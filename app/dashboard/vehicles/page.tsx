import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabaseClient"
import StockTable from "@/components/vehicles/stock-table"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

export const metadata: Metadata = {
  title: "Inventario de Vehículos | CVO",
  description: "Gestión del inventario de vehículos en stock",
}

async function getStockData() {
  const { data, error } = await supabaseAdmin.from("stock").select("*").order("reception_date", { ascending: false })

  if (error) {
    console.error("Error al cargar datos de stock:", error)
    return []
  }

  return data || []
}

export default async function VehiclesPage() {
  const stockData = await getStockData()

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="flex flex-col space-y-2">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Vehículos", href: "/dashboard/vehicles" },
          ]}
        />
        <h1 className="text-3xl font-bold tracking-tight">Inventario de Vehículos</h1>
        <p className="text-muted-foreground">Gestión y seguimiento del inventario de vehículos en stock</p>
      </div>

      <StockTable initialStock={stockData} />
    </div>
  )
}
