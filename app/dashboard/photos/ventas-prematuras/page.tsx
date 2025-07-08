import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { createServerClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"

async function getPrematureSalesData() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data: prematureSales, error } = await supabase
    .from("sales_vehicles")
    .select(`
      *,
      stock:vehicle_id (
        license_plate,
        brand,
        model,
        photos_status,
        body_status
      )
    `)
    .eq("is_premature_sale", true)
    .order("premature_sale_detected_at", { ascending: false })

  if (error) {
    console.error("Error fetching premature sales:", error)
    return []
  }

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
                  <td className="p-2 font-mono">{sale.stock?.license_plate}</td>
                  <td className="p-2">
                    {sale.stock?.brand} {sale.stock?.model}
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        sale.stock?.photos_status === "Listo"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {sale.stock?.photos_status || "Sin estado"}
                    </span>
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        sale.stock?.body_status === "Listo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {sale.stock?.body_status || "Sin estado"}
                    </span>
                  </td>
                  <td className="p-2 text-sm text-muted-foreground">{sale.premature_sale_reason}</td>
                  <td className="p-2 text-sm text-muted-foreground">
                    {new Date(sale.premature_sale_detected_at).toLocaleDateString("es-ES")}
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
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Ventas Prematuras - Perspectiva Fotografías</h1>
        <p className="text-muted-foreground">Vehículos vendidos antes de completar el proceso de fotografías</p>
      </div>

      <Suspense fallback={<div>Cargando...</div>}>
        <PrematureSalesTable sales={prematureSales} />
      </Suspense>
    </div>
  )
}
