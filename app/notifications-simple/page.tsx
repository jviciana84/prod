"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NotificationsSimplePage() {
  const [status, setStatus] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function testSimpleSubscription() {
    setIsLoading(true)
    setStatus("Probando...")

    try {
      // Llamar al endpoint simple
      const response = await fetch("/api/notifications/simple-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: "test-endpoint-" + Date.now(),
          p256dh: "test-p256dh",
          auth: "test-auth",
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setStatus(`✅ Éxito: ${JSON.stringify(result)}`)
      } else {
        setStatus(`❌ Error: ${JSON.stringify(result)}`)
      }
    } catch (error) {
      setStatus(`💥 Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Prueba Simple de Notificaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testSimpleSubscription} disabled={isLoading}>
            {isLoading ? "Probando..." : "Probar Inserción Simple"}
          </Button>

          {status && <div className="p-4 border rounded-md whitespace-pre-wrap">{status}</div>}
        </CardContent>
      </Card>
    </div>
  )
}
