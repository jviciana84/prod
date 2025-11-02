"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Bell, BellOff, TestTube, CheckCircle, XCircle, Database, RefreshCw } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { toast } from "sonner"

export default function NotificationTestPanel() {
  const [testTitle, setTestTitle] = useState("🧪 Notificación de Prueba")
  const [testBody, setTestBody] = useState("Esta es una notificación de prueba desde el servidor")
  const [isSending, setIsSending] = useState(false)

  const handleSendTest = async () => {
    if (!testTitle || !testBody) {
      toast.error("Título y mensaje son requeridos")
      return
    }

    setIsSending(true)
    try {
      const response = await fetch("/api/notifications/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: testTitle,
          body: testBody,
          data: { url: "/dashboard" }
        })
      })

      if (response.ok) {
        toast.success("Notificación de prueba enviada (solo campana)")
        setTestTitle("🧪 Notificación de Prueba")
        setTestBody("Esta es una notificación de prueba desde el servidor")
      } else {
        toast.error("Error enviando notificación")
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`)
    } finally {
      setIsSending(false)
    }
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
            <Badge className="bg-gray-400 text-white">
              <BellOff className="h-3 w-3 mr-1" />
              Push Anulado
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span>Campana:</span>
            <Badge className="bg-green-600 text-white">
              <CheckCircle className="h-3 w-3 mr-1" />
              Activa
            </Badge>
          </div>

          <Alert>
            <AlertDescription>
              Las notificaciones push están anuladas. Solo la campana está activa.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Panel de Prueba */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Enviar Notificación de Prueba
          </CardTitle>
          <CardDescription>Envía una notificación de prueba usando solo la campana</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-title">Título</Label>
            <Input
              id="test-title"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              placeholder="Título de la notificación"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-body">Mensaje</Label>
            <Textarea
              id="test-body"
              value={testBody}
              onChange={(e) => setTestBody(e.target.value)}
              placeholder="Mensaje de la notificación"
              rows={3}
            />
          </div>

          <Button onClick={handleSendTest} disabled={isSending} className="w-full">
            {isSending ? (
              <>
                <BMWMSpinner size={16} className="mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Enviar Notificación de Prueba
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
