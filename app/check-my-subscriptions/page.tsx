"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function CheckMySubscriptions() {
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const checkMySubscriptions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/notifications/check-my-subscriptions", {
        method: "GET"
      })

      const data = await response.json()
      setResult(data)
      
      if (response.ok) {
        toast.info(`Tienes ${data.activeCount} suscripciones activas`)
      } else {
        toast.error(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error verificando suscripciones")
    } finally {
      setIsLoading(false)
    }
  }

  const activatePushNow = async () => {
    setIsLoading(true)
    try {
      // Verificar soporte
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Push notifications no soportadas")
      }

      // Solicitar permisos
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        throw new Error("Permisos no concedidos")
      }

      // Registrar service worker
      const registration = await navigator.serviceWorker.register("/sw.js")
      await navigator.serviceWorker.ready

      // Obtener VAPID key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        throw new Error("VAPID key no configurada")
      }

      // Crear suscripción
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      })

      // Guardar en servidor
      const response = await fetch("/api/notifications/activate-my-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.getKey("p256dh")
                ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh")!)))
                : null,
              auth: subscription.getKey("auth")
                ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("auth")!)))
                : null,
            },
          }
        }),
      })

      const data = await response.json()
      if (response.ok) {
        toast.success("Push notifications activadas")
        setResult(data)
      } else {
        toast.error(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">Verificar Mis Suscripciones</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado de Mis Push Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={checkMySubscriptions}
              disabled={isLoading}
              variant="outline"
            >
              Verificar Mis Suscripciones
            </Button>
            
            <Button 
              onClick={activatePushNow}
              disabled={isLoading}
              variant="default"
            >
              Activar Push Ahora
            </Button>
          </div>

          {result && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Resultado:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 