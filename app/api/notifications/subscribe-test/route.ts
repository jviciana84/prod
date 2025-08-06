import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  console.log("🚀 Iniciando proceso de suscripción de prueba...")

  try {
    const body = await request.json()
    console.log("📦 Body recibido:", { hasSubscription: !!body.subscription })

    const { subscription } = body

    if (!subscription?.endpoint) {
      console.log("❌ Datos de suscripción inválidos")
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    console.log("🔗 Endpoint válido recibido")

    // Usar service_role para bypass RLS
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Insertar con usuario de prueba (null para permitir suscripciones sin usuario)
    const { error } = await supabase.from("user_push_subscriptions").insert({
      user_id: null, // Usuario de prueba
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

    console.log("✅ Suscripción de prueba guardada")
    return NextResponse.json({
      success: true,
      message: "Suscripción de prueba guardada correctamente",
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