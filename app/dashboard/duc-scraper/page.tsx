import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { getUserRoles } from "@/lib/auth/permissions"
import { Database, FileSpreadsheet } from "lucide-react"
import DucScraperTable from "@/components/duc-scraper/duc-scraper-table"

export default async function DucScraperPage() {
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

  // Obtener datos de la tabla duc_scraper
  const { data: ducScraperData, error: ducScraperError } = await supabase
    .from("duc_scraper")
    .select("*")
    .order("import_date", { ascending: false })
    .limit(1000) // Limitar a 1000 registros para rendimiento

  if (ducScraperError) {
    console.error("Error al cargar datos de duc_scraper:", ducScraperError)
  }

  // Obtener estadísticas
  const { count: totalRecords } = await supabase
    .from("duc_scraper")
    .select("*", { count: "exact", head: true })

  const { data: latestImport } = await supabase
    .from("duc_scraper")
    .select("import_date, file_name")
    .order("import_date", { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <Breadcrumbs className="mt-4" />
        <div className="flex items-center gap-3">
          <Database className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">DUC Scraper</h1>
            <p className="text-muted-foreground">Datos extraídos directamente del CSV de BMW</p>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-500" />
            <span className="font-medium">Total Registros</span>
          </div>
          <p className="text-2xl font-bold mt-2">{totalRecords || 0}</p>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-green-500" />
            <span className="font-medium">Última Importación</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {latestImport?.import_date 
              ? new Date(latestImport.import_date).toLocaleDateString('es-ES')
              : 'N/A'
            }
          </p>
          {latestImport?.file_name && (
            <p className="text-xs text-muted-foreground">{latestImport.file_name}</p>
          )}
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-orange-500" />
            <span className="font-medium">Registros Mostrados</span>
          </div>
          <p className="text-2xl font-bold mt-2">{ducScraperData?.length || 0}</p>
        </div>
      </div>
      
      <DucScraperTable 
        initialData={ducScraperData || []}
        userRoles={userRoles}
      />
    </div>
  )
} 