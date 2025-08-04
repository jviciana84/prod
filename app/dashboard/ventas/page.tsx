"use client"

import { useState, useCallback, useEffect } from "react"
import { SalesQuickForm } from "@/components/sales/sales-quick-form"
import SalesTable from "@/components/sales/sales-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, Wrench, TableIcon, FileText, Plus, Calendar, Clock, Hash, ShoppingCart, TrendingUp, Upload } from "lucide-react"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { Button } from "@/components/ui/button"
import { AutoRefreshIndicator } from "@/components/ui/auto-refresh-indicator"
import { AutoRefreshSettings } from "@/components/ui/auto-refresh-settings"
import { AutoRefreshNotification } from "@/components/ui/auto-refresh-notification"
import { useAutoRefresh } from "@/hooks/use-auto-refresh"
import { useAutoRefreshPreferences } from "@/hooks/use-auto-refresh-preferences"
import Link from "next/link"
import PdfUploadModal from "@/components/sales/pdf-upload-modal"

interface SalesStats {
  totalVentas: number
  esteMes: number
  ultimaSemana: number
  promedioPrecio: number
  financiadas: number
}

export default function VentasPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [isAddingSale, setIsAddingSale] = useState(false)
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)
  const [stats, setStats] = useState<SalesStats>({
    totalVentas: 0,
    esteMes: 0,
    ultimaSemana: 0,
    promedioPrecio: 0,
    financiadas: 0
  })
  const [loadingStats, setLoadingStats] = useState(true)
  
  // Usar preferencias guardadas
  const { preferences, isLoaded, setEnabled, setInterval } = useAutoRefreshPreferences()

  const fetchSalesStats = useCallback(async () => {
    try {
      setLoadingStats(true)
      const response = await fetch('/api/sales/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error cargando estadísticas de ventas:', error)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  useEffect(() => {
    fetchSalesStats()
  }, [fetchSalesStats])

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
    setLastRefresh(new Date())
    fetchSalesStats() // Recargar estadísticas también
  }, [fetchSalesStats])

  const { isActive } = useAutoRefresh({
    interval: preferences.interval,
    enabled: preferences.enabled && isLoaded,
    onRefresh: handleRefresh,
    onError: (error) => {
      console.error('Error en auto refresh de ventas:', error)
    }
  })

  const handleSaleRegistered = () => {
    handleRefresh()
    setIsAddingSale(false)
  }

  const handlePdfUpload = () => {
    setIsPdfModalOpen(true)
  }

  const toggleAutoRefresh = () => {
    setEnabled(!preferences.enabled)
  }

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <Breadcrumbs className="mt-4" />
        <div className="flex items-center gap-3">
          <Car className="h-8 w-8 text-green-500" />
          <div className="flex-1">
                          <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Gestión Vehículos Vendidos</h1>
              </div>
            <p className="text-muted-foreground">Control y seguimiento de ventas completadas y en proceso</p>
          </div>
        </div>
      </div>

      {/* 6 Mini Cards de Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {!isAddingSale ? (
          <>
            {/* Total Ventas */}
            <Card className="p-4 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Ventas</p>
                  <p className="text-2xl font-bold">
                    {loadingStats ? "..." : stats.totalVentas}
                  </p>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </Card>

            {/* Este Mes */}
            <Card className="p-4 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Este Mes</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {loadingStats ? "..." : stats.esteMes}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </Card>

            {/* Última Semana */}
            <Card className="p-4 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Última Semana</p>
                  <p className="text-2xl font-bold text-amber-500">
                    {loadingStats ? "..." : stats.ultimaSemana}
                  </p>
                </div>
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </Card>

            {/* Promedio Precio */}
            <Card className="p-4 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Promedio Precio</p>
                  <p className="text-2xl font-bold text-purple-500">
                    {loadingStats ? "..." : `${stats.promedioPrecio.toLocaleString()}€`}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Hash className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </Card>

            {/* Financiadas */}
            <Card className="p-4 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Financiadas</p>
                  <p className="text-2xl font-bold text-indigo-500">
                    {loadingStats ? "..." : stats.financiadas}
                  </p>
                </div>
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                  <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </Card>

            {/* Card de Acciones */}
            <Card className="p-4 relative border-2 border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-400/50 shadow-[0_0_10px_rgba(59,130,246,0.3)] dark:shadow-[0_0_10px_rgba(96,165,250,0.3)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Acciones</p>
                  <div className="flex gap-2 mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePdfUpload}
                      className="text-xs"
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingSale(!isAddingSale)}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Añadir
                    </Button>
                  </div>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </Card>
          </>
        ) : (
          /* Card del Formulario (ocupa todo el ancho) */
          <Card className="lg:col-span-6">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Plus className="h-5 w-5 text-blue-600" />
                    Añadir Venta Manual
                  </CardTitle>
                  <CardDescription>Registra una nueva venta de vehículo</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingSale(false)}
                >
                  <Plus className="h-4 w-4 mr-2 rotate-45" />
                  Ocultar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <SalesQuickForm onSaleRegistered={handleSaleRegistered} />
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center text-lg">
                <TableIcon className="mr-2 h-4 w-4 text-blue-500" />
                Vehículos Vendidos
              </CardTitle>
              <CardDescription>Seguimiento y gestión de vehículos vendidos</CardDescription>
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
        <CardContent className="p-6">
          <SalesTable key={refreshKey} onRefresh={handleRefresh} />
        </CardContent>
      </Card>

      {/* Componente de notificaciones de auto refresh */}
      <AutoRefreshNotification
        isActive={isActive}
        onRefresh={handleRefresh}
        showNotifications={preferences.enabled}
      />

      <PdfUploadModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
      />
    </div>
  )
}
