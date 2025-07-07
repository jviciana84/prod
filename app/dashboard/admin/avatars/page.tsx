import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AdminAvatarManager from "@/components/admin/avatar-manager"
import { avatars } from "@/lib/avatars"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminAvatarsPage() {
  const cookieStore = await cookies()
  const supabase = await createServerClient(cookieStore)

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

  // Obtener todos los usuarios con sus roles usando la función RPC
  let users = []
  try {
    const { data, error } = await supabase.rpc("get_users_with_roles")

    if (error) {
      console.error("Error al obtener usuarios:", error)
    } else {
      users = data || []
    }
  } catch (error) {
    console.error("Error al ejecutar RPC:", error)
  }

  return (
    <div className="container mx-auto p-6">
      <Breadcrumbs />
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Avatares</CardTitle>
          <CardDescription>Administra los avatares de los usuarios del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminAvatarManager users={users} avatars={avatars} />
        </CardContent>
      </Card>
    </div>
  )
}
