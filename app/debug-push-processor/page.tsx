"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export default function DebugPushProcessor() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testPushProcessor = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch("/api/notifications/process-pending-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      const data = await response.json()
      setResult(data)

      if (response.ok) {
        toast.success(`Procesadas ${data.processed} notificaciones, ${data.pushSent} push enviadas`)
      } else {
        toast.error(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error procesando push notifications")
    } finally {
      setIsProcessing(false)
    }
  }

  const checkPendingNotifications = async () => {
    try {
      const response = await fetch("/api/notifications/check-pending", {
        method: "GET"
      })

      const data = await response.json()
      setResult(data)
      toast.info(`Encontradas ${data.count} notificaciones pendientes`)
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error verificando notificaciones")
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">Debug Push Processor</h1>
        <Badge variant="secondary">Sistema de Push</Badge>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Procesador de Push Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={testPushProcessor} 
                disabled={isProcessing}
                variant="default"
              >
                {isProcessing ? "Procesando..." : "Procesar Push Pendientes"}
              </Button>
              
              <Button 
                onClick={checkPendingNotifications}
                variant="outline"
              >
                Verificar Pendientes
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

        <Card>
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Procesador automático:</strong> Cada 30 segundos</p>
              <p><strong>API endpoint:</strong> /api/notifications/process-pending-push</p>
              <p><strong>Campo de búsqueda:</strong> data->needsPushNotification = true</p>
              <p><strong>Límite por ejecución:</strong> 10 notificaciones</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 