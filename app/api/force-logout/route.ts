import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createRouteHandlerClient(cookieStore)
    
    // Forzar logout
    const { error: logoutError } = await supabase.auth.signOut()
    
    if (logoutError) {
      console.error("Error en logout:", logoutError)
    }
    
    // Crear respuesta con headers para limpiar cookies
    const response = NextResponse.json({
      success: true,
      message: "Sesión limpiada. Por favor, inicia sesión nuevamente.",
      logoutError: logoutError?.message
    })
    
    // Limpiar la cookie de autenticación manualmente
    response.cookies.delete("sb-wpjmimbscfsdzcwuwctk-auth-token")
    
    return response
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 