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
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.error("=== API DEBUG: No se proporcionó ningún archivo ===")
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 })
    }

    // Verificar que sea un PDF
    if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
      console.error("=== API DEBUG: El archivo no es un PDF ===")
      return NextResponse.json({ error: "El archivo debe ser un PDF" }, { status: 400 })
    }

    console.log(`=== API DEBUG: Procesando archivo ===`)
    console.log(`Nombre: ${file.name}`)
    console.log(`Tamaño: ${file.size} bytes`)
    console.log(`Tipo: ${file.type}`)

    // Convertir el archivo a un ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log("=== API DEBUG: Archivo convertido a Buffer, iniciando extracción... ===")

    // Extraer texto del PDF
    let extractedText = ""
    try {
      extractedText = await extractTextFromPdf(buffer)
      console.log(`=== API DEBUG: Texto extraído: ${extractedText.length} caracteres ===`)
      console.log(`=== API DEBUG: Primeros 200 caracteres: ${extractedText.substring(0, 200)} ===`)
    } catch (extractError) {
      console.error("=== API DEBUG: Error extrayendo texto ===", extractError)
      return NextResponse.json({ 
        error: `Error extrayendo texto del PDF: ${(extractError as Error).message}` 
      }, { status: 400 })
    }
    
    if (!extractedText || extractedText.trim().length === 0) {
      console.error("=== API DEBUG: No se pudo extraer texto del PDF ===")
      return NextResponse.json({ 
        error: "No se pudo extraer texto del PDF. El archivo puede estar corrupto, protegido o ser una imagen escaneada." 
      }, { status: 400 })
    }

    console.log("=== API DEBUG: Texto extraído, procesando campos... ===")

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
      method: "pdf-text-extraction",
      pages: "1", // Por ahora asumimos 1 página
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
