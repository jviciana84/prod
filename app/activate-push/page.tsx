"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { usePushNotifications } from "@/hooks/use-push-notifications"

export default function ActivatePushPage() {
  const [isActivating, setIsActivating] = useState(false)
  const [status, setStatus] = useState<string>("")
  const { subscribe, unsubscribe, isSupported, permission } = usePushNotifications()

  const activatePushNotifications = async () => {
    setIsActivating(true)
    setStatus("Activando push notifications...")
    
    try {
      await subscribe()
      setStatus("✅ Push notifications activadas correctamente")
      toast.success("Push notifications activadas")
    } catch (error) {
      console.error("Error:", error)
      setStatus(`❌ Error: ${error}`)
      toast.error("Error activando push notifications")
    } finally {
      setIsActivating(false)
    }
  }

  const deactivatePushNotifications = async () => {
    setIsActivating(true)
    setStatus("Desactivando push notifications...")
    
    try {
      await unsubscribe()
      setStatus("✅ Push notifications desactivadas")
      toast.success("Push notifications desactivadas")
    } catch (error) {
      console.error("Error:", error)
      setStatus(`❌ Error: ${error}`)
      toast.error("Error desactivando push notifications")
    } finally {
      setIsActivating(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">Activar Push Notifications</h1>
        <Badge variant="secondary">Configuración</Badge>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Soporte:</strong> {isSupported ? "✅ Sí" : "❌ No"}
              </div>
              <div>
                <strong>Permisos:</strong> {permission || "No solicitado"}
              </div>
            </div>
            
            {status && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">{status}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={activatePushNotifications} 
                disabled={isActivating || !isSupported}
                variant="default"
              >
                {isActivating ? "Activando..." : "Activar Push Notifications"}
              </Button>
              
              <Button 
                onClick={deactivatePushNotifications}
                disabled={isActivating}
                variant="outline"
              >
                Desactivar Push Notifications
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>• Las push notifications aparecerán como notificaciones del navegador</p>
              <p>• Debes dar permiso cuando el navegador lo solicite</p>
              <p>• Funciona mejor en Chrome/Edge</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 