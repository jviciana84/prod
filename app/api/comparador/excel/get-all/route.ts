import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Excel Get-All] Cargando vehículos...')
    
    // ✅ PATRÓN OFICIAL: createServerClient con cookies
    const supabase = await createServerClient(await cookies())
    
    // ✅ Verificar autenticación según guía
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('❌ [Excel Get-All] Usuario no autenticado')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    console.log('✅ [Excel Get-All] Usuario autenticado:', user.id)
    
    // Consulta de datos
    const { data: vehiculos, error } = await supabase
      .from('vehiculos_excel_comparador')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ [Excel Get-All] Error en consulta:', error)
      return NextResponse.json({ 
        error: 'Error cargando vehículos de Excel', 
        details: error.message 
      }, { status: 500 })
    }

    console.log(`✅ [Excel Get-All] ${vehiculos?.length || 0} vehículos cargados`)
    
    return NextResponse.json({ 
      success: true, 
      vehiculos: vehiculos || [],
      count: vehiculos?.length || 0
    })

  } catch (error: any) {
    console.error('❌ [Excel Get-All] Error inesperado:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    }, { status: 500 })
  }
}

