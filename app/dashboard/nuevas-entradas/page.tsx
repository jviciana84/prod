"use client"

import { useState, useCallback, useEffect } from "react"
import TransportDashboard from "@/components/transport/transport-dashboard"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { CompactSearchWithModal } from "@/components/dashboard/compact-search-with-modal"
import { AutoRefreshNotification } from "@/components/ui/auto-refresh-notification"
import { useAutoRefresh } from "@/hooks/use-auto-refresh"
import { useAutoRefreshPreferences } from "@/hooks/use-auto-refresh-preferences"
import { AddCarIcon } from "@/components/ui/icons"
import { toast } from "sonner"

export default function TransportPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [initialData, setInitialData] = useState<{
    transports: any[]
    locations: any[]
    userRoles: string[]
  }>({
    transports: [],
    locations: [],
    userRoles: []
  })
  const [isLoading, setIsLoading] = useState(false)
  
  // Usar preferencias guardadas
  const { preferences, isLoaded, setEnabled, setInterval } = useAutoRefreshPreferences()

  // Función para cargar datos desde API Route
  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true)
    }
    try {
      console.log("🚚 Cargando nuevas entradas desde API...")
      const response = await fetch("/api/transport/list")

      if (!response.ok) {
        throw new Error("Error al cargar datos de transporte")
      }

      const { data } = await response.json()
      
      setInitialData({
        transports: data.transports || [],
        locations: data.locations || [],
        userRoles: data.userRoles || []
      })
      
      console.log("✅ Nuevas entradas cargadas:", data.transports?.length || 0)
    } catch (error) {
      console.error("❌ Error cargando datos:", error)
      toast.error("Error al cargar los datos de transporte")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Cargar datos iniciales
  useEffect(() => {
    loadData(false) // No mostrar loading en carga inicial
  }, [loadData])

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
    setLastRefresh(new Date())
    loadData(true) // Mostrar loading en refresh manual
  }, [loadData])

  const { isActive } = useAutoRefresh({
    interval: preferences.interval,
    enabled: preferences.enabled && isLoaded,
    onRefresh: handleRefresh,
    onError: (error) => {
      console.error('Error en auto refresh de nuevas entradas:', error)
    }
  })

  const toggleAutoRefresh = () => {
    setEnabled(!preferences.enabled)
  }

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Breadcrumbs className="mt-4" />
          <CompactSearchWithModal className="mt-4" />
        </div>
        <div className="flex items-center gap-3">
          <AddCarIcon className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Nuevas Entradas</h1>
            <p className="text-muted-foreground">Control y seguimiento de vehículos recién adquiridos</p>
          </div>
        </div>
      </div>

      <TransportDashboard
        key={refreshKey}
        initialTransports={initialData.transports}
        locations={initialData.locations}
        userRoles={initialData.userRoles}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        autoRefreshProps={{
          isActive,
          interval: preferences.interval,
          onToggle: toggleAutoRefresh,
          lastRefresh,
          onIntervalChange: setInterval
        }}
      />

      {/* Componente de notificaciones de auto refresh */}
      <AutoRefreshNotification
        isActive={isActive}
        onRefresh={handleRefresh}
        showNotifications={preferences.enabled}
      />
    </div>
  )
}
