"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCircle, XCircle, AlertTriangle, Monitor, Settings, Volume2 } from "lucide-react"

export default function NotificationDiagnostic() {
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)

  const runCompleteDiagnostic = async () => {
    setIsRunning(true)
    const results: any = {
      timestamp: new Date().toISOString(),
      browser: {},
      system: {},
      permissions: {},
      serviceWorker: {},
      tests: {},
    }

    try {
      // 1. Información del navegador
      results.browser = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        vendor: navigator.vendor,
        browserName: getBrowserName(),
        isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      }

      // 2. Soporte de APIs
      results.system = {
        serviceWorkerSupport: "serviceWorker" in navigator,
        pushManagerSupport: "PushManager" in window,
        notificationSupport: "Notification" in window,
        vapidSupport: "applicationServerKey" in PushSubscription.prototype,
        promiseSupport: typeof Promise !== "undefined",
      }

      // 3. Permisos
      results.permissions = {
        notification: Notification.permission,
        canRequestPermission: typeof Notification.requestPermission === "function",
      }

      // 4. Service Worker
      if ("serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration()
          if (registration) {
            results.serviceWorker = {
              registered: true,
              active: !!registration.active,
              scope: registration.scope,
              updateViaCache: registration.updateViaCache,
              hasSubscription: !!(await registration.pushManager.getSubscription()),
            }
          } else {
            results.serviceWorker = { registered: false }
          }
        } catch (error) {
          results.serviceWorker = { error: error.message }
        }
      }

      // 5. Configuración del sistema
      results.system.focus = {
        hasFocus: document.hasFocus(),
        visibilityState: document.visibilityState,
        hidden: document.hidden,
      }

      // 6. Pruebas específicas
      results.tests = await runNotificationTests()
    } catch (error) {
      results.error = error.message
    }

    setDiagnosticResults(results)
    setIsRunning(false)
  }

  const runNotificationTests = async () => {
    const tests: any = {}

    // Test 1: Notificación simple
    if (Notification.permission === "granted") {
      try {
        const notification = new Notification("🧪 Test de Diagnóstico", {
          body: "Si ves esto, las notificaciones básicas funcionan",
          icon: "/favicon.ico",
          tag: "diagnostic-test",
          requireInteraction: false,
          silent: false,
        })

        tests.basicNotification = {
          success: true,
          message: "Notificación básica creada",
        }

        // Cerrar después de 3 segundos
        setTimeout(() => notification.close(), 3000)
      } catch (error) {
        tests.basicNotification = {
          success: false,
          error: error.message,
        }
      }
    }

    // Test 2: Verificar configuración del navegador
    tests.browserConfig = await checkBrowserNotificationSettings()

    return tests
  }

  const checkBrowserNotificationSettings = async () => {
    const config: any = {}

    // Verificar si las notificaciones están habilitadas a nivel del navegador
    if ("permissions" in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: "notifications" as any })
        config.permissionAPI = {
          state: permission.state,
          supported: true,
        }
      } catch (error) {
        config.permissionAPI = {
          supported: false,
          error: error.message,
        }
      }
    }

    return config
  }

  const getBrowserName = () => {
    const userAgent = navigator.userAgent
    if (userAgent.includes("Chrome")) return "Chrome"
    if (userAgent.includes("Firefox")) return "Firefox"
    if (userAgent.includes("Safari")) return "Safari"
    if (userAgent.includes("Edge")) return "Edge"
    return "Unknown"
  }

  const getStatusIcon = (condition: boolean) => {
    return condition ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />
  }

  const getRecommendations = () => {
    if (!diagnosticResults) return []

    const recommendations = []
    const { browser, system, permissions } = diagnosticResults

    if (browser.browserName === "Edge") {
      recommendations.push({
        type: "warning",
        title: "Microsoft Edge",
        message:
          "Edge puede tener configuraciones específicas de notificaciones. Verifica en Configuración > Cookies y permisos del sitio > Notificaciones.",
      })
    }

    if (browser.isMobile) {
      recommendations.push({
        type: "info",
        title: "Dispositivo Móvil",
        message:
          "En móviles, las notificaciones pueden estar bloqueadas por el sistema operativo o el modo de ahorro de batería.",
      })
    }

    if (permissions.notification !== "granted") {
      recommendations.push({
        type: "error",
        title: "Permisos Denegados",
        message: "Los permisos de notificación no están concedidos. Esto es necesario para recibir notificaciones.",
      })
    }

    if (!system.focus.hasFocus) {
      recommendations.push({
        type: "warning",
        title: "Pestaña en Segundo Plano",
        message: "La pestaña no tiene foco. Algunas notificaciones solo aparecen cuando la pestaña está activa.",
      })
    }

    return recommendations
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Diagnóstico Completo de Notificaciones
          </CardTitle>
          <CardDescription>Análisis detallado del sistema de notificaciones para identificar problemas</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runCompleteDiagnostic} disabled={isRunning} className="w-full">
            {isRunning ? "Ejecutando Diagnóstico..." : "Ejecutar Diagnóstico Completo"}
          </Button>
        </CardContent>
      </Card>

      {diagnosticResults && (
        <>
          {/* Resumen */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Navegador:</span>
                <Badge variant="outline">
                  {diagnosticResults.browser.browserName}
                  {diagnosticResults.browser.isMobile && " (Móvil)"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span>Soporte de Notificaciones:</span>
                {getStatusIcon(diagnosticResults.system.notificationSupport)}
              </div>

              <div className="flex items-center justify-between">
                <span>Service Worker:</span>
                {getStatusIcon(diagnosticResults.serviceWorker.registered)}
              </div>

              <div className="flex items-center justify-between">
                <span>Permisos:</span>
                <Badge variant={diagnosticResults.permissions.notification === "granted" ? "default" : "destructive"}>
                  {diagnosticResults.permissions.notification}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span>Pestaña Activa:</span>
                {getStatusIcon(diagnosticResults.system.focus.hasFocus)}
              </div>
            </CardContent>
          </Card>

          {/* Recomendaciones */}
          {getRecommendations().length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Recomendaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {getRecommendations().map((rec, index) => (
                  <Alert
                    key={index}
                    className={
                      rec.type === "error"
                        ? "border-red-200 bg-red-50"
                        : rec.type === "warning"
                          ? "border-yellow-200 bg-yellow-50"
                          : "border-blue-200 bg-blue-50"
                    }
                  >
                    <AlertDescription>
                      <strong>{rec.title}:</strong> {rec.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Detalles Técnicos */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles Técnicos</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto whitespace-pre-wrap max-h-96">
                {JSON.stringify(diagnosticResults, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* Instrucciones Específicas por Navegador */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración del Navegador
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {diagnosticResults.browser.browserName === "Edge" && (
                <Alert>
                  <Monitor className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Microsoft Edge:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Ve a Configuración (⋯ → Configuración)</li>
                      <li>Busca "Cookies y permisos del sitio"</li>
                      <li>Haz clic en "Notificaciones"</li>
                      <li>Asegúrate de que este sitio esté en "Permitir"</li>
                      <li>Verifica que "Preguntar antes de enviar" esté activado</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              )}

              {diagnosticResults.browser.browserName === "Chrome" && (
                <Alert>
                  <Monitor className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Google Chrome:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Haz clic en el candado junto a la URL</li>
                      <li>Asegúrate de que "Notificaciones" esté en "Permitir"</li>
                      <li>O ve a chrome://settings/content/notifications</li>
                      <li>Verifica que este sitio no esté bloqueado</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              )}

              <Alert>
                <Volume2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>Sistema Operativo:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>
                      <strong>Windows:</strong> Configuración → Sistema → Notificaciones y acciones
                    </li>
                    <li>
                      <strong>macOS:</strong> Preferencias del Sistema → Notificaciones
                    </li>
                    <li>Asegúrate de que las notificaciones del navegador estén habilitadas</li>
                    <li>Verifica que no esté activado el "Modo No Molestar"</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
