import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[Debug Clear Cookies] Limpiando cookies corruptas...")
    
    // Crear respuesta con headers para limpiar cookies
    const response = NextResponse.json({
      message: "Cookies limpiadas. Por favor, recarga la página.",
      success: true
    })

    // Limpiar todas las cookies de Supabase
    const cookiesToClear = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'supabase.auth.token',
      'supabase.auth.refresh_token',
      'supabase.auth.access_token'
    ]

    // Agregar headers para limpiar cookies
    cookiesToClear.forEach(cookieName => {
      response.headers.append('Set-Cookie', `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax`)
    })

    console.log("[Debug Clear Cookies] Headers de limpieza agregados")

    return response
  } catch (error: any) {
    console.error("[Debug Clear Cookies] Error:", error)
    return NextResponse.json({ message: error.message || "Error interno" }, { status: 500 })
  }
}
