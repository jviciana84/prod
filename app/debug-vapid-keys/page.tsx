"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export default function DebugVapidKeys() {
  const [result, setResult] = useState<any>(null)

  const checkVapidKeys = async () => {
    try {
      const response = await fetch("/api/debug-vapid-keys", {
        method: "GET"
      })

      const data = await response.json()
      setResult(data)
      
      if (response.ok) {
        toast.success("VAPID keys verificadas")
      } else {
        toast.error(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error verificando VAPID keys")
    }
  }

  const testPushDirect = async () => {
    try {
      const response = await fetch("/api/notifications/send-test-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userEmail: "jordi.viciana@munichgroup.es" // Cambiar email aquí
        })
      })

      const data = await response.json()
      setResult(data)
      
      if (response.ok) {
        toast.success("Push de prueba enviada")
      } else {
        toast.error(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error enviando push de prueba")
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">Debug VAPID Keys</h1>
        <Badge variant="secondary">Configuración</Badge>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Verificar VAPID Keys</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={checkVapidKeys}
                variant="outline"
              >
                Verificar VAPID Keys
              </Button>
              
              <Button 
                onClick={testPushDirect}
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

        <Card>
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>VAPID Public Key:</strong> {process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? "✅ Configurada" : "❌ No configurada"}</p>
              <p><strong>VAPID Private Key:</strong> {process.env.VAPID_PRIVATE_KEY ? "✅ Configurada" : "❌ No configurada"}</p>
              <p><strong>Service Worker:</strong> /sw.js</p>
              <p><strong>Navegador:</strong> {typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 