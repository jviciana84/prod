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
          // No modificar cookies de autenticación existentes
          if (name.includes("auth-token") && request.cookies.get(name)) {
            console.log(`Preservando cookie de autenticación existente: ${name}`)
            return
          }

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
          // No eliminar cookies de autenticación
          if (name.includes("auth-token")) {
            console.log(`Preservando cookie de autenticación: ${name}`)
            return
          }

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

  // Refrescar la sesión del usuario si existe, pero sin modificar cookies existentes
  try {
    await supabase.auth.getUser()
  } catch (error) {
    console.error("Error al obtener usuario en middleware:", error)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - / (the root page, which is the login page)
     * - /auth/reset-password (the password reset page)
     * - /api/ (API routes)
     * Feel free to modify this pattern to include other public routes.
     */
    "/((?!_next/static|_next/image|favicon.ico|auth/reset-password|api|).*)",
    // Aplicar el middleware a la raíz (/) solo si no es la página de login
    // Si tu página de login está en '/', necesitas excluirla explícitamente
    // o usar una lógica más compleja si la raíz a veces es pública y a veces no.
    // Por ahora, la expresión regular de arriba excluye la raíz si no tiene nada después.
    // Para ser explícitos, si tu login está en '/', la regex de arriba ya lo maneja
    // al no coincidir con una ruta vacía después del dominio.
  ],
}
