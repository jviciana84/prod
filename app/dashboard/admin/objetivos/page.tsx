import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { getUserRoles } from "@/lib/auth/permissions"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { ObjetivosSimpleManager } from "@/components/admin/objetivos-simple-manager"

export default async function ObjetivosPage() {
  const cookieStore = await cookies()
  const supabase = await createServerClient(cookieStore)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  const roles = await getUserRoles()

  if (!roles.includes("admin")) {
    redirect("/dashboard")
  }

  return (
    <div className="container py-6 space-y-6">
      <Breadcrumbs />
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Objetivos de Ventas</h1>
        <p className="text-muted-foreground">
          Configura los objetivos por trimestre y semestre para cada concesionario.
        </p>
      </div>

      <ObjetivosSimpleManager />
    </div>
  )
}
