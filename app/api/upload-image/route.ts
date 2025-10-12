import { NextRequest, NextResponse } from 'next/server'
import Client from 'ssh2-sftp-client'

const sftp = new Client()

const SFTP_CONFIG = {
  host: 'ftp.cluster100.hosting.ovh.net',
  port: 22,
  username: 'controt',
  password: process.env.SFTP_PASSWORD || 'eVCNt5hMjc3.9M$',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image, fileName, tasacionId } = body

    if (!image || !fileName || !tasacionId) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      )
    }

    // Convertir base64 a buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Conectar via SFTP
    await sftp.connect(SFTP_CONFIG)

    // Crear directorio si no existe
    const remoteDir = `/home/controt/tasaciones/${tasacionId}`
    try {
      await sftp.mkdir(remoteDir, true)
    } catch (err) {
      // Directorio ya existe, continuar
    }

    // Subir archivo
    const remotePath = `${remoteDir}/${fileName}`
    await sftp.put(buffer, remotePath)

    // Cerrar conexión
    await sftp.end()

    // Construir URL pública (ajusta según tu dominio)
    const publicUrl = `https://tudominio.com/tasaciones/${tasacionId}/${fileName}`

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      path: remotePath
    })
  } catch (error) {
    console.error('Error al subir imagen:', error)
    
    // Asegurar que cerramos la conexión
    try {
      await sftp.end()
    } catch (endError) {
      // Ignorar error al cerrar
    }

    return NextResponse.json(
      { 
        error: 'Error al subir imagen',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

