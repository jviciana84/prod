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

    // Buscar en garantias_brutas_MM (tabla principal con datos del cliente)
    console.log("🔍 Consultando tabla garantias_brutas_MM...")
    const { data: garantiasData, error: garantiasError } = await supabase
      .from("garantias_brutas_MM")
      .select("*")
      .ilike("matricula", `%${licensePlate}%`)
      .limit(1)

    if (garantiasError) {
      console.error("❌ Error consultando garantias_brutas_mm:", garantiasError)
    } else {
      console.log("✅ Datos de garantias_brutas_mm encontrados:", garantiasData?.length || 0)
    }

    // Buscar en garantias_brutas_MMC
    console.log("🔍 Consultando tabla garantias_brutas_MMC...")
    const { data: garantiasMmcData, error: garantiasMmcError } = await supabase
      .from("garantias_brutas_MMC")
      .select("*")
      .ilike("matricula", `%${licensePlate}%`)
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
      .select("*")
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
    console.log("📊 Datos encontrados en stock:", stockRecord)
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

     // Función para calcular la información de garantía
     const calculateWarrantyInfo = (fechaMatriculacion: string, garantiasRecord: any, garantiasMmcRecord: any, modelo: string) => {
       if (!fechaMatriculacion) return { fechaFinal: null, descripcion: null }
       
       try {
         const regDate = new Date(fechaMatriculacion)
         
         // Calcular fecha de garantía de fábrica (matriculación + 36 meses - 1 día)
         const fabricaDate = new Date(regDate)
         fabricaDate.setMonth(fabricaDate.getMonth() + 36)
         fabricaDate.setDate(fabricaDate.getDate() - 1) // Restar 1 día porque el primer día cuenta
         const fechaFabrica = formatDate(fabricaDate.toISOString())
         
         // Verificar si hay garantía contratada (está en garantias_brutas_MM o garantias_brutas_MMC)
         const garantiaContratada = garantiasRecord || garantiasMmcRecord
         
         if (!garantiaContratada) {
           // Solo garantía de fábrica
           return {
             fechaFinal: fechaFabrica,
             descripcion: `Garantía de fábrica hasta ${fechaFabrica}`
           }
         } else {
           // Hay garantía contratada, usar F.Final
           const fechaFinal = garantiaContratada["F.Final"] || garantiaContratada["f_final"]
           
           if (fechaFinal) {
             const fechaFinalFormateada = formatDate(fechaFinal)
             
             // Determinar tipo de certificación
             const tipoCert = getCertificationType(modelo)
             
             return {
               fechaFinal: fechaFinalFormateada,
               descripcion: `Garantía de fábrica hasta ${fechaFabrica}, extensión ${tipoCert} hasta ${fechaFinalFormateada}`
             }
           } else {
             // No se encontró F.Final, usar solo garantía de fábrica
             return {
               fechaFinal: fechaFabrica,
               descripcion: `Garantía de fábrica hasta ${fechaFabrica}`
             }
           }
         }
       } catch (error) {
         console.error("Error calculando información de garantía:", error)
         return { fechaFinal: null, descripcion: null }
       }
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
       
       return "Cumple con todos los parámetros exigidos para su antigüedad y kilometraje."
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

     // Función para resolver el nombre completo del asesor desde el alias
     const resolveAsesorName = async (asesorAlias: string | null | undefined): Promise<{name: string, position: string, phone: string, email: string}> => {
       if (!asesorAlias) return {name: "Asesor Desconocido", position: "", phone: "", email: ""}
       
       console.log(`🔍 Resolviendo nombre completo para asesor: "${asesorAlias}"`)
       
       // Si ya es un nombre completo (contiene espacios) o es un nombre estático, devolverlo tal como está
       if (asesorAlias.includes(" ") || ["Comercial", "Sistema", "Taller"].includes(asesorAlias)) {
         console.log(`✅ Devolviendo nombre completo/estático: "${asesorAlias}"`)
         return {name: asesorAlias, position: "", phone: "", email: ""}
       }
       
       try {
         // Buscar en la tabla profiles por alias
         const { data: profileByAlias, error: aliasError } = await supabase
           .from("profiles")
           .select("full_name, position, phone, email")
           .ilike("alias", asesorAlias)
           .limit(1)
         
         if (aliasError) {
           console.warn(`⚠️ Error buscando por alias ${asesorAlias}:`, aliasError.message)
         } else if (profileByAlias && profileByAlias.length > 0) {
           console.log(`✅ Encontrado nombre completo: "${profileByAlias[0].full_name}" para alias "${asesorAlias}"`)
           return {
             name: profileByAlias[0].full_name,
             position: profileByAlias[0].position || "",
             phone: profileByAlias[0].phone || "",
             email: profileByAlias[0].email || ""
           }
         }
         
         console.log(`⚠️ No se encontró perfil para alias "${asesorAlias}". Intentando búsqueda por nombre completo.`)
         
         // Fallback: si no hay coincidencia por alias, intentar coincidencia por full_name
         const { data: fullNameData, error: fullNameError } = await supabase
           .from("profiles")
           .select("full_name, position, phone, email")
           .ilike("full_name", asesorAlias)
           .limit(1)
         
         if (fullNameError) {
           console.warn(`⚠️ Error buscando por nombre completo ${asesorAlias}:`, fullNameError.message)
         } else if (fullNameData && fullNameData.length > 0) {
           console.log(`✅ Encontrado nombre completo: "${fullNameData[0].full_name}" para búsqueda por nombre "${asesorAlias}"`)
           return {
             name: fullNameData[0].full_name,
             position: fullNameData[0].position || "",
             phone: fullNameData[0].phone || "",
             email: fullNameData[0].email || ""
           }
         }
         
         console.log(`⚠️ No se encontró coincidencia para "${asesorAlias}". Devolviendo alias original.`)
         return {name: asesorAlias, position: "", phone: "", email: ""} // Fallback al alias original si no se encuentra nada
         
       } catch (err) {
         console.error(`💥 Error resolviendo nombre de asesor para ${asesorAlias}:`, err)
         return {name: asesorAlias, position: "", phone: "", email: ""}
       }
     }

         // Obtener fecha de matriculación
     const fechaMatriculacion = garantiasRecord["f_matricula"] || garantiasMmcRecord["f_matricula"] || salesRecord.registration_date || stockRecord.registration_date

     // Obtener fecha de entrega desde la tabla entregas
     const fechaEntrega = entregasRecord.fecha_entrega || entregaRecord.fecha_entrega || entregaRecord.fecha || entregaRecord.created_at

     // Obtener incidencias desde la tabla entregas (campo incidencias)
     const { data: incidenciasData, error: incidenciasError } = await supabase
       .from("entregas")
       .select("incidencias")
       .eq("matricula", licensePlate)
       .not("incidencias", "is", null)
       .not("incidencias", "eq", "[]")
       .not("incidencias", "eq", "")

     console.log("🔍 Buscando incidencias en tabla entregas para matrícula:", licensePlate)
     console.log("📊 Incidencias encontradas en entregas:", incidenciasData)

     // Obtener incidencias desde la tabla incidencias_historial
     const { data: incidenciasHistorialData, error: incidenciasHistorialError } = await supabase
       .from("incidencias_historial")
       .select("*")
       .eq("matricula", licensePlate)
       .order("fecha", { ascending: false })

     console.log("🔍 Buscando incidencias en incidencias_historial para matrícula:", licensePlate)
     console.log("📊 Incidencias encontradas en historial:", incidenciasHistorialData)

     // Procesar incidencias
     let incidents = []
     
     // Primero intentar desde incidencias_historial (más reciente)
     if (incidenciasHistorialData && incidenciasHistorialData.length > 0) {
       incidents = incidenciasHistorialData.map((incidencia, index) => {
         // Formatear fecha correctamente
         let fechaFormateada = "Sin fecha"
         if (incidencia.fecha) {
           fechaFormateada = formatDate(incidencia.fecha)
         } else if (incidencia.created_at) {
           fechaFormateada = formatDate(incidencia.created_at)
         }
         
         return {
           id: incidencia.id || index + 1,
           tipo: incidencia.tipo_incidencia || "Sin especificar",
           descripcion: incidencia.comentario || incidencia.descripcion || "Sin descripción",
           fecha: fechaFormateada,
           estado: incidencia.resuelta ? "Cerrada" : "Abierta",
           prioridad: "Media" // Por defecto
         }
       })
       console.log("✅ Usando incidencias de incidencias_historial")
     }
     // Si no hay en historial, intentar desde entregas
     else if (incidenciasData && incidenciasData.length > 0) {
       try {
         // Tomar la primera entrega con incidencias
         const incidenciasString = incidenciasData[0].incidencias
         if (incidenciasString && typeof incidenciasString === 'string') {
           const incidenciasParsed = JSON.parse(incidenciasString)
           if (Array.isArray(incidenciasParsed)) {
             incidents = incidenciasParsed.map((incidencia, index) => {
               // Formatear fecha correctamente
               let fechaFormateada = "Sin fecha"
               if (incidencia.fecha) {
                 fechaFormateada = formatDate(incidencia.fecha)
               }
               
               return {
                 id: index + 1,
                 tipo: incidencia.tipo || "Sin especificar",
                 descripcion: incidencia.descripcion || "Sin descripción",
                 fecha: fechaFormateada,
                 estado: incidencia.estado || "Abierta",
                 prioridad: incidencia.prioridad || "Media"
               }
             })
           }
         }
         console.log("✅ Usando incidencias de tabla entregas")
       } catch (parseError) {
         console.error("❌ Error parseando incidencias de entregas:", parseError)
         incidents = []
       }
     }

    // Obtener información de certificación desde la tabla entregas
    const fechaCertificacion = getCertificationDate(entregasRecord)
    const tipoCertificacion = getCertificationType(salesRecord.model || garantiasRecord.Modelo || garantiasMmcRecord.Modelo || stockRecord.model)
    
         // Generar texto de valoración
     const año = getYearFromRegistration(fechaMatriculacion)
     const kilometraje = garantiasRecord.kms || garantiasMmcRecord.kms || salesRecord.mileage || stockRecord.mileage
     const valoracionText = getValoracionText(kilometraje, año)

     // Logs específicos para información del propietario
     console.log("👤 Información del propietario desde sales_vehicles:")
     console.log("  - client_name:", salesRecord.client_name)
     console.log("  - client_dni:", salesRecord.client_dni)
     console.log("  - client_phone:", salesRecord.client_phone)
     console.log("  - client_email:", salesRecord.client_email)
     console.log("  - client_address:", salesRecord.client_address)
     
     console.log("👤 Información del propietario desde stock:")
     console.log("  - client_name:", stockRecord.client_name)
     console.log("  - client_dni:", stockRecord.client_dni)
     console.log("  - client_phone:", stockRecord.client_phone)
     console.log("  - client_email:", stockRecord.client_email)
     console.log("  - client_address:", stockRecord.client_address)

         // Construir respuesta con datos reales
     const responseData = {
       success: true,
       vehicleData: {
         matricula: licensePlate,
         marca: garantiasRecord.marca || garantiasMmcRecord.marca || salesRecord.brand || stockRecord.brand,
         modelo: garantiasRecord.modelo || garantiasMmcRecord.modelo || salesRecord.model || stockRecord.model,
         año: getYearFromRegistration(fechaMatriculacion),
         color: salesRecord.color || stockRecord.color,
         kilometraje: garantiasRecord.kms || garantiasMmcRecord.kms || salesRecord.mileage || stockRecord.mileage,
         vin: getBastidor(garantiasRecord.chasis || garantiasMmcRecord.chasis || salesRecord.vin || stockRecord.vin),
         fechaMatriculacion: formatDate(fechaMatriculacion),
         fechaEntrega: formatDate(fechaEntrega),
         fechaVenta: formatDate(garantiasRecord["f_venta"] || garantiasMmcRecord["f_venta"] || salesRecord.sale_date || stockRecord.sale_date),
                           fechaCertificacion: fechaCertificacion,
         tipoCertificacion: tipoCertificacion,
         valoracion: valoracionText,
         diasDesdeVenta: getTimeSinceDelivery(fechaEntrega),
         garantiaInfo: calculateWarrantyInfo(fechaMatriculacion, garantiasRecord, garantiasMmcRecord, salesRecord.model || garantiasRecord.Modelo || garantiasMmcRecord.Modelo || stockRecord.model),
         precio: garantiasRecord["precio_venta"] || garantiasMmcRecord["precio_venta"] || salesRecord.price || stockRecord.price,
         descuento: salesRecord.discount,
         precioOriginal: ((garantiasRecord["precio_venta"] || garantiasMmcRecord["precio_venta"] || salesRecord.price || stockRecord.price) || 0) + Math.abs(salesRecord.discount || 0),
       },
       ownerData: {
         nombre: salesRecord.client_name || stockRecord.client_name,
         dni: dni || salesRecord.client_dni || stockRecord.client_dni,
         telefono: salesRecord.client_phone || stockRecord.client_phone,
         email: salesRecord.client_email || stockRecord.client_email,
         direccion: salesRecord.client_address || stockRecord.client_address,
       },
       saleData: {
         asesorComercial: (await resolveAsesorName(salesRecord.advisor || stockRecord.advisor)).name,
         asesorPosition: (await resolveAsesorName(salesRecord.advisor || stockRecord.advisor)).position,
         concesionario: salesRecord.dealership || stockRecord.dealership,
         telefonoAsesor: (await resolveAsesorName(salesRecord.advisor || stockRecord.advisor)).phone,
         emailAsesor: (await resolveAsesorName(salesRecord.advisor || stockRecord.advisor)).email,
       },
      incidents: incidents,
      debug: {
        garantiasDataFound: !!garantiasData?.length,
        garantiasMmcDataFound: !!garantiasMmcData?.length,
        salesDataFound: !!salesData?.length,
        stockDataFound: !!stockData?.length,
        entregaDataFound: !!entregaData?.length,
        entregasDataFound: !!entregasData?.length,
        incidenciasDataFound: !!incidenciasData?.length,
        incidenciasHistorialDataFound: !!incidenciasHistorialData?.length,
        incidenciasCount: incidents.length,
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
    
    // Log del ownerData final
    console.log("👤 ownerData final:", responseData.ownerData)

    return NextResponse.json(responseData)

  } catch (error) {
    console.error("💥 Error general en la API:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      details: error.message 
    }, { status: 500 })
  }
}
