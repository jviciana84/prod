import type { Metadata } from "next"
import UserNotificationSettings from "@/components/notifications/user-notification-settings"

export const metadata: Metadata = {
  title: "Configuración de Notificaciones",
  description: "Configura tus preferencias de notificaciones",
}

export default function NotificationSettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configuración de Notificaciones</h1>
          <p className="text-muted-foreground">Personaliza qué notificaciones quieres recibir y cómo recibirlas</p>
        </div>

        <UserNotificationSettings />
      </div>
    </div>
  )
}
