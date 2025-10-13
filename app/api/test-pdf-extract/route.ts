export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"

// Función para extraer texto del PDF
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Importar dinámicamente para evitar problemas en build
    const { extractTextFromPDF } = await import("@/lib/pdf-text-extractor")
    const result = await extractTextFromPDF(buffer)
    return result?.text || ""
  } catch (error) {
    console.error("Error extrayendo texto del PDF:", error)
    throw new Error("No se pudo extraer texto del PDF")
  }
}

// Función para procesar el texto extraído
function processExtractedText(text: string): Record<string, string> {
  try {
    // Importar dinámicamente para evitar problemas en build
    const { extractDataFromText } = require("@/lib/text-processor")
    return extractDataFromText(text)
  } catch (error) {
    console.error("Error procesando texto extraído:", error)
    throw new Error("No se pudieron procesar los campos del texto")
  }
}

export async function POST(request: NextRequest) {
  console.log("=== API DEBUG: Iniciando procesamiento de PDF ===")
  
  try {
    // Recibir texto extraído desde el cliente
    const body = await request.json()
    const extractedText = body.text as string

    if (!extractedText) {
      console.error("=== API DEBUG: No se proporcionó texto ===")
      return NextResponse.json({ error: "No se proporcionó texto del PDF" }, { status: 400 })
    }

    console.log(`=== API DEBUG: Texto recibido del cliente ===`)
    console.log(`Tamaño: ${extractedText.length} caracteres`)
    console.log(`Primeros 200 caracteres: ${extractedText.substring(0, 200)}`)
    
    if (extractedText.trim().length === 0) {
      console.error("=== API DEBUG: El texto está vacío ===")
      return NextResponse.json({ 
        error: "El texto extraído está vacío. El PDF puede estar corrupto o ser una imagen escaneada." 
      }, { status: 400 })
    }

    console.log("=== API DEBUG: Texto válido, procesando campos... ===")

    // Procesar el texto extraído para obtener los campos
    let extractedFields = {}
    try {
      extractedFields = processExtractedText(extractedText)
      console.log("=== API DEBUG: Campos extraídos ===", Object.keys(extractedFields))
      console.log("=== API DEBUG: Campos con valores ===", Object.entries(extractedFields).filter(([k, v]) => v && String(v).trim() !== ""))
    } catch (processError) {
      console.error("=== API DEBUG: Error procesando campos ===", processError)
      return NextResponse.json({ 
        error: `Error procesando campos del PDF: ${(processError as Error).message}` 
      }, { status: 400 })
    }
    
    if (!extractedFields || Object.keys(extractedFields).length === 0) {
      console.error("=== API DEBUG: No se pudieron extraer campos válidos ===")
      return NextResponse.json({ 
        error: "No se pudieron extraer campos válidos del PDF. El formato del documento no es reconocido." 
      }, { status: 400 })
    }

    console.log("=== API DEBUG: Campos extraídos exitosamente ===", extractedFields)

    const response = {
      text: extractedText,
      extractedFields,
      method: "client-extraction",
      pages: "unknown", // El cliente no envía número de páginas
    }

    console.log("=== API DEBUG: Enviando respuesta exitosa ===")
    return NextResponse.json(response)
  } catch (error: any) {
    console.error("=== API DEBUG: Error procesando PDF ===", error)
    return NextResponse.json({ 
      error: error.message || "Error interno del servidor al procesar el PDF" 
    }, { status: 500 })
  }
}
