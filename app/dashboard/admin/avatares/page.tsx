import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import AvatarManagement from "@/components/admin/avatar-management"

export const metadata = {
  title: "Gestión de Avatares | CVO",
  description: "Administración de avatares predefinidos del sistema",
}

export default async function AvatarManagementPage() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    },
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  // Verificar si el usuario es administrador usando la función RPC
  const { data: isAdmin, error } = await supabase.rpc("user_has_role", {
    user_id_param: session.user.id,
    role_name_param: "admin",
  })

  if (error || !isAdmin) {
    console.error("Error verificando rol de administrador:", error)
    redirect("/dashboard")
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gestión de Avatares</h1>
        <p className="text-muted-foreground">Administra los avatares predefinidos disponibles en el sistema</p>
      </div>

      <AvatarManagement />
    </div>
  )
}
