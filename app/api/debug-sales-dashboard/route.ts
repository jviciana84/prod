import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getDateDebugInfo } from "@/lib/date-utils"

export async function GET() {
  try {
    console.log("🔍 === DEBUG DASHBOARD VENTAS ===")
    
    const supabase = await createServerClient()
    
    // Obtener información del entorno usando las funciones utilitarias
    const dateDebugInfo = getDateDebugInfo()
    
    console.log("📋 Información del entorno:")
    console.log("- Environment:", dateDebugInfo.environment)
    console.log("- Timezone:", dateDebugInfo.timezone)
    console.log("- Current Date:", dateDebugInfo.currentDate)
    console.log("- Current Date Local:", dateDebugInfo.currentDateLocal)
    
    // Usar las funciones utilitarias para las fechas
    const firstDayOfMonth = dateDebugInfo.firstDayOfCurrentMonth
    const firstDayOfPreviousMonth = dateDebugInfo.firstDayOfPreviousMonth
    const lastDayOfPreviousMonth = dateDebugInfo.lastDayOfPreviousMonth
    
    console.log("📅 Fechas calculadas:")
    console.log("- First Day of Month:", firstDayOfMonth)
    console.log("- First Day of Previous Month:", firstDayOfPreviousMonth)
    console.log("- Last Day of Previous Month:", lastDayOfPreviousMonth)
    
    // Obtener ventas del mes actual
    const { data: salesData, error: salesError } = await supabase
      .from("sales_vehicles")
      .select("id, price, brand, payment_method, vehicle_type, license_plate, model, order_date")
      .gte("order_date", firstDayOfMonth)
    
    if (salesError) {
      console.error("❌ Error obteniendo ventas:", salesError)
      return NextResponse.json({
        success: false,
        error: salesError.message,
        dateDebugInfo,
        firstDayOfMonth,
      })
    }
    
    console.log("📊 Datos de ventas obtenidos:", salesData?.length || 0)
    
    // Mostrar algunos ejemplos de fechas
    const sampleDates = salesData?.slice(0, 5).map(sale => ({
      id: sale.id,
      order_date: sale.order_date,
      brand: sale.brand,
      vehicle_type: sale.vehicle_type
    })) || []
    
    // Calcular estadísticas
    const salesThisMonth = salesData?.length || 0
    const revenue = salesData?.reduce((total, sale) => total + (sale.price || 0), 0) || 0
    
    // Obtener ventas del mes anterior
    const { data: previousMonthSalesData, error: previousError } = await supabase
      .from("sales_vehicles")
      .select("id, price, payment_method, vehicle_type, order_date")
      .gte("order_date", firstDayOfPreviousMonth)
      .lt("order_date", firstDayOfMonth)
    
    if (previousError) {
      console.error("❌ Error obteniendo ventas del mes anterior:", previousError)
    }
    
    const previousSalesThisMonth = previousMonthSalesData?.length || 0
    const previousRevenue = previousMonthSalesData?.reduce((total, sale) => total + (sale.price || 0), 0) || 0
    
    const result = {
      success: true,
      dateDebugInfo,
      firstDayOfMonth,
      firstDayOfPreviousMonth,
      lastDayOfPreviousMonth,
      salesThisMonth,
      revenue,
      previousSalesThisMonth,
      previousRevenue,
      sampleDates,
      totalSalesRecords: salesData?.length || 0,
      totalPreviousMonthRecords: previousMonthSalesData?.length || 0
    }
    
    console.log("✅ Debug completado:", result)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error("💥 Error en debug:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
} 