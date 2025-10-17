import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createServerComponentClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { IncidenciaHistorialComponent } from "@/components/entregas/incidencia-historial"
import { PackageOpen, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { VehicleActionButtons } from "@/components/vehicles/vehicle-action-buttons"

interface EntregaDetallePageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: EntregaDetallePageProps): Promise<Metadata> {
  return {
    title: `Detalle de Entrega ${params.id} | Dashboard`,
    description: "Información detallada de la entrega y su historial de incidencias",
  }
}

export default async function EntregaDetallePage({ params }: EntregaDetallePageProps) {
  const supabase = await createServerComponentClient()

  // Obtener datos de la entrega
  const { data: entrega, error } = await supabase.from("entregas").select("*").eq("id", params.id).single()

  if (error || !entrega) {
    notFound()
  }

  // Obtener datos del stock relacionado
  let stockData: { id: string; vendedor_id: string | null; estado: string | null } | null = null
  if (entrega.stock_id) {
    const { data: sData, error: stockFetchError } = await supabase
      .from("stock")
      .select("id, vendedor_id, estado")
      .eq("id", entrega.stock_id)
      .single()

    if (stockFetchError) {
      console.error(`Error fetching stock data for stock_id ${entrega.stock_id}:`, stockFetchError.message)
      // Potentially handle this error more gracefully, e.g., by setting a flag
    } else {
      stockData = sData
    }
  } else {
    console.warn(`Entrega ${entrega.id} does not have a stock_id.`)
  }

  // Obtener la sesión del usuario actual
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const currentUserId = session?.user?.id

  // Obtener el rol del usuario actual
  let userRole = "user"
  if (currentUserId) {
    const { data: userData } = await supabase.from("users").select("role").eq("id", currentUserId).single()

    if (userData) {
      userRole = userData.role
    }
  }

  // Determinar si el usuario puede editar este vehículo
  const canEdit =
    userRole === "admin" ||
    userRole === "supervisor" ||
    (userRole === "vendedor" && stockData?.vendedor_id === currentUserId)

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "No establecida"
    try {
      if (typeof dateString !== "string") {
        console.warn(`Invalid date string encountered (not a string): ${dateString}`)
        return "Fecha inválida (no es una cadena)"
      }

      const date = new Date(dateString)
      // Check if date is valid before formatting
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date string encountered during formatting: ${dateString}`)
        return `Fecha inválida (${dateString})`
      }
      return format(date, "dd MMMM yyyy", { locale: es })
    } catch (e) {
      console.error(`Error formatting date "${dateString}":`, e)
      return "Fecha inválida" // Fallback to a user-friendly message
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4 md:p-8">
      <div className="flex flex-col gap-4">
        <Breadcrumbs
          segments={[
            {
              title: "Dashboard",
              href: "/dashboard",
            },
            {
              title: "Entregas",
              href: "/dashboard/entregas",
            },
            {
              title: `Entrega ${entrega.matricula || params.id}`,
              href: `/dashboard/entregas/${params.id}`,
            },
          ]}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageOpen className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold tracking-tight">Detalle de Entrega: {entrega.matricula || params.id}</h1>
          </div>
          <Link href="/dashboard/entregas" passHref>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Entregas
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Entrega</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Matrícula</h3>
                  <p className="text-lg font-medium">{entrega.matricula || "No disponible"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Modelo</h3>
                  <p className="text-lg font-medium">{entrega.modelo || "No disponible"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Fecha de Venta</h3>
                  <p className="text-lg font-medium">{formatDate(entrega.fecha_venta)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Fecha de Entrega</h3>
                  <p className="text-lg font-medium">{formatDate(entrega.fecha_entrega)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Asesor</h3>
                  <p className="text-lg font-medium">{entrega.asesor || "No asignado"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">OR</h3>
                  <p className="text-lg font-medium">{entrega.or || "No disponible"}</p>
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Observaciones</h3>
                  <p className="text-lg font-medium">{entrega.observaciones || "Sin observaciones"}</p>
                </div>
                <div className="md:col-span-2 mt-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Acciones del Vehículo</h3>
                  {entrega.stock_id && stockData ? (
                    <VehicleActionButtons
                      vehicleId={entrega.stock_id}
                      isDelivered={stockData.estado === "entregado"}
                      onMarkDelivered={() => {
                        // Server Actions or client-side mutations would go here
                        console.log(`Mark delivered for ${entrega.stock_id}`)
                      }}
                      onRegisterIncident={() => {
                        console.log(`Register incident for ${entrega.stock_id}`)
                        // Navigation or modal trigger would go here
                      }}
                      onEdit={() => {
                        console.log(`Edit vehicle ${entrega.stock_id}`)
                        // Navigation or modal trigger would go here
                      }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      {entrega.stock_id
                        ? "No se encontraron datos de stock para este vehículo."
                        : "No hay ID de stock asociado a esta entrega, acciones de vehículo no disponibles."}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Estado de Incidencias</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {entrega.tipos_incidencia && entrega.tipos_incidencia.length > 0 ? (
                      entrega.tipos_incidencia.map((tipo) => (
                        <span
                          key={tipo}
                          className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 px-2 py-1 rounded text-sm"
                        >
                          {tipo}
                        </span>
                      ))
                    ) : (
                      <span className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 px-2 py-1 rounded text-sm">
                        Sin incidencias
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <IncidenciaHistorialComponent entregaId={params.id} />
        </div>
      </div>
    </div>
  )
}
