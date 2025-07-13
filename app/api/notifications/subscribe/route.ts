import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  console.log("🚀 Iniciando proceso de suscripción...")

  try {
    // Authenticate user first
    const supabaseAuth = await createServerClient()

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      console.log("❌ Usuario no autenticado")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("✅ Usuario autenticado:", user.id)

    const body = await request.json()
    console.log("📦 Body recibido:", { hasSubscription: !!body.subscription })

    const { subscription } = body

    if (!subscription?.endpoint) {
      console.log("❌ Datos de suscripción inválidos")
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    console.log("🔗 Endpoint válido recibido")

    // Usar service_role para bypass RLS pero con usuario autenticado
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Check if user already has a subscription
    const { data: existingSubscription } = await supabase
      .from("user_push_subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("endpoint", subscription.endpoint)
      .single()

    if (existingSubscription) {
      console.log("✅ Suscripción ya existe")
      return NextResponse.json({
        success: true,
        message: "Suscripción ya existe",
      })
    }

    // Insert with authenticated user ID
    const { error } = await supabase.from("user_push_subscriptions").insert({
      user_id: user.id,
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

    console.log("✅ Suscripción guardada")
    return NextResponse.json({
      success: true,
      message: "Suscripción guardada correctamente",
    })
  } catch (error) {
    console.error("💥 Error general:", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        stack: process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
