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

    // Aquí podrías eliminar la suscripción de la base de datos
    console.log("Desuscribiendo usuario:", session.user.id)

    return NextResponse.json({
      message: "Desuscripción exitosa",
      userId: session.user.id,
    })
  } catch (error) {
    console.error("Error desuscribiendo:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
