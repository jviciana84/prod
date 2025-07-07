import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "No hay sesión activa" }, { status: 401 })
    }

    const userId = session.user.id

    // Obtener suscripciones del usuario
    const { data: subscriptions, error } = await supabase.from("push_subscriptions").select("*").eq("user_id", userId)

    if (error) {
      console.error("Error obteniendo suscripciones:", error)
      return NextResponse.json({ error: "Error obteniendo suscripciones" }, { status: 500 })
    }

    return NextResponse.json({
      userId,
      subscriptions: subscriptions?.length || 0,
      data: subscriptions,
      message: subscriptions?.length > 0 ? "Suscripciones encontradas" : "No hay suscripciones",
    })
  } catch (error) {
    console.error("Error verificando suscripciones:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
