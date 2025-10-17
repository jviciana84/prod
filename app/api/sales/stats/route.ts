import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    console.log('🚀🚀🚀 API /api/sales/stats EJECUTÁNDOSE 🚀🚀🚀')
    const cookieStore = await cookies()
    const supabase = await createRouteHandlerClient(cookieStore)

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

    // Días promedio de preparación (usando la misma lógica del dashboard)
    const { data: preparacionData, error: prepError } = await supabase
      .from('sales_vehicles')
      .select('sale_date, cyp_date, photo_360_date, cyp_status, photo_360_status, license_plate, updated_at')
      .not('sale_date', 'is', null)
      .eq('cyp_status', 'completado')
      .eq('photo_360_status', 'completado')
      .not('cyp_date', 'is', null)
      .not('photo_360_date', 'is', null)

    if (prepError) {
      console.error('Error obteniendo datos de preparación:', prepError)
      return NextResponse.json({ error: 'Error obteniendo estadísticas' }, { status: 500 })
    }

    let promedioDiasPreparacion = 0
    if (preparacionData && preparacionData.length > 0) {
      // Ordenar por updated_at (más reciente primero) - misma lógica del dashboard
      const sortedCompletedVehicles = preparacionData.sort((a, b) => {
        const aUpdatedAt = new Date(a.updated_at).getTime()
        const bUpdatedAt = new Date(b.updated_at).getTime()
        return bUpdatedAt - aUpdatedAt
      })

      const calculateDays = (saleDate: string, cypDate: string | null, photo360Date: string | null) => {
        const sale = new Date(saleDate)
        let completionDate: Date | null = null

        if (cypDate && photo360Date) {
          const cyp = new Date(cypDate)
          const photo = new Date(photo360Date)
          completionDate = cyp > photo ? cyp : photo
        } else if (cypDate) {
          completionDate = new Date(cypDate)
        } else if (photo360Date) {
          completionDate = new Date(photo360Date)
        }

        if (completionDate) {
          const diffTime = completionDate.getTime() - sale.getTime()
          return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        }
        return null
      }

      // Procesar todos los vehículos completados
      const allWorkshopDaysData = sortedCompletedVehicles
        .map((v) => {
          const days = calculateDays(v.sale_date, v.cyp_date, v.photo_360_date)
          return {
            days: days,
            matricula: v.license_plate || v.id,
          }
        })
        .filter((item) => item.days !== null) as { days: number; matricula: string }[]

      // Calcular promedio total (misma lógica del dashboard)
      const totalDays = allWorkshopDaysData.reduce((sum, item) => sum + item.days, 0)
      promedioDiasPreparacion = allWorkshopDaysData.length > 0 ? Math.round(totalDays / allWorkshopDaysData.length) : 0

      console.log('=== DEBUG DÍAS PREPARACIÓN VENTAS ===')
      console.log('Total vehículos completados procesados:', sortedCompletedVehicles.length)
      console.log('Vehículos con días válidos:', allWorkshopDaysData.length)
      console.log('Promedio calculado:', promedioDiasPreparacion)
      console.log('Primeros 5 vehículos:', allWorkshopDaysData.slice(0, 5).map(v => ({ matricula: v.matricula, days: v.days })))
      console.log('==============================')
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
      }).filter(desc => desc !== 0) // Incluir descuentos negativos y positivos, excluir solo 0
      
      if (descuentos.length > 0) {
        // Usar Math.abs para mostrar el valor absoluto del descuento promedio
        promedioDescuentos = Math.round(Math.abs(descuentos.reduce((sum, desc) => sum + desc, 0) / descuentos.length))
        console.log('Descuentos encontrados:', descuentos)
        console.log('Promedio calculado (absoluto):', promedioDescuentos)
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