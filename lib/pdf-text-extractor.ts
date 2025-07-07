export async function extractTextFromPDF(pdfBuffer: Buffer) {
  try {
    console.log("Iniciando extracción de texto del PDF...")
    console.log("Tamaño del buffer:", pdfBuffer.length)

    // Importar pdf-parse dinámicamente solo en runtime
    const pdfParse = (await import("pdf-parse")).default

    console.log("pdf-parse importado correctamente")

    // Configuración específica para evitar problemas con archivos de prueba
    const data = await pdfParse(pdfBuffer, {
      max: 0,
      version: "v1.10.100",
    })

    console.log("Texto extraído directamente del PDF:", data.text.substring(0, 200) + "...")

    if (data.text && data.text.trim().length > 0) {
      console.log("Extracción exitosa con pdf-parse")
      return {
        text: data.text,
        method: "direct",
        pages: data.numpages,
        info: data.info,
      }
    }

    console.error("No se extrajo texto del PDF")
    return null
  } catch (error) {
    console.error("Error extrayendo texto directamente del PDF:", error)
    return null
  }
}
