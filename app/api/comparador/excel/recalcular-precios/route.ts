import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [Recalcular Precios] Iniciando recálculo...')
    
    const supabase = await createServerClient(await cookies())
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('❌ [Recalcular] Usuario no autenticado')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    console.log('✅ [Recalcular] Usuario autenticado:', user.id)
    
    // Obtener todos los vehículos del Excel
    const { data: vehiculos, error: vehiculosError } = await supabase
      .from('vehiculos_excel_comparador')
      .select('id, modelo, serie, marca, fecha_matriculacion, km')
    
    if (vehiculosError) {
      return NextResponse.json({ error: 'Error cargando vehículos', details: vehiculosError.message }, { status: 500 })
    }
    
    if (!vehiculos || vehiculos.length === 0) {
      return NextResponse.json({ error: 'No hay vehículos para procesar' }, { status: 400 })
    }
    
    console.log(`📊 [Recalcular] Procesando ${vehiculos.length} vehículos...`)
    
    let actualizados = 0
    let sinDatos = 0
    const stats = { exactas: 0, parciales: 0, fuzzy: 0, noEncontrados: 0 }
    
    for (const vehiculo of vehiculos) {
      try {
        let competidores: any[] = []
        let tipoCoincidencia = 'exacta'
        
        // ESTRATEGIA 1: Búsqueda por modelo completo
        if (vehiculo.modelo) {
          let query = supabase
            .from('comparador_scraper')
            .select('precio, km, año, modelo')
            .in('estado_anuncio', ['activo', 'nuevo', 'precio_bajado'])
            .ilike('modelo', `%${vehiculo.modelo}%`)
          
          // Filtro de año ±1
          if (vehiculo.fecha_matriculacion) {
            const añoVehiculo = new Date(vehiculo.fecha_matriculacion).getFullYear()
            query = query.gte('año', (añoVehiculo - 1).toString())
            query = query.lte('año', (añoVehiculo + 1).toString())
          }
          
          // Filtro de KM ±30.000 km
          if (vehiculo.km) {
            const kmMin = Math.max(0, vehiculo.km - 30000)
            const kmMax = vehiculo.km + 30000
            query = query.gte('km', kmMin.toString())
            query = query.lte('km', kmMax.toString())
          }
          
          const { data } = await query
          
          if (data && data.length >= 3) {
            competidores = data
            stats.exactas++
          }
        }
        
        // ESTRATEGIA 2: Búsqueda por versión específica (con letra: d, i, xd, etc.)
        if (competidores.length < 3 && vehiculo.modelo) {
          // Capturar versión específica: "118d", "320i", "M135i", "40i", etc.
          // Incluye modelos M (M135i, M240i, etc.)
          const partesModelo = vehiculo.modelo.match(/\b[M]?\d{2,3}[a-z]+\b/gi)
          
          if (partesModelo && partesModelo.length > 0) {
            const versionEspecifica = partesModelo[0] // "M135i" o "118d" completo
            
            let query = supabase
              .from('comparador_scraper')
              .select('precio, km, año, modelo')
              .in('estado_anuncio', ['activo', 'nuevo', 'precio_bajado'])
              .ilike('modelo', `%${versionEspecifica}%`) // Busca "118d" completo
            
            // Añadir serie para mayor precisión
            if (vehiculo.serie) {
              const serieLimpia = vehiculo.serie.replace(/serie/i, '').trim()
              query = query.ilike('modelo', `%${serieLimpia}%`)
            }
            
            // Filtro de año ±1
            if (vehiculo.fecha_matriculacion) {
              const añoVehiculo = new Date(vehiculo.fecha_matriculacion).getFullYear()
              query = query.gte('año', (añoVehiculo - 1).toString())
              query = query.lte('año', (añoVehiculo + 1).toString())
            }
            
            // Filtro de KM ±30.000 km
            if (vehiculo.km) {
              const kmMin = Math.max(0, vehiculo.km - 30000)
              const kmMax = vehiculo.km + 30000
              query = query.gte('km', kmMin.toString())
              query = query.lte('km', kmMax.toString())
            }
            
            const { data } = await query
            
            if (data && data.length > 0) {
              competidores = data
              tipoCoincidencia = 'parcial'
              stats.parciales++
            }
          }
        }
        
        // ESTRATEGIA 3: DESACTIVADA (demasiado amplia, mezclaba versiones diferentes)
        
        // Procesar precios
        if (competidores.length > 0) {
          const precios = competidores
            .map(c => {
              if (typeof c.precio === 'string') {
                return parseFloat(c.precio.replace(/[€.\s]/g, '').replace(',', '.'))
              }
              return c.precio
            })
            .filter(p => !isNaN(p) && p > 0)
          
          if (precios.length > 0) {
            const precioMedio = precios.reduce((sum, p) => sum + p, 0) / precios.length
            const precioCompetitivo = precioMedio * 0.98
            
            await supabase
              .from('vehiculos_excel_comparador')
              .update({
                precio_medio_red: Math.round(precioMedio),
                precio_competitivo: Math.round(precioCompetitivo),
                num_competidores: precios.length,
                ultima_busqueda_red: new Date().toISOString()
              })
              .eq('id', vehiculo.id)
            
            actualizados++
            console.log(`✅ [${vehiculo.modelo}] ${precios.length} comp. (${tipoCoincidencia})`)
          } else {
            sinDatos++
            stats.noEncontrados++
          }
        } else {
          sinDatos++
          stats.noEncontrados++
          console.log(`⚠️ [${vehiculo.modelo}] Sin competidores (serie: ${vehiculo.serie})`)
        }
      } catch (error: any) {
        console.error(`Error procesando ${vehiculo.id}:`, error)
      }
    }
    
    console.log(`✅ [Recalcular] Completado: ${actualizados} actualizados, ${sinDatos} sin datos`)
    console.log(`🎯 [Recalcular] Exactas=${stats.exactas} | Parciales=${stats.parciales} | Fuzzy=${stats.fuzzy} | No encontrados=${stats.noEncontrados}`)
    
    return NextResponse.json({
      success: true,
      actualizados,
      sinDatos,
      stats
    })
    
  } catch (error: any) {
    console.error('❌ [Recalcular] Error:', error)
    return NextResponse.json({ error: 'Error recalculando precios', details: error.message }, { status: 500 })
  }
}

