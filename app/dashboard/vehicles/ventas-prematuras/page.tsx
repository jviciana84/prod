import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Car } from "lucide-react"
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
        body_status,
        paint_status,
        created_at
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

function VehiclePrematureSalesTable({ sales }: { sales: any[] }) {
  if (sales.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
          Vehículos con Ventas Prematuras
        </CardTitle>
        <CardDescription>Análisis desde la perspectiva del estado de preparación del vehículo</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Matrícula</th>
                <th className="text-left p-2">Vehículo</th>
                <th className="text-left p-2">Carrocería</th>
                <th className="text-left p-2">Pintura</th>
                <th className="text-left p-2">Fotos</th>
                <th className="text-left p-2">Días en Stock</th>
                <th className="text-left p-2">Problema</th>
                <th className="text-left p-2">Venta Detectada</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => {
                const daysInStock = sale.stock?.created_at
                  ? Math.floor(
                      (new Date().getTime() - new Date(sale.stock.created_at).getTime()) / (1000 * 60 * 60 * 24),
                    )
                  : 0

                return (
                  <tr key={sale.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-mono">{sale.stock?.license_plate}</td>
                    <td className="p-2">
                      {sale.stock?.brand} {sale.stock?.model}
                    </td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          sale.stock?.body_status === "Listo"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {sale.stock?.body_status || "Pendiente"}
                      </span>
                    </td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          sale.stock?.paint_status === "Listo"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {sale.stock?.paint_status || "Pendiente"}
                      </span>
                    </td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          sale.stock?.photos_status === "Listo"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {sale.stock?.photos_status || "Pendiente"}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <span className={`font-semibold ${daysInStock > 30 ? "text-red-600" : "text-gray-600"}`}>
                        {daysInStock}
                      </span>
                    </td>
                    <td className="p-2 text-sm text-red-600">{sale.premature_sale_reason}</td>
                    <td className="p-2 text-sm text-muted-foreground">
                      {new Date(sale.premature_sale_detected_at).toLocaleDateString("es-ES")}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function PrematureSalesVehiclesPage() {
  const prematureSales = await getPrematureSalesData()

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Ventas Prematuras - Perspectiva Vehículos</h1>
        <p className="text-muted-foreground">Análisis de vehículos vendidos antes de completar su preparación</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas Prematuras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{prematureSales.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Por Fotografías Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {prematureSales.filter((s) => s.premature_sale_reason?.includes("Fotos")).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Por Carrocería Pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {prematureSales.filter((s) => s.premature_sale_reason?.includes("Carrocería")).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={<div>Cargando...</div>}>
        <VehiclePrematureSalesTable sales={prematureSales} />
      </Suspense>
    </div>
  )
}
