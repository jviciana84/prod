import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    console.log("=== PRUEBA DE CONFIGURACIÓN SUPABASE ===")
    
    // Verificar variables de entorno
    console.log("SUPABASE_URL:", process.env.SUPABASE_URL)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log("SUPABASE_SERVICE_ROLE_KEY (inicio):", process.env.SUPABASE_SERVICE_ROLE_KEY.slice(0, 8) + '...')
    } else {
      console.log("SUPABASE_SERVICE_ROLE_KEY: NO DEFINIDA")
    }
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: false,
        message: "Variables de entorno de Supabase no definidas",
        supabaseUrl: !!process.env.SUPABASE_URL,
        supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      })
    }
    
    // Intentar crear el cliente
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    // Probar conexión
    const { data, error } = await supabase
      .from('docuware_requests')
      .select('count')
      .limit(1)
    
    if (error) {
      return NextResponse.json({
        success: false,
        message: "Error de conexión con Supabase",
        error: error.message
      })
    }
    
    return NextResponse.json({
      success: true,
      message: "Conexión con Supabase exitosa",
      data: data
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Error en la prueba",
      error: error.message
    })
  }
} 