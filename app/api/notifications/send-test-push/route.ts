import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import webpush from "web-push"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, body: message, userId } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: "title y body son requeridos" },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: "userId requerido" },
        { status: 400 }
      )
    }

    // Configurar VAPID
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

    if (!vapidPrivateKey || !vapidPublicKey) {
      return NextResponse.json(
        { error: "VAPID keys no configuradas" },
        { status: 500 }
      )
    }

    webpush.setVapidDetails(
      "mailto:viciana84@gmail.com",
      vapidPublicKey,
      vapidPrivateKey
    )

    // Obtener suscripciones activas del usuario
    const supabase = createRouteHandlerClient({ cookies })
    const { data: subscriptions, error } = await supabase
      .from("user_push_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)

    if (error) {
      console.error("Error obteniendo suscripciones:", error)
      return NextResponse.json(
        { error: "Error obteniendo suscripciones" },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { error: "No hay suscripciones activas para este usuario" },
        { status: 404 }
      )
    }

    // Enviar notificación a todas las suscripciones
    const results = []
    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        }

        const payload = JSON.stringify({
          title,
          body: message,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          data: {
            url: "/dashboard",
            timestamp: new Date().toISOString()
          }
        })

        const result = await webpush.sendNotification(pushSubscription, payload)
        results.push({ success: true, endpoint: subscription.endpoint })
      } catch (error) {
        console.error("Error enviando notificación:", error)
        results.push({ 
          success: false, 
          endpoint: subscription.endpoint, 
          error: error.message 
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const totalCount = results.length

    return NextResponse.json({
      message: `Notificación enviada a ${successCount}/${totalCount} suscripciones`,
      results,
      total: totalCount,
      success: successCount
    })
  } catch (error) {
    console.error("Error en send-test-push:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
} 