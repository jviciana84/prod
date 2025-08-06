import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Usar service_role key para evitar autenticación
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { subscription } = body

    if (!subscription) {
      return NextResponse.json({ message: "Suscripción requerida" }, { status: 400 })
    }

    // Usuario específico
    const userEmail = "viciana84@gmail.com"
    
    // Buscar el usuario en profiles
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", userEmail)
      .single()

    if (userError || !user) {
      console.error("Error buscando usuario:", userError)
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
    }

    // Guardar suscripción
    const { error: insertError } = await supabase
      .from("user_push_subscriptions")
      .insert({
        user_id: user.id,
        subscription: subscription,
        is_active: true
      })

    if (insertError) {
      console.error("Error guardando suscripción:", insertError)
      return NextResponse.json({ message: "Error guardando suscripción" }, { status: 500 })
    }

    console.log(`✅ Suscripción guardada para ${user.email}`)

    return NextResponse.json({ 
      success: true, 
      message: "Push notifications activadas correctamente",
      userId: user.id,
      userEmail: user.email
    })

  } catch (error: any) {
    console.error("Error activando push:", error)
    return NextResponse.json({ 
      message: "Error interno del servidor" 
    }, { status: 500 })
  }
} 