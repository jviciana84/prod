import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { FavoritesSettings } from "@/components/settings/favorites-settings"
import UserNotificationSettings from "@/components/notifications/user-notification-settings" // Asegúrate que la ruta sea correcta

export default async function UserSettingsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/") // Redirige si no hay sesión
  }

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <Breadcrumbs />
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Configuración de Usuario</h1>
        <p className="text-muted-foreground">Personaliza tu experiencia en la plataforma.</p>
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
