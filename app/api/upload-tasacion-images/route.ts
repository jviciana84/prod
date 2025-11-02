import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

interface ImageToUpload {
  key: string
  data: string
  category: string
}

export async function POST(request: NextRequest) {
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

    const supabase = await createClient()
    const uploadedUrls: Record<string, string> = {}
    const errors: Array<{ key: string, error: string }> = []

    // Subir cada imagen a Supabase Storage
    for (const image of images) {
      try {
        // Convertir base64 a blob
        const base64Data = image.data.replace(/^data:image\/\w+;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')
        
        // Determinar extensión
        const extension = image.data.match(/^data:image\/(\w+);base64,/)?.[1] || 'jpg'
        const fileName = `${image.key}.${extension}`
        const filePath = `${tasacionId}/${image.category}/${fileName}`

        // Subir a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('tasacion-fotos')
          .upload(filePath, buffer, {
            contentType: `image/${extension}`,
            upsert: true
          })

        if (uploadError) {
          throw uploadError
        }

        // Obtener URL pública
        const { data: publicUrlData } = supabase.storage
          .from('tasacion-fotos')
          .getPublicUrl(filePath)

        uploadedUrls[image.key] = publicUrlData.publicUrl

        console.log(`✅ Subida exitosa: ${image.key}`)
      } catch (error) {
        console.error(`❌ Error al subir ${image.key}:`, error)
        errors.push({
          key: image.key,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }

    return NextResponse.json({
      success: true,
      uploadedUrls,
      totalUploaded: Object.keys(uploadedUrls).length,
      totalErrors: errors.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Error general al subir imágenes:', error)

    return NextResponse.json(
      { 
        error: 'Error al subir imágenes',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

