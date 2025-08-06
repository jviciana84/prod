"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function TestNotificationAPIPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-notification-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "🧪 Prueba de diagnóstico",
          body: "Esta es una prueba del sistema de notificaciones",
          data: { url: "/dashboard", source: "test" }
        })
      })

      const result = await response.json()
      setResult({ status: response.status, data: result })

      if (response.ok) {
        toast.success("API funcionando correctamente")
      } else {
        toast.error(`Error: ${result.error}`)
      }
    } catch (error) {
      setResult({ error: error.message })
      toast.error(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">🧪 Prueba de API de Notificaciones</h1>

      <Card>
        <CardHeader>
          <CardTitle>Prueba del API</CardTitle>
          <CardDescription>
            Prueba el API de notificaciones para diagnosticar problemas de autenticación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={testAPI} disabled={loading}>
            {loading ? "Probando..." : "Probar API"}
          </Button>

          {result && (
            <div className="mt-4 p-4 border rounded bg-gray-50">
              <h3 className="font-medium mb-2">Resultado:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 