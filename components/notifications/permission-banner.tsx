"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bell, X, Shield, Smartphone } from "lucide-react"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { toast } from "sonner"

export default function PermissionBanner() {
  const { needsPermission, requestPermissionAndSubscribe, dismissPermissionRequest, isLoading } = usePushNotifications()
  const [isDismissed, setIsDismissed] = useState(false)

  if (!needsPermission || isDismissed) {
    return null
  }

  const handleAllow = async () => {
    try {
      await requestPermissionAndSubscribe()
      toast.success("¡Notificaciones activadas! Ahora recibirás actualizaciones importantes.")
    } catch (error) {
      if (error.message.includes("denegados")) {
        toast.error("Permisos denegados. Puedes activarlos manualmente en la configuración del navegador.")
      } else {
        toast.error(`Error: ${error.message}`)
      }
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    dismissPermissionRequest()
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <Card className="border-blue-200 bg-blue-50 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg text-blue-900">Mantente Informado</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDismiss} className="h-6 w-6 p-0 text-gray-500">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-blue-700">
            Recibe notificaciones importantes sobre tus vehículos y entregas
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 text-sm text-blue-800">
            <Shield className="h-4 w-4 mt-0.5 text-blue-600" />
            <div>
              <div className="font-medium">Notificaciones seguras</div>
              <div className="text-blue-600">Solo recibirás actualizaciones relevantes</div>
            </div>
          </div>

          <div className="flex items-start gap-3 text-sm text-blue-800">
            <Smartphone className="h-4 w-4 mt-0.5 text-blue-600" />
            <div>
              <div className="font-medium">En tiempo real</div>
              <div className="text-blue-600">Mantente al día con cambios importantes</div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleAllow} disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {isLoading ? "Activando..." : "Permitir Notificaciones"}
            </Button>
            <Button variant="outline" onClick={handleDismiss} className="text-gray-600">
              Ahora no
            </Button>
          </div>

          <Alert className="bg-blue-100 border-blue-200">
            <AlertDescription className="text-xs text-blue-700">
              💡 <strong>Tip:</strong> Si no aparece el diálogo de permisos, verifica que no esté bloqueado en la
              configuración de tu navegador.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
