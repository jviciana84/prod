import { createRouteHandlerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createRouteHandlerClient(cookieStore)

    // Verificar si el usuario está autenticado
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { photographerId, vehicleId, licensePlate, model } = body

    if (!photographerId || !vehicleId || !licensePlate) {
      return NextResponse.json({ message: "Faltan datos requeridos" }, { status: 400 })
    }

    // Obtener información del fotógrafo
    const { data: photographer, error: photographerError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", photographerId)
      .single()

    if (photographerError || !photographer) {
      console.error("Error obteniendo información del fotógrafo:", photographerError)
      return NextResponse.json({ message: "Fotógrafo no encontrado" }, { status: 404 })
    }

    // Crear notificación en la base de datos (solo campana)
    const notificationData = {
      user_id: photographerId,
      title: "📸 Nuevas fotografías asignadas",
      body: `Se te han asignado nuevas fotografías para tomar: ${licensePlate} ${model || ""}`,
      data: {
        type: "photo_assignment",
        vehicleId,
        licensePlate,
        model,
        url: "/dashboard/photos"
      },
      created_at: new Date().toISOString()
    }

    const { error: notificationError } = await supabase
      .from("notification_history")
      .insert(notificationData)

    if (notificationError) {
      console.error("Error creando notificación:", notificationError)
      return NextResponse.json({ message: "Error creando notificación" }, { status: 500 })
    }

    console.log(`✅ Notificación creada para ${photographer.full_name || photographer.email}`)

    return NextResponse.json({
      message: "Notificación enviada (solo campana - push anulado)",
      success: true
    })

  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
