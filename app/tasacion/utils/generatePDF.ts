'use client'

import { pdf } from '@react-pdf/renderer'
import TasacionPDF from '../components/pdf/TasacionPDF'
import type { TasacionFormData } from '@/types/tasacion'
import React from 'react'

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
  tasacionId?: string
  filename?: string
}

export async function generateAndDownloadPDF({ 
  data, 
  metadata,
  tasacionId,
  filename = `tasacion_${data.matricula}_${Date.now()}.pdf` 
}: GeneratePDFOptions) {
  try {
    console.log('Generando PDF con datos:', data)
    console.log('Generando PDF con metadata:', metadata)
    console.log('ID de tasación:', tasacionId)
    console.log('Nombre del archivo:', filename)
    
    // Crear el documento PDF
    console.log('Creando documento PDF...')
    const doc = TasacionPDF({ data, metadata, tasacionId })
    console.log('Documento creado, generando blob...')
    
    const blob = await pdf(doc).toBlob()
    console.log('Blob generado:', blob)

    // Crear un enlace de descarga
    console.log('Creando enlace de descarga...')
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    console.log('Haciendo click en el enlace...')
    link.click()
    
    // Limpiar
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    console.log('PDF descargado exitosamente')
    return { success: true, message: 'PDF generado correctamente' }
  } catch (error) {
    console.error('Error generando PDF:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack available')
    return { 
      success: false, 
      message: 'Error al generar el PDF',
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

export async function generatePDFBlob({ 
  data, 
  metadata,
  tasacionId
}: GeneratePDFOptions): Promise<Blob> {
  const blob = await pdf(
    TasacionPDF({ data, metadata, tasacionId })
  ).toBlob()
  
  return blob
}

