import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { vehicles, replace = false } = body

    if (!vehicles || !Array.isArray(vehicles)) {
      return NextResponse.json(
        { error: 'Se requiere un array de vehículos' },
        { status: 400 }
      )
    }

    // Si replace=true, borrar todos los datos existentes
    if (replace) {
      const { error: deleteError } = await supabase
        .from('bps_scraper')
        .delete()
        .neq('id', 0) // Borrar todos

      if (deleteError) {
        console.error('Error borrando datos BPS:', deleteError)
        return NextResponse.json(
          { error: 'Error borrando datos existentes', details: deleteError },
          { status: 500 }
        )
      }
    }

    // Preparar datos para inserción
    const vehiclesToInsert = vehicles.map((v: any) => ({
      modelo: v.Modelo || '',
      url: v.URL || '',
      id_anuncio: v.ID_Anuncio || '',
      precio: v.Precio || '',
      km: v.KM || '',
      año: v.Año || '',
      concesionario: v.Concesionario || '',
      precio_nuevo: v.Precio_Nuevo || '',
      ahorro: v.Ahorro || ''
    }))

    // Insertar en lotes de 500 para evitar límites
    const batchSize = 500
    let insertedCount = 0
    let errorCount = 0

    for (let i = 0; i < vehiclesToInsert.length; i += batchSize) {
      const batch = vehiclesToInsert.slice(i, i + batchSize)
      
      const { data, error } = await supabase
        .from('bps_scraper')
        .upsert(batch, {
          onConflict: 'url',
          ignoreDuplicates: false
        })

      if (error) {
        console.error(`Error en lote ${i / batchSize + 1}:`, error)
        errorCount += batch.length
      } else {
        insertedCount += batch.length
      }
    }

    return NextResponse.json({
      success: true,
      message: `${insertedCount} vehículos procesados`,
      insertedCount,
      errorCount,
      totalReceived: vehicles.length
    })

  } catch (error: any) {
    console.error('Error en upload BPS:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}

