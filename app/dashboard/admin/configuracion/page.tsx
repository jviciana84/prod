import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { getUserRoles } from "@/lib/auth/permissions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import LocationsManager from "@/components/settings/locations-manager"
import ExpenseTypesManager from "@/components/settings/expense-types-manager"
import VehiclesDatabaseManager from "@/components/settings/vehicles-database-manager"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

export default async function SettingsPage() {
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

  // Obtener sedes
  const { data: locations } = await supabase.from("locations").select("*").order("name")

  // Obtener tipos de gastos
  const { data: expenseTypes } = await supabase.from("expense_types").select("*").order("name")

  return (
    <div className="container py-6 space-y-6">
      <Breadcrumbs />
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h1>
        <p className="text-muted-foreground">Administra la configuración global de la aplicación.</p>
      </div>

      <Tabs defaultValue="locations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="locations">Sedes</TabsTrigger>
          <TabsTrigger value="expense-types">Tipos de Gastos</TabsTrigger>
          <TabsTrigger value="vehicles-database">Base de Datos Vehículos</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Sedes</CardTitle>
              <CardDescription>Administra las sedes disponibles para el transporte de vehículos</CardDescription>
            </CardHeader>
            <CardContent>
              <LocationsManager initialLocations={locations || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expense-types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Cargos de Gastos</CardTitle>
              <CardDescription>Administra los tipos de cargos de gastos disponibles para el transporte</CardDescription>
            </CardHeader>
            <CardContent>
              <ExpenseTypesManager initialExpenseTypes={expenseTypes || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles-database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Base de Datos de Vehículos</CardTitle>
              <CardDescription>Gestiona la información de vehículos para autocompletar datos</CardDescription>
            </CardHeader>
            <CardContent>
              <VehiclesDatabaseManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>Ajustes generales del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Esta sección está en desarrollo. Próximamente podrás configurar parámetros generales del sistema.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
