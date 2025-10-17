import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
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

    const cookieStore = await cookies()
    const supabase = await createRouteHandlerClient(cookieStore)
    
    // Verificar autenticación pero no fallar si no está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        error: "Usuario no autenticado",
        authError: authError?.message,
        userExists: !!user
      }, { status: 401 })
    }

    // Crear una notificación de prueba en el historial
    const { error: insertError } = await supabase
      .from("notification_history")
      .insert({
        user_id: user.id,
        title,
        body: message,
        data,
        created_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error("Error insertando notificación de prueba:", insertError)
      return NextResponse.json({ 
        error: "Error guardando notificación",
        details: insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      message: "Notificación de prueba creada",
      sent: 1,
      user_id: user.id,
    })
  } catch (error) {
    console.error("Error en notificación de prueba:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
} 