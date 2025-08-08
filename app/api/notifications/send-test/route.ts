import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const body = await request.json()

    const { title, body: message, data = {} } = body

    if (!title || !message) {
      return NextResponse.json(
        {
          error: "title y body son requeridos",
        },
        { status: 400 },
      )
    }

    // Obtener todos los usuarios activos para enviar notificación de campana
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id")
      .eq("is_active", true)

    if (usersError) {
      console.error("Error obteniendo usuarios:", usersError)
      return NextResponse.json({ error: "Error obteniendo usuarios" }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        message: "No hay usuarios activos",
        sent: 0,
      })
    }

    // Crear notificaciones de campana para todos los usuarios
    const notifications = users.map(user => ({
      user_id: user.id,
      title,
      body: message,
      data: {
        ...data,
        category: "test",
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
      message: "Notificaciones de prueba enviadas",
      sent: notifications.length,
    })
  } catch (error) {
    console.error("Error enviando notificaciones de prueba:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
