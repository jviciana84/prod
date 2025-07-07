import type { Metadata } from "next"
import AdminNotificationPanel from "@/components/notifications/admin-notification-panel"

export const metadata: Metadata = {
  title: "Administración de Notificaciones",
  description: "Panel de administración para gestionar notificaciones del sistema",
}

export default function AdminNotificationsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Administración de Notificaciones</h1>
          <p className="text-muted-foreground">Gestiona los tipos de notificaciones y envía notificaciones de prueba</p>
        </div>

        <AdminNotificationPanel />
      </div>
    </div>
  )
}
