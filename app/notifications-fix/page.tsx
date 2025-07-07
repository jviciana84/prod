"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function NotificationsFixPage() {
  const [status, setStatus] = useState("Verificando...")
  const [hasSubscription, setHasSubscription] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    checkSubscription()
  }, [])

  async function checkSubscription() {
    if (typeof window === "undefined") return

    try {
      setStatus("Verificando suscripción...")

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("Tu navegador no soporta notificaciones push")
        return
      }

      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration) {
        setStatus("No hay service worker registrado")
        return
      }

      const subscription = await registration.pushManager.getSubscription()
      setHasSubscription(!!subscription)

      if (subscription) {
        setStatus("Suscripción existente encontrada")
      } else {
        setStatus("No hay suscripción activa")
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`)
    }
  }

  async function unsubscribe() {
    setIsLoading(true)
    setMessage("")

    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration) {
        setMessage("No hay service worker registrado")
        return
      }

      const subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        setMessage("No hay suscripción para eliminar")
        return
      }

      await subscription.unsubscribe()
      setMessage("✅ Suscripción eliminada correctamente")
      setHasSubscription(false)
      setStatus("No hay suscripción activa")
    } catch (error) {
      setMessage(`❌ Error eliminando suscripción: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function subscribe() {
    setIsLoading(true)
    setMessage("")

    try {
      // 1. Registrar service worker
      const registration = await navigator.serviceWorker.register("/sw.js")
      await navigator.serviceWorker.ready

      // 2. Solicitar permisos
      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission()
        if (permission !== "granted") {
          setMessage("❌ Permisos denegados")
          return
        }
      }

      // 3. Obtener VAPID key
      const vapidResponse = await fetch("/api/notifications/vapid-key")
      const { publicKey } = await vapidResponse.json()

      // 4. Crear suscripción
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      })

      // 5. USAR EL ENDPOINT QUE FUNCIONA
      const saveResponse = await fetch("/api/notifications/simple-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh")))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("auth")))),
        }),
      })

      const result = await saveResponse.json()

      if (result.success) {
        setMessage("✅ Suscripción creada correctamente")
        setHasSubscription(true)
        setStatus("Suscripción activa")
      } else {
        setMessage(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function testNotification() {
    setIsLoading(true)
    setMessage("")

    try {
      // Enviar notificación local primero
      new Notification("Notificación Local", {
        body: "Esta es una notificación local de prueba",
        icon: "/favicon.ico",
      })

      // Luego probar notificación del servidor
      const response = await fetch("/api/notifications/send-test", {
        method: "POST",
      })

      const result = await response.json()
      setMessage(`📊 Resultado: ${JSON.stringify(result)}`)
    } catch (error) {
      setMessage(`❌ Error enviando notificación: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function runDiagnostic() {
    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/notifications/debug")
      const diagnostic = await response.json()

      setMessage(`🔍 Diagnóstico:
📊 Supabase: ${diagnostic.supabase?.connected ? "✅" : "❌"}
🔑 VAPID Keys: ${diagnostic.environment?.hasVapidKeys?.public ? "✅" : "❌"}
👤 Usuario: ${diagnostic.auth?.authenticated ? "✅" : "❌"}
📋 Tabla: ${diagnostic.table?.exists ? "✅" : "❌"}
📈 Suscripciones: ${diagnostic.subscriptions?.count || 0}

${diagnostic.supabase?.error ? `Error Supabase: ${diagnostic.supabase.error}` : ""}
${diagnostic.table?.error ? `Error Tabla: ${diagnostic.table.error}` : ""}`)
    } catch (error) {
      setMessage(`❌ Error en diagnóstico: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Reparar Notificaciones Push</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-md">
            <p className="font-medium">Estado: {status}</p>
          </div>

          {message && (
            <Alert variant={message.includes("❌") ? "destructive" : "default"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            {hasSubscription && (
              <Button onClick={unsubscribe} disabled={isLoading} variant="destructive">
                1. Eliminar suscripción existente
              </Button>
            )}

            <Button onClick={subscribe} disabled={isLoading}>
              {hasSubscription ? "2. Crear nueva suscripción" : "Crear suscripción"}
            </Button>

            <Button onClick={testNotification} disabled={isLoading || !hasSubscription} variant="outline">
              Probar notificación
            </Button>

            <Button onClick={runDiagnostic} disabled={isLoading} variant="secondary">
              Diagnóstico completo
            </Button>
          </div>

          <div className="text-sm text-gray-500 mt-4">
            <p>Si tienes problemas con las notificaciones, sigue estos pasos:</p>
            <ol className="list-decimal pl-5 space-y-1 mt-2">
              <li>Elimina la suscripción existente</li>
              <li>Crea una nueva suscripción</li>
              <li>Prueba las notificaciones</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
