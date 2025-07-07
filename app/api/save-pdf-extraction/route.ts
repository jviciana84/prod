export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { detectVehicleType } from "@/utils/vehicle-type-detector"
import { formatDateForDatabase } from "@/lib/date-utils"

// Función para detectar el concesionario basado en el TOMO del PDF
function getDealershipCodeFromTomo(extractedFields: any): string | null {
  const tomo = extractedFields["TOMO"] || extractedFields["Tomo"] || null

  console.log("🔍 Detectando concesionario por TOMO:", tomo)

  if (!tomo) {
    console.log("⚠️ No se encontró TOMO en el PDF")
    return null
  }

  const tomoStr = tomo.toString().toUpperCase()

  // Lógica de detección por TOMO
  if (tomoStr.includes("TERRASSA") || tomoStr.includes("MOTOR MUNICH") || tomoStr === "MM") {
    console.log("✅ Detectado Motor Munich (MM) por TOMO")
    return "MM"
  } else if (tomoStr.includes("CORNELLÀ") || tomoStr.includes("CORNELLA") || tomoStr === "MMC") {
    console.log("✅ Detectado Motor Munich Cornellà (MMC) por TOMO")
    return "MMC"
  }

  console.log("⚠️ TOMO no reconocido:", tomo)
  return null
}

// Función de fallback para obtener el código del concesionario desde la selección manual
function getDealershipCodeFromSelection(selectedDealership: string | null): string | null {
  if (!selectedDealership) return null

  if (selectedDealership.includes("Motor Munich (MM)") || selectedDealership.includes("MM")) {
    return "MM"
  } else if (selectedDealership.includes("Motor Munich Cornellà (MMC)") || selectedDealership.includes("MMC")) {
    return "MMC"
  }
  return null
}

// Función para convertir números en formato europeo a formato de base de datos
function parseEuropeanNumber(value: string | null): number | null {
  if (!value || value.trim() === "") return null

  let cleanValue = value.replace(/[^\d.,-]/g, "")

  if (cleanValue.includes(".") && cleanValue.includes(",")) {
    cleanValue = cleanValue.replace(/\./g, "").replace(",", ".")
  } else if (cleanValue.includes(",")) {
    cleanValue = cleanValue.replace(",", ".")
  }

  const parsed = Number.parseFloat(cleanValue)
  if (isNaN(parsed)) return null

  return parsed
}

// Función para determinar el tipo de vehículo basado en el modelo
function getVehicleType(modelo: string | null): string {
  if (!modelo) return "Coche"
  return detectVehicleType(modelo)
}

// Función para determinar la marca basada en el modelo
function getBrand(modelo: string | null): string | null {
  if (!modelo) return null
  const modeloUpper = modelo.toUpperCase()
  if (modeloUpper.includes("BMW")) return "BMW"
  if (modeloUpper.includes("MINI")) return "MINI"
  return null
}

// Función para limpiar el modelo removiendo la marca
function cleanModel(modelo: string | null): string | null {
  if (!modelo) return null

  let cleanedModel = modelo.trim()

  if (cleanedModel.toUpperCase().startsWith("BMW ")) {
    cleanedModel = cleanedModel.substring(4)
  }

  if (cleanedModel.toUpperCase().startsWith("MINI ")) {
    cleanedModel = cleanedModel.substring(5)
  }

  return cleanedModel.trim()
}

// Función mejorada para determinar el método de pago basado en el banco
function getPaymentMethod(banco: string | null): string {
  console.log("🏦 Analizando método de pago para banco:", banco)

  if (!banco || banco.trim() === "") {
    console.log("🏦 No hay banco especificado, asumiendo CONTADO")
    return "Contado"
  }

  const bancoUpper = banco.toUpperCase().trim()
  console.log("🏦 Banco normalizado:", bancoUpper)

  const bmwFinancingPatterns = [
    "BMW BANK",
    "BMW FINANCIAL",
    "SELECT",
    "LINEAL",
    "BALLOON",
    "TRIPLE 0",
    "TRIPLE0",
    "BMW FS",
    "BMWBANK",
  ]

  for (const pattern of bmwFinancingPatterns) {
    if (bancoUpper.includes(pattern)) {
      console.log("🏦 Detectado financiación BMW:", pattern)
      return "Financiado"
    }
  }

  if (bancoUpper.includes("FINANCIAD") || bancoUpper.includes("FINANCIACIÓN") || bancoUpper.includes("FINANCIACION")) {
    console.log("🏦 Detectado financiado:", bancoUpper)
    return "Financiado"
  }

  const contadoPatterns = ["CONTADO", "EFECTIVO", "CASH", "PAGO ÚNICO"]

  for (const pattern of contadoPatterns) {
    if (bancoUpper.includes(pattern)) {
      console.log("🏦 Detectado contado:", pattern)
      return "Contado"
    }
  }

  const externalBanks = [
    "BBVA",
    "CAIXABANK",
    "CAIXA",
    "SANTANDER",
    "SABADELL",
    "BANKINTER",
    "ING",
    "UNICAJA",
    "KUTXABANK",
    "ABANCA",
    "OPENBANK",
  ]

  for (const bank of externalBanks) {
    if (bancoUpper.includes(bank)) {
      console.log("🏦 Detectado financiación externa:", bank)
      return "Externa"
    }
  }

  const financingKeywords = [
    "FINANCIACIÓN",
    "FINANCIACION",
    "CRÉDITO",
    "CREDITO",
    "PRÉSTAMO",
    "PRESTAMO",
    "CUOTAS",
    "MENSUALIDADES",
  ]

  for (const keyword of financingKeywords) {
    if (bancoUpper.includes(keyword)) {
      console.log("🏦 Detectado financiación genérica:", keyword)
      return "Financiado"
    }
  }

  console.log("🏦 No se reconoció el patrón, asumiendo CONTADO por defecto")
  return "Contado"
}

// Función para determinar el tipo de documento basado en el formato
function getDocumentType(dniNif: string | null): string | null {
  if (!dniNif || dniNif.trim() === "") return null

  const cleaned = dniNif.replace(/[^A-Z0-9]/g, "")

  if (/^\d{8}[A-Z]$/.test(cleaned)) return "DNI"
  if (/^[XYZ]\d{7}[A-Z]$/.test(cleaned)) return "NIE"
  if (/^[A-Z]\d{7}[A-Z0-9]$/.test(cleaned)) return "NIF"

  return "DNI/NIF"
}

// Función para buscar el asesor en la base de datos basado en el nombre del PDF
async function findAdvisorByName(
  supabase: any,
  nombreComercial: string | null,
): Promise<{
  advisor: string
  advisor_name: string
  advisor_id: string | null
}> {
  if (!nombreComercial || nombreComercial.trim() === "") {
    return {
      advisor: "Sin asignar",
      advisor_name: "Sin asignar",
      advisor_id: null,
    }
  }

  try {
    console.log("🔍 Buscando asesor para:", nombreComercial)

    // Primero, buscar directamente en profiles sin filtrar por roles
    const { data: allProfilesData, error: allProfilesError } = await supabase
      .from("profiles")
      .select("id, full_name, alias")
      .not("full_name", "is", null)

    if (allProfilesError) {
      console.error("❌ Error obteniendo perfiles:", allProfilesError)
      return {
        advisor: nombreComercial.split(" ")[0] || "Sin asignar",
        advisor_name: nombreComercial,
        advisor_id: null,
      }
    }

    if (!allProfilesData || allProfilesData.length === 0) {
      console.log("❌ No se encontraron perfiles")
      return {
        advisor: nombreComercial.split(" ")[0] || "Sin asignar",
        advisor_name: nombreComercial,
        advisor_id: null,
      }
    }

    console.log("📋 Total de perfiles encontrados:", allProfilesData.length)

    const nombreLimpio = nombreComercial.toLowerCase().trim()
    console.log("🔍 Buscando coincidencia exacta para:", nombreLimpio)

    // 1. Buscar coincidencia exacta
    let asesorEncontrado = allProfilesData.find((profile) => 
      profile.full_name && profile.full_name.toLowerCase() === nombreLimpio
    )

    if (asesorEncontrado) {
      console.log("✅ Coincidencia exacta encontrada:", asesorEncontrado)
    } else {
      console.log("🔍 No hay coincidencia exacta, buscando por partes...")
      
      // 2. Buscar por nombre y apellido
      const partesNombrePDF = nombreLimpio.split(" ")
      const nombrePDF = partesNombrePDF[0]
      const apellidoPDF = partesNombrePDF[1]

      if (nombrePDF && apellidoPDF) {
        asesorEncontrado = allProfilesData.find((profile) => {
          if (!profile.full_name) return false
          const partesNombreDB = profile.full_name.toLowerCase().split(" ")
          const nombreDB = partesNombreDB[0]
          const apellidoDB = partesNombreDB[1]

          return nombreDB === nombrePDF && apellidoDB === apellidoPDF
        })

        if (asesorEncontrado) {
          console.log("✅ Coincidencia por nombre y apellido encontrada:", asesorEncontrado)
        }
      }
    }

    // 3. Si no se encontró, buscar por nombre que empiece igual
    if (!asesorEncontrado) {
      const nombrePDF = nombreLimpio.split(" ")[0]
      console.log("🔍 Buscando por nombre que empiece con:", nombrePDF)
      
      asesorEncontrado = allProfilesData.find((profile) => 
        profile.full_name && profile.full_name.toLowerCase().startsWith(nombrePDF)
      )

      if (asesorEncontrado) {
        console.log("✅ Coincidencia por nombre encontrada:", asesorEncontrado)
      }
    }

    // 4. Si no se encontró, buscar por alias
    if (!asesorEncontrado) {
      console.log("🔍 Buscando por alias...")
      
      asesorEncontrado = allProfilesData.find((profile) => 
        profile.alias && profile.alias.toLowerCase() === nombreLimpio
      )

      if (asesorEncontrado) {
        console.log("✅ Coincidencia por alias encontrada:", asesorEncontrado)
      }
    }

    // 5. Búsqueda más flexible - buscar si el nombre contiene el texto
    if (!asesorEncontrado) {
      console.log("🔍 Búsqueda flexible...")
      
      asesorEncontrado = allProfilesData.find((profile) => 
        profile.full_name && profile.full_name.toLowerCase().includes(nombreLimpio)
      )

      if (asesorEncontrado) {
        console.log("✅ Coincidencia flexible encontrada:", asesorEncontrado)
      }
    }

    if (asesorEncontrado) {
      console.log("✅ Asesor encontrado:", asesorEncontrado)
      return {
        advisor: asesorEncontrado.alias || asesorEncontrado.full_name.split(" ")[0],
        advisor_name: asesorEncontrado.full_name,
        advisor_id: asesorEncontrado.id.toString(),
      }
    } else {
      console.log("⚠️ No se encontró coincidencia para:", nombreComercial)
      console.log("📋 Perfiles disponibles:", allProfilesData.map(p => p.full_name))
      return {
        advisor: nombreComercial.split(" ")[0] || "Sin asignar",
        advisor_name: nombreComercial,
        advisor_id: null,
      }
    }
  } catch (error) {
    console.error("❌ Error buscando asesor:", error)
    return {
      advisor: nombreComercial.split(" ")[0] || "Sin asignar",
      advisor_name: nombreComercial,
      advisor_id: null,
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 === INICIANDO PROCESAMIENTO DE PDF ===")

    const body = await request.json()
    const { extractedFields, originalText, fileName, method, selectedDealership } = body

    if (!extractedFields) {
      return NextResponse.json({ error: "No se proporcionaron datos para guardar" }, { status: 400 })
    }

    console.log("📋 Campos extraídos recibidos:", JSON.stringify(extractedFields, null, 2))

    // Crear cliente de Supabase
    const supabase = await createServerClient()

    const cifCliente = extractedFields["D.N.I. Ó N.I.F."] || null

    // Primero intentar detectar por TOMO, luego por selección manual
    let dealershipCode = getDealershipCodeFromTomo(extractedFields)
    if (!dealershipCode) {
      dealershipCode = getDealershipCodeFromSelection(selectedDealership)
      console.log("🏢 Usando selección manual para dealership:", dealershipCode)
    }

    let marca = extractedFields["MARCA"]
    if (!marca && extractedFields["MODELO"]) {
      marca = getBrand(extractedFields["MODELO"])
      console.log("🏷️ Marca extraída automáticamente del modelo:", marca)
    }

    const now = new Date().toISOString()

    // Usar funciones de fecha con manejo de errores
    let fechaPedido = null
    let primeraFechaMatriculacion = null

    try {
      fechaPedido = formatDateForDatabase(extractedFields["FECHA DE PEDIDO"])
      primeraFechaMatriculacion = formatDateForDatabase(extractedFields["PRIMERA FECHA MATRICULACIÓN"])
    } catch (dateError) {
      console.warn("⚠️ Error procesando fechas:", dateError)
      // Continuar sin las fechas si hay error
    }

    // Datos para pdf_extracted_data
    const pdfDataToInsert = {
      numero_pedido: extractedFields["Nº PEDIDO"] || null,
      fecha_pedido: fechaPedido,
      nombre_cliente: extractedFields["NOMBRE Y APELLIDOS O EMPRESA"] || null,
      dni_nif: cifCliente,
      email: extractedFields["EMAIL"] || null,
      telefono: extractedFields["TFNO. PARTICULAR"] || null,
      domicilio: extractedFields["DOMICILIO"] || null,
      ciudad: extractedFields["CIUDAD"] || null,
      codigo_postal: extractedFields["C.P."] || null,
      provincia: extractedFields["PROVINCIA"] || null,
      matricula: extractedFields["Nº DE MATRÍCULA"] || null,
      numero_bastidor: extractedFields["Nº BASTIDOR"] || null,
      modelo: extractedFields["MODELO"] || null,
      comercial: extractedFields["Comercial"] || null,
      portal_origen: extractedFields["PORTAL ORIGEN"] || null,
      banco: extractedFields["BANCO"] || null,
      total: parseEuropeanNumber(extractedFields["TOTAL"]),
      descuento: parseEuropeanNumber(extractedFields["DESCUENTO"]),
      marca: marca,
      color: extractedFields["COLOR"] || null,
      kilometros: extractedFields["KILÓMETROS"]
        ? Number.parseInt(extractedFields["KILÓMETROS"].replace(/[^\d]/g, ""))
        : null,
      primera_fecha_matriculacion: primeraFechaMatriculacion,
      pdf_filename: fileName || null,
      extraction_status: "completed",
      processed: true,
      processed_at: now,
      created_at: now,
      dealership_code: dealershipCode,
      raw_text: originalText || null,
      extraction_method: method || "manual",
    }

    console.log("💾 === INSERTANDO EN pdf_extracted_data ===")

    const { data: pdfData, error: pdfError } = await supabase
      .from("pdf_extracted_data")
      .insert([pdfDataToInsert])
      .select()

    if (pdfError) {
      console.error("❌ Error insertando en pdf_extracted_data:", pdfError)
      return NextResponse.json(
        {
          error: "Error guardando en pdf_extracted_data",
          details: pdfError.message,
        },
        { status: 500 },
      )
    }

    console.log("✅ Datos guardados en pdf_extracted_data:", pdfData[0]?.id)

    // Buscar asesor
    const advisorInfo = await findAdvisorByName(supabase, extractedFields["Comercial"])

    // Preparar datos para sales_vehicles
    const modelo = extractedFields["MODELO"]
    const banco = extractedFields["BANCO"]

    let saleDate = null
    let orderDate = null
    let registrationDate = null

    try {
      saleDate = formatDateForDatabase(extractedFields["FECHA DE PEDIDO"]) || now
      orderDate = formatDateForDatabase(extractedFields["FECHA DE PEDIDO"])
      registrationDate = formatDateForDatabase(extractedFields["PRIMERA FECHA MATRICULACIÓN"])
    } catch (dateError) {
      console.warn("⚠️ Error procesando fechas para sales_vehicles:", dateError)
      saleDate = now // Usar fecha actual como fallback
    }

    const salesDataToInsert = {
      license_plate: extractedFields["Nº DE MATRÍCULA"] || null,
      model: cleanModel(modelo),
      vehicle_type: getVehicleType(modelo),
      sale_date: saleDate,
      price: parseEuropeanNumber(extractedFields["TOTAL"]),
      payment_method: getPaymentMethod(banco),
      advisor_name: advisorInfo.advisor_name,
      document_type: getDocumentType(cifCliente),
      client_name: extractedFields["NOMBRE Y APELLIDOS O EMPRESA"] || null,
      client_dni: cifCliente,
      client_address: extractedFields["DOMICILIO"] || null,
      client_phone: extractedFields["TFNO. PARTICULAR"] || null,
      client_email: extractedFields["EMAIL"] || null,
      client_city: extractedFields["CIUDAD"] || null,
      client_province: extractedFields["PROVINCIA"] || null,
      client_postal_code: extractedFields["C.P."] || null,
      vin: extractedFields["Nº BASTIDOR"] || null,
      brand: marca,
      bank: banco || null,
      origin_portal: extractedFields["PORTAL ORIGEN"] || null,
      pdf_extraction_id: pdfData[0]?.id || null,
      dealership_code: dealershipCode,
      color: extractedFields["COLOR"] || null,
      mileage: extractedFields["KILÓMETROS"]
        ? Number.parseInt(extractedFields["KILÓMETROS"].replace(/[^\d]/g, ""))
        : null,
      registration_date: registrationDate,
      order_number: extractedFields["Nº PEDIDO"] || null,
      order_date: orderDate,
      discount: parseEuropeanNumber(extractedFields["DESCUENTO"]),
      stock_id: null,
      advisor: advisorInfo.advisor,
      payment_status: "pendiente",
      or_value: null,
      expense_charge: null,
      cyp_status: "pendiente",
      cyp_date: null,
      photo_360_status: "pendiente",
      photo_360_date: null,
      validated: false,
      validation_date: null,
      appraised: false,
      appraisal_date: null,
      delivery_center: "Terrassa",
      external_provider: null,
      advisor_id: advisorInfo.advisor_id,
      purchase_price: null,
      pdf_url: null,
      extraction_date: now,
      is_duplicate: false,
      duplicate_reference_id: null,
      is_resale: false,
      created_at: now,
      updated_at: now,
    }

    // Verificar si el vehículo existe en stock
    if (salesDataToInsert.license_plate) {
      try {
        console.log("🔍 Verificando si el vehículo existe en stock...")
        const { data: existingStock } = await supabase
          .from("stock")
          .select("id")
          .eq("matricula", salesDataToInsert.license_plate)
          .single()

        if (existingStock) {
          salesDataToInsert.stock_id = existingStock.id
          console.log("✅ Vehículo encontrado en stock, ID:", existingStock.id)
        }
      } catch (stockError) {
        console.log("⚠️ Vehículo no encontrado en stock")
      }
    }

    // Verificar vehículo existente en sales_vehicles
    let existingVehicleId = null
    if (salesDataToInsert.license_plate) {
      try {
        const { data: existingVehicle } = await supabase
          .from("sales_vehicles")
          .select("id, validated")
          .eq("license_plate", salesDataToInsert.license_plate)
          .maybeSingle()

        if (existingVehicle) {
          existingVehicleId = existingVehicle.id
          console.log("🔄 Vehículo existente encontrado, ID:", existingVehicleId)
        }
      } catch (existingError) {
        console.log("⚠️ Error verificando vehículo existente:", existingError.message)
      }
    }

    let salesVehicleId = null

    if (existingVehicleId) {
      // Actualizar vehículo existente
      console.log("🔄 === ACTUALIZANDO VEHÍCULO EXISTENTE EN sales_vehicles ===")

      const { error: updateError } = await supabase
        .from("sales_vehicles")
        .update(salesDataToInsert)
        .eq("id", existingVehicleId)

      if (updateError) {
        console.error("❌ Error actualizando en sales_vehicles:", updateError)
        return NextResponse.json(
          {
            error: "Error actualizando en sales_vehicles",
            details: updateError.message,
          },
          { status: 500 },
        )
      }

      salesVehicleId = existingVehicleId
      console.log("✅ Vehículo actualizado en sales_vehicles:", salesVehicleId)
    } else {
      // Insertar nuevo vehículo
      console.log("💾 === INSERTANDO NUEVO VEHÍCULO EN sales_vehicles ===")

      const { data: salesData, error: salesError } = await supabase
        .from("sales_vehicles")
        .insert([salesDataToInsert])
        .select()

      if (salesError) {
        console.error("❌ Error insertando en sales_vehicles:", salesError)
        return NextResponse.json(
          {
            error: "Error guardando en sales_vehicles",
            details: salesError.message,
          },
          { status: 500 },
        )
      }

      salesVehicleId = salesData[0]?.id
      console.log("✅ Datos guardados en sales_vehicles:", salesVehicleId)
    }

    // Actualizar referencia en pdf_extracted_data
    if (salesVehicleId) {
      try {
        await supabase.from("pdf_extracted_data").update({ sales_vehicle_id: salesVehicleId }).eq("id", pdfData[0]?.id)
      } catch (refError) {
        console.warn("⚠️ Error actualizando referencia:", refError)
      }
    }

    console.log("🎉 === PROCESAMIENTO COMPLETADO EXITOSAMENTE ===")

    return NextResponse.json({
      success: true,
      message: "Datos guardados correctamente",
      data: {
        pdfExtractionId: pdfData[0]?.id,
        salesVehicleId: salesVehicleId,
        dealershipCode,
        advisorInfo,
        paymentMethod: salesDataToInsert.payment_method,
        vehicleType: salesDataToInsert.vehicle_type,
        documentType: salesDataToInsert.document_type,
        extractedBrand: marca,
        detectedByTomo: getDealershipCodeFromTomo(extractedFields) !== null,
      },
    })
  } catch (error) {
    console.error("❌ Error general en save-pdf-extraction:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
} 