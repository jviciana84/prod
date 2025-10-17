import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Iniciando prueba de autenticación...")
    
    const cookieStore = await cookies()
    const supabase = await createRouteHandlerClient(cookieStore)
    
    // Obtener cookies manualmente
    const authCookie = cookieStore.get("sb-wpjmimbscfsdzcwuwctk-auth-token")
    
    console.log("🍪 Cookie de auth encontrada:", !!authCookie)
    
    // Intentar obtener sesión
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log("📋 Sesión obtenida:", !!session, "Error:", sessionError?.message)
    
    // Intentar obtener usuario
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log("👤 Usuario obtenido:", !!user, "Error:", userError?.message)
    
    return NextResponse.json({
      success: true,
      session: {
        exists: !!session,
        error: sessionError?.message
      },
      user: {
        exists: !!user,
        id: user?.id,
        email: user?.email,
        error: userError?.message
      },
      cookie: {
        exists: !!authCookie,
        value: authCookie ? "present" : "missing"
      }
    })
  } catch (error) {
    console.error("💥 Error en prueba de auth:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 })
  }
} 