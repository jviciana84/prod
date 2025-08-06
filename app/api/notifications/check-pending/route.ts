import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Obtener notificaciones pendientes de push
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from("notification_history")
      .select(`
        id,
        user_id,
        title,
        body,
        data,
        created_at
      `)
      .eq("data->needsPushNotification", true)
      .order("created_at", { ascending: false })

    if (fetchError) {
      console.error("Error obteniendo notificaciones pendientes:", fetchError)
      return NextResponse.json({ message: "Error obteniendo notificaciones" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      count: pendingNotifications?.length || 0,
      notifications: pendingNotifications || []
    })

  } catch (error: any) {
    console.error("Error verificando notificaciones pendientes:", error)
    return NextResponse.json({ 
      message: "Error interno del servidor" 
    }, { status: 500 })
  }
} 