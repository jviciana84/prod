import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
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

    // Ventas financiadas (payment_method = 'financed')
    const { count: financiadas, error: finError } = await supabase
      .from('sales_vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('payment_method', 'financed')

    if (finError) {
      console.error('Error obteniendo ventas financiadas:', finError)
      return NextResponse.json({ error: 'Error obteniendo estadísticas' }, { status: 500 })
    }

    console.log('=== DEBUG: Estadísticas obtenidas exitosamente ===')
    console.log('Total ventas:', totalVentas)
    console.log('Este mes:', esteMes)
    console.log('Última semana:', ultimaSemana)
    console.log('Promedio precio:', promedioPrecio)
    console.log('Financiadas:', financiadas)

    return NextResponse.json({
      totalVentas: totalVentas || 0,
      esteMes: esteMes || 0,
      ultimaSemana: ultimaSemana || 0,
      promedioPrecio: Math.round(promedioPrecio),
      financiadas: financiadas || 0
    })

  } catch (error) {
    console.error('Error en stats de ventas:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 