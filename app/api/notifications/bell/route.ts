import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, body: message, data = {}, userIds = [] } = body

    if (!title || !message) {
      return NextResponse.json(
        {
          error: "title y body son requeridos",
        },
        { status: 400 },
      )
    }

    const cookieStore = await cookies()
    const supabase = await createRouteHandlerClient(cookieStore)

    // Obtener usuarios a los que enviar la notificación
    let targetUserIds = userIds

    // Si no se especifican usuarios, obtener todos los usuarios activos
    if (userIds.length === 0) {
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", "id") // Solo para obtener la estructura

      if (usersError) {
        console.error("Error obteniendo usuarios:", usersError)
        return NextResponse.json({ error: "Error obteniendo usuarios" }, { status: 500 })
      }

      // Por ahora, usar un usuario de prueba
      targetUserIds = ["test-user"]
    }

    // Crear notificaciones en el historial
    const notifications = targetUserIds.map(userId => ({
      user_id: userId,
      title,
      body: message,
      data,
      created_at: new Date().toISOString(),
    }))

    const { error: insertError } = await supabase
      .from("notification_history")
      .insert(notifications)

    if (insertError) {
      console.error("Error insertando notificaciones:", insertError)
      return NextResponse.json({ error: "Error guardando notificaciones" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Notificaciones de campana enviadas",
      sent: notifications.length,
    })
  } catch (error) {
    console.error("Error enviando notificaciones de campana:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createRouteHandlerClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    // Obtener notificaciones del usuario
    const { data: notifications, error } = await supabase
      .from("notification_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error obteniendo notificaciones:", error)
      return NextResponse.json({ error: "Error obteniendo notificaciones" }, { status: 500 })
    }

    return NextResponse.json({
      notifications: notifications || [],
      unread: notifications?.filter(n => !n.read_at).length || 0,
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
} 