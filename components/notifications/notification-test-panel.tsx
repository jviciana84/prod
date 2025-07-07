"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { Bell, Send, TestTube, CheckCircle, XCircle, Loader2, Database, RefreshCw } from "lucide-react"
import { toast } from "sonner"

export default function NotificationTestPanel() {
  const { isSupported, isSubscribed, isLoading, permission, subscribe, unsubscribe, refreshState } =
    usePushNotifications()
  const [testTitle, setTestTitle] = useState("🧪 Notificación de Prueba")
  const [testBody, setTestBody] = useState("Esta es una notificación de prueba desde el servidor")
  const [isSending, setIsSending] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)
  const [dbStatus, setDbStatus] = useState<any>(null)

  const handleSubscribe = async () => {
    try {
      await subscribe()
      toast.success("¡Notificaciones activadas correctamente!")
      // Verificar inmediatamente en la base de datos
      setTimeout(checkDatabaseStatus, 1000)
    } catch (error) {
      toast.error(`Error activando notificaciones: ${error.message}`)
    }
  }

  const handleUnsubscribe = async () => {
    try {
      await unsubscribe()
      toast.success("Notificaciones desactivadas")
      setDbStatus(null)
    } catch (error) {
      toast.error(`Error desactivando notificaciones: ${error.message}`)
    }
  }

  const checkDatabaseStatus = async () => {
    setIsChecking(true)
    try {
      const response = await fetch("/api/notifications/check-subscription", {
        method: "GET",
      })

      const result = await response.json()
      setDbStatus(result)

      if (result.subscriptions > 0) {
        toast.success(`✅ ${result.subscriptions} suscripción(es) encontrada(s) en la base de datos`)
      } else {
        toast.warning("⚠️ No se encontraron suscripciones en la base de datos")
      }
    } catch (error) {
      toast.error(`Error verificando base de datos: ${error.message}`)
      setDbStatus({ error: error.message })
    } finally {
      setIsChecking(false)
    }
  }

  const sendTestNotification = async () => {
    if (!isSubscribed) {
      toast.error("Primero debes activar las notificaciones")
      return
    }

    setIsSending(true)
    try {
      console.log("🚀 Enviando notificación de prueba...")

      const response = await fetch("/api/notifications/send-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: testTitle,
          body: testBody,
        }),
      })

      const result = await response.json()
      setLastResult(result)

      console.log("📋 Resultado:", result)

      if (response.ok) {
        toast.success(`✅ ${result.message}`)
        console.log("✅ Notificación enviada exitosamente")
      } else {
        toast.error(`❌ Error: ${result.error}`)
        console.error("❌ Error del servidor:", result)
      }
    } catch (error) {
      console.error("❌ Error enviando notificación:", error)
      toast.error(`Error de conexión: ${error.message}`)
      setLastResult({ error: error.message })
    } finally {
      setIsSending(false)
    }
  }

  const testLocalNotification = () => {
    if (permission !== "granted") {
      toast.error("Permisos no concedidos")
      return
    }

    console.log("🧪 Creando notificación local...")

    const notification = new Notification("🎯 Notificación Local", {
      body: "Esta notificación se creó localmente en tu navegador",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "local-test",
      requireInteraction: true,
      silent: false,
      vibrate: [200, 100, 200],
    })

    notification.onshow = () => {
      console.log("✅ Notificación local mostrada")
      toast.success("Notificación local mostrada")
    }

    notification.onerror = (error) => {
      console.error("❌ Error en notificación local:", error)
      toast.error("Error en notificación local")
    }

    notification.onclick = () => {
      console.log("👆 Notificación local clickeada")
      notification.close()
    }

    setTimeout(() => notification.close(), 5000)
  }

  const getStatusBadge = () => {
    if (!isSupported) return <Badge variant="destructive">No Soportado</Badge>
    if (isLoading) return <Badge variant="secondary">Cargando...</Badge>
    if (permission !== "granted") return <Badge variant="destructive">Sin Permisos</Badge>
    if (isSubscribed)
      return (
        <Badge variant="default" className="bg-green-600">
          ✅ Activo
        </Badge>
      )
    return <Badge variant="secondary">Inactivo</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Estado de las Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Estado de las Notificaciones
          </CardTitle>
          <CardDescription>Configuración actual del sistema de notificaciones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Estado:</span>
            {getStatusBadge()}
          </div>

          <div className="flex items-center justify-between">
            <span>Permisos:</span>
            <Badge variant={permission === "granted" ? "default" : "destructive"}>{permission}</Badge>
          </div>

          <div className="flex gap-2">
            {!isSubscribed ? (
              <Button onClick={handleSubscribe} disabled={isLoading || !isSupported}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bell className="h-4 w-4 mr-2" />}
                Activar Notificaciones
              </Button>
            ) : (
              <Button onClick={handleUnsubscribe} variant="outline" disabled={isLoading}>
                Desactivar Notificaciones
              </Button>
            )}

            <Button onClick={refreshState} variant="outline" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Verificación de Base de Datos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Estado en Base de Datos
          </CardTitle>
          <CardDescription>Verificar que la suscripción se guardó correctamente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={checkDatabaseStatus} disabled={isChecking}>
            {isChecking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
            Verificar Base de Datos
          </Button>

          {dbStatus && (
            <Alert>
              <AlertDescription>
                <pre className="text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(dbStatus, null, 2)}</pre>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Panel de Pruebas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Pruebas de Notificaciones
          </CardTitle>
          <CardDescription>Envía notificaciones de prueba para verificar el funcionamiento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                placeholder="Título de la notificación"
              />
            </div>

            <div>
              <Label htmlFor="body">Mensaje</Label>
              <Textarea
                id="body"
                value={testBody}
                onChange={(e) => setTestBody(e.target.value)}
                placeholder="Contenido de la notificación"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={sendTestNotification} disabled={!isSubscribed || isSending}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar desde Servidor
            </Button>

            <Button onClick={testLocalNotification} variant="outline" disabled={permission !== "granted"}>
              <TestTube className="h-4 w-4 mr-2" />
              Prueba Local
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {lastResult.error ? (
                <XCircle className="h-5 w-5 text-red-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              Último Resultado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto whitespace-pre-wrap">
              {JSON.stringify(lastResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
