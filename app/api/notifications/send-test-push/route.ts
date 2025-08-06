import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import webpush from "web-push"

// Configurar VAPID keys
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL || 'noreply@example.com'}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { userEmail = "jordi.viciana@munichgroup.es" } = body

    if (!userEmail) {
      return NextResponse.json({ message: "Email requerido" }, { status: 400 })
    }

    console.log("📱 Buscando usuario:", userEmail)

    // Buscar en profiles primero, luego en auth.users si no se encuentra
    let { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", userEmail)
      .single()

    if (userError || !user) {
      // Si no está en profiles, buscar en auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(userEmail)
      if (authUser && !authError) {
        user = { id: authUser.user.id }
        userError = null
      }
    }

    if (userError || !user) {
      console.error("Error buscando usuario:", userError)
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
    }

    console.log("✅ Usuario encontrado:", user.id)

    const { data: subscriptions, error: subsError } = await supabase
      .from("user_push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", user.id)
      .eq("is_active", true)

    if (subsError) {
      console.error("Error obteniendo suscripciones:", subsError)
      return NextResponse.json({ message: "Error obteniendo suscripciones" }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ 
        message: "No hay suscripciones push activas para este usuario",
        userId: user.id,
        subscriptionsCount: 0
      })
    }

    console.log(`📱 Enviando push notifications a ${subscriptions.length} suscripción(es)`)
    
    const pushPayload = {
      title: "🧪 Push de Prueba",
      body: "Esta es una notificación push de prueba",
      icon: "/android-chrome-192x192.png",
      badge: "/android-chrome-192x192.png",
      data: {
        url: "/dashboard",
        type: "test"
      }
    }

    let successCount = 0
    for (const sub of subscriptions) {
      try {
        console.log("📱 Procesando suscripción:", sub.endpoint.substring(0, 50) + "...")
        
        // Construir objeto subscription para web-push
        const subscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }
        
        console.log("📱 Subscription object:", JSON.stringify(subscription, null, 2))
        
        await webpush.sendNotification(
          subscription,
          JSON.stringify(pushPayload)
        )
        successCount++
        console.log("✅ Push notification enviada correctamente")
      } catch (pushError: any) {
        console.error("❌ Error enviando push notification:", pushError)
        console.error("❌ Error details:", {
          message: pushError.message,
          statusCode: pushError.statusCode,
          headers: pushError.headers,
          body: pushError.body
        })
        
        // Si es error 410 (Gone) o 404 (Not Found), marcar como inactiva
        if (pushError.statusCode === 410 || pushError.statusCode === 404) {
          console.log("🗑️ Marcando suscripción como inactiva (error 410/404)")
          await supabase
            .from("user_push_subscriptions")
            .update({ is_active: false })
            .eq("user_id", user.id)
            .eq("endpoint", sub.endpoint)
        }
        
        // Si es error de FCM, mostrar mensaje específico
        if (sub.endpoint.includes('fcm.googleapis.com')) {
          console.error("🔥 Error de FCM - Las suscripciones de FCM requieren configuración adicional")
        }
      }
    }
    
    console.log(`📱 Push notifications: ${successCount}/${subscriptions.length} enviadas correctamente`)

    return NextResponse.json({ 
      success: true, 
      message: `Push notifications enviadas: ${successCount}/${subscriptions.length}`,
      userId: user.id,
      totalSubscriptions: subscriptions.length,
      successCount: successCount
    })

  } catch (error: any) {
    console.error("Error enviando push de prueba:", error)
    return NextResponse.json({ 
      message: "Error interno del servidor" 
    }, { status: 500 })
  }
}