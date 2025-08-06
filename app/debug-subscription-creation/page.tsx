"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function DebugSubscriptionCreation() {
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const createSubscription = async () => {
    setIsLoading(true)
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Push notifications no soportadas")
      }

      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        throw new Error("Permisos no concedidos")
      }

      const registration = await navigator.serviceWorker.register("/sw.js")
      await navigator.serviceWorker.ready

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        throw new Error("VAPID key no configurada")
      }

      console.log("🔑 VAPID Public Key:", vapidPublicKey)

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      })

      console.log("📱 Subscription creada:", subscription)

      const response = await fetch("/api/notifications/debug-subscription-creation", {
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
          },
          userEmail: "jordi.viciana@munichgroup.es"
        }),
      })

      const data = await response.json()
      setResult(data)
      
      if (response.ok) {
        toast.success("Suscripción creada correctamente")
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

  const checkSubscriptions = async () => {
    try {
      const response = await fetch("/api/notifications/debug-subscriptions", {
        method: "GET"
      })

      const data = await response.json()
      setResult(data)
      toast.info("Suscripciones verificadas")
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error verificando suscripciones")
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">Debug Creación de Suscripciones</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crear Suscripción Push</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={createSubscription}
              disabled={isLoading}
              variant="default"
            >
              {isLoading ? "Creando..." : "Crear Suscripción"}
            </Button>
            
            <Button 
              onClick={checkSubscriptions}
              variant="outline"
            >
              Verificar Suscripciones
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