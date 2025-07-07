import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Verificando variables de entorno...")
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log("📋 Variables encontradas:", {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? "Definida" : "No definida",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? "Definida" : "No definida",
      SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? "Definida" : "No definida"
    })

    return NextResponse.json({ 
      success: true,
      variables: {
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? "Definida" : "No definida",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? "Definida" : "No definida",
        SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? "Definida" : "No definida"
      }
    })
  } catch (error: any) {
    console.error("❌ Error verificando variables:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Error inesperado"
    }, { status: 500 })
  }
} 