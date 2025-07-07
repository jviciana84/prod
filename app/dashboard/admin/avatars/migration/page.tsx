import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import AvatarMigrationTool from "@/components/admin/avatar-migration-tool"

export const metadata = {
  title: "Migración de Avatares - CVO Admin",
  description: "Herramienta para migrar avatares a Vercel Blob",
}

export default async function AvatarMigrationPage() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  // Verificar si el usuario está autenticado
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

  if (!isAdmin) {
    redirect("/dashboard")
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Migración de Avatares a Vercel Blob</h1>
      <p className="text-gray-500 mb-8">
        Esta herramienta te permite migrar los avatares existentes a Vercel Blob para garantizar su persistencia entre
        despliegues.
      </p>

      <AvatarMigrationTool />
    </div>
  )
}
