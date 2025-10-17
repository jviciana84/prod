import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createRouteHandlerClient(cookieStore)
    
    // Intentar refrescar la sesión
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.error("Error refrescando sesión:", error)
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.status
      }, { status: 400 })
    }
    
    // Verificar si ahora tenemos usuario
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    return NextResponse.json({
      success: true,
      message: "Sesión refrescada correctamente",
      user: user ? {
        id: user.id,
        email: user.email
      } : null,
      userError: userError?.message
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 