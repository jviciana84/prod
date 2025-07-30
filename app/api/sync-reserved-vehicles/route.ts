import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente de Supabase con rol de servicio
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando sincronización de vehículos reservados...')
    
    // Ejecutar la función de sincronización
    const { data: syncResult, error: syncError } = await supabase
      .rpc('manual_sync_reserved_vehicles')
    
    if (syncError) {
      console.error('❌ Error en sincronización:', syncError)
      return NextResponse.json({
        success: false,
        error: syncError.message
      }, { status: 500 })
    }
    
    console.log('✅ Sincronización completada:', syncResult)
    
    // Obtener estadísticas actualizadas
    const { data: reservedVehicles } = await supabase
      .from('duc_scraper')
      .select('"Matrícula", "Modelo", "Marca", "Precio", "Concesionario", "Disponibilidad", last_seen_date')
      .ilike('"Disponibilidad"', '%reservado%')
      .not('"Matrícula"', 'is', null)
      .order('last_seen_date', { ascending: false })
    
    const { data: soldVehicles } = await supabase
      .from('sales_vehicles')
      .select('license_plate, model, sale_date, advisor_name')
      .order('sale_date', { ascending: false })
    
    return NextResponse.json({
      success: true,
      message: syncResult?.[0]?.message || 'Sincronización completada',
      processed_count: syncResult?.[0]?.processed_count || 0,
      statistics: {
        reserved_in_csv: reservedVehicles?.length || 0,
        sold_vehicles: soldVehicles?.length || 0,
        reserved_vehicles: reservedVehicles || []
      }
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
    console.log('📊 Obteniendo estadísticas de vehículos reservados...')
    
    // Obtener vehículos reservados en CSV
    const { data: reservedVehicles, error: reservedError } = await supabase
      .from('duc_scraper')
      .select('"Matrícula", "Modelo", "Marca", "Precio", "Concesionario", "Disponibilidad", last_seen_date')
      .ilike('"Disponibilidad"', '%reservado%')
      .not('"Matrícula"', 'is', null)
      .order('last_seen_date', { ascending: false })
    
    if (reservedError) {
      console.error('❌ Error obteniendo vehículos reservados:', reservedError)
      return NextResponse.json({
        success: false,
        error: reservedError.message
      }, { status: 500 })
    }
    
    // Obtener vehículos vendidos
    const { data: soldVehicles, error: soldError } = await supabase
      .from('sales_vehicles')
      .select('license_plate, model, sale_date, advisor_name')
      .order('sale_date', { ascending: false })
    
    if (soldError) {
      console.error('❌ Error obteniendo vehículos vendidos:', soldError)
      return NextResponse.json({
        success: false,
        error: soldError.message
      }, { status: 500 })
    }
    
    // Identificar vehículos reservados que no están sincronizados
    const reservedMatriculas = new Set(reservedVehicles?.map(v => v['Matrícula']) || [])
    const soldMatriculas = new Set(soldVehicles?.map(v => v.license_plate) || [])
    
    const pendingSync = reservedVehicles?.filter(v => 
      !soldMatriculas.has(v['Matrícula'])
    ) || []
    
    return NextResponse.json({
      success: true,
      statistics: {
        reserved_in_csv: reservedVehicles?.length || 0,
        sold_vehicles: soldVehicles?.length || 0,
        pending_sync: pendingSync.length,
        sync_percentage: reservedVehicles?.length ? 
          Math.round(((reservedVehicles.length - pendingSync.length) / reservedVehicles.length) * 100) : 0
      },
      reserved_vehicles: reservedVehicles || [],
      pending_sync: pendingSync
    })
    
  } catch (error: any) {
    console.error('❌ Error inesperado:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 