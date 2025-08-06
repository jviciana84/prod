import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  console.log("🚀 Iniciando proceso de suscripción simple...")

  try {
    const body = await request.json()
    console.log("📦 Body recibido:", { hasSubscription: !!body.subscription, hasUserId: !!body.userId })

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

    // Insertar suscripción con el userId proporcionado
    const supabase = createRouteHandlerClient({ cookies })
    const { error } = await supabase.from("user_push_subscriptions").insert({
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys?.p256dh || "",
      auth: subscription.keys?.auth || "",
      is_active: true,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("❌ Error insertando:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error.details,
          code: error.code,
          hint: error.hint,
        },
        { status: 500 },
      )
    }

    console.log("✅ Suscripción guardada para usuario:", userId)
    return NextResponse.json({
      success: true,
      message: "Suscripción guardada correctamente",
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