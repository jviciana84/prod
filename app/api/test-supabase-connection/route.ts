import { NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Probando conexión a Supabase...")
    
    // Verificar variables de entorno
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log("📋 Variables de entorno:")
    console.log("   NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✅ Configurada" : "❌ No configurada")
    console.log("   SUPABASE_SERVICE_ROLE_KEY:", supabaseKey ? "✅ Configurada" : "❌ No configurada")
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        success: false,
        error: "Variables de entorno no configuradas",
        message: "Variables de entorno no configuradas",
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey
      }, { status: 500 })
    }
    
    // Crear cliente
    const supabase = createServiceClient(supabaseUrl, supabaseKey)
    console.log("✅ Cliente de Supabase creado")
    
    // Probar conexión simple
    const { data, error } = await supabase
      .from('stock')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error("❌ Error de conexión:", error)
      return NextResponse.json({ 
        success: false,
        error: "Error de conexión a Supabase",
        message: "Error de conexión a Supabase",
        details: error.message,
        code: error.code
      }, { status: 500 })
    }
    
    console.log("✅ Conexión exitosa")
    
    // Probar consulta más específica
    const { data: stockData, error: stockError } = await supabase
      .from('stock')
      .select('id, license_plate, is_sold')
      .limit(5)
    
    if (stockError) {
      console.error("❌ Error consultando stock:", stockError)
      return NextResponse.json({ 
        success: false,
        error: "Error consultando tabla stock",
        message: "Error consultando tabla stock",
        details: stockError.message,
        code: stockError.code
      }, { status: 500 })
    }
    
    console.log("✅ Consulta de stock exitosa")
    
    return NextResponse.json({
      success: true,
      message: "Conexión a Supabase exitosa",
      stockSample: stockData,
      count: stockData?.length || 0
    })
    
  } catch (error) {
    console.error("💥 Error crítico:", error)
    return NextResponse.json({ 
      success: false,
      error: "Error crítico",
      message: "Error crítico",
      details: error.message
    }, { status: 500 })
  }
}
