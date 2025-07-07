"use client"

import { useState, useEffect } from "react"
import { CheckCircle, XCircle } from "lucide-react"
import NotificationDiagnostic from "@/components/notifications/notification-diagnostic"

export default function NotificationDiagnosticPage() {
  const [diagnostics, setDiagnostics] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    setIsLoading(true)
    const results: any = {}

    // 1. Verificar soporte del navegador
    results.browserSupport = {
      serviceWorker: "serviceWorker" in navigator,
      pushManager: "PushManager" in window,
      notification: "Notification" in window,
    }

    // 2. Verificar permisos
    results.permission = Notification.permission

    // 3. Verificar service worker
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      results.serviceWorker = {
        registered: !!registration,
        active: !!registration?.active,
        scope: registration?.scope,
      }
    } catch (error) {
      results.serviceWorker = {
        registered: false,
        error: error.message,
      }
    }

    // 4. Verificar configuración del sistema
    results.systemConfig = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
    }

    // 5. Verificar configuración de notificaciones del navegador
    if ("Notification" in window) {
      results.notificationSettings = {
        permission: Notification.permission,
        maxActions: Notification.maxActions || "No disponible",
      }
    }

    setDiagnostics(results)
    setIsLoading(false)
  }

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission()
      await runDiagnostics()
      return permission
    } catch (error) {
      console.error("Error solicitando permisos:", error)
    }
  }

  const registerServiceWorker = async () => {
    try {
      await navigator.serviceWorker.register("/sw.js")
      await runDiagnostics()
    } catch (error) {
      console.error("Error registrando service worker:", error)
    }
  }

  const testLocalNotification = () => {
    if (Notification.permission === "granted") {
      new Notification("🧪 Prueba Local", {
        body: "Esta es una notificación de prueba local",
        icon: "/favicon.ico",
        tag: "test-local",
      })
    }
  }

  const testServiceWorkerNotification = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification("🔧 Prueba Service Worker", {
        body: "Esta notificación viene del Service Worker",
        icon: "/favicon.ico",
        tag: "test-sw",
        requireInteraction: true,
      })
    } catch (error) {
      console.error("Error con service worker:", error)
    }
  }

  const openNotificationSettings = () => {
    // Intentar abrir configuración de notificaciones del navegador
    if ("chrome" in window) {
      window.open("chrome://settings/content/notifications")
    } else if ("firefox" in window) {
      window.open("about:preferences#privacy")
    } else {
      alert("Abre manualmente la configuración de notificaciones de tu navegador")
    }
  }

  const StatusIcon = ({ status }: { status: boolean }) => {
    return status ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Ejecutando diagnóstico...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Diagnóstico de Notificaciones</h1>
        <p className="text-muted-foreground">
          Herramienta completa para diagnosticar problemas con las notificaciones push
        </p>
      </div>

      <NotificationDiagnostic
        diagnostics={diagnostics}
        runDiagnostics={runDiagnostics}
        requestPermission={requestPermission}
        registerServiceWorker={registerServiceWorker}
        testLocalNotification={testLocalNotification}
        testServiceWorkerNotification={testServiceWorkerNotification}
        openNotificationSettings={openNotificationSettings}
        StatusIcon={StatusIcon}
      />
    </div>
  )
}
