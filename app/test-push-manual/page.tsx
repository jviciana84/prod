"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function TestPushManual() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)

  const forceProcessPush = async () => {
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
      toast.error("Error procesando push")
    } finally {
      setIsProcessing(false)
    }
  }

  const checkPending = async () => {
    try {
      const response = await fetch("/api/notifications/check-pending", {
        method: "GET"
      })

      const data = await response.json()
      setResult(data)
      toast.info(`Encontradas ${data.count} notificaciones pendientes`)
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error verificando")
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">Test Push Manual</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Forzar Procesamiento de Push</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={checkPending}
              variant="outline"
            >
              Verificar Pendientes
            </Button>
            
            <Button 
              onClick={forceProcessPush} 
              disabled={isProcessing}
              variant="default"
            >
              {isProcessing ? "Procesando..." : "Forzar Procesamiento"}
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