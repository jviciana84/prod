import { pdf } from '@react-pdf/renderer'
import TasacionPDF from '../components/pdf/TasacionPDF'
import type { TasacionFormData } from '@/types/tasacion'

interface GeneratePDFOptions {
  data: TasacionFormData
  metadata?: {
    ip?: string
    geolocalizacion?: {
      latitude: number
      longitude: number
    }
    dispositivo?: {
      userAgent: string
      platform: string
      idioma: string
    }
    timestamp?: string
  }
  filename?: string
}

export async function generateAndDownloadPDF({ 
  data, 
  metadata, 
  filename = `tasacion_${data.matricula}_${Date.now()}.pdf` 
}: GeneratePDFOptions) {
  try {
    // Crear el documento PDF
    const blob = await pdf(
      TasacionPDF({ data, metadata })
    ).toBlob()

    // Crear un enlace de descarga
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    
    // Limpiar
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    return { success: true, message: 'PDF generado correctamente' }
  } catch (error) {
    console.error('Error generando PDF:', error)
    return { 
      success: false, 
      message: 'Error al generar el PDF',
      error 
    }
  }
}

export async function generatePDFBlob({ 
  data, 
  metadata 
}: GeneratePDFOptions): Promise<Blob> {
  const blob = await pdf(
    TasacionPDF({ data, metadata })
  ).toBlob()
  
  return blob
}

