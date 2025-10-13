// Extractor de texto de PDF para el CLIENTE (navegador)
// Aquí DOMMatrix SÍ existe, no hay problemas

export async function extractTextFromPDFClient(file: File): Promise<string> {
  try {
    console.log('📄 Extrayendo texto del PDF en el cliente...')
    
    // Importar dinámicamente pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
    
    // Configurar worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
    
    // Leer el archivo como ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    
    // Cargar el PDF
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    
    console.log(`✅ PDF cargado: ${pdf.numPages} páginas`)
    
    // Extraer texto de todas las páginas
    let fullText = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      fullText += pageText + '\n'
    }
    
    console.log(`✅ Texto extraído: ${fullText.length} caracteres`)
    return fullText
  } catch (error) {
    console.error('❌ Error extrayendo texto del PDF:', error)
    throw new Error('No se pudo extraer texto del PDF')
  }
}

