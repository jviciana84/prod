import { type NextRequest, NextResponse } from "next/server"
import webpush from "web-push"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

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

    // Construir query para suscripciones
    let subscriptionsQuery = supabase
      .from("user_push_subscriptions")
      .select(`
        *,
        user_notification_preferences!inner(is_enabled)
      `)
      .eq("is_active", true)
      .eq("user_notification_preferences.notification_type_id", notificationTypeId)
      .eq("user_notification_preferences.is_enabled", true)

    // Si se especifican usuarios específicos, filtrar por ellos
    if (userIds.length > 0) {
      subscriptionsQuery = subscriptionsQuery.in("user_id", userIds)
    }

    const { data: subscriptions, error: subsError } = await subscriptionsQuery

    if (subsError) {
      console.error("Error obteniendo suscripciones:", subsError)
      return NextResponse.json({ error: "Error obteniendo suscripciones" }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        message: "No hay usuarios suscritos a este tipo de notificación",
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
        category: notificationType.category,
        url: data.url || "/dashboard",
      },
      tag: notificationType.name,
      requireInteraction: notificationType.is_critical,
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

          // Guardar en historial
          await supabase.from("notification_history").insert({
            notification_type_id: notificationTypeId,
            user_id: subscription.user_id,
            title,
            body: message,
            data,
            status: "sent",
          })

          return { success: true, userId: subscription.user_id }
        } catch (error) {
          console.error(`Error enviando notificación a ${subscription.user_id}:`, error)

          // Si la suscripción es inválida, desactivarla
          if (error.statusCode === 410) {
            await supabase.from("user_push_subscriptions").update({ is_active: false }).eq("id", subscription.id)
          }

          // Guardar error en historial
          await supabase.from("notification_history").insert({
            notification_type_id: notificationTypeId,
            user_id: subscription.user_id,
            title,
            body: message,
            data,
            status: "failed",
          })

          return { success: false, userId: subscription.user_id, error: error.message }
        }
      }),
    )

    // Contar resultados
    const successful = results.filter((r) => r.status === "fulfilled" && r.value.success).length
    const failed = results.filter((r) => r.status === "rejected" || !r.value.success).length

    return NextResponse.json({
      message: "Notificaciones enviadas",
      sent: successful,
      failed,
      total: subscriptions.length,
    })
  } catch (error) {
    console.error("Error enviando notificaciones:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
