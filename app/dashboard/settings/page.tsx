import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { CompactSearchWithModal } from "@/components/dashboard/compact-search-with-modal"
import { FavoritesSettings } from "@/components/settings/favorites-settings"
import UserNotificationSettings from "@/components/notifications/user-notification-settings" // Asegúrate que la ruta sea correcta
import { Settings } from "lucide-react"

export default async function UserSettingsPage() {
  const supabase = await createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/") // Redirige si no hay sesión
  }

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Breadcrumbs className="mt-4" />
          <CompactSearchWithModal className="mt-4" />
        </div>
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
            <p className="text-muted-foreground">Ajustes y preferencias del sistema</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <FavoritesSettings />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notificaciones</CardTitle>
          <CardDescription>Gestiona tus preferencias de notificación.</CardDescription>
        </CardHeader>
        <CardContent>
          <UserNotificationSettings />
        </CardContent>
      </Card>
    </div>
  )
}
