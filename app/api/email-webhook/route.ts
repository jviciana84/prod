// Forzar el uso de Node.js runtime
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { extractTextFromPDF } from "@/lib/pdf-text-extractor"
import { extractDataFromText } from "@/lib/text-processor"
import { Buffer } from "buffer" // Asegúrate de importar Buffer

// Helper para convertir HTML a texto plano (simple)
function htmlToPlainText(html: string): string {
  if (!html) return ""
  return html
    .replace(/<style([\s\S]*?)<\/style>/gi, "")
    .replace(/<script([\s\S]*?)<\/script>/gi, "")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li>/gi, "  *  ")
    .replace(/<\/ul>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/gi, "")
    .replace(/\s\s+/g, " ") // Reemplazar múltiples espacios con uno solo
    .trim()
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== WEBHOOK EMAIL RECIBIDO ===")
    // Verificación de token opcional (puede ser configurado para otros proveedores)
    const webhookToken = process.env.WEBHOOK_TOKEN
    if (webhookToken) {
      const providedToken = request.headers.get("X-Webhook-Token")
      if (providedToken !== webhookToken) {
        console.error("Token de webhook inválido.")
        return NextResponse.json({ error: "No autorizado" }, { status: 401 })
      }
      console.log("Token de webhook verificado.")
    }

    const body = await request.json()
    // console.log("Cuerpo del webhook:", JSON.stringify(body, null, 2)); // Log detallado si es necesario

    if (!body.envelope || !body.envelope.from || !body.envelope.to) {
      console.error("Datos del envelope faltantes")
      return NextResponse.json({ error: "Datos del envelope faltantes" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Guardar el correo en received_emails (tabla genérica para emails recibidos)
    const { data: savedEmail, error: emailSaveError } = await supabase
      .from("received_emails")
      .insert({
        from_email: body.envelope.from,
        to_email: Array.isArray(body.envelope.to) ? body.envelope.to.join(", ") : body.envelope.to,
        subject: body.headers?.subject || "Sin asunto",
        plain_text: body.plain,
        html_text: body.html,
        headers: body.headers,
        envelope: body.envelope,
        attachments: body.attachments,
        received_at: new Date().toISOString(),
        processed: false, // Se marcará como procesado después
      })
      .select()
      .single()

    if (emailSaveError) {
      console.error("Error guardando email en received_emails:", emailSaveError)
      // Continuar igualmente si es posible, o retornar error si es crítico
    } else {
      console.log("Email guardado en received_emails:", savedEmail.id)
    }

    let extractedFields: Record<string, string> = {}
    let extractionSource: "pdf" | "email_body" | null = null
    let pdfFilename: string | null = null
    let rawTextForStorage: string | null = null
    let extractionStatus: "success" | "partial" | "failed" = "failed"
    let extractionErrors: string | null = null

    // 2. Intentar extracción de PDF
    if (body.attachments && Array.isArray(body.attachments) && body.attachments.length > 0) {
      const comandaPdf = body.attachments.find(
        (att: any) =>
          att.content_type === "application/pdf" && att.filename && att.filename.toUpperCase().includes("COMANDA"),
      )
      const pdfToProcess = comandaPdf || body.attachments.find((att: any) => att.content_type === "application/pdf")

      if (pdfToProcess && pdfToProcess.content) {
        console.log(`Procesando PDF adjunto: ${pdfToProcess.filename}`)
        pdfFilename = pdfToProcess.filename
        try {
          const pdfBuffer = Buffer.from(pdfToProcess.content, "base64")
          const extractionResult = await extractTextFromPDF(pdfBuffer)

          if (extractionResult && extractionResult.text) {
            rawTextForStorage = extractionResult.text
            extractedFields = extractDataFromText(extractionResult.text)
            if (Object.keys(extractedFields).some((key) => extractedFields[key] !== "")) {
              extractionSource = "pdf"
              extractionStatus = "success"
              console.log("Datos extraídos del PDF:", extractedFields)
            } else {
              console.log("PDF procesado pero no se extrajeron campos significativos.")
              extractionErrors = "PDF procesado pero no se extrajeron campos significativos."
            }
          } else {
            extractionErrors = "No se pudo extraer texto del PDF."
            console.error(extractionErrors)
          }
        } catch (pdfError: any) {
          extractionErrors = `Error procesando PDF: ${pdfError.message}`
          console.error(extractionErrors, pdfError)
        }
      }
    }

    // 3. Si no se extrajo del PDF, intentar del cuerpo del correo
    if (extractionSource !== "pdf" || extractionStatus !== "success") {
      console.log("Intentando extracción desde el cuerpo del correo...")
      const textToProcess = body.plain || htmlToPlainText(body.html || "")
      if (textToProcess && textToProcess.trim() !== "") {
        rawTextForStorage = textToProcess // Sobrescribir o añadir si se quiere guardar ambos
        const emailBodyFields = extractDataFromText(textToProcess)
        if (Object.keys(emailBodyFields).some((key) => emailBodyFields[key] !== "")) {
          extractedFields = emailBodyFields // Sobrescribir si el PDF no dio nada, o fusionar si se desea
          extractionSource = "email_body"
          extractionStatus = "success" // Asumir éxito si se extraen campos
          console.log("Datos extraídos del cuerpo del email:", extractedFields)
        } else {
          console.log("Cuerpo del email procesado pero no se extrajeron campos significativos.")
          if (!extractionErrors) extractionErrors = "No se extrajeron campos del cuerpo del email."
        }
      } else {
        console.log("Cuerpo del correo vacío o no procesable.")
        if (!extractionErrors) extractionErrors = "Cuerpo del correo vacío."
      }
    }

    // 4. Guardar datos extraídos y crear/actualizar sales_vehicles si hay campos
    let pdfExtractionId: string | null = null
    if (Object.keys(extractedFields).some((key) => extractedFields[key] !== "")) {
      const { data: extractionData, error: insertError } = await supabase
        .from("pdf_extracted_data") // Asegúrate que esta tabla existe y tiene las columnas correctas
        .insert({
          numero_pedido: extractedFields["Nº PEDIDO"] || null,
          fecha_pedido: extractedFields["FECHA DE PEDIDO"] || null,
          nombre_apellidos: extractedFields["NOMBRE Y APELLIDOS O EMPRESA"] || null,
          dni_nif: extractedFields["D.N.I. Ó N.I.F."] || null,
          email: extractedFields["EMAIL"] || null,
          telefono_particular: extractedFields["TFNO. PARTICULAR"] || null,
          domicilio: extractedFields["DOMICILIO"] || null,
          ciudad: extractedFields["CIUDAD"] || null,
          codigo_postal: extractedFields["C.P."] || null,
          provincia: extractedFields["PROVINCIA"] || null,
          numero_matricula: extractedFields["Nº DE MATRÍCULA"] || null,
          numero_bastidor: extractedFields["Nº BASTIDOR"] || null,
          modelo: extractedFields["MODELO"] || null,
          comercial: extractedFields["Comercial"] || null,
          portal_origen: extractedFields["PORTAL ORIGEN"] || null,
          banco: extractedFields["BANCO"] || null,
          total: extractedFields["TOTAL"]
            ? Number.parseFloat(extractedFields["TOTAL"].replace(/[^\d,.-]/g, "").replace(",", ".")) || null
            : null,
          descuento: extractedFields["DESCUENTO"]
            ? Number.parseFloat(extractedFields["DESCUENTO"].replace(/[^\d,.-]/g, "").replace(",", ".")) || null
            : null,
          pdf_filename: pdfFilename,
          email_subject: body.headers?.subject || "Sin asunto",
          extraction_status: extractionStatus,
          extraction_errors: extractionErrors,
          raw_text: rawTextForStorage,
          extraction_source: extractionSource, // Nueva columna
          received_email_id: savedEmail?.id || null, // Enlazar con el correo original
        })
        .select()
        .single()

      if (insertError) {
        console.error("Error guardando datos extraídos:", insertError)
        // No retornar error aquí necesariamente, podría ser un problema de datos parciales
      } else {
        pdfExtractionId = extractionData.id
        console.log("Datos extraídos guardados exitosamente:", extractionData.id)

        // Lógica para crear/actualizar sales_vehicles (similar a la que ya tenías)
        const matricula = extractedFields["Nº DE MATRÍCULA"]
        if (matricula) {
          const { data: existingVehicle } = await supabase
            .from("sales_vehicles")
            .select("id, document_id") // Solo seleccionar lo necesario
            .eq("license_plate", matricula.toUpperCase())
            .order("created_at", { ascending: false }) // Tomar el más reciente si hay duplicados por matrícula
            .limit(1)
            .maybeSingle()

          let isDuplicate = false
          let isResale = false

          if (existingVehicle) {
            const existingDNI = existingVehicle.document_id || ""
            const newDNI = extractedFields["D.N.I. Ó N.I.F."] || ""
            if (existingDNI && newDNI && existingDNI.trim().toUpperCase() !== newDNI.trim().toUpperCase()) {
              isResale = true
            } else {
              isDuplicate = true
            }
          }

          if (isDuplicate) {
            console.log(
              `Vehículo con matrícula ${matricula} ya existe y DNI coincide. No se crea nuevo registro de venta.`,
            )
          } else {
            // ... (resto de tu lógica para determinar paymentMethod, documentType, vehicleType, price, advisorId, etc.)
            // Asegúrate que esta lógica esté completa y sea robusta
            let paymentMethod = "Contado"
            const banco = extractedFields["BANCO"]?.toUpperCase() || ""
            if (
              banco.includes("BMW") ||
              banco.includes("SELECT") ||
              banco.includes("LINEAL") ||
              banco.includes("BALLOON") ||
              banco.includes("TRIPLE 0")
            ) {
              paymentMethod = "Financiación"
            } else if (banco !== "CONTADO" && banco !== "") {
              paymentMethod = "Externa"
            }

            let documentType = "DNI"
            const documentId = extractedFields["D.N.I. Ó N.I.F."] || ""
            if (documentId.startsWith("X") || documentId.startsWith("Y") || documentId.startsWith("Z")) {
              documentType = "NIE"
            } else if (/^[A-Z]/.test(documentId)) {
              documentType = "CIF"
            }

            const modelo = extractedFields["MODELO"] || ""
            const vehicleType = modelo.toLowerCase().includes("moto") ? "Moto" : "Coche"

            let price = null
            if (extractedFields["TOTAL"]) {
              const cleanPrice = extractedFields["TOTAL"].replace(/[^\d,.-]/g, "").replace(",", ".")
              price = Number.parseFloat(cleanPrice)
            }

            let advisorId = null
            let advisorName = extractedFields["Comercial"] || ""
            let advisorAlias = advisorName.split(" ")[0] || "" // Simple alias

            if (advisorName) {
              const { data: profilesData } = await supabase
                .from("profiles")
                .select("id, full_name, alias")
                .ilike("full_name", `%${advisorName.split(" ")[0]}%`) // Búsqueda más flexible

              if (profilesData && profilesData.length > 0) {
                // Lógica para encontrar el mejor match si hay varios
                const advisor = profilesData.find((p) => p.full_name.toLowerCase().includes(advisorName.toLowerCase()))
                if (advisor) {
                  advisorId = advisor.id
                  advisorName = advisor.full_name
                  advisorAlias = advisor.alias || advisor.full_name.split(" ")[0]
                }
              }
            }

            const salesData = {
              license_plate: matricula.toUpperCase(),
              model: extractedFields["MODELO"] || "",
              vehicle_type: vehicleType,
              sale_date: new Date().toISOString(),
              advisor: advisorAlias,
              advisor_name: advisorName,
              advisor_id: advisorId,
              payment_method: paymentMethod,
              payment_status: "pendiente",
              price: price,
              document_type: documentType,
              document_id: documentId,
              client_name: extractedFields["NOMBRE Y APELLIDOS O EMPRESA"] || "",
              client_email: extractedFields["EMAIL"] || null,
              client_phone: extractedFields["TFNO. PARTICULAR"] || null,
              client_address: extractedFields["DOMICILIO"] || null,
              client_city: extractedFields["CIUDAD"] || null,
              client_province: extractedFields["PROVINCIA"] || null,
              client_postal_code: extractedFields["C.P."] || null,
              vin: extractedFields["Nº BASTIDOR"] || null,
              order_number: extractedFields["Nº PEDIDO"] || null,
              order_date: extractedFields["FECHA DE PEDIDO"] || null, // Asegurar formato correcto o convertir
              bank: extractedFields["BANCO"] || null,
              discount: extractedFields["DESCUENTO"]
                ? Number.parseFloat(extractedFields["DESCUENTO"].replace(/[^\d,.-]/g, "").replace(",", ".")) || null
                : null,
              portal_origin: extractedFields["PORTAL ORIGEN"] || null,
              cyp_status: "pendiente",
              photo_360_status: "pendiente",
              validated: false,
              pdf_extraction_id: pdfExtractionId,
              is_resale: isResale,
            }

            const { data: salesResult, error: salesError } = await supabase
              .from("sales_vehicles")
              .insert([salesData])
              .select()
              .single()

            if (salesError) {
              console.error("Error al crear la venta:", salesError)
            } else {
              console.log("Venta registrada correctamente:", salesResult.id)
            }
          }
        }
      }
    } else {
      console.log(
        "No se extrajeron campos significativos del correo o PDF. No se guardaron datos en pdf_extracted_data ni se creó venta.",
      )
    }

    // Marcar el correo original como procesado si se guardaron datos extraídos
    if (savedEmail && pdfExtractionId) {
      await supabase
        .from("received_emails")
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq("id", savedEmail.id)
    } else if (savedEmail) {
      // Marcar como procesado pero con error si no se extrajo nada útil
      await supabase
        .from("received_emails")
        .update({ processed: true, processed_at: new Date().toISOString() }) // O un estado de error
        .eq("id", savedEmail.id)
    }

    return NextResponse.json({ success: true, message: "Email procesado", extractionStatus, pdfExtractionId })
  } catch (error: any) {
    console.error("Error catastrófico procesando webhook:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
