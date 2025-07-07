export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getUserIdByAsesorAlias } from "@/lib/user-mapping-improved" // Importar la función mejorada

// Usar las variables de entorno correctas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

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
  // Lógica para detectar el tipo de vehículo
  return modelo
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

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 === INICIANDO PROCESAMIENTO DE PDF ===")

    const body = await request.json()
    const { extractedData, pdfUrl, originalFileName } = body

    console.log("Received data for PDF extraction save:", {
      extractedData,
      pdfUrl,
      originalFileName,
    })

    // Validar datos esenciales
    if (!extractedData || !extractedData.matricula || !extractedData.fecha_pedido || !extractedData.asesor) {
      console.error("Missing essential extracted data:", extractedData)
      return NextResponse.json({ error: "Missing essential data (matricula, fecha_pedido, asesor)" }, { status: 400 })
    }

    // Intentar obtener el advisor_id usando la función mejorada
    let advisorId: string | null = null
    if (extractedData.asesor) {
      advisorId = await getUserIdByAsesorAlias(extractedData.asesor)
      if (!advisorId) {
        console.warn(`Could not find advisor_id for asesor alias: ${extractedData.asesor}`)
      } else {
        console.log(`Found advisor_id: ${advisorId} for asesor: ${extractedData.asesor}`)
      }
    }

    // Insertar en pdf_extracted_data
    const { data: pdfData, error: pdfError } = await supabaseAdmin
      .from("pdf_extracted_data")
      .insert({
        matricula: extractedData.matricula,
        fecha_pedido: extractedData.fecha_pedido,
        asesor: extractedData.asesor,
        pdf_url: pdfUrl,
        original_file_name: originalFileName,
        // Añadir advisor_id aquí
        advisor_id: advisorId,
        // Otros campos extraídos
        marca: extractedData.marca || null,
        modelo: extractedData.modelo || null,
        version: extractedData.version || null,
        color: extractedData.color || null,
        precio: extractedData.precio || null,
        forma_pago: extractedData.forma_pago || null,
        fecha_entrega_prevista: extractedData.fecha_entrega_prevista || null,
        observaciones: extractedData.observaciones || null,
        cliente_nombre: extractedData.cliente_nombre || null,
        cliente_nif: extractedData.cliente_nif || null,
        cliente_telefono: extractedData.cliente_telefono || null,
        cliente_email: extractedData.cliente_email || null,
        kilometros: extractedData.kilometros || null,
        bastidor: extractedData.bastidor || null,
        tipo_vehiculo: extractedData.tipo_vehiculo || null,
        fecha_matriculacion: extractedData.fecha_matriculacion || null,
        fecha_primera_matriculacion: extractedData.fecha_primera_matriculacion || null,
        fecha_fabricacion: extractedData.fecha_fabricacion || null,
        tipo_documento: extractedData.tipo_documento || null,
        // Campos de auditoría
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (pdfError) {
      console.error("Error inserting into pdf_extracted_data:", pdfError)
      return NextResponse.json({ error: pdfError.message }, { status: 500 })
    }

    console.log("Successfully saved PDF extracted data:", pdfData)

    // Opcional: Actualizar sales_vehicles si ya existe un registro con esa matrícula
    // Esto es para asegurar que sales_vehicles también tenga el advisor_id
    const { data: existingSale, error: fetchSaleError } = await supabaseAdmin
      .from("sales_vehicles")
      .select("id")
      .eq("license_plate", extractedData.matricula)
      .single()

    if (fetchSaleError && fetchSaleError.code !== "PGRST116") {
      // PGRST116 means no rows found
      console.error("Error fetching existing sales_vehicle:", fetchSaleError)
      // No retornar error, solo loguear, ya que la inserción principal ya se hizo
    }

    if (existingSale) {
      console.log(`Updating existing sales_vehicle for license plate: ${extractedData.matricula}`)
      const { error: updateSaleError } = await supabaseAdmin
        .from("sales_vehicles")
        .update({
          advisor_id: advisorId,
          // Actualiza otros campos si es necesario
          advisor: extractedData.asesor,
          advisor_name: extractedData.asesor, // Asumiendo que asesor es el nombre o alias
          order_date: extractedData.fecha_pedido,
          price: extractedData.precio,
          payment_method: extractedData.forma_pago,
          vehicle_type: extractedData.tipo_vehiculo,
          brand: extractedData.marca,
          model: extractedData.modelo,
          version: extractedData.version,
          color: extractedData.color,
          chassis_number: extractedData.bastidor,
          kms: extractedData.kilometros,
          registration_date: extractedData.fecha_matriculacion,
          first_registration_date: extractedData.fecha_primera_matriculacion,
          manufacture_date: extractedData.fecha_fabricacion,
          expected_delivery_date: extractedData.fecha_entrega_prevista,
          customer_name: extractedData.cliente_nombre,
          customer_nif: extractedData.cliente_nif,
          customer_phone: extractedData.cliente_telefono,
          customer_email: extractedData.cliente_email,
          observations: extractedData.observaciones,
          document_type: extractedData.tipo_documento,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSale.id)

      if (updateSaleError) {
        console.error("Error updating existing sales_vehicle:", updateSaleError)
      } else {
        console.log("Successfully updated existing sales_vehicle with advisor_id.")
      }
    } else {
      console.log(
        `No existing sales_vehicle found for license plate: ${extractedData.matricula}. A new one will be created by trigger.`,
      )
      // Si no existe, se espera que un trigger de la base de datos cree el registro en sales_vehicles
      // o se maneje la inserción directamente aquí si no hay trigger.
      // Por ahora, asumimos que el trigger se encargará de ello.
    }

    return NextResponse.json({ message: "PDF data saved successfully", data: pdfData })
  } catch (error: any) {
    console.error("Unexpected error in save-pdf-extraction:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
