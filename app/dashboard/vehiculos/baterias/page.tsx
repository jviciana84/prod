"use client"

import { useState, useCallback } from "react"
import { Battery, Zap, TableIcon } from "lucide-react"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { CompactSearchWithModal } from "@/components/dashboard/compact-search-with-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BatteryControlTable } from "@/components/battery-control/battery-control-table"
import { AutoRefreshIndicator } from "@/components/ui/auto-refresh-indicator"
import { AutoRefreshSettings } from "@/components/ui/auto-refresh-settings"
import { AutoRefreshNotification } from "@/components/ui/auto-refresh-notification"
import { useAutoRefresh } from "@/hooks/use-auto-refresh"
import { useAutoRefreshPreferences } from "@/hooks/use-auto-refresh-preferences"

export default function BatteryControlPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Usar preferencias guardadas
  const { preferences, isLoaded, setEnabled, setInterval } = useAutoRefreshPreferences()

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
    setLastRefresh(new Date())
  }, [])

  const { isActive } = useAutoRefresh({
    interval: preferences.interval,
    enabled: preferences.enabled && isLoaded,
    onRefresh: handleRefresh,
    onError: (error) => {
      console.error("Error en auto refresh de baterías:", error)
    },
  })

  const toggleAutoRefresh = () => {
    setEnabled(!preferences.enabled)
  }

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      {/* Header con breadcrumbs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Breadcrumbs
            className="mt-4"
            items={[
              { label: "Vehículos", href: "/dashboard/vehicles" },
              { label: "Control Baterías", href: "/dashboard/vehiculos/baterias" },
            ]}
          />
          <CompactSearchWithModal className="mt-4" />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Battery className="h-8 w-8 text-green-500" />
            <Zap className="h-4 w-4 text-yellow-500 absolute -bottom-1 -right-1" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Control de Baterías BEV y PHEV</h1>
            <p className="text-muted-foreground">
              Seguimiento y gestión del estado de carga de vehículos eléctricos e híbridos enchufables
            </p>
          </div>
        </div>
      </div>

      {/* Tabla principal */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center text-lg">
                <TableIcon className="mr-2 h-4 w-4 text-blue-500" />
                Vehículos Eléctricos e Híbridos
              </CardTitle>
              <CardDescription>
                Control de niveles de carga y estado de vehículos BEV (eléctricos) y PHEV (híbridos enchufables)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <AutoRefreshIndicator
                isActive={isActive}
                interval={preferences.interval}
                onToggle={toggleAutoRefresh}
                lastRefresh={lastRefresh}
              />
              <AutoRefreshSettings currentInterval={preferences.interval} onIntervalChange={setInterval} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <BatteryControlTable key={refreshKey} onRefresh={handleRefresh} />
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

