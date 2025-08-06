"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, TestTube, CheckCircle, XCircle } from "lucide-react"

export default function TestNotificationsPage() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [vapidKey, setVapidKey] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    checkSupport()
  }, [])

  const checkSupport = async () => {
    addLog("🔍 Verificando soporte...")
    
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
    setIsSupported(supported)
    addLog(`📱 Soporte: ${supported ? "✅ Sí" : "❌ No"}`)

    if (supported) {
      setPermission(Notification.permission)
      addLog(`🔔 Permisos actuales: ${Notification.permission}`)

      // Verificar VAPID key
      try {
        const response = await fetch("/api/notifications/vapid-key")
        if (response.ok) {
          const data = await response.json()
          setVapidKey(data.publicKey)
          addLog("🔑 VAPID key obtenida correctamente")
        } else {
          addLog("❌ Error obteniendo VAPID key")
        }
      } catch (error) {
        addLog(`❌ Error: ${error.message}`)
      }
    }
  }

  const requestPermission = async () => {
    if (!isSupported) {
      addLog("❌ Notificaciones no soportadas")
      return
    }

    setIsLoading(true)
    try {
      addLog("🔔 Solicitando permisos...")
      const permission = await Notification.requestPermission()
      setPermission(permission)
      addLog(`🔔 Permisos: ${permission}`)
    } catch (error) {
      addLog(`❌ Error solicitando permisos: ${error.message}`)
    } finally {
      setIsLoading(false)
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
      
      // Registrar service worker
      const registration = await navigator.serviceWorker.register("/sw.js")
      await navigator.serviceWorker.ready
      addLog("✅ Service worker registrado")

      addLog("📝 Creando suscripción...")
      
      // Crear suscripción
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      })
      addLog("✅ Suscripción creada localmente")

      addLog("💾 Guardando en servidor (modo prueba)...")
      
      // Guardar en servidor usando API de prueba
      const response = await fetch("/api/notifications/subscribe-test", {
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

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error guardando suscripción")
      }

      setSubscription(newSubscription)
      addLog("✅ Suscripción guardada en servidor (modo prueba)")
    } catch (error) {
      addLog(`❌ Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testNotification = async () => {
    try {
      addLog("🧪 Enviando notificación de prueba...")
      
      const response = await fetch("/api/notifications/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "🧪 Notificación de Prueba",
          body: "Esta es una notificación de prueba desde el servidor",
          data: { url: "/dashboard" }
        })
      })

      const result = await response.json()
      addLog(`📊 Resultado: ${JSON.stringify(result, null, 2)}`)
    } catch (error) {
      addLog(`❌ Error: ${error.message}`)
    }
  }

  const getStatusIcon = (condition: boolean) => {
    return condition ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">🧪 Prueba de Notificaciones</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Estado del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Soporte del navegador</span>
              {getStatusIcon(isSupported)}
            </div>
            <div className="flex items-center justify-between">
              <span>Permisos concedidos</span>
              <Badge variant={permission === "granted" ? "default" : "secondary"}>
                {permission}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>VAPID key configurada</span>
              {getStatusIcon(!!vapidKey)}
            </div>
            <div className="flex items-center justify-between">
              <span>Suscripción activa</span>
              {getStatusIcon(!!subscription)}
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={requestPermission} 
              disabled={!isSupported || isLoading}
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              Solicitar Permisos
            </Button>
            
            <Button 
              onClick={createSubscription} 
              disabled={permission !== "granted" || !vapidKey || isLoading}
              className="w-full"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Crear Suscripción (Prueba)
            </Button>
            
            <Button 
              onClick={testNotification} 
              disabled={!subscription || isLoading}
              className="w-full"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Enviar Notificación de Prueba
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <span className="text-muted-foreground">No hay logs aún...</span>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
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