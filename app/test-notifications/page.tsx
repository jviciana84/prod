"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, BellOff, TestTube } from "lucide-react"
import { toast } from "sonner"

export default function TestNotificationsPage() {
  const [isLoading, setIsLoading] = useState(false)

  const testBellNotification = async () => {
    setIsLoading(true)
    try {
      console.log("🔔 Enviando notificación de campana...")
      
      const response = await fetch("/api/notifications/bell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "🧪 Prueba Notificaciones",
          body: "Esta es una notificación de prueba",
          data: { url: "/dashboard" }
        })
      })

      const data = await response.json()
      console.log("📦 Resultado:", data)
      
      if (response.ok) {
        toast.success("Notificación de campana enviada correctamente")
      } else {
        toast.error("Error enviando notificación")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error de conexión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Test Notifications</h1>
        <p className="text-gray-600">Página de prueba para notificaciones</p>
      </div>

      <div className="grid gap-6">
        {/* Estado del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Estado del Sistema
            </CardTitle>
            <CardDescription>Configuración actual de notificaciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Push Notifications:</span>
              <Badge className="bg-gray-400 text-white">
                <BellOff className="h-3 w-3 mr-1" />
                Anulado
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Campana:</span>
              <Badge className="bg-green-600 text-white">
                <Bell className="h-3 w-3 mr-1" />
                Activa
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Pruebas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Pruebas de Notificación
            </CardTitle>
            <CardDescription>Envía notificaciones de prueba</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testBellNotification}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Enviando..." : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Probar Campana
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
