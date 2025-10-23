import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { CompactSearchWithModal } from "@/components/dashboard/compact-search-with-modal"

async function getPrematureSalesData() {
  const supabase = await createServerClient(await cookies())

  // Query simple SIN join
  const { data: prematureSales, error } = await supabase
    .from("sales_vehicles")
    .select("*")
    .order("sale_date", { ascending: false })
    .limit(100)

  if (error) {
    console.error("Error fetching premature sales:", error)
    return []
  }

  // TODO: Filtrar por photos_status cuando el join funcione
  return prematureSales || []
}

function PrematureSalesTable({ sales }: { sales: any[] }) {
  if (sales.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay ventas prematuras detectadas</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Ventas Prematuras Detectadas
        </CardTitle>
        <CardDescription>Vehículos vendidos antes de completar la preparación de fotos o carrocería</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Matrícula</th>
                <th className="text-left p-2">Vehículo</th>
                <th className="text-left p-2">Estado Fotografías</th>
                <th className="text-left p-2">Estado Carrocería</th>
                <th className="text-left p-2">Razón</th>
                <th className="text-left p-2">Detectado</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="border-b hover:bg-muted/50">
                  <td className="p-2 font-mono">{sale.license_plate}</td>
                  <td className="p-2">
                    {sale.brand} {sale.model}
                  </td>
                  <td className="p-2">
                    <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                      N/A
                    </span>
                  </td>
                  <td className="p-2">
                    <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                      N/A
                    </span>
                  </td>
                  <td className="p-2 text-sm text-muted-foreground">Ver en Stock/Fotos</td>
                  <td className="p-2 text-sm text-muted-foreground">
                    {new Date(sale.sale_date).toLocaleDateString("es-ES")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function PrematureSalesPhotosPage() {
  const prematureSales = await getPrematureSalesData()

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Breadcrumbs
            segments={[
              { title: "Dashboard", href: "/dashboard" },
              { title: "Fotos", href: "/dashboard/photos" },
              { title: "Ventas Prematuras", href: "/dashboard/photos/ventas-prematuras" },
            ]}
          />
          <CompactSearchWithModal />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Ventas Prematuras - Perspectiva Fotografías</h1>
        <p className="text-muted-foreground">Vehículos vendidos antes de completar el proceso de fotografías</p>
      </div>

      <Suspense fallback={<div>Cargando...</div>}>
        <PrematureSalesTable sales={prematureSales} />
      </Suspense>
    </div>
  )
}
