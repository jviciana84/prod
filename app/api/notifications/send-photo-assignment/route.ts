import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import webpush from "web-push"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

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

    // Crear notificación en la base de datos
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

    // Enviar notificación push si está habilitada
    try {
      // Obtener suscripciones push del fotógrafo
      const { data: subscriptions, error: subsError } = await supabase
        .from("user_push_subscriptions")
        .select("subscription")
        .eq("user_id", photographerId)
        .eq("is_active", true)

      if (!subsError && subscriptions && subscriptions.length > 0) {
        const pushPayload = {
          title: "📸 Nuevas fotografías asignadas",
          body: `Se te han asignado nuevas fotografías para tomar: ${licensePlate} ${model || ""}`,
          icon: "/android-chrome-192x192.png",
          badge: "/android-chrome-192x192.png",
          data: {
            url: "/dashboard/photos",
            type: "photo_assignment",
            vehicleId,
            licensePlate
          }
        }

        // Enviar a todas las suscripciones del fotógrafo
        for (const sub of subscriptions) {
          try {
            await webpush.sendNotification(
              sub.subscription,
              JSON.stringify(pushPayload)
            )
          } catch (pushError) {
            console.error("Error enviando push notification:", pushError)
            // Marcar suscripción como inactiva si falla
            await supabase
              .from("user_push_subscriptions")
              .update({ is_active: false })
              .eq("user_id", photographerId)
              .eq("subscription", sub.subscription)
          }
        }
      }
    } catch (pushError) {
      console.error("Error en notificaciones push:", pushError)
      // No fallar si las push notifications fallan
    }

    return NextResponse.json({ 
      success: true, 
      message: "Notificación enviada correctamente",
      photographer: photographer.full_name || photographer.email
    })

  } catch (error: any) {
    console.error("Error enviando notificación de asignación:", error)
    return NextResponse.json({ 
      message: "Error interno del servidor" 
    }, { status: 500 })
  }
} 