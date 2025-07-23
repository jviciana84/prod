"use client"

import { useState, useCallback, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import TransportDashboard from "@/components/transport/transport-dashboard"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { getUserRolesClient } from "@/lib/auth/permissions-client"
import { Truck } from "lucide-react"
import { AutoRefreshIndicator } from "@/components/ui/auto-refresh-indicator"
import { AutoRefreshSettings } from "@/components/ui/auto-refresh-settings"
import { AutoRefreshNotification } from "@/components/ui/auto-refresh-notification"
import { useAutoRefresh } from "@/hooks/use-auto-refresh"
import { useAutoRefreshPreferences } from "@/hooks/use-auto-refresh-preferences"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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

  const supabase = createClientComponentClient()

  // Función para cargar datos
  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true)
    }
    try {
      // Obtener sedes para el formulario
      const { data: locations, error: locationsError } = await supabase.from("locations").select("*").order("name")
      if (locationsError) {
        console.error("Error al cargar sedes:", locationsError)
      }

      // Cambiar la consulta a la base de datos
      const { data: transports, error: transportsError } = await supabase
        .from("nuevas_entradas")
        .select("*")
        .order("purchase_date", { ascending: false })
      if (transportsError) {
        console.error("Error al cargar datos de transporte:", transportsError)
      }

      // Si tenemos transportes, cargar los datos relacionados
      let transportesConRelaciones = []
      if (transports && transports.length > 0) {
        // Crear un mapa de ubicaciones para búsqueda rápida
        const locationMap = locations
          ? locations.reduce((map, loc) => {
              map[loc.id] = loc
              return map
            }, {})
          : {}

        // Obtener tipos de gastos
        const { data: expenseTypes } = await supabase.from("expense_types").select("*")

        // Crear un mapa de tipos de gastos para búsqueda rápida
        const expenseTypeMap = expenseTypes
          ? expenseTypes.reduce((map, type) => {
              map[type.id] = type
              return map
            }, {})
          : {}

        // Combinar los datos manualmente
        transportesConRelaciones = transports.map((transport) => ({
          ...transport,
          origin_location: locationMap[transport.origin_location_id] || null,
          expense_type: expenseTypeMap[transport.expense_type_id] || null,
        }))
      }

      // Obtener roles del usuario
      const userRoles = await getUserRolesClient()

      setInitialData({
        transports: transportesConRelaciones || [],
        locations: locations || [],
        userRoles: userRoles || []
      })
    } catch (error) {
      console.error("Error cargando datos:", error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

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
        <Breadcrumbs className="mt-4" />
        <div className="flex items-center gap-3">
          <Truck className="h-8 w-8 text-green-600" />
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
