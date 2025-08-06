import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get("sb-wpjmimbscfsdzcwuwctk-auth-token")
    
    if (!authCookie) {
      return NextResponse.json({
        error: "No se encontró la cookie de autenticación"
      })
    }
    
    // Intentar decodificar la cookie
    let decodedCookie
    try {
      let cookieValue = authCookie.value
      
      // Si la cookie empieza con "base64-", decodificar desde base64
      if (cookieValue.startsWith("base64-")) {
        const base64Data = cookieValue.substring(7) // Remover "base64-"
        const decoded = Buffer.from(base64Data, 'base64').toString('utf-8')
        decodedCookie = JSON.parse(decoded)
      } else {
        // Intentar decodificar como JSON normal
        decodedCookie = JSON.parse(decodeURIComponent(cookieValue))
      }
    } catch (e) {
      decodedCookie = { 
        error: "No se pudo decodificar la cookie", 
        raw: authCookie.value.substring(0, 100) + "...",
        decodeError: e.message
      }
    }
    
    // Verificar si la cookie ha expirado
    const now = Date.now() / 1000
    const isExpired = decodedCookie?.expires_at ? now > decodedCookie.expires_at : null
    
    return NextResponse.json({
      cookie: {
        name: authCookie.name,
        value_length: authCookie.value.length,
        decoded: decodedCookie,
        has_access_token: decodedCookie?.access_token ? true : false,
        has_refresh_token: decodedCookie?.refresh_token ? true : false,
        expires_at: decodedCookie?.expires_at ? new Date(decodedCookie.expires_at * 1000).toISOString() : null,
        is_expired: isExpired,
        current_time: new Date().toISOString(),
        time_until_expiry: decodedCookie?.expires_at ? (decodedCookie.expires_at - now) / 3600 : null // horas
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 })
  }
} 