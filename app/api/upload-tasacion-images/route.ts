import { NextRequest, NextResponse } from 'next/server'
import Client from 'ssh2-sftp-client'

const SFTP_CONFIG = {
  host: 'ftp.cluster100.hosting.ovh.net',
  port: 22,
  username: 'controt',
  password: process.env.SFTP_PASSWORD || 'eVCNt5hMjc3.9M$',
}

interface ImageToUpload {
  key: string
  data: string
  category: string
}

export async function POST(request: NextRequest) {
  const sftp = new Client()
  
  try {
    const body = await request.json()
    const { images, tasacionId } = body as { images: ImageToUpload[], tasacionId: string }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'No hay imágenes para subir' },
        { status: 400 }
      )
    }

    if (!tasacionId) {
      return NextResponse.json(
        { error: 'Falta ID de tasación' },
        { status: 400 }
      )
    }

    // Conectar via SFTP
    await sftp.connect(SFTP_CONFIG)

    // Crear directorio base si no existe
    const remoteBaseDir = `/home/controt/tasaciones/${tasacionId}`
    try {
      await sftp.mkdir(remoteBaseDir, true)
    } catch (err) {
      // Directorio ya existe, continuar
    }

    const uploadedUrls: Record<string, string> = {}
    const errors: Array<{ key: string, error: string }> = []

    // Subir cada imagen
    for (const image of images) {
      try {
        // Convertir base64 a buffer
        const base64Data = image.data.replace(/^data:image\/\w+;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')

        // Crear subcarpeta por categoría
        const categoryDir = `${remoteBaseDir}/${image.category}`
        try {
          await sftp.mkdir(categoryDir, true)
        } catch (err) {
          // Directorio ya existe
        }

        // Determinar extensión
        const extension = image.data.match(/^data:image\/(\w+);base64,/)?.[1] || 'jpg'
        const fileName = `${image.key}.${extension}`
        const remotePath = `${categoryDir}/${fileName}`

        // Subir archivo
        await sftp.put(buffer, remotePath)

        // URL pública (ajusta según tu dominio)
        const publicUrl = `https://tudominio.com/tasaciones/${tasacionId}/${image.category}/${fileName}`
        uploadedUrls[image.key] = publicUrl

        console.log(`✅ Subida exitosa: ${image.key}`)
      } catch (error) {
        console.error(`❌ Error al subir ${image.key}:`, error)
        errors.push({
          key: image.key,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }

    // Cerrar conexión
    await sftp.end()

    return NextResponse.json({
      success: true,
      uploadedUrls,
      totalUploaded: Object.keys(uploadedUrls).length,
      totalErrors: errors.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Error general al subir imágenes:', error)
    
    // Asegurar que cerramos la conexión
    try {
      await sftp.end()
    } catch (endError) {
      // Ignorar error al cerrar
    }

    return NextResponse.json(
      { 
        error: 'Error al subir imágenes',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

