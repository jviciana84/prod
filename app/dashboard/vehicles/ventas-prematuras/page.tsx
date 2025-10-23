import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Car } from "lucide-react"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { CompactSearchWithModal } from "@/components/dashboard/compact-search-with-modal"

async function getPrematureSalesData() {
  const supabase = await createServerClient(await cookies())

  // Query simple SIN join (para evitar errores de FK)
  const { data: prematureSales, error } = await supabase
    .from("sales_vehicles")
    .select("*")
    .order("sale_date", { ascending: false })
    .limit(100)

  if (error) {
    console.error("Error fetching premature sales:", error)
    return []
  }

  // TODO: Agregar join con stock cuando la relación FK esté correcta
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
                    <td className="p-2">
                      <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                        N/A
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <span className="font-semibold text-gray-600">-</span>
                    </td>
                    <td className="p-2 text-sm text-gray-500">
                      Ver en Stock
                    </td>
                    <td className="p-2 text-sm text-muted-foreground">
                      {new Date(sale.sale_date).toLocaleDateString("es-ES")}
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
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Breadcrumbs
            segments={[
              { title: "Dashboard", href: "/dashboard" },
              { title: "Vehículos", href: "/dashboard/vehicles" },
              { title: "Ventas Prematuras", href: "/dashboard/vehicles/ventas-prematuras" },
            ]}
          />
          <CompactSearchWithModal />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Ventas Prematuras - Perspectiva Vehículos</h1>
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
            <CardTitle className="text-sm font-medium">Ventas Este Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {prematureSales.filter((s) => {
                const saleDate = new Date(s.sale_date)
                const now = new Date()
                return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear()
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Última Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {prematureSales.filter((s) => {
                const saleDate = new Date(s.sale_date)
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return saleDate >= weekAgo
              }).length}
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
