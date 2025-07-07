import { type NextRequest, NextResponse } from "next/server"
import webpush from "web-push"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    console.log("🔔 Iniciando envío de notificación de prueba...")

    // Verificar claves VAPID
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const privateKey = process.env.VAPID_PRIVATE_KEY

    console.log("🔑 VAPID Public Key:", publicKey ? "✅ Configurada" : "❌ No configurada")
    console.log("🔑 VAPID Private Key:", privateKey ? "✅ Configurada" : "❌ No configurada")

    if (!publicKey || !privateKey) {
      return NextResponse.json({
        success: false,
        error: "Claves VAPID no configuradas",
        debug: {
          publicKey: !!publicKey,
          privateKey: !!privateKey,
        },
      })
    }

    // Configurar web-push con más detalles
    try {
      webpush.setVapidDetails("mailto:admin@controlvo.ovh", publicKey, privateKey)
      console.log("✅ VAPID configurado correctamente")
    } catch (vapidError) {
      console.error("❌ Error configurando VAPID:", vapidError)
      return NextResponse.json({
        success: false,
        error: "Error en configuración VAPID",
        details: vapidError.message,
      })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Obtener suscripciones activas
    const { data: subscriptions, error: subsError } = await supabase
      .from("user_push_subscriptions")
      .select("*")
      .eq("is_active", true)

    console.log(`📊 Suscripciones encontradas: ${subscriptions?.length || 0}`)

    if (subsError) {
      console.error("❌ Error obteniendo suscripciones:", subsError)
      return NextResponse.json({
        success: false,
        error: "Error obteniendo suscripciones",
        details: subsError.message,
      })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No hay suscripciones activas",
        subscriptions: 0,
      })
    }

    // Preparar notificación de prueba
    const notificationPayload = {
      title: "🧪 Notificación de Prueba",
      body: "Esta es una notificación de prueba desde el servidor",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: {
        url: "/dashboard",
        timestamp: Date.now(),
      },
      tag: "test-notification",
    }

    console.log("📤 Enviando notificaciones...")

    // Enviar a cada suscripción con diagnóstico detallado
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription, index) => {
        try {
          console.log(`📨 Enviando a suscripción ${index + 1}/${subscriptions.length}`)
          console.log(`🔗 Endpoint: ${subscription.endpoint.substring(0, 50)}...`)

          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          }

          // Validar que las claves existan
          if (!pushSubscription.keys.p256dh || !pushSubscription.keys.auth) {
            throw new Error("Claves de suscripción faltantes")
          }

          const result = await webpush.sendNotification(pushSubscription, JSON.stringify(notificationPayload))

          console.log(`✅ Notificación enviada exitosamente a ${subscription.user_id}`)
          console.log(`📊 Status Code: ${result.statusCode}`)

          return {
            success: true,
            userId: subscription.user_id,
            statusCode: result.statusCode,
            endpoint: subscription.endpoint.substring(0, 50) + "...",
          }
        } catch (error) {
          console.error(`❌ Error enviando a ${subscription.user_id}:`, error)

          // Información detallada del error
          const errorInfo = {
            success: false,
            userId: subscription.user_id,
            error: error.message,
            statusCode: error.statusCode || null,
            endpoint: subscription.endpoint.substring(0, 50) + "...",
            details: {
              name: error.name,
              code: error.code,
              errno: error.errno,
            },
          }

          // Si la suscripción es inválida (410), marcarla como inactiva
          if (error.statusCode === 410) {
            console.log(`🗑️ Marcando suscripción como inactiva: ${subscription.id}`)
            await supabase.from("user_push_subscriptions").update({ is_active: false }).eq("id", subscription.id)
            errorInfo.action = "subscription_deactivated"
          }

          return errorInfo
        }
      }),
    )

    // Analizar resultados
    const successful = results.filter((r) => r.status === "fulfilled" && r.value.success)
    const failed = results.filter((r) => r.status === "rejected" || !r.value.success)

    console.log(`📊 Resultados: ${successful.length} exitosas, ${failed.length} fallidas`)

    return NextResponse.json({
      success: true,
      message: `Notificación enviada a ${successful.length} dispositivos (${failed.length} fallidos)`,
      results: results.map((r) => ({
        status: r.status,
        value: r.status === "fulfilled" ? r.value : null,
        reason: r.status === "rejected" ? r.reason?.message || r.reason : null,
      })),
      debug: {
        totalSubscriptions: subscriptions.length,
        successful: successful.length,
        failed: failed.length,
        vapidConfigured: true,
      },
    })
  } catch (error) {
    console.error("💥 Error general:", error)
    return NextResponse.json({
      success: false,
      error: "Error interno del servidor",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    })
  }
}
