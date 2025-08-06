import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Intentar hacer logout para limpiar la sesión corrupta
    const { error: logoutError } = await supabase.auth.signOut()
    
    if (logoutError) {
      console.log("Error en logout:", logoutError)
    }
    
    return NextResponse.json({
      success: true,
      message: "Sesión limpiada. Por favor, inicia sesión nuevamente.",
      logoutError: logoutError?.message
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 