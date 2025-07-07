"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Bell, Bug, TestTube, RefreshCw } from "lucide-react"

export default function NotificationsDebugPage() {
  const [isClient, setIsClient] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [vapidKey, setVapidKey] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    setIsClient(true)
    checkInitialState()
  }, [])

  const checkInitialState = async () => {
    if (typeof window === "undefined") return

    addLog("🔍 Verificando estado inicial...")

    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
    setIsSupported(supported)
    addLog(`📱 Soporte: ${supported ? "✅ Sí" : "❌ No"}`)

    if (supported) {
      setPermission(Notification.permission)
      addLog(`🔔 Permisos: ${Notification.permission}`)

      // Verificar VAPID key
      try {
        const response = await fetch("/api/notifications/vapid-key")
        if (response.ok) {
          const data = await response.json()
          setVapidKey(data.publicKey)
          addLog("🔑 VAPID key obtenida")
        } else {
          addLog("❌ Error obteniendo VAPID key")
        }
      } catch (error) {
        addLog(`❌ Error: ${error.message}`)
      }

      // Verificar suscripción existente
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          const existingSubscription = await registration.pushManager.getSubscription()
          if (existingSubscription) {
            setSubscription(existingSubscription)
            addLog("📝 Suscripción existente encontrada")
          } else {
            addLog("📝 No hay suscripción existente")
          }
        }
      } catch (error) {
        addLog(`❌ Error verificando suscripción: ${error.message}`)
      }
    }
  }

  const requestPermission = async () => {
    if (!isSupported) {
      addLog("❌ Notificaciones no soportadas")
      return
    }

    try {
      addLog("🔔 Solicitando permisos...")
      const permission = await Notification.requestPermission()
      setPermission(permission)
      addLog(`🔔 Permisos: ${permission}`)
    } catch (error) {
      addLog(`❌ Error solicitando permisos: ${error.message}`)
    }
  }

  const createSubscription = async () => {
    if (permission !== "granted") {
      addLog("❌ Permisos no concedidos")
      return
    }

    if (!vapidKey) {
      addLog("❌ VAPID key no disponible")
      return
    }

    setIsLoading(true)
    try {
      addLog("📝 Registrando service worker...")
      const registration = await navigator.serviceWorker.register("/sw.js")
      await navigator.serviceWorker.ready
      addLog("✅ Service worker registrado")

      addLog("📝 Creando suscripción...")
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      })
      setSubscription(newSubscription)
      addLog("✅ Suscripción creada localmente")

      addLog("💾 Guardando en servidor...")
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: {
            endpoint: newSubscription.endpoint,
            keys: {
              p256dh: newSubscription.getKey("p256dh")
                ? btoa(String.fromCharCode(...new Uint8Array(newSubscription.getKey("p256dh")!)))
                : null,
              auth: newSubscription.getKey("auth")
                ? btoa(String.fromCharCode(...new Uint8Array(newSubscription.getKey("auth")!)))
                : null,
            },
          },
        }),
      })

      const result = await response.json()
      if (response.ok) {
        addLog("✅ Suscripción guardada en servidor")
      } else {
        addLog(`❌ Error guardando: ${result.error}`)
      }
    } catch (error) {
      addLog(`❌ Error creando suscripción: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testNotification = async () => {
    setIsLoading(true)
    try {
      addLog("🧪 Enviando notificación de prueba...")
      const response = await fetch("/api/notifications/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const result = await response.json()
      addLog(`📊 Resultado: ${JSON.stringify(result, null, 2)}`)
    } catch (error) {
      addLog(`❌ Error enviando notificación: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  if (!isClient) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Cargando...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Diagnóstico de Notificaciones Push
          </CardTitle>
          <CardDescription>Herramienta completa para diagnosticar problemas con notificaciones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span>Soporte:</span>
              <Badge variant={isSupported ? "default" : "destructive"}>
                {isSupported ? "✅ Soportado" : "❌ No Soportado"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span>Permisos:</span>
              <Badge variant={permission === "granted" ? "default" : "destructive"}>{permission}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span>VAPID Key:</span>
              <Badge variant={vapidKey ? "default" : "destructive"}>
                {vapidKey ? "✅ Configurada" : "❌ No Configurada"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span>Suscripción:</span>
              <Badge variant={subscription ? "default" : "destructive"}>
                {subscription ? "✅ Activa" : "❌ No Activa"}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="flex gap-2 flex-wrap">
            <Button onClick={requestPermission} disabled={!isSupported || isLoading}>
              <Bell className="h-4 w-4 mr-2" />
              Solicitar Permisos
            </Button>

            <Button onClick={createSubscription} disabled={permission !== "granted" || isLoading} variant="outline">
              📝 Crear Suscripción
            </Button>

            <Button onClick={testNotification} disabled={!subscription || isLoading} variant="outline">
              <TestTube className="h-4 w-4 mr-2" />
              Probar Notificación
            </Button>

            <Button onClick={checkInitialState} disabled={isLoading} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refrescar Estado
            </Button>

            <Button onClick={clearLogs} variant="outline">
              🗑️ Limpiar Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logs de Diagnóstico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No hay logs aún...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-sm font-mono mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
