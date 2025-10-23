"use client"

import { useState, useCallback, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import StockTable from "@/components/vehicles/stock-table"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { CompactSearchWithModal } from "@/components/dashboard/compact-search-with-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AutoRefreshIndicator } from "@/components/ui/auto-refresh-indicator"
import { AutoRefreshSettings } from "@/components/ui/auto-refresh-settings"
import { AutoRefreshNotification } from "@/components/ui/auto-refresh-notification"
import { CheckRemovedVehiclesButton } from "@/components/ui/check-removed-vehicles-button"
import { useAutoRefresh } from "@/hooks/use-auto-refresh"
import { useAutoRefreshPreferences } from "@/hooks/use-auto-refresh-preferences"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CarFrontDoubleIcon } from "@/components/ui/icons"
import { Filter, CheckCircle, Tag, AlertTriangle } from "lucide-react"

export default function VehiclesPage() {
  const supabase = createClientComponentClient()
  const [refreshKey, setRefreshKey] = useState(0)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [stockStats, setStockStats] = useState({ total: 0, disponible: 0, noDisponible: 0, reservado: 0 })
  
  // Usar preferencias guardadas
  const { preferences, isLoaded, setEnabled, setInterval } = useAutoRefreshPreferences()

  // Cargar estadísticas de stock
  useEffect(() => {
    async function loadStats() {
      const { data: stockData } = await supabase
        .from('stock')
        .select('is_available, license_plate')

      const { data: salesData } = await supabase
        .from('sales_vehicles')
        .select('license_plate')

      const { data: entregasData } = await supabase
        .from('entregas')
        .select('license_plate, fecha_entrega')
        .not('fecha_entrega', 'is', null)

      const entregados = new Set((entregasData || []).map(e => e.license_plate))
      const salesSinEntregar = (salesData || []).filter(s => !entregados.has(s.license_plate))

      setStockStats({
        total: stockData?.length || 0,
        disponible: stockData?.filter(v => v.is_available === true).length || 0,
        noDisponible: stockData?.filter(v => v.is_available === false).length || 0,
        reservado: salesSinEntregar.length
      })
    }
    loadStats()
  }, [refreshKey])

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
    setLastRefresh(new Date())
  }, [])

  const { isActive } = useAutoRefresh({
    interval: preferences.interval,
    enabled: preferences.enabled && isLoaded,
    onRefresh: handleRefresh,
    onError: (error) => {
      console.error('Error en auto refresh de vehículos:', error)
    }
  })

  const toggleAutoRefresh = () => {
    setEnabled(!preferences.enabled)
  }

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Breadcrumbs className="mt-4"
            segments={[
              {
                title: "Dashboard",
                href: "/dashboard",
              },
              {
                title: "Vehículos",
                href: "/dashboard/vehicles",
              },
            ]}
          />
          <CompactSearchWithModal className="mt-4" />
        </div>
        <div className="flex items-center gap-3">
          <CarFrontDoubleIcon className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventario de Vehículos</h1>
            <p className="text-muted-foreground">Gestión y seguimiento del inventario de vehículos en stock</p>
          </div>
        </div>
      </div>

      {/* Mini Cards de Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Stock</p>
              <p className="text-2xl font-bold text-blue-500">
                {stockStats.total}
              </p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Disponible</p>
              <p className="text-2xl font-bold text-green-500">
                {stockStats.disponible}
              </p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Reservado</p>
              <p className="text-2xl font-bold text-amber-500">
                {stockStats.reservado}
              </p>
            </div>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <Tag className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">No Disponible</p>
              <p className="text-2xl font-bold text-red-500">
                {stockStats.noDisponible}
              </p>
            </div>
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center text-lg">
                <CarFrontDoubleIcon className="mr-2 h-4 w-4 text-blue-500" />
                Stock de Vehículos
              </CardTitle>
              <CardDescription>
                Tabla completa del inventario con filtros, búsqueda y gestión de estados
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <AutoRefreshIndicator
                isActive={isActive}
                interval={preferences.interval}
                onToggle={toggleAutoRefresh}
                lastRefresh={lastRefresh}
              />
              <AutoRefreshSettings
                currentInterval={preferences.interval}
                onIntervalChange={setInterval}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {/* Botón para ver vehículos eliminados - justo debajo de los controles auto refresh */}
          <div className="mb-4 flex justify-end">
            <CheckRemovedVehiclesButton />
          </div>
          {/* Tabs principales justo antes de las tabs de filtro */}
          <div className="w-full mb-4">
            <Tabs defaultValue="inventory" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="inventory" asChild>
                  <a href="/dashboard/vehicles" className="flex items-center gap-2">
                    <CarFrontDoubleIcon className="h-4 w-4" />
                    <span>Inventario</span>
                  </a>
                </TabsTrigger>
                <TabsTrigger value="stats" asChild>
                  <a href="/dashboard/vehicles/stats" className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18" /><path d="M18 17V9M13 17V5M8 17v-3" /></svg>
                    <span>Estadísticas</span>
                  </a>
                </TabsTrigger>
                <TabsTrigger value="premature-sales" asChild>
                  <a href="/dashboard/vehicles/ventas-prematuras" className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Ventas Prematuras</span>
                  </a>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <StockTable key={refreshKey} onRefresh={handleRefresh} />
        </CardContent>
      </Card>
      {/* Componente de notificaciones de auto refresh */}
      <AutoRefreshNotification
        isActive={isActive}
        onRefresh={handleRefresh}
        showNotifications={preferences.enabled}
      />
    </div>
  )
}
