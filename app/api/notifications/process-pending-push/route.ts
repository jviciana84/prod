import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import webpush from "web-push"

export async function POST(request: NextRequest) {
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
      .limit(10)

    if (fetchError) {
      console.error("Error obteniendo notificaciones pendientes:", fetchError)
      return NextResponse.json({ message: "Error obteniendo notificaciones" }, { status: 500 })
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "No hay notificaciones pendientes de push",
        processed: 0
      })
    }

    let processedCount = 0
    let successCount = 0

    for (const notification of pendingNotifications) {
      try {
        // Obtener suscripciones push del usuario
        const { data: subscriptions, error: subsError } = await supabase
          .from("user_push_subscriptions")
          .select("subscription")
          .eq("user_id", notification.user_id)
          .eq("is_active", true)

        if (!subsError && subscriptions && subscriptions.length > 0) {
          const pushPayload = {
            title: notification.title,
            body: notification.body,
            icon: "/android-chrome-192x192.png",
            badge: "/android-chrome-192x192.png",
            data: {
              url: notification.data?.url || "/dashboard/photos",
              type: notification.data?.type || "photo_assignment",
              notificationId: notification.id
            }
          }

          // Enviar a todas las suscripciones del usuario
          for (const sub of subscriptions) {
            try {
              await webpush.sendNotification(
                sub.subscription,
                JSON.stringify(pushPayload)
              )
              successCount++
              console.log(`✅ Push notification enviada para notificación ${notification.id}`)
            } catch (pushError) {
              console.error(`❌ Error enviando push para notificación ${notification.id}:`, pushError)
              // Marcar suscripción como inactiva si falla
              await supabase
                .from("user_push_subscriptions")
                .update({ is_active: false })
                .eq("user_id", notification.user_id)
                .eq("subscription", sub.subscription)
            }
          }
        }

        // Marcar como procesada (remover needsPushNotification)
        const { error: updateError } = await supabase
          .from("notification_history")
          .update({ 
            data: notification.data 
          })
          .eq("id", notification.id)

        if (updateError) {
          console.error(`Error actualizando notificación ${notification.id}:`, updateError)
        } else {
          processedCount++
        }

      } catch (error) {
        console.error(`Error procesando notificación ${notification.id}:`, error)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Procesadas ${processedCount} notificaciones`,
      processed: processedCount,
      pushSent: successCount
    })

  } catch (error: any) {
    console.error("Error procesando push notifications:", error)
    return NextResponse.json({ 
      message: "Error interno del servidor" 
    }, { status: 500 })
  }
} 