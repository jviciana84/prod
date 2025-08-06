import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  console.log("🚀 Iniciando proceso de desuscripción simple...")

  try {
    const body = await request.json()
    const { subscription, userId } = body

    if (!subscription?.endpoint) {
      console.log("❌ Datos de suscripción inválidos")
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    if (!userId) {
      console.log("❌ userId no proporcionado")
      return NextResponse.json({ error: "userId requerido" }, { status: 400 })
    }

    console.log("🔗 Endpoint válido recibido para usuario:", userId)

    // Desactivar suscripción en la base de datos
    const supabase = createRouteHandlerClient({ cookies })
    const { error } = await supabase
      .from("user_push_subscriptions")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("endpoint", subscription.endpoint)

    if (error) {
      console.error("❌ Error desactivando suscripción:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      )
    }

    console.log("✅ Suscripción desactivada para usuario:", userId)
    return NextResponse.json({
      success: true,
      message: "Suscripción desactivada correctamente",
      user_id: userId,
    })
  } catch (error) {
    console.error("💥 Error general:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
} 