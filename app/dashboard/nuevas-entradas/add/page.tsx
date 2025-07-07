import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import TransportForm from "@/components/transport/transport-form"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

export default async function AddTransportPage() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  // Obtener sedes para el formulario
  const { data: locations } = await supabase.from("locations").select("*").order("name")

  // Cambiar el título y la descripción
  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <h1 className="text-3xl font-bold tracking-tight">Nueva Entrada</h1>

      <Card>
        <CardHeader>
          <CardTitle>Registrar Nueva Entrada de Vehículo</CardTitle>
          <CardDescription>Introduce los datos de la nueva entrada del vehículo</CardDescription>
        </CardHeader>
        <CardContent>
          <TransportForm locations={locations || []} />
        </CardContent>
      </Card>
    </div>
  )
}
