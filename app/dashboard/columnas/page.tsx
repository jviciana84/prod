import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { getUserRoles } from "@/lib/auth/permissions"
import { Database, FileSpreadsheet, Settings } from "lucide-react"
import ColumnasManager from "@/components/columnas/columnas-manager"

export default async function ColumnasPage() {
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

  // Verificar si el usuario tiene permisos de administrador (solo admin)
  const hasAdminRole = userRoles.some(
    (role) => role.toLowerCase() === "admin"
  )

  if (!hasAdminRole) {
    redirect("/dashboard")
  }

  // Obtener información de las tablas
  const { data: nuevasEntradasColumns, error: nuevasEntradasError } = await supabase
    .rpc('get_table_structure', { table_name: 'nuevas_entradas' })

  const { data: stockColumns, error: stockError } = await supabase
    .rpc('get_table_structure', { table_name: 'stock' })

  if (nuevasEntradasError) {
    console.error("Error al obtener estructura de nuevas_entradas:", nuevasEntradasError)
  }

  if (stockError) {
    console.error("Error al obtener estructura de stock:", stockError)
  }

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <Breadcrumbs className="mt-4" />
        <div className="flex items-center gap-3">
          <Database className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Columnas</h1>
            <p className="text-muted-foreground">Administra las columnas de las tablas nuevas_entradas y stock</p>
          </div>
        </div>
      </div>
      
      <ColumnasManager 
        nuevasEntradasColumns={nuevasEntradasColumns || []}
        stockColumns={stockColumns || []}
        userRoles={userRoles}
      />
    </div>
  )
} 