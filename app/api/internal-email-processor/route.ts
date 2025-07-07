// Forzar el uso de Node.js runtime
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { extractTextFromPDF } from "@/lib/pdf-text-extractor"
import { extractDataFromText } from "@/lib/text-processor"
import { Buffer } from "buffer"

// Helper para convertir HTML a texto plano (simple) - (puedes moverlo a un utils si lo usas en más sitios)
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
    .replace(/\s\s+/g, " ")
    .trim()
}

interface AttachmentPayload {
  filename: string
  contentType: string
  content: string // Base64 encoded
}

interface EmailPayload {
  from: string
  to: string[]
  subject: string
  textBody?: string
  htmlBody?: string
  attachments?: AttachmentPayload[]
  messageId?: string
  date?: string
}

export async function POST(request: NextRequest) {
  try {
    const internalApiToken = process.env.INTERNAL_API_TOKEN
    const authorizationHeader = request.headers.get("Authorization")

    if (!internalApiToken || !authorizationHeader || authorizationHeader !== `Bearer ${internalApiToken}`) {
      console.warn("Intento de acceso no autorizado a internal-email-processor.")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("=== PROCESADOR INTERNO DE EMAIL RECIBIDO ===")
    const body: EmailPayload = await request.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Guardar el correo en la tabla received_emails
    const { data: savedEmail, error: emailSaveError } = await supabase
      .from("received_emails")
      .insert({
        from_email: body.from,
        to_email: body.to.join(", "),
        subject: body.subject,
        plain_text: body.textBody,
        html_text: body.htmlBody,
        // Podrías guardar los adjuntos como JSON si la estructura de tu tabla lo permite
        // o solo la información relevante.
        // attachments_info: body.attachments?.map(a => ({ filename: a.filename, contentType: a.contentType })),
        received_at: body.date ? new Date(body.date) : new Date().toISOString(),
        message_id: body.messageId,
        processed: false,
      })
      .select()
      .single()

    if (emailSaveError) {
      console.error("Error guardando email en received_emails:", emailSaveError)
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
    if (body.attachments && body.attachments.length > 0) {
      const comandaPdf = body.attachments.find(
        (att) =>
          att.contentType === "application/pdf" && att.filename && att.filename.toUpperCase().includes("COMANDA"),
      )
      const pdfToProcess = comandaPdf || body.attachments.find((att) => att.contentType === "application/pdf")

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
              extractionErrors = "PDF procesado pero no se extrajeron campos significativos."
            }
          } else {
            extractionErrors = "No se pudo extraer texto del PDF."
          }
        } catch (pdfError: any) {
          extractionErrors = `Error procesando PDF: ${pdfError.message}`
          console.error(extractionErrors, pdfError)
        }
      }
    }

    // 3. Si no se extrajo del PDF, intentar del cuerpo del correo
    if (extractionStatus !== "success") {
      console.log("Intentando extracción desde el cuerpo del correo...")
      const textToProcess = body.textBody || htmlToPlainText(body.htmlBody || "")
      if (textToProcess && textToProcess.trim() !== "") {
        if (!rawTextForStorage) rawTextForStorage = textToProcess // Guardar si no hay texto de PDF
        const emailBodyFields = extractDataFromText(textToProcess)
        if (Object.keys(emailBodyFields).some((key) => emailBodyFields[key] !== "")) {
          extractedFields = emailBodyFields
          extractionSource = "email_body"
          extractionStatus = "success"
          console.log("Datos extraídos del cuerpo del email:", extractedFields)
        } else {
          if (!extractionErrors) extractionErrors = "No se extrajeron campos del cuerpo del email."
        }
      } else {
        if (!extractionErrors) extractionErrors = "Cuerpo del correo vacío."
      }
    }

    // 4. Guardar datos extraídos y crear/actualizar sales_vehicles
    let pdfExtractionId: string | null = null
    if (extractionStatus === "success" && Object.keys(extractedFields).some((key) => extractedFields[key] !== "")) {
      const { data: extractionData, error: insertError } = await supabase
        .from("pdf_extracted_data")
        .insert({
          // ... (mapeo de extractedFields a las columnas de tu tabla)
          // Asegúrate de que las columnas coincidan con tu script anterior
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
          email_subject: body.subject,
          extraction_status: extractionStatus,
          extraction_errors: extractionErrors,
          raw_text: rawTextForStorage,
          extraction_source: extractionSource,
          received_email_id: savedEmail?.id || null, // Enlazar con el correo original
        })
        .select()
        .single()

      if (insertError) {
        console.error("Error guardando datos extraídos:", insertError)
      } else {
        pdfExtractionId = extractionData.id
        console.log("Datos extraídos guardados exitosamente:", extractionData.id)
        // Lógica para crear/actualizar sales_vehicles (reutiliza tu lógica existente)
        // ...
        const matricula = extractedFields["Nº DE MATRÍCULA"]
        if (matricula) {
          // ... (Tu lógica completa para sales_vehicles aquí) ...
          console.log(`Procesando venta para matrícula: ${matricula}`)
        }
      }
    } else {
      console.log("No se extrajeron campos significativos. No se guardaron datos en pdf_extracted_data.")
    }

    if (savedEmail) {
      await supabase
        .from("received_emails")
        .update({ processed: true, processed_at: new Date().toISOString(), extraction_id: pdfExtractionId })
        .eq("id", savedEmail.id)
    }

    return NextResponse.json({
      success: true,
      message: "Email procesado internamente",
      extractionStatus,
      pdfExtractionId,
    })
  } catch (error: any) {
    console.error("Error catastrófico en internal-email-processor:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
