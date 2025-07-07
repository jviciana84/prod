import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AvatarSelector from "@/components/profile/avatar-selector"
import { avatars } from "@/lib/avatars"

export default async function AvatarPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  // Verificar si el usuario es administrador
  const { data: userRoles } = await supabase.rpc("get_user_role_names", {
    user_id_param: session.user.id,
  })

  const isAdmin = userRoles && (userRoles.includes("admin") || userRoles.includes("Administrador"))

  // Si no es administrador, redirigir al dashboard
  if (!isAdmin) {
    redirect("/dashboard")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Avatar</CardTitle>
          <CardDescription>Elige un avatar para tu perfil</CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarSelector userId={session.user.id} currentAvatar={profile?.avatar_url} avatars={avatars} />
        </CardContent>
      </Card>
    </div>
  )
}
