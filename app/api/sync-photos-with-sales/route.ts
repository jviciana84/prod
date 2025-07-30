import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente de Supabase con rol de servicio
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando sincronización de fotos con ventas...')
    
    // Ejecutar la función de sincronización
    const { data: syncResult, error: syncError } = await supabase
      .rpc('sync_photos_with_sales')
    
    if (syncError) {
      console.error('❌ Error en sincronización:', syncError)
      return NextResponse.json({
        success: false,
        error: syncError.message
      }, { status: 500 })
    }
    
    console.log('✅ Sincronización completada:', syncResult)
    
    return NextResponse.json({
      success: true,
      message: syncResult?.[0]?.message || 'Sincronización completada',
      processed_count: syncResult?.[0]?.processed_count || 0,
      removed_count: syncResult?.[0]?.removed_count || 0
    })
    
  } catch (error: any) {
    console.error('❌ Error inesperado:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Verificando inconsistencias entre fotos y ventas...')
    
    // Verificar inconsistencias
    const { data: inconsistencies, error: inconsistenciesError } = await supabase
      .rpc('check_photos_sales_inconsistencies')
    
    if (inconsistenciesError) {
      console.error('❌ Error verificando inconsistencias:', inconsistenciesError)
      return NextResponse.json({
        success: false,
        error: inconsistenciesError.message
      }, { status: 500 })
    }
    
    // Obtener estadísticas
    const { data: soldVehicles } = await supabase
      .from('sales_vehicles')
      .select('license_plate')
    
    const { data: photosVehicles } = await supabase
      .from('fotos')
      .select('license_plate, photos_completed')
    
    const soldCount = soldVehicles?.length || 0
    const photosCount = photosVehicles?.length || 0
    const inconsistenciesCount = inconsistencies?.length || 0
    
    return NextResponse.json({
      success: true,
      statistics: {
        sold_vehicles: soldCount,
        photos_vehicles: photosCount,
        inconsistencies: inconsistenciesCount
      },
      inconsistencies: inconsistencies || []
    })
    
  } catch (error: any) {
    console.error('❌ Error inesperado:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 