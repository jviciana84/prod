export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("pdf") as File

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 })
    }

    // Verificar que sea un PDF
    if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "El archivo debe ser un PDF" }, { status: 400 })
    }

    console.log(`Procesando archivo: ${file.name}, tamaño: ${file.size} bytes`)

    // Convertir el archivo a un ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log("Archivo convertido a Buffer, iniciando extracción...")

    // Importar dinámicamente para evitar problemas en build
    const { extractTextFromPDF } = await import("@/lib/pdf-text-extractor")

    // Extraer texto del PDF
    const result = await extractTextFromPDF(buffer)

    if (!result) {
      return NextResponse.json({ error: "No se pudo extraer texto del PDF" }, { status: 500 })
    }

    console.log(`Extracción completada. Texto extraído: ${result.text.length} caracteres`)

    // Extraer campos específicos del texto
    let extractedFields = {}
    let fieldsCount = 0

    if (result.text && result.text.length > 0) {
      try {
        const { extractDataFromText } = await import("@/lib/text-processor")
        extractedFields = extractDataFromText(result.text)
        fieldsCount = Object.keys(extractedFields).filter(
          (key) => extractedFields[key as keyof typeof extractedFields] !== "",
        ).length
        console.log(`Campos extraídos: ${fieldsCount}/18`)
      } catch (processingError) {
        console.error("Error procesando campos:", processingError)
      }
    }

    return NextResponse.json({
      ...result,
      extractedFields,
      fieldsCount,
    })
  } catch (error) {
    console.error("Error procesando PDF:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
