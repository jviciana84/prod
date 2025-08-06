"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Bell, Bug, TestTube, RefreshCw, CheckCircle, XCircle, Database, Settings } from "lucide-react"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function NotificationsDebugPage() {
  const [isClient, setIsClient] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [vapidKey, setVapidKey] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [user, setUser] = useState<any>(null)

  const { isSupported: hookSupported, isSubscribed, isLoading: pushLoading, permission: hookPermission, subscribe, unsubscribe } = usePushNotifications()
  const supabase = createClientComponentClient()

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    setIsClient(true)
    checkInitialState()
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      addLog(`👤 Usuario: ${user ? user.email : 'No autenticado'}`)
    } catch (error) {
      addLog(`❌ Error cargando usuario: ${error.message}`)
    }
  }

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

  const checkDatabaseStatus = async () => {
    setIsLoading(true)
    addLog("🗄️ Verificando estado de la base de datos...")

    try {
      // Verificar tablas
      const tables = ['notification_types', 'notification_history', 'user_notification_preferences', 'user_push_subscriptions']
      const status: any = {}

      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select('count').limit(1)
          status[table] = {
            exists: !error,
            error: error?.message,
            count: data?.[0]?.count || 0
          }
        } catch (err) {
          status[table] = {
            exists: false,
            error: err.message
          }
        }
      }

      setDbStatus(status)
      addLog("✅ Estado de BD verificado")
    } catch (error) {
      addLog(`❌ Error verificando BD: ${error.message}`)
    } finally {
      setIsLoading(false)
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
      addLog("📝 Creando suscripción...")

      // Registrar service worker
      const registration = await navigator.serviceWorker.register("/sw.js")
      await navigator.serviceWorker.ready

      // Crear suscripción
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      })

      // Guardar en servidor
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

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error guardando suscripción")
      }

      setSubscription(newSubscription)
      addLog("✅ Suscripción creada y guardada")
    } catch (error) {
      addLog(`❌ Error creando suscripción: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testNotification = async () => {
    try {
      addLog("🧪 Enviando notificación de prueba...")
      
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationTypeId: "test",
          title: "🧪 Notificación de Prueba",
          body: "Esta es una notificación de prueba desde el servidor",
          data: { url: "/dashboard" }
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        addLog(`✅ Notificación enviada: ${result.sent} exitosas, ${result.failed} fallidas`)
      } else {
        addLog(`❌ Error enviando notificación: ${result.error}`)
      }
    } catch (error) {
      addLog(`❌ Error: ${error.message}`)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  const getStatusIcon = (condition: boolean) => {
    return condition ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🔧 Diagnóstico de Notificaciones</h1>
        <Button onClick={clearLogs} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Limpiar Logs
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Estado del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Estado del Sistema
            </CardTitle>
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
            <div className="flex items-center justify-between">
              <span>Usuario autenticado</span>
              {getStatusIcon(!!user)}
            </div>
          </CardContent>
        </Card>

        {/* Estado de la Base de Datos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Base de Datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dbStatus ? (
              <div className="space-y-2">
                {Object.entries(dbStatus).map(([table, status]: [string, any]) => (
                  <div key={table} className="flex items-center justify-between">
                    <span className="text-sm">{table}</span>
                    {getStatusIcon(status.exists)}
                  </div>
                ))}
              </div>
            ) : (
              <Button onClick={checkDatabaseStatus} disabled={isLoading}>
                {isLoading ? "Verificando..." : "Verificar BD"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Acciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Acciones de Prueba
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={requestPermission} disabled={!isSupported}>
              Solicitar Permisos
            </Button>
            <Button onClick={createSubscription} disabled={permission !== "granted" || !vapidKey}>
              Crear Suscripción
            </Button>
            <Button onClick={testNotification} disabled={!subscription}>
              Enviar Notificación de Prueba
            </Button>
            <Button onClick={checkDatabaseStatus} disabled={isLoading}>
              Verificar Base de Datos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Logs de Diagnóstico
          </CardTitle>
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
