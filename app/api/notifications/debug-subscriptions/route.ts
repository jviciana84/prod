import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Obtener usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ message: "Usuario no autenticado" }, { status: 401 })
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
    console.error("Error debuggeando suscripciones:", error)
    return NextResponse.json({ 
      message: "Error interno del servidor" 
    }, { status: 500 })
  }
} 