import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * API de Analytics del Comparador
 * 
 * Endpoints:
 * GET /api/comparador/analytics?type=modelos
 * GET /api/comparador/analytics?type=concesionarios
 * GET /api/comparador/analytics?type=frecuencia_cambios
 * GET /api/comparador/analytics?type=mas_competitivos
 * GET /api/comparador/analytics?type=stock_estancado
 * GET /api/comparador/analytics?type=velocidad_venta
 * GET /api/comparador/analytics?type=estrategias
 * GET /api/comparador/analytics?type=reporte_concesionario&concesionario=XXX&source=BPS
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const type = searchParams.get('type')
    const source = searchParams.get('source') // BPS o MN
    const concesionario = searchParams.get('concesionario')
    
    if (!type) {
      return NextResponse.json(
        { error: 'Se requiere parámetro "type"' },
        { status: 400 }
      )
    }
    
    let query: any
    let data: any
    let error: any
    
    switch (type) {
      case 'modelos':
        // Estadísticas por modelo
        query = supabase
          .from('comparador_stats_por_modelo')
          .select('*')
          .order('total_anuncios', { ascending: false })
        
        if (source) {
          query = query.eq('source', source)
        }
        
        const modelos = await query
        data = modelos.data
        error = modelos.error
        break
      
      case 'concesionarios':
        // Estadísticas por concesionario
        query = supabase
          .from('comparador_stats_por_concesionario')
          .select('*')
          .order('total_anuncios', { ascending: false })
        
        if (source) {
          query = query.eq('source', source)
        }
        
        const concesionarios = await query
        data = concesionarios.data
        error = concesionarios.error
        break
      
      case 'frecuencia_cambios':
        // Frecuencia de reposicionamiento de precios
        query = supabase
          .from('comparador_frecuencia_cambios')
          .select('*')
          .order('anuncios_totales', { ascending: false })
        
        if (source) {
          query = query.eq('source', source)
        }
        
        const frecuencia = await query
        data = frecuencia.data
        error = frecuencia.error
        break
      
      case 'mas_competitivos':
        // Modelos más competitivos (mayor descuento)
        query = supabase
          .from('comparador_modelos_mas_competitivos')
          .select('*')
          .limit(50)
        
        if (source) {
          query = query.eq('source', source)
        }
        
        const competitivos = await query
        data = competitivos.data
        error = competitivos.error
        break
      
      case 'stock_estancado':
        // Stock estancado (mucho tiempo publicado)
        query = supabase
          .from('comparador_stock_estancado')
          .select('*')
          .limit(100)
        
        if (source) {
          query = query.eq('source', source)
        }
        
        if (concesionario) {
          query = query.eq('concesionario', concesionario)
        }
        
        const estancado = await query
        data = estancado.data
        error = estancado.error
        break
      
      case 'velocidad_venta':
        // Velocidad de venta por modelo
        query = supabase
          .from('comparador_velocidad_venta')
          .select('*')
          .order('dias_promedio_hasta_venta', { ascending: true })
        
        if (source) {
          query = query.eq('source', source)
        }
        
        const velocidad = await query
        data = velocidad.data
        error = velocidad.error
        break
      
      case 'estrategias':
        // Estrategias de concesionarios
        query = supabase
          .from('comparador_estrategias_concesionarios')
          .select('*')
          .order('anuncios_activos', { ascending: false })
        
        if (source) {
          query = query.eq('source', source)
        }
        
        const estrategias = await query
        data = estrategias.data
        error = estrategias.error
        break
      
      case 'reporte_concesionario':
        // Reporte completo de un concesionario
        if (!concesionario) {
          return NextResponse.json(
            { error: 'Se requiere parámetro "concesionario"' },
            { status: 400 }
          )
        }
        
        const { data: reporteData, error: reporteError } = await supabase
          .rpc('obtener_reporte_concesionario', {
            p_concesionario: concesionario,
            p_source: source
          })
        
        data = reporteData
        error = reporteError
        break
      
      case 'historial_precio':
        // Historial de precios de un anuncio específico
        const idAnuncio = searchParams.get('id_anuncio')
        
        if (!idAnuncio) {
          return NextResponse.json(
            { error: 'Se requiere parámetro "id_anuncio"' },
            { status: 400 }
          )
        }
        
        query = supabase
          .from('comparador_historial_precios')
          .select('*')
          .eq('id_anuncio', idAnuncio)
          .order('fecha_cambio', { ascending: false })
        
        if (source) {
          query = query.eq('source', source)
        }
        
        const historial = await query
        data = historial.data
        error = historial.error
        break
      
      case 'resumen_general':
        // Resumen general de todo el sistema
        const [
          totalAnuncios,
          totalActivos,
          totalCambios,
          promedioDescuento
        ] = await Promise.all([
          supabase
            .from('comparador_scraper')
            .select('*', { count: 'exact', head: true })
            .then(r => r.count || 0),
          
          supabase
            .from('comparador_scraper')
            .select('*', { count: 'exact', head: true })
            .eq('estado_anuncio', 'activo')
            .then(r => r.count || 0),
          
          supabase
            .from('comparador_historial_precios')
            .select('*', { count: 'exact', head: true })
            .then(r => r.count || 0),
          
          supabase
            .from('comparador_scraper')
            .select('porcentaje_descuento')
            .eq('estado_anuncio', 'activo')
            .not('porcentaje_descuento', 'is', null)
            .then(r => {
              if (!r.data || r.data.length === 0) return 0
              const sum = r.data.reduce((acc, item) => acc + (item.porcentaje_descuento || 0), 0)
              return Math.round((sum / r.data.length) * 100) / 100
            })
        ])
        
        data = {
          total_anuncios: totalAnuncios,
          anuncios_activos: totalActivos,
          total_cambios_precio: totalCambios,
          descuento_promedio: promedioDescuento
        }
        error = null
        break
      
      default:
        return NextResponse.json(
          { error: `Tipo de análisis "${type}" no válido` },
          { status: 400 }
        )
    }
    
    if (error) {
      console.error(`Error en analytics tipo ${type}:`, error)
      return NextResponse.json(
        { error: 'Error consultando analytics', details: error },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      type,
      data: data || [],
      count: Array.isArray(data) ? data.length : 1
    })
    
  } catch (error: any) {
    console.error('Error en analytics:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST - Crear snapshot diario manual
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.rpc('crear_snapshot_diario')
    
    if (error) {
      console.error('Error creando snapshot:', error)
      return NextResponse.json(
        { error: 'Error creando snapshot', details: error },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Snapshot creado correctamente',
      registros_insertados: data
    })
    
  } catch (error: any) {
    console.error('Error en POST analytics:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}

