import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const licensePlate = searchParams.get("licensePlate")?.toUpperCase()
    const dni = searchParams.get("dni")?.toUpperCase()

    if (!licensePlate) {
      return NextResponse.json({ error: "Matrícula no proporcionada" }, { status: 400 })
    }

    console.log(`🔍 Consultando datos del dashboard para matrícula: ${licensePlate}, DNI: ${dni}`)

    // Verificar variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Variables de entorno de Supabase no configuradas")
      return NextResponse.json({ 
        error: "Configuración de base de datos incompleta",
        details: {
          supabaseUrl: !!supabaseUrl,
          supabaseKey: !!supabaseKey
        }
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log("✅ Cliente Supabase creado correctamente")

    // Buscar en garantias_brutas_mm (tabla principal con datos del cliente)
    console.log("🔍 Consultando tabla garantias_brutas_mm...")
    const { data: garantiasData, error: garantiasError } = await supabase
      .from("garantias_brutas_mm")
      .select("*")
      .ilike("Matrícula", `%${licensePlate}%`)
      .limit(1)

    if (garantiasError) {
      console.error("❌ Error consultando garantias_brutas_mm:", garantiasError)
    } else {
      console.log("✅ Datos de garantias_brutas_mm encontrados:", garantiasData?.length || 0)
    }

    // Buscar en garantias_brutas_mmc
    console.log("🔍 Consultando tabla garantias_brutas_mmc...")
    const { data: garantiasMmcData, error: garantiasMmcError } = await supabase
      .from("garantias_brutas_mmc")
      .select("*")
      .ilike("Matrícula", `%${licensePlate}%`)
      .limit(1)

    if (garantiasMmcError) {
      console.error("❌ Error consultando garantias_brutas_mmc:", garantiasMmcError)
    } else {
      console.log("✅ Datos de garantias_brutas_mmc encontrados:", garantiasMmcData?.length || 0)
    }

    // Buscar en sales_vehicles para obtener datos de certificación (CYP y 360)
    console.log("🔍 Consultando tabla sales_vehicles para certificación...")
    const { data: salesData, error: salesError } = await supabase
      .from("sales_vehicles")
      .select("*, cyp_date, photo_360_date, cyp_status, photo_360_status, license_plate, model, brand, sale_date, price, client_name, client_dni, client_phone, client_email, client_address, advisor, dealership")
      .ilike("license_plate", `%${licensePlate}%`)
      .limit(1)

    if (salesError) {
      console.error("❌ Error consultando sales_vehicles:", salesError)
    } else {
      console.log("✅ Datos de sales_vehicles encontrados:", salesData?.length || 0)
    }

    // Buscar en stock
    console.log("🔍 Consultando tabla stock...")
    const { data: stockData, error: stockError } = await supabase
      .from("stock")
      .select("*")
      .ilike("license_plate", `%${licensePlate}%`)
      .limit(1)

    if (stockError) {
      console.error("❌ Error consultando stock:", stockError)
    } else {
      console.log("✅ Datos de stock encontrados:", stockData?.length || 0)
    }

    // Buscar en entrega para obtener fecha de entrega
    console.log("🔍 Consultando tabla entrega...")
    const { data: entregaData, error: entregaError } = await supabase
      .from("entrega")
      .select("*")
      .ilike("matricula", `%${licensePlate}%`)
      .limit(1)

    if (entregaError) {
      console.error("❌ Error consultando entrega:", entregaError)
    } else {
      console.log("✅ Datos de entrega encontrados:", entregaData?.length || 0)
    }

    // Buscar en entregas para obtener información de certificación y fecha de entrega
    console.log("🔍 Consultando tabla entregas para certificación y fecha de entrega...")
    const { data: entregasData, error: entregasError } = await supabase
      .from("entregas")
      .select("id, created_at, matricula, modelo, asesor, fecha_entrega")
      .ilike("matricula", `%${licensePlate}%`)
      .order("created_at", { ascending: false })
      .limit(1)

    if (entregasError) {
      console.error("❌ Error consultando entregas:", entregasError)
    } else {
      console.log("✅ Datos de entregas encontrados:", entregasData?.length || 0)
    }

    // Combinar datos de todas las fuentes
    const garantiasRecord = garantiasData?.[0] || {}
    const garantiasMmcRecord = garantiasMmcData?.[0] || {}
    const salesRecord = salesData?.[0] || {}
    const stockRecord = stockData?.[0] || {}
    const entregaRecord = entregaData?.[0] || {}
    const entregasRecord = entregasData?.[0] || {}

    console.log("📊 Datos encontrados en garantias_brutas_mm:", garantiasRecord)
    console.log("📊 Datos encontrados en garantias_brutas_mmc:", garantiasMmcRecord)
    console.log("📊 Datos encontrados en sales_vehicles:", salesRecord)
    console.log("📊 Datos encontrados en entrega:", entregaRecord)
    console.log("📊 Datos encontrados en entregas:", entregasRecord)

         // Función para formatear fecha a dd/mm/aaaa
     const formatDate = (dateString: string) => {
       if (!dateString) return null
       try {
         const date = new Date(dateString)
         if (isNaN(date.getTime())) return null
         return date.toLocaleDateString('es-ES', {
           day: '2-digit',
           month: '2-digit',
           year: 'numeric'
         })
       } catch {
         return null
       }
     }

         // Función para obtener el bastidor completo
     const getBastidor = (text: string) => {
       if (!text) return null
       return text.toString()
     }

         // Función para calcular año desde fecha de matriculación
     const getYearFromRegistration = (dateString: string) => {
       if (!dateString) return null
       try {
         const date = new Date(dateString)
         if (isNaN(date.getTime())) return null
         return date.getFullYear()
       } catch {
         return null
       }
     }

         // Función para determinar el tipo de certificación basándose en el modelo
     const getCertificationType = (model: string) => {
       if (!model) return null
       
       const lowerCaseModel = model.toLowerCase()
       
       if (lowerCaseModel.includes("bmw motorrad")) {
         return "Certificado BMW Motorrad"
       } else if (
         lowerCaseModel.includes("mini") ||
         lowerCaseModel.includes("countryman") ||
         lowerCaseModel.includes("cooper")
       ) {
         return "Certificado MINI Next"
       } else if (lowerCaseModel.includes("bmw") || model.length > 0) {
         return "Certificado BMW Premium Selection"
       }
       
       return null
     }

         // Función para obtener la fecha de certificación desde la tabla entregas
     const getCertificationDate = (entregasRecord: any) => {
       if (!entregasRecord || !entregasRecord.created_at) {
         console.log("⚠️ No se encontró fecha de certificación en entregas")
         return null
       }
       
       console.log("✅ Fecha de certificación desde entregas.created_at:", entregasRecord.created_at)
       return formatDate(entregasRecord.created_at)
     }

         // Función para generar la frase de valoración
     const getValoracionText = (kilometraje: any, año: any) => {
       if (!kilometraje || !año) return null
       
       const currentYear = new Date().getFullYear()
       const antiguedad = currentYear - año
       
       let frase = ""
       
       if (antiguedad <= 2) {
         if (kilometraje <= 50000) {
           frase = "Cumple con todos los parámetros exigidos para su antigüedad y kilometraje."
         } else if (kilometraje <= 100000) {
           frase = "Cumple con los parámetros de calidad establecidos para su antigüedad y kilometraje."
         } else {
           frase = "Cumple con los estándares requeridos para su antigüedad y kilometraje."
         }
       } else if (antiguedad <= 5) {
         if (kilometraje <= 80000) {
           frase = "Cumple con los parámetros exigidos para su antigüedad y kilometraje."
         } else if (kilometraje <= 150000) {
           frase = "Cumple con los estándares establecidos para su antigüedad y kilometraje."
         } else {
           frase = "Cumple con los parámetros mínimos requeridos para su antigüedad y kilometraje."
         }
       } else {
         if (kilometraje <= 120000) {
           frase = "Cumple con los parámetros establecidos para su antigüedad y kilometraje."
         } else {
           frase = "Cumple con los estándares mínimos requeridos para su antigüedad y kilometraje."
         }
       }
       
       return frase
     }

         // Función para calcular tiempo transcurrido en formato legible
     const getTimeSinceDelivery = (fechaEntrega: string) => {
       if (!fechaEntrega) return null
       
       try {
         const deliveryDate = new Date(fechaEntrega)
         const currentDate = new Date()
         
                   if (isNaN(deliveryDate.getTime())) return null
         
         const diffTime = Math.abs(currentDate.getTime() - deliveryDate.getTime())
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
         
         if (diffDays < 30) {
           return `${diffDays} día${diffDays !== 1 ? 's' : ''}`
         }
         
         const years = Math.floor(diffDays / 365)
         const remainingDays = diffDays % 365
         const months = Math.floor(remainingDays / 30)
         const days = remainingDays % 30
         
         let result = ""
         
         if (years > 0) {
           result += `${years} año${years !== 1 ? 's' : ''}`
           if (months > 0 || days > 0) result += ", "
         }
         
         if (months > 0) {
           result += `${months} mes${months !== 1 ? 'es' : ''}`
           if (days > 0) result += " y "
         }
         
         if (days > 0 || (years === 0 && months === 0)) {
           result += `${days} día${days !== 1 ? 's' : ''}`
         }
         
         return result
       } catch {
         return null
       }
     }

         // Obtener fecha de matriculación
     const fechaMatriculacion = garantiasRecord["F. Matrícula"] || garantiasMmcRecord["F. Matrícula"] || salesRecord.registration_date || stockRecord.registration_date

     // Obtener fecha de entrega desde la tabla entregas
     const fechaEntrega = entregasRecord.fecha_entrega || entregaRecord.fecha_entrega || entregaRecord.fecha || entregaRecord.created_at

    // Obtener información de certificación desde la tabla entregas
    const fechaCertificacion = getCertificationDate(entregasRecord)
    const tipoCertificacion = getCertificationType(salesRecord.model || garantiasRecord.Modelo || garantiasMmcRecord.Modelo || stockRecord.model)
    
         // Generar texto de valoración
     const año = getYearFromRegistration(fechaMatriculacion)
     const kilometraje = garantiasRecord.Kms || garantiasMmcRecord.Kms || salesRecord.mileage || stockRecord.mileage
     const valoracionText = getValoracionText(kilometraje, año)

         // Construir respuesta con datos reales
     const responseData = {
       success: true,
       vehicleData: {
         matricula: licensePlate,
         marca: garantiasRecord.Marca || garantiasMmcRecord.Marca || salesRecord.brand || stockRecord.brand,
         modelo: garantiasRecord.Modelo || garantiasMmcRecord.Modelo || salesRecord.model || stockRecord.model,
         año: getYearFromRegistration(fechaMatriculacion),
         color: garantiasRecord.Color || garantiasMmcRecord.Color || salesRecord.color || stockRecord.color,
         kilometraje: garantiasRecord.Kms || garantiasMmcRecord.Kms || salesRecord.mileage || stockRecord.mileage,
         vin: getBastidor(garantiasRecord.Chasis || garantiasMmcRecord.Chasis || salesRecord.vin || stockRecord.vin),
         fechaMatriculacion: formatDate(fechaMatriculacion),
         fechaEntrega: formatDate(fechaEntrega),
         fechaVenta: formatDate(garantiasRecord["F.Venta"] || garantiasMmcRecord["F.Venta"] || salesRecord.sale_date || stockRecord.sale_date),
                  fechaCertificacion: fechaCertificacion,
          tipoCertificacion: tipoCertificacion,
          valoracion: valoracionText,
          diasDesdeVenta: getTimeSinceDelivery(fechaEntrega),
          precio: garantiasRecord["Precio Venta"] || garantiasMmcRecord["Precio Venta"] || salesRecord.price || stockRecord.price,
          precioOriginal: garantiasRecord["Precio Original"] || garantiasMmcRecord["Precio Original"],
       },
       ownerData: {
         nombre: garantiasRecord.Cliente || garantiasMmcRecord.Cliente || salesRecord.client_name || stockRecord.client_name,
         dni: dni || garantiasRecord.DNI || garantiasMmcRecord.DNI || salesRecord.client_dni || stockRecord.client_dni,
         telefono: garantiasRecord.Teléfono || garantiasMmcRecord.Teléfono || salesRecord.client_phone || stockRecord.client_phone,
         email: garantiasRecord.Email || garantiasMmcRecord.Email || salesRecord.client_email || stockRecord.client_email,
         direccion: garantiasRecord.Dirección || garantiasMmcRecord.Dirección || salesRecord.client_address || stockRecord.client_address,
       },
       saleData: {
         asesorComercial: garantiasRecord.Asesor || garantiasMmcRecord.Asesor || salesRecord.advisor || stockRecord.advisor,
         concesionario: garantiasRecord.Concesionario || garantiasMmcRecord.Concesionario || salesRecord.dealership || stockRecord.dealership,
         telefonoAsesor: garantiasRecord["Teléfono Asesor"] || garantiasMmcRecord["Teléfono Asesor"],
         emailAsesor: garantiasRecord["Email Asesor"] || garantiasMmcRecord["Email Asesor"],
       },
      incidents: [],
      debug: {
        garantiasDataFound: !!garantiasData?.length,
        garantiasMmcDataFound: !!garantiasMmcData?.length,
        salesDataFound: !!salesData?.length,
        stockDataFound: !!stockData?.length,
        entregaDataFound: !!entregaData?.length,
        entregasDataFound: !!entregasData?.length,
        licensePlate,
        dni,
        garantiasRecord,
        garantiasMmcRecord,
        salesRecord,
        entregaRecord,
        entregasRecord,
      }
    }

    console.log("✅ Respuesta construida exitosamente")
    console.log("📊 Datos encontrados:", responseData.debug)

    return NextResponse.json(responseData)

  } catch (error) {
    console.error("💥 Error general en la API:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      details: error.message 
    }, { status: 500 })
  }
}
