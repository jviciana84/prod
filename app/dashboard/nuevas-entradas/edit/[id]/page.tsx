import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import TransportForm from "@/components/transport/transport-form"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

interface EditTransportPageProps {
  params: {
    id: string
  }
}

export default async function EditTransportPage({ params }: EditTransportPageProps) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  // Usar el ID directamente como string sin convertirlo a número
  const id = params.id
  console.log("ID recibido:", id, "Tipo:", typeof id)

  try {
    // Obtener datos del transporte
    const { data: transport, error } = await supabase.from("nuevas_entradas").select("*").eq("id", id).single()

    if (error) {
      console.error("Error al obtener datos del transporte:", error.message)
      redirect("/dashboard/nuevas-entradas")
    }

    if (!transport) {
      console.error("No se encontró el transporte con ID:", id)
      redirect("/dashboard/nuevas-entradas")
    }

    // Obtener sedes para el formulario
    const { data: locations } = await supabase.from("locations").select("*").order("name")

    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <h1 className="text-3xl font-bold tracking-tight">Editar Nueva Entrada</h1>

        <Card>
          <CardHeader>
            <CardTitle>Modificar Nueva Entrada de Vehículo</CardTitle>
            <CardDescription>Actualiza los datos de la nueva entrada del vehículo</CardDescription>
          </CardHeader>
          <CardContent>
            <TransportForm transport={transport} locations={locations || []} />
          </CardContent>
        </Card>
      </div>
    )
  } catch (err) {
    console.error("Error inesperado:", err)
    redirect("/dashboard/nuevas-entradas")
  }
}
