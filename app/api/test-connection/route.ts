import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    console.log("🔍 Probando conexión a Supabase...")

    // Verificar variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log("📋 Variables de entorno:")
    console.log("- NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✅ Configurada" : "❌ No configurada")
    console.log("- SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Configurada" : "❌ No configurada")
    console.log("- NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Configurada" : "❌ No configurada")

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: "Variables de entorno de Supabase no configuradas",
        env: {
          supabaseUrl: !!supabaseUrl,
          supabaseKey: !!supabaseKey
        }
      }, { status: 500 })
    }

    // Crear cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log("✅ Cliente Supabase creado")

    // Probar una consulta simple
    const { data, error } = await supabase
      .from("sales_vehicles")
      .select("count")
      .limit(1)

    if (error) {
      console.error("❌ Error en consulta:", error)
      return NextResponse.json({
        success: false,
        error: "Error en consulta a la base de datos",
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    console.log("✅ Consulta exitosa:", data)

    return NextResponse.json({
      success: true,
      message: "Conexión a Supabase exitosa",
      data: data
    })

  } catch (error) {
    console.error("💥 Error general:", error)
    return NextResponse.json({
      success: false,
      error: "Error general en la prueba",
      details: error.message
    }, { status: 500 })
  }
}

