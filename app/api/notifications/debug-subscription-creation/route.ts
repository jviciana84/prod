import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { subscription, userEmail } = body

    if (!subscription || !userEmail) {
      return NextResponse.json({ message: "Faltan datos requeridos" }, { status: 400 })
    }

    console.log("📱 Recibida suscripción para:", userEmail)
    console.log("📱 Endpoint:", subscription.endpoint)

    // Buscar usuario
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("email", userEmail)
      .single()

    if (userError || !user) {
      console.error("Error buscando usuario:", userError)
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
    }

    console.log("✅ Usuario encontrado:", user.id)

    // Guardar suscripción
    const { data: savedSubscription, error: insertError } = await supabase
      .from("user_push_subscriptions")
      .insert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        is_active: true
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error guardando suscripción:", insertError)
      return NextResponse.json({ message: "Error guardando suscripción" }, { status: 500 })
    }

    console.log("✅ Suscripción guardada:", savedSubscription.id)

    return NextResponse.json({ 
      success: true, 
      message: "Suscripción creada correctamente",
      userId: user.id,
      userEmail: user.email,
      subscriptionId: savedSubscription.id
    })

  } catch (error: any) {
    console.error("Error creando suscripción:", error)
    return NextResponse.json({ 
      message: "Error interno del servidor" 
    }, { status: 500 })
  }
} 