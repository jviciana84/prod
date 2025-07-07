"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, BellOff, Settings } from "lucide-react"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { toast } from "sonner"

export default function NotificationStatus() {
  const { isSupported, isSubscribed, permission, requestPermissionAndSubscribe, unsubscribe, isLoading } =
    usePushNotifications()

  if (!isSupported) {
    return null
  }

  const handleToggle = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe()
        toast.success("Notificaciones desactivadas")
      } else {
        await requestPermissionAndSubscribe()
        toast.success("¡Notificaciones activadas!")
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`)
    }
  }

  const getStatusColor = () => {
    if (permission === "granted" && isSubscribed) return "bg-green-600"
    if (permission === "denied") return "bg-red-600"
    return "bg-gray-400"
  }

  const getStatusText = () => {
    if (permission === "granted" && isSubscribed) return "Activas"
    if (permission === "denied") return "Bloqueadas"
    if (permission === "default") return "No configuradas"
    return "Inactivas"
  }

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${getStatusColor()} text-white`}>
        {isSubscribed ? <Bell className="h-3 w-3 mr-1" /> : <BellOff className="h-3 w-3 mr-1" />}
        {getStatusText()}
      </Badge>

      <Button variant="ghost" size="sm" onClick={handleToggle} disabled={isLoading || permission === "denied"}>
        {isLoading ? "..." : isSubscribed ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      </Button>

      {permission === "denied" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if ("chrome" in window) {
              window.open("chrome://settings/content/notifications")
            } else {
              toast.info("Ve a la configuración de tu navegador para activar las notificaciones")
            }
          }}
        >
          <Settings className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
