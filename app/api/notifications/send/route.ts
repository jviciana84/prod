import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    const { notificationTypeId, title, body: message, data = {}, userIds = [] } = body

    if (!notificationTypeId || !title || !message) {
      return NextResponse.json(
        {
          error: "notificationTypeId, title y body son requeridos",
        },
        { status: 400 },
      )
    }

    // Obtener el tipo de notificación
    const { data: notificationType, error: typeError } = await supabase
      .from("notification_types")
      .select("*")
      .eq("id", notificationTypeId)
      .eq("is_active", true)
      .single()

    if (typeError || !notificationType) {
      return NextResponse.json(
        {
          error: "Tipo de notificación no encontrado o inactivo",
        },
        { status: 404 },
      )
    }

    // Obtener usuarios a los que enviar la notificación
    let targetUserIds = userIds

    // Si no se especifican usuarios, obtener todos los usuarios activos
    if (userIds.length === 0) {
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("id")
        .eq("is_active", true)

      if (usersError) {
        console.error("Error obteniendo usuarios:", usersError)
        return NextResponse.json({ error: "Error obteniendo usuarios" }, { status: 500 })
      }

      targetUserIds = users?.map(user => user.id) || []
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({
        message: "No hay usuarios para enviar la notificación",
        sent: 0,
      })
    }

    // Crear notificaciones de campana
    const notifications = targetUserIds.map(userId => ({
      user_id: userId,
      title,
      body: message,
      data: {
        ...data,
        category: notificationType.category,
        url: data.url || "/dashboard",
      },
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
      message: "Notificaciones enviadas",
      sent: notifications.length,
    })
  } catch (error) {
    console.error("Error enviando notificaciones:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
