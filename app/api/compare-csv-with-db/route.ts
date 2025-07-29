import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Obtener todos los coches de stock + nuevas_entradas
    const { data: stockData, error: stockError } = await supabase
      .from('stock')
      .select('id, license_plate, model, vehicle_type, reception_date, created_at')

    if (stockError) {
      console.error('Error obteniendo datos de stock:', stockError)
      return NextResponse.json({ error: 'Error obteniendo datos de stock' }, { status: 500 })
    }

    const { data: nuevasEntradasData, error: nuevasEntradasError } = await supabase
      .from('nuevas_entradas')
      .select('id, license_plate, model, vehicle_type, reception_date, created_at')

    if (nuevasEntradasError) {
      console.error('Error obteniendo datos de nuevas entradas:', nuevasEntradasError)
      return NextResponse.json({ error: 'Error obteniendo datos de nuevas entradas' }, { status: 500 })
    }

    // Obtener vehículos ya clasificados para excluirlos
    const { data: classifiedVehicles, error: classifiedError } = await supabase
      .from('vehicle_sale_status')
      .select('vehicle_id, source_table')

    if (classifiedError) {
      console.error('Error obteniendo vehículos clasificados:', classifiedError)
      return NextResponse.json({ error: 'Error obteniendo vehículos clasificados' }, { status: 500 })
    }

    // Crear set de vehículos ya clasificados
    const classifiedSet = new Set(
      (classifiedVehicles || []).map(v => `${v.source_table}_${v.vehicle_id}`)
    )

    // Combinar todos los coches de la BD (excluyendo los ya clasificados)
    const allVehicles = [
      ...(stockData || [])
        .filter(vehicle => !classifiedSet.has(`stock_${vehicle.id}`))
        .map(vehicle => ({
          ...vehicle,
          source: 'stock',
          table_id: vehicle.id
        })),
      ...(nuevasEntradasData || [])
        .filter(vehicle => !classifiedSet.has(`nuevas_entradas_${vehicle.id}`))
        .map(vehicle => ({
          ...vehicle,
          source: 'nuevas_entradas',
          table_id: vehicle.id
        }))
    ]

    // Obtener las matrículas del último CSV procesado (agrupando por matrícula y tomando el más reciente)
    const { data: csvData, error: csvError } = await supabase
      .from('duc_scraper')
      .select('"Matrícula", last_seen_date')
      .not('"Matrícula"', 'is', null)
      .not('"Matrícula"', 'eq', '')

    if (csvError) {
      console.error('Error obteniendo datos del CSV:', csvError)
      return NextResponse.json({ error: 'Error obteniendo datos del CSV' }, { status: 500 })
    }

    // Agrupar por matrícula y tomar el last_seen_date más reciente
    const matriculaMap = new Map()
    
    ;(csvData || []).forEach(item => {
      const matricula = item['Matrícula']?.toUpperCase().trim()
      const lastSeen = new Date(item.last_seen_date)
      
      if (matricula) {
        const existing = matriculaMap.get(matricula)
        if (!existing || lastSeen > existing.lastSeen) {
          matriculaMap.set(matricula, {
            matricula,
            lastSeen
          })
        }
      }
    })

    // Crear un set de matrículas del último CSV (solo las más recientes)
    const csvMatriculas = new Set(
      Array.from(matriculaMap.values()).map(item => item.matricula)
    )

    // Encontrar vehículos que están en la BD pero no en el CSV
    const removedVehicles = allVehicles.filter(vehicle => {
      const matricula = vehicle.license_plate?.toUpperCase().trim()
      return matricula && !csvMatriculas.has(matricula)
    })

    return NextResponse.json({
      success: true,
      totalVehicles: allVehicles.length,
      removedVehicles: removedVehicles,
      message: 'Comparación completada',
      csvMatriculasCount: csvMatriculas.size,
      bdMatriculasCount: allVehicles.length,
      classifiedVehiclesCount: classifiedVehicles?.length || 0
    })

  } catch (error) {
    console.error('Error en comparación CSV vs BD:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 