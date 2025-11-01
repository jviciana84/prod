'use client'

import { pdf } from '@react-pdf/renderer'
import TasacionPDF from '../components/pdf/TasacionPDF'
import type { TasacionFormData } from '@/types/tasacion'
import React from 'react'
import { generateAllDamageSVGs } from './generateDamageSVG'

// Función helper para convertir imagen a base64
async function imageToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        resolve(base64String)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error convirtiendo imagen a base64:', error)
    throw error
  }
}

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
    
    // Convertir logo a base64
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://controlvo.ovh'
    const logoUrl = `${baseUrl}/svg/logo_tasaciones.png`
    
    console.log('Convirtiendo logo a base64...')
    const logoBase64 = await imageToBase64(logoUrl).catch((err) => {
      console.error('Error cargando logo:', err)
      return undefined
    })
    
    // Generar imágenes SVG de daños
    console.log('Generando imágenes SVG de daños...')
    const allDamages = [
      ...(data.danosExteriores || []),
      ...(data.danosInteriores || [])
    ]
    const damageSVGs = await generateAllDamageSVGs(allDamages)
    console.log('SVGs de daños generados:', Object.keys(damageSVGs))
    
    console.log('Imágenes convertidas, creando documento PDF...')
    const doc = TasacionPDF({ 
      data, 
      metadata, 
      tasacionId,
      logoBase64,
      watermarkBase64: undefined,
      damageSVGs
    })
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
  // Convertir logo a base64
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://controlvo.ovh'
  const logoUrl = `${baseUrl}/svg/logo_tasaciones.png`
  
  const logoBase64 = await imageToBase64(logoUrl).catch(() => undefined)
  
  // Generar imágenes SVG de daños
  const allDamages = [
    ...(data.danosExteriores || []),
    ...(data.danosInteriores || [])
  ]
  const damageSVGs = await generateAllDamageSVGs(allDamages)
  
  const blob = await pdf(
    TasacionPDF({ 
      data, 
      metadata, 
      tasacionId,
      logoBase64,
      watermarkBase64: undefined,
      damageSVGs
    })
  ).toBlob()
  
  return blob
}

