import type { Metadata } from "next"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { CompactSearchWithModal } from "@/components/dashboard/compact-search-with-modal"
import StockStatsDashboard from "@/components/vehicles/stock-stats-dashboard"
import StockStatsCard from "@/components/vehicles/stock-stats-card"

export const metadata: Metadata = {
  title: "Estadísticas de Inventario | CVO",
  description: "Panel de estadísticas del inventario de vehículos",
}

async function getStockData() {
  const supabase = await createServerClient(await cookies())
  
  // Obtener registros de stock para las estadísticas
  const { data: stockData, error: stockError } = await supabase
    .from("stock")
    .select("*")
    .order("reception_date", { ascending: false })

  if (stockError) {
    console.error("Error al cargar datos de stock:", stockError)
    return { stock: [] }
  }

  // Obtener datos del historial para análisis de tendencias
  const { data: historyData, error: historyError } = await supabase
    .from("stock_history")
    .select("*")
    .order("changed_at", { ascending: false })
    .limit(1000) // Limitar para evitar problemas de rendimiento

  if (historyError) {
    console.error("Error al cargar historial:", historyError)
    return { stock: stockData || [], history: [] }
  }

  return {
    stock: stockData || [],
    history: historyData || [],
  }
}

export default async function VehicleStatsPage() {
  const { stock, history } = await getStockData()

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Breadcrumbs
            segments={[
              { title: "Dashboard", href: "/dashboard" },
              { title: "Vehículos", href: "/dashboard/vehicles" },
              { title: "Estadísticas", href: "/dashboard/vehicles/stats" },
            ]}
          />
          <CompactSearchWithModal />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Estadísticas de Inventario</h1>
        <p className="text-muted-foreground">Análisis y métricas del estado actual del inventario de vehículos</p>
      </div>

      {/* Añadir el nuevo componente de estadísticas de prioridad */}
      <StockStatsCard initialStock={stock} />

      <StockStatsDashboard stockData={stock} historyData={history} />
    </div>
  )
}
