import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import webpush from "web-push"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

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

    console.log(`📱 Procesando ${pendingNotifications.length} notificaciones pendientes`)

    // Obtener todas las suscripciones activas para comparar
    const { data: allSubscriptions, error: subsError } = await supabase
      .from("user_push_subscriptions")
      .select("user_id, endpoint, p256dh, auth")
      .eq("is_active", true)

    if (subsError) {
      console.error("Error obteniendo todas las suscripciones:", subsError)
    } else {
      console.log(`📱 Total de suscripciones activas: ${allSubscriptions?.length || 0}`)
      const userIds = allSubscriptions?.map(sub => sub.user_id) || []
      console.log(`📱 User IDs con suscripciones:`, userIds)
    }

    let processedCount = 0
    let successCount = 0

    for (const notification of pendingNotifications) {
      try {
        console.log(`📱 Procesando notificación ${notification.id} para usuario ${notification.user_id}`)
        
        // Obtener suscripciones push del usuario
        const { data: subscriptions, error: subsError } = await supabase
          .from("user_push_subscriptions")
          .select("endpoint, p256dh, auth")
          .eq("user_id", notification.user_id)
          .eq("is_active", true)

        if (subsError) {
          console.error(`❌ Error obteniendo suscripciones para ${notification.user_id}:`, subsError)
          continue
        }

        console.log(`📱 Usuario ${notification.user_id} tiene ${subscriptions?.length || 0} suscripciones activas`)

        if (!subscriptions || subscriptions.length === 0) {
          console.log(`ℹ️ No hay suscripciones activas para usuario ${notification.user_id}`)
          // Marcar como procesada aunque no haya suscripciones
          const { error: updateError } = await supabase
            .from("notification_history")
            .update({ 
              data: notification.data 
            })
            .eq("id", notification.id)

          if (!updateError) {
            processedCount++
          }
          continue
        }

        console.log(`📱 Enviando push notifications a ${subscriptions.length} suscripción(es)`)
        
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
            console.log(`📱 Intentando enviar push a endpoint: ${sub.endpoint.substring(0, 50)}...`)
            
            // Construir objeto subscription para web-push
            const subscription = {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth
              }
            }
            
            await webpush.sendNotification(
              subscription,
              JSON.stringify(pushPayload)
            )
            successCount++
            console.log(`✅ Push notification enviada correctamente para notificación ${notification.id}`)
          } catch (pushError) {
            console.error(`❌ Error enviando push para notificación ${notification.id}:`, pushError)
            // Marcar suscripción como inactiva si falla
            await supabase
              .from("user_push_subscriptions")
              .update({ is_active: false })
              .eq("user_id", notification.user_id)
              .eq("endpoint", sub.endpoint)
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

    console.log(`📱 Resumen: ${processedCount} procesadas, ${successCount} push enviadas`)

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