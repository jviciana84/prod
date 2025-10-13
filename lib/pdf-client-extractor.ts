// Extractor de texto de PDF para el CLIENTE (navegador)
// Usa pdf.js desde CDN para evitar problemas de webpack

declare global {
  interface Window {
    pdfjsLib: any
  }
}

async function loadPdfJs(): Promise<any> {
  if (window.pdfjsLib) {
    return window.pdfjsLib
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        resolve(window.pdfjsLib)
      } else {
        reject(new Error('pdf.js no se cargó correctamente'))
      }
    }
    script.onerror = () => reject(new Error('Error cargando pdf.js'))
    document.head.appendChild(script)
  })
}

export async function extractTextFromPDFClient(file: File): Promise<string> {
  try {
    console.log('📄 Extrayendo texto del PDF en el cliente...')
    
    // Cargar pdf.js desde CDN
    const pdfjsLib = await loadPdfJs()
    console.log('✅ pdf.js cargado desde CDN')
    
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

