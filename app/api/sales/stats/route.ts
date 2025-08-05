import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    console.log('🚀🚀🚀 API /api/sales/stats EJECUTÁNDOSE 🚀🚀🚀')
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Obtener la fecha actual y calcular rangos
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 7)

    console.log('=== DEBUG: Obteniendo estadísticas reales de sales_vehicles ===')

    // Total de ventas
    const { count: totalVentas, error: totalError } = await supabase
      .from('sales_vehicles')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      console.error('Error obteniendo total de ventas:', totalError)
      return NextResponse.json({ error: 'Error obteniendo estadísticas' }, { status: 500 })
    }

    // Ventas de este mes
    const { count: esteMes, error: mesError } = await supabase
      .from('sales_vehicles')
      .select('*', { count: 'exact', head: true })
      .gte('sale_date', startOfMonth.toISOString())

    if (mesError) {
      console.error('Error obteniendo ventas del mes:', mesError)
      return NextResponse.json({ error: 'Error obteniendo estadísticas' }, { status: 500 })
    }

    // Ventas de la última semana
    const { count: ultimaSemana, error: semanaError } = await supabase
      .from('sales_vehicles')
      .select('*', { count: 'exact', head: true })
      .gte('sale_date', startOfWeek.toISOString())

    if (semanaError) {
      console.error('Error obteniendo ventas de la semana:', semanaError)
      return NextResponse.json({ error: 'Error obteniendo estadísticas' }, { status: 500 })
    }

    // Promedio de precios
    const { data: precios, error: preciosError } = await supabase
      .from('sales_vehicles')
      .select('price')
      .not('price', 'is', null)

    if (preciosError) {
      console.error('Error obteniendo precios:', preciosError)
      return NextResponse.json({ error: 'Error obteniendo estadísticas' }, { status: 500 })
    }

    const promedioPrecio = precios && precios.length > 0 
      ? precios.reduce((sum, venta) => sum + (venta.price || 0), 0) / precios.length
      : 0

    // Días promedio de preparación (TODOS los vehículos completados)
    const { data: preparacionData, error: prepError } = await supabase
      .from('sales_vehicles')
      .select('sale_date, cyp_date, photo_360_date')
      .not('sale_date', 'is', null)
      .eq('vehicle_type', 'Coche') // Solo coches
      .eq('cyp_status', 'completado')
      .eq('photo_360_status', 'completado')

    if (prepError) {
      console.error('Error obteniendo datos de preparación:', prepError)
      return NextResponse.json({ error: 'Error obteniendo estadísticas' }, { status: 500 })
    }

    let promedioDiasPreparacion = 0
    if (preparacionData && preparacionData.length > 0) {
      const diasPreparacion = preparacionData.map(venta => {
        const saleDate = new Date(venta.sale_date)
        const cypDate = new Date(venta.cyp_date)
        const photo360Date = new Date(venta.photo_360_date)
        
        // Tomar la fecha más reciente entre CYP y 360 como fecha de completado
        const completionDate = new Date(Math.max(cypDate.getTime(), photo360Date.getTime()))
        const diffTime = completionDate.getTime() - saleDate.getTime()
        const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        console.log(`Vehículo ${venta.sale_date}: venta=${venta.sale_date}, cyp=${venta.cyp_date}, 360=${venta.photo_360_date}, días=${dias}`)
        console.log(`  - Sale date: ${saleDate.toISOString()}`)
        console.log(`  - CYP date: ${cypDate.toISOString()}`)
        console.log(`  - 360 date: ${photo360Date.toISOString()}`)
        console.log(`  - Completion date: ${completionDate.toISOString()}`)
        console.log(`  - Diff time (ms): ${diffTime}`)
        console.log(`  - Days calculated: ${dias}`)
        return dias
      }).filter(dias => dias > 0 && dias <= 30) // Solo días válidos y razonables (máximo 30 días)
      
      if (diasPreparacion.length > 0) {
        promedioDiasPreparacion = Math.round(diasPreparacion.reduce((sum, dias) => sum + dias, 0) / diasPreparacion.length)
        console.log('=== DEBUG DÍAS PREPARACIÓN ===')
        console.log('Total vehículos completados procesados:', preparacionData.length)
        console.log('Días de preparación encontrados:', diasPreparacion)
        console.log('Días ordenados:', diasPreparacion.sort((a, b) => a - b))
        console.log('Promedio calculado:', promedioDiasPreparacion)
        console.log('Mínimo:', Math.min(...diasPreparacion))
        console.log('Máximo:', Math.max(...diasPreparacion))
        console.log('==============================')
      }
    }

    // Total en cola (coches que NO tienen AMBOS procesos completados)
    const { data: enColaData, error: colaError } = await supabase
      .from('sales_vehicles')
      .select('*')
      .eq('vehicle_type', 'Coche')
      .not('cyp_status', 'is', null)

    if (colaError) {
      console.error('Error obteniendo vehículos en cola:', colaError)
      return NextResponse.json({ error: 'Error obteniendo estadísticas' }, { status: 500 })
    }

    // Filtrar en JavaScript para replicar exactamente la lógica del dashboard
    const enCola = enColaData ? enColaData.filter(vehicle => 
      !(vehicle.cyp_status === "completado" && vehicle.photo_360_status === "completado")
    ).length : 0

    if (colaError) {
      console.error('Error obteniendo vehículos en cola:', colaError)
      return NextResponse.json({ error: 'Error obteniendo estadísticas' }, { status: 500 })
    }

    // Promedio de descuentos
    const { data: descuentosData, error: descError } = await supabase
      .from('sales_vehicles')
      .select('discount')
      .not('discount', 'is', null)
      .neq('discount', '')

    if (descError) {
      console.error('Error obteniendo descuentos:', descError)
      return NextResponse.json({ error: 'Error obteniendo estadísticas' }, { status: 500 })
    }

    let promedioDescuentos = 0
    if (descuentosData && descuentosData.length > 0) {
      const descuentos = descuentosData.map(venta => {
        const desc = parseFloat(venta.discount) || 0
        return desc
      }).filter(desc => desc > 0)
      
      if (descuentos.length > 0) {
        promedioDescuentos = Math.round(descuentos.reduce((sum, desc) => sum + desc, 0) / descuentos.length)
        console.log('Descuentos encontrados:', descuentos)
        console.log('Promedio calculado:', promedioDescuentos)
      }
    }

    // Asegurar que el valor sea un número
    promedioDescuentos = Number(promedioDescuentos) || 0

    console.log('=== DEBUG: Estadísticas obtenidas exitosamente ===')
    console.log('Total ventas:', totalVentas)
    console.log('Este mes:', esteMes)
    console.log('Última semana:', ultimaSemana)
    console.log('Promedio precio:', promedioPrecio)
    console.log('Promedio días preparación:', promedioDiasPreparacion)
    console.log('En cola:', enCola)
    console.log('Promedio descuentos (raw):', promedioDescuentos)
    console.log('Promedio descuentos (formatted):', promedioDescuentos.toLocaleString())
    console.log('Promedio descuentos (type):', typeof promedioDescuentos)
    console.log('Datos de preparación encontrados:', preparacionData?.length || 0)
    console.log('Datos de descuentos encontrados:', descuentosData?.length || 0)

    return NextResponse.json({
      totalVentas: totalVentas || 0,
      esteMes: esteMes || 0,
      ultimaSemana: ultimaSemana || 0,
      promedioPrecio: Math.round(promedioPrecio),
      promedioDiasPreparacion: promedioDiasPreparacion || 0,
      enCola: enCola || 0,
      promedioDescuentos: promedioDescuentos || 0
    })

  } catch (error) {
    console.error('Error en stats de ventas:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 