"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Calendar, TrendingUp, TrendingDown } from "lucide-react"

interface DateDebugInfo {
  currentDate: string
  currentDateLocal: string
  timezone: string
  firstDayOfCurrentMonth: string
  firstDayOfPreviousMonth: string
  lastDayOfPreviousMonth: string
  environment: string
}

interface DebugResult {
  success: boolean
  dateDebugInfo: DateDebugInfo
  firstDayOfMonth: string
  firstDayOfPreviousMonth: string
  lastDayOfPreviousMonth: string
  salesThisMonth: number
  revenue: number
  previousSalesThisMonth: number
  previousRevenue: number
  sampleDates: Array<{
    id: string
    order_date: string
    brand: string
    vehicle_type: string
  }>
  totalSalesRecords: number
  totalPreviousMonthRecords: number
}

export default function DebugSalesDashboardPage() {
  const [debugData, setDebugData] = useState<DebugResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDebugData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log("🔍 Iniciando fetch de debug data...")
      const response = await fetch("/api/debug-sales-dashboard")
      console.log("📡 Response status:", response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("📊 Debug data recibida:", data)
      
      if (data.success) {
        setDebugData(data)
      } else {
        setError(data.error || "Error desconocido")
      }
    } catch (err) {
      console.error("❌ Error en fetchDebugData:", err)
      setError(err instanceof Error ? err.message : "Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log("🚀 Componente montado, iniciando fetch...")
    fetchDebugData()
  }, [])

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short"
      })
    } catch (error) {
      console.error("Error formateando fecha:", dateString, error)
      return dateString
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR"
    }).format(amount)
  }

  console.log("🔄 Renderizando componente con:", { loading, error, debugData })

  if (loading) {
    return (
      <div className="p-4 md:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Cargando datos de debug...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-5 space-y-4">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
            <Button onClick={fetchDebugData} className="mt-4">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!debugData) {
    return (
      <div className="p-4 md:p-5 space-y-4">
        <h1 className="text-3xl font-bold">Debug Dashboard Ventas</h1>
        <p>No hay datos disponibles</p>
        <Button onClick={fetchDebugData}>Cargar datos</Button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Debug Dashboard Ventas</h1>
        <Button onClick={fetchDebugData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Información del entorno */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Información del Entorno
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Entorno</p>
              <Badge variant={debugData.dateDebugInfo.environment === "production" ? "default" : "secondary"}>
                {debugData.dateDebugInfo.environment}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Zona Horaria</p>
              <p className="font-mono text-sm">{debugData.dateDebugInfo.timezone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha Actual (UTC)</p>
              <p className="font-mono text-sm">{formatDate(debugData.dateDebugInfo.currentDate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha Actual (Local)</p>
              <p className="font-mono text-sm">{formatDate(debugData.dateDebugInfo.currentDateLocal)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fechas calculadas */}
      <Card>
        <CardHeader>
          <CardTitle>Fechas Calculadas</CardTitle>
          <CardDescription>Fechas utilizadas para filtrar las ventas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Primer día del mes actual</p>
              <p className="font-mono text-sm">{formatDate(debugData.firstDayOfMonth)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Primer día del mes anterior</p>
              <p className="font-mono text-sm">{formatDate(debugData.firstDayOfPreviousMonth)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Último día del mes anterior</p>
              <p className="font-mono text-sm">{formatDate(debugData.lastDayOfPreviousMonth)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas de ventas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Mes Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Ventas:</span>
                <span className="font-bold">{debugData.salesThisMonth}</span>
              </div>
              <div className="flex justify-between">
                <span>Ingresos:</span>
                <span className="font-bold">{formatCurrency(debugData.revenue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Registros totales:</span>
                <span className="font-bold">{debugData.totalSalesRecords}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-blue-500" />
              Mes Anterior
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Ventas:</span>
                <span className="font-bold">{debugData.previousSalesThisMonth}</span>
              </div>
              <div className="flex justify-between">
                <span>Ingresos:</span>
                <span className="font-bold">{formatCurrency(debugData.previousRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Registros totales:</span>
                <span className="font-bold">{debugData.totalPreviousMonthRecords}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ejemplos de fechas */}
      {debugData.sampleDates && debugData.sampleDates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ejemplos de Fechas de Ventas</CardTitle>
            <CardDescription>Primeros 5 registros encontrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {debugData.sampleDates.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{sale.brand} - {sale.vehicle_type}</p>
                    <p className="text-sm text-muted-foreground">ID: {sale.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm">{formatDate(sale.order_date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 