import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { getUserRoles } from "@/lib/auth/permissions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { ValidadosTable } from "@/components/validados/validados-table"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { CompactSearchWithModal } from "@/components/dashboard/compact-search-with-modal"

export default async function ValidadosPage() {
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

  const roles = await getUserRoles()

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Breadcrumbs className="mt-4" />
          <CompactSearchWithModal className="mt-4" />
        </div>
        <div className="flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Validados</h1>
            <p className="text-muted-foreground">Control y seguimiento de vehículos validados</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Pedidos Validados
          </CardTitle>
          <CardDescription>Seguimiento y gestión de pedidos validados</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <ValidadosTable />
        </CardContent>
      </Card>
    </div>
  )
}
