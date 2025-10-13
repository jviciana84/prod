// Importar y configurar DOMMatrix ANTES de cualquier otra cosa
import DOMMatrix from 'dommatrix'
if (typeof global !== 'undefined') {
  (global as any).DOMMatrix = DOMMatrix
}

export async function extractTextFromPDF(pdfBuffer: Buffer) {
  try {
    console.log("Iniciando extracción de texto del PDF con pdfjs-dist...")
    console.log("Tamaño del buffer:", pdfBuffer.length)

    // Importar pdfjs-dist dinámicamente
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs")

    console.log("pdfjs-dist importado correctamente")

    // Cargar el documento PDF
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
      standardFontDataUrl: undefined,
    })

    const pdfDocument = await loadingTask.promise
    console.log(`PDF cargado: ${pdfDocument.numPages} páginas`)

    // Extraer texto de todas las páginas
    let fullText = ""
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ")
      fullText += pageText + "\n"
    }

    console.log("Texto extraído con pdfjs-dist:", fullText.substring(0, 200) + "...")

    if (fullText && fullText.trim().length > 0) {
      console.log("Extracción exitosa con pdfjs-dist")
      return {
        text: fullText,
        method: "pdfjs-dist",
        pages: pdfDocument.numPages,
        info: {},
      }
    }

    console.error("No se extrajo texto del PDF")
    return null
  } catch (error) {
    console.error("Error extrayendo texto con pdfjs-dist:", error)
    return null
  }
}
