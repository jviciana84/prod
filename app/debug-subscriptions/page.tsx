"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function DebugSubscriptions() {
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const checkSubscriptions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/notifications/debug-subscriptions", {
        method: "GET"
      })

      const data = await response.json()
      setResult(data)
      toast.info(`Usuario: ${data.userId}, Suscripciones activas: ${data.activeCount}`)
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error verificando suscripciones")
    } finally {
      setIsLoading(false)
    }
  }

  const testPushDirect = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/notifications/send-test-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "4ece67b0-85a0-4b01-bdb7-f9d5b185e1b4" })
      })

      const data = await response.json()
      setResult(data)
      toast.success("Push de prueba enviada")
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error enviando push de prueba")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">Debug Suscripciones</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verificar Suscripciones Push</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={checkSubscriptions}
              disabled={isLoading}
              variant="outline"
            >
              Verificar Suscripciones
            </Button>
            
            <Button 
              onClick={testPushDirect}
              disabled={isLoading}
              variant="default"
            >
              Enviar Push de Prueba
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