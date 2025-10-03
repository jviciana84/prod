import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabaseClient"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import StockStatsDashboard from "@/components/vehicles/stock-stats-dashboard"
import StockStatsCard from "@/components/vehicles/stock-stats-card"

export const metadata: Metadata = {
  title: "Estadísticas de Inventario | CVO",
  description: "Panel de estadísticas del inventario de vehículos",
}

async function getStockData() {
  // Obtener registros de stock para las estadísticas (excluyendo entregados)
  const { data: stockData, error: stockError } = await supabaseAdmin
    .from("stock")
    .select("*")
    .neq('estado', 'entregado') // Excluir vehículos entregados del stock
    .order("reception_date", { ascending: false })

  if (stockError) {
    console.error("Error al cargar datos de stock:", stockError)
    return { stock: [] }
  }

  // Obtener datos del historial para análisis de tendencias
  const { data: historyData, error: historyError } = await supabaseAdmin
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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Vehículos", href: "/dashboard/vehicles" },
            { label: "Estadísticas", href: "/dashboard/vehicles/stats" },
          ]}
        />
        <h1 className="text-3xl font-bold tracking-tight">Estadísticas de Inventario</h1>
        <p className="text-muted-foreground">Análisis y métricas del estado actual del inventario de vehículos</p>
      </div>

      {/* Añadir el nuevo componente de estadísticas de prioridad */}
      <StockStatsCard initialStock={stock} />

      <StockStatsDashboard stockData={stock} historyData={history} />
    </div>
  )
}
