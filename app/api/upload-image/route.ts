import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

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

    const supabase = createClient()

    // Convertir base64 a buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Determinar extensión
    const extension = image.match(/^data:image\/(\w+);base64,/)?.[1] || 'jpg'
    const filePath = `${tasacionId}/${fileName}.${extension}`

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from('tasacion-fotos')
      .upload(filePath, buffer, {
        contentType: `image/${extension}`,
        upsert: true
      })

    if (error) {
      throw error
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from('tasacion-fotos')
      .getPublicUrl(filePath)

    return NextResponse.json({ 
      success: true, 
      url: publicUrlData.publicUrl,
      path: filePath
    })
  } catch (error) {
    console.error('Error al subir imagen:', error)

    return NextResponse.json(
      { 
        error: 'Error al subir imagen',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

