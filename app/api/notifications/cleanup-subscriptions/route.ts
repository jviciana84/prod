import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: "userId requerido" },
        { status: 400 }
      )
    }

    // Eliminar todas las suscripciones del usuario
    const supabase = createRouteHandlerClient({ cookies })
    const { error } = await supabase
      .from("user_push_subscriptions")
      .delete()
      .eq("user_id", userId)

    if (error) {
      console.error("Error eliminando suscripciones:", error)
      return NextResponse.json(
        { error: "Error eliminando suscripciones" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Suscripciones limpiadas correctamente",
      user_id: userId
    })
  } catch (error) {
    console.error("Error en cleanup-subscriptions:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
} 