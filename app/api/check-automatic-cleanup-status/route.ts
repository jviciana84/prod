import { NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Verificando estado del sistema automático...")
    
    // Verificar variables de entorno
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        success: false,
        error: "Variables de entorno no configuradas",
        message: "Variables de entorno no configuradas"
      }, { status: 500 })
    }
    
    // Crear cliente
    const supabase = createServiceClient(supabaseUrl, supabaseKey)
    console.log("✅ Cliente de Supabase configurado")

    // Verificar si existen los triggers
    const { data: triggers, error: triggersError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, action_timing')
      .eq('event_object_table', 'stock')
      .like('trigger_name', '%vehicle_sold_cleanup%')
    
    if (triggersError) {
      console.error("❌ Error verificando triggers:", triggersError)
      return NextResponse.json({ 
        success: false,
        error: "Error verificando triggers",
        message: triggersError.message
      }, { status: 500 })
    }

    const triggersInstalled = triggers && triggers.length >= 2 // Debería haber 2 triggers

    // Obtener estadísticas del stock
    const { data: stockData, error: stockError } = await supabase
      .from('stock')
      .select('id, is_sold')
    
    if (stockError) {
      console.error("❌ Error obteniendo datos de stock:", stockError)
      return NextResponse.json({ 
        success: false,
        error: "Error obteniendo datos de stock",
        message: stockError.message
      }, { status: 500 })
    }

    // Obtener estadísticas de entregas
    const { data: entregasData, error: entregasError } = await supabase
      .from('entregas')
      .select('id')
    
    if (entregasError) {
      console.error("❌ Error obteniendo datos de entregas:", entregasError)
    }

    // Calcular estadísticas
    const totalVehicles = stockData?.length || 0
    const soldInStock = stockData?.filter(v => v.is_sold === true).length || 0
    const availableInStock = stockData?.filter(v => v.is_sold === false || v.is_sold === null).length || 0
    const deliveredVehicles = entregasData?.length || 0

    console.log("📊 Estadísticas del sistema:")
    console.log(`   Total vehículos en stock: ${totalVehicles}`)
    console.log(`   Vendidos en stock: ${soldInStock}`)
    console.log(`   Disponibles en stock: ${availableInStock}`)
    console.log(`   Entregados: ${deliveredVehicles}`)
    console.log(`   Triggers instalados: ${triggersInstalled}`)

    return NextResponse.json({
      success: true,
      status: {
        triggersInstalled,
        totalVehicles,
        soldInStock,
        availableInStock,
        deliveredVehicles,
        triggers: triggers || []
      }
    })

  } catch (error) {
    console.error("💥 Error crítico verificando estado:", error)
    return NextResponse.json({ 
      success: false,
      error: "Error crítico",
      message: error.message,
      details: error.message
    }, { status: 500 })
  }
}
