import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { getUserRoles } from "@/lib/auth/permissions"
import { Car } from "lucide-react"
import ReservedVehiclesSync from "@/components/duc-scraper/reserved-vehicles-sync"

export default async function ReservedSyncPage() {
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

  // Obtener roles del usuario
  const userRoles = await getUserRoles()

  // Verificar si el usuario tiene permisos (admin o manager)
  const hasPermission = userRoles.some(
    (role) => 
      role.toLowerCase() === "admin" || 
      role.toLowerCase() === "manager" ||
      role.toLowerCase() === "supervisor"
  )

  if (!hasPermission) {
    redirect("/dashboard")
  }

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <Breadcrumbs className="mt-4" />
        <div className="flex items-center gap-3">
          <Car className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sincronización de Vehículos Reservados</h1>
            <p className="text-muted-foreground">
              Gestionar vehículos que aparecen como "Reservado" en el CSV del scraper
            </p>
          </div>
        </div>
      </div>

      {/* Información sobre el proceso */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          ¿Cómo funciona la sincronización?
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Los vehículos con "Disponibilidad = Reservado" en el CSV se consideran vendidos</li>
          <li>• Se crean automáticamente registros en <code>sales_vehicles</code></li>
          <li>• Los vehículos aparecen en la pestaña "Vendido" de Stock</li>
          <li>• La sincronización puede ejecutarse manualmente o automáticamente</li>
        </ul>
      </div>

      {/* Componente de sincronización */}
      <ReservedVehiclesSync />
    </div>
  )
} 