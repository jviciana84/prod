import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente de Supabase con rol de servicio
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Verificando funciones de sincronización...')
    
    // Verificar funciones existentes
    const { data: functions, error: functionsError } = await supabase
      .from('pg_proc')
      .select('proname')
      .in('proname', ['sync_photos_with_sales', 'check_photos_sales_inconsistencies', 'handle_vehicle_sold_remove_from_photos'])
    
    if (functionsError) {
      console.error('❌ Error verificando funciones:', functionsError)
      return NextResponse.json({
        success: false,
        error: functionsError.message
      }, { status: 500 })
    }
    
    // Verificar triggers existentes
    const { data: triggers, error: triggersError } = await supabase
      .from('pg_trigger')
      .select('tgname')
      .eq('tgname', 'trigger_remove_from_photos_on_sale')
    
    if (triggersError) {
      console.error('❌ Error verificando triggers:', triggersError)
      return NextResponse.json({
        success: false,
        error: triggersError.message
      }, { status: 500 })
    }
    
    const existingFunctions = functions?.map(f => f.proname) || []
    const existingTriggers = triggers?.map(t => t.tgname) || []
    
    const status = {
      functions: {
        sync_photos_with_sales: existingFunctions.includes('sync_photos_with_sales'),
        check_photos_sales_inconsistencies: existingFunctions.includes('check_photos_sales_inconsistencies'),
        handle_vehicle_sold_remove_from_photos: existingFunctions.includes('handle_vehicle_sold_remove_from_photos')
      },
      triggers: {
        trigger_remove_from_photos_on_sale: existingTriggers.includes('trigger_remove_from_photos_on_sale')
      }
    }
    
    console.log('✅ Verificación completada:', status)
    
    return NextResponse.json({
      success: true,
      message: 'Funciones verificadas correctamente',
      status
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
    console.log('📊 Obteniendo estado de las funciones...')
    
    // Verificar funciones existentes usando consultas directas
    const { data: functions, error: functionsError } = await supabase
      .from('pg_proc')
      .select('proname')
      .in('proname', ['sync_photos_with_sales', 'check_photos_sales_inconsistencies', 'handle_vehicle_sold_remove_from_photos'])
    
    if (functionsError) {
      console.error('❌ Error verificando funciones:', functionsError)
      return NextResponse.json({
        success: false,
        error: functionsError.message
      }, { status: 500 })
    }
    
    // Verificar triggers existentes
    const { data: triggers, error: triggersError } = await supabase
      .from('pg_trigger')
      .select('tgname')
      .eq('tgname', 'trigger_remove_from_photos_on_sale')
    
    if (triggersError) {
      console.error('❌ Error verificando triggers:', triggersError)
      return NextResponse.json({
        success: false,
        error: triggersError.message
      }, { status: 500 })
    }
    
    const existingFunctions = functions?.map(f => f.proname) || []
    const existingTriggers = triggers?.map(t => t.tgname) || []
    
    const status = {
      functions: {
        sync_photos_with_sales: existingFunctions.includes('sync_photos_with_sales'),
        check_photos_sales_inconsistencies: existingFunctions.includes('check_photos_sales_inconsistencies'),
        handle_vehicle_sold_remove_from_photos: existingFunctions.includes('handle_vehicle_sold_remove_from_photos')
      },
      triggers: {
        trigger_remove_from_photos_on_sale: existingTriggers.includes('trigger_remove_from_photos_on_sale')
      }
    }
    
    return NextResponse.json({
      success: true,
      status
    })
    
  } catch (error: any) {
    console.error('❌ Error inesperado:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 