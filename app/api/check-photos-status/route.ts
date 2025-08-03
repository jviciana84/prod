import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente de Supabase con rol de servicio
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Verificando estado de fotos y ventas...')
    
    // Obtener estadísticas básicas
    const { data: soldVehicles, error: soldError } = await supabase
      .from('sales_vehicles')
      .select('license_plate')
    
    if (soldError) {
      console.error('❌ Error obteniendo ventas:', soldError)
      return NextResponse.json({
        success: false,
        error: soldError.message
      }, { status: 500 })
    }
    
    const { data: photosVehicles, error: photosError } = await supabase
      .from('fotos')
      .select('license_plate, photos_completed')
    
    if (photosError) {
      console.error('❌ Error obteniendo fotos:', photosError)
      return NextResponse.json({
        success: false,
        error: photosError.message
      }, { status: 500 })
    }
    
    // Encontrar vehículos vendidos que aún están en fotos
    const soldPlates = new Set(soldVehicles?.map(v => v.license_plate) || [])
    const photosPlates = new Set(photosVehicles?.map(p => p.license_plate) || [])
    
    const soldInPhotos = photosVehicles?.filter(p => soldPlates.has(p.license_plate)) || []
    
    const soldCount = soldVehicles?.length || 0
    const photosCount = photosVehicles?.length || 0
    const soldInPhotosCount = soldInPhotos.length
    
    console.log('✅ Estado verificado:', {
      sold_vehicles: soldCount,
      photos_vehicles: photosCount,
      sold_in_photos: soldInPhotosCount
    })
    
    return NextResponse.json({
      success: true,
      statistics: {
        sold_vehicles: soldCount,
        photos_vehicles: photosCount,
        sold_in_photos: soldInPhotosCount
      },
      sold_in_photos: soldInPhotos.map(p => p.license_plate)
    })
    
  } catch (error: any) {
    console.error('❌ Error inesperado:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor'
    }, { status: 500 })
  }
} 