import { type NextRequest, NextResponse } from "next/server"
import webpush from "web-push"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    // Verificar que las claves VAPID estén configuradas
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const privateKey = process.env.VAPID_PRIVATE_KEY

    if (!publicKey || !privateKey) {
      return NextResponse.json(
        {
          error: "Claves VAPID no configuradas",
        },
        { status: 500 },
      )
    }

    // Configurar web-push
    try {
      webpush.setVapidDetails("mailto:admin@controlvo.ovh", publicKey, privateKey)
    } catch (vapidError) {
      console.error("Error configurando VAPID:", vapidError)
      return NextResponse.json(
        {
          error: "Error en configuración VAPID",
        },
        { status: 500 },
      )
    }

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

    // Obtener todas las suscripciones activas (incluyendo las de prueba)
    const { data: subscriptions, error: subsError } = await supabase
      .from("user_push_subscriptions")
      .select("*")
      .eq("is_active", true)

    if (subsError) {
      console.error("Error obteniendo suscripciones:", subsError)
      return NextResponse.json({ error: "Error obteniendo suscripciones" }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        message: "No hay suscripciones activas",
        sent: 0,
      })
    }

    // Preparar payload de notificación
    const notificationPayload = {
      title,
      body: message,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: {
        ...data,
        category: "test",
        url: data.url || "/dashboard",
      },
      tag: "test-notification",
      requireInteraction: false,
    }

    // Enviar notificaciones
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          }

          await webpush.sendNotification(pushSubscription, JSON.stringify(notificationPayload))

          return { success: true, userId: subscription.user_id }
        } catch (error) {
          console.error(`Error enviando notificación a ${subscription.user_id}:`, error)

          // Si la suscripción es inválida, desactivarla
          if (error.statusCode === 410) {
            await supabase.from("user_push_subscriptions").update({ is_active: false }).eq("id", subscription.id)
          }

          return { success: false, userId: subscription.user_id, error: error.message }
        }
      }),
    )

    // Contar resultados
    const successful = results.filter((r) => r.status === "fulfilled" && r.value.success).length
    const failed = results.filter((r) => r.status === "rejected" || !r.value.success).length

    return NextResponse.json({
      message: "Notificaciones de prueba enviadas",
      sent: successful,
      failed,
      total: subscriptions.length,
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
