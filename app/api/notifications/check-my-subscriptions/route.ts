import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Usar service_role key para evitar autenticación
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar usuario por email específico en profiles
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

    // Obtener suscripciones del usuario
    const { data: subscriptions, error: subsError } = await supabase
      .from("user_push_subscriptions")
      .select("*")
      .eq("user_id", user.id)

    if (subsError) {
      console.error("Error obteniendo suscripciones:", subsError)
      return NextResponse.json({ message: "Error obteniendo suscripciones" }, { status: 500 })
    }

    const activeCount = subscriptions?.filter(sub => sub.is_active).length || 0
    const totalCount = subscriptions?.length || 0

    return NextResponse.json({ 
      success: true,
      userId: user.id,
      userEmail: user.email,
      totalSubscriptions: totalCount,
      activeCount: activeCount,
      subscriptions: subscriptions || []
    })

  } catch (error: any) {
    console.error("Error verificando suscripciones:", error)
    return NextResponse.json({ 
      message: "Error interno del servidor" 
    }, { status: 500 })
  }
} 