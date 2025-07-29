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

    // Combinar todos los coches de la BD
    const allVehicles = [
      ...(stockData || []).map(vehicle => ({
        ...vehicle,
        source: 'stock',
        table_id: vehicle.id
      })),
      ...(nuevasEntradasData || []).map(vehicle => ({
        ...vehicle,
        source: 'nuevas_entradas',
        table_id: vehicle.id
      }))
    ]

    // Obtener los datos del último CSV procesado desde duc_scraper
    const { data: csvData, error: csvError } = await supabase
      .from('duc_scraper')
      .select('"ID Anuncio", "Matrícula", "Modelo", "Marca", "Chasis", last_seen_date')
      .not('"Matrícula"', 'is', null)
      .not('"Matrícula"', 'eq', '')

    if (csvError) {
      console.error('Error obteniendo datos del CSV:', csvError)
      return NextResponse.json({ error: 'Error obteniendo datos del CSV' }, { status: 500 })
    }

    // Crear un set de matrículas del CSV actual
    const csvMatriculas = new Set(
      (csvData || [])
        .filter(item => item['Matrícula'] && item['Matrícula'].trim() !== '')
        .map(item => item['Matrícula'].toUpperCase().trim())
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
      message: 'Comparación completada'
    })

  } catch (error) {
    console.error('Error en comparación CSV vs BD:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 