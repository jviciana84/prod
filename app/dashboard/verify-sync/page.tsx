import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { getUserRoles } from "@/lib/auth/permissions"
import { Database, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react"
import VerifySyncClient from "./verify-sync-client"

export default async function VerifySyncPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // No modificar cookies aquí
        },
        remove(name: string, options: any) {
          // No modificar cookies aquí
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const userRoles = await getUserRoles(user.id)
  const hasAdminAccess = userRoles.includes("admin") || userRoles.includes("super_admin")

  if (!hasAdminAccess) {
    redirect("/dashboard")
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Verificar Sincronización</h1>
          <p className="text-muted-foreground">
            Verifica y ejecuta las funciones de sincronización entre fotos y ventas
          </p>
        </div>
        <Database className="h-8 w-8 text-blue-600" />
      </div>

      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Verificar Sincronización", href: "/dashboard/verify-sync" },
        ]}
      />

      <VerifySyncClient />
    </div>
  )
} 