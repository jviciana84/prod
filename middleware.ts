import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: "",
            ...options,
          })
        },
      },
    },
  )

  // Refrescar la sesión del usuario si existe
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error("Error al obtener sesión en middleware:", error)
      // Si hay error de parsing de cookies, limpiar cookies corruptas
      if (error.message.includes("JSON") || error.message.includes("parse") || error.message.includes("Failed to parse cookie")) {
        console.warn("Cookies corruptas detectadas en middleware, limpiando...")
        // Limpiar cookies corruptas sin afectar otras cookies
        response.cookies.delete("sb-access-token")
        response.cookies.delete("sb-refresh-token")
      }
    } else if (session) {
      // Forzar refresh del token si está cerca de expirar
      const tokenExpiry = session.expires_at ? new Date(session.expires_at * 1000) : null
      const now = new Date()
      const timeUntilExpiry = tokenExpiry ? tokenExpiry.getTime() - now.getTime() : 0
      
      // Si el token expira en menos de 5 minutos, forzar refresh (sincronizado con cliente)
      if (timeUntilExpiry < 5 * 60 * 1000) {
        console.log("🔄 Token cerca de expirar, forzando refresh...")
        await supabase.auth.refreshSession()
      }
    }
  } catch (error) {
    console.error("Error crítico en middleware:", error)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth/reset-password|api|).*)",
  ],
}
