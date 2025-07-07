import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  console.log("[API Send Reset Email] Received POST request.")
  try {
    const cookieStore = await cookies()
    const supabase = await createServerClient(cookieStore)
    const requestOrigin = request.nextUrl.origin

    // Verificar sesión del admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.warn("[API Send Reset Email] Unauthorized access attempt.")
      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { email } = body
    console.log("[API Send Reset Email] Request body:", body)

    if (!email) {
      console.warn("[API Send Reset Email] Missing email in request.")
      return NextResponse.json({ message: "Se requiere el email" }, { status: 400 })
    }

    console.log(`[API Send Reset Email] Sending reset email to: ${email}`)

    // Usar Supabase para enviar el correo de reset con configuración mejorada
    const { data, error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${requestOrigin}/auth/reset-password`,
      captchaToken: undefined, // No usar captcha para admin
    })

    if (error) {
      console.error("[API Send Reset Email] Error sending reset email:", error)

      // Manejar errores específicos
      if (error.message.includes("Email not confirmed")) {
        return NextResponse.json(
          { message: "El email del usuario no está confirmado. Envía primero un correo de bienvenida." },
          { status: 400 },
        )
      }

      if (error.message.includes("User not found")) {
        return NextResponse.json({ message: "No se encontró un usuario con ese email." }, { status: 404 })
      }

      return NextResponse.json(
        { message: error.message || "Error al enviar correo de restablecimiento" },
        { status: 500 },
      )
    }

    console.log(`[API Send Reset Email] Reset email sent successfully to ${email}`)

    return NextResponse.json({
      message: "Correo de restablecimiento enviado exitosamente",
      success: true,
      data: data,
    })
  } catch (error: any) {
    console.error("[API Send Reset Email] Unhandled error:", error)
    return NextResponse.json({ message: error.message || "Error en el proceso de restablecimiento" }, { status: 500 })
  }
}
