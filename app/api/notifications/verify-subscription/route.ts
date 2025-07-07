import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "No hay sesión activa" }, { status: 401 })
    }

    const { subscription } = await request.json()

    if (!subscription) {
      return NextResponse.json({ error: "Suscripción requerida" }, { status: 400 })
    }

    // Aquí podrías verificar la suscripción en la base de datos
    // Por ahora solo verificamos que existe
    return NextResponse.json({
      valid: true,
      userId: session.user.id,
      endpoint: subscription.endpoint?.substring(0, 50) + "...",
    })
  } catch (error) {
    console.error("Error verificando suscripción:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
