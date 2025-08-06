"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function ForceActivatePush() {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState("")

  const forceActivatePush = async () => {
    setIsLoading(true)
    setStatus("Activando push notifications...")
    
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

      // Guardar en servidor (sin autenticación)
      const response = await fetch("/api/notifications/force-subscribe", {
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
          userEmail: "viciana84@gmail.com" // Usuario específico
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error guardando suscripción")
      }

      setStatus("✅ Push notifications activadas correctamente")
      toast.success("Push notifications activadas")
      
    } catch (error) {
      console.error("Error:", error)
      setStatus(`❌ Error: ${error.message}`)
      toast.error(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testPush = async () => {
    try {
      const response = await fetch("/api/notifications/send-test-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userEmail: "viciana84@gmail.com" 
        })
      })

      const data = await response.json()
      if (response.ok) {
        toast.success("Push de prueba enviada")
        setStatus("✅ Push de prueba enviada")
      } else {
        toast.error(`Error: ${data.message}`)
        setStatus(`❌ Error: ${data.message}`)
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error enviando push de prueba")
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">Forzar Activación Push</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activar Push Notifications (Sin Autenticación)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={forceActivatePush} 
              disabled={isLoading}
              variant="default"
            >
              {isLoading ? "Activando..." : "Forzar Activación"}
            </Button>
            
            <Button 
              onClick={testPush}
              variant="outline"
            >
              Probar Push
            </Button>
          </div>
          
          {status && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">{status}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 