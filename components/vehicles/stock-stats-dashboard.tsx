"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { StockItem, StockHistory } from "@/lib/types/stock"
import { format, parseISO, differenceInDays, subDays, isAfter } from "date-fns"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import {
  Car,
  Clock,
  TrendingUp,
  BarChart3,
  PieChartIcon,
  Activity,
  Paintbrush,
  Wrench,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"

interface StockStatsDashboardProps {
  stockData: StockItem[]
  historyData: StockHistory[]
}

// Colores para los gráficos
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]
const STATUS_COLORS = {
  pendiente: "#f59e0b",
  en_proceso: "#3b82f6",
  apto: "#10b981",
  no_apto: "#ef4444",
}

export default function StockStatsDashboard({ stockData, historyData }: StockStatsDashboardProps) {
  const [timeRange, setTimeRange] = useState<"7" | "30" | "90" | "all">("30")
  const [chartType, setChartType] = useState<"bar" | "pie" | "line">("bar")

  // Filtrar datos por rango de tiempo
  const filteredStock = useMemo(() => {
    if (timeRange === "all") return stockData

    const cutoffDate = subDays(new Date(), Number.parseInt(timeRange))
    return stockData.filter((item) => {
      const receptionDate = item.reception_date ? parseISO(item.reception_date) : null
      return receptionDate && isAfter(receptionDate, cutoffDate)
    })
  }, [stockData, timeRange])

  // Calcular estadísticas generales
  const stats = useMemo(() => {
    const total = filteredStock.length
    const withInspection = filteredStock.filter((item) => item.inspection_date).length
    const pendingPaint = filteredStock.filter((item) => item.paint_status === "pendiente").length
    const pendingMechanical = filteredStock.filter((item) => item.mechanical_status === "pendiente").length
    const inProcessPaint = filteredStock.filter((item) => item.paint_status === "en_proceso").length
    const inProcessMechanical = filteredStock.filter((item) => item.mechanical_status === "en_proceso").length
    const aptoPaint = filteredStock.filter((item) => item.paint_status === "apto").length
    const aptoMechanical = filteredStock.filter((item) => item.mechanical_status === "apto").length
    const noAptoPaint = filteredStock.filter((item) => item.paint_status === "no_apto").length
    const noAptoMechanical = filteredStock.filter((item) => item.mechanical_status === "no_apto").length

    // Calcular tiempos promedio
    let totalDaysToInspection = 0
    let countWithBothDates = 0

    filteredStock.forEach((item) => {
      if (item.reception_date && item.inspection_date) {
        const receptionDate = parseISO(item.reception_date)
        const inspectionDate = parseISO(item.inspection_date)
        totalDaysToInspection += differenceInDays(inspectionDate, receptionDate)
        countWithBothDates++
      }
    })

    const avgDaysToInspection = countWithBothDates > 0 ? (totalDaysToInspection / countWithBothDates).toFixed(1) : "N/A"

    // Calcular vehículos completamente procesados (ambos estados son apto o no_apto)
    const fullyProcessed = filteredStock.filter(
      (item) =>
        (item.paint_status === "apto" || item.paint_status === "no_apto") &&
        (item.mechanical_status === "apto" || item.mechanical_status === "no_apto"),
    ).length

    // Calcular porcentaje de completitud
    const completionPercentage = total > 0 ? Math.round((fullyProcessed / total) * 100) : 0

    return {
      total,
      withInspection,
      pendingPaint,
      pendingMechanical,
      inProcessPaint,
      inProcessMechanical,
      aptoPaint,
      aptoMechanical,
      noAptoPaint,
      noAptoMechanical,
      avgDaysToInspection,
      fullyProcessed,
      completionPercentage,
    }
  }, [filteredStock])

  // Preparar datos para gráficos
  const paintStatusData = useMemo(() => {
    return [
      { name: "Pendiente", value: stats.pendingPaint, color: STATUS_COLORS.pendiente },
      { name: "En proceso", value: stats.inProcessPaint, color: STATUS_COLORS.en_proceso },
      { name: "Apto", value: stats.aptoPaint, color: STATUS_COLORS.apto },
      { name: "No apto", value: stats.noAptoPaint, color: STATUS_COLORS.no_apto },
    ]
  }, [stats])

  const mechanicalStatusData = useMemo(() => {
    return [
      { name: "Pendiente", value: stats.pendingMechanical, color: STATUS_COLORS.pendiente },
      { name: "En proceso", value: stats.inProcessMechanical, color: STATUS_COLORS.en_proceso },
      { name: "Apto", value: stats.aptoMechanical, color: STATUS_COLORS.apto },
      { name: "No apto", value: stats.noAptoMechanical, color: STATUS_COLORS.no_apto },
    ]
  }, [stats])

  // Preparar datos para gráfico de tendencias
  const trendData = useMemo(() => {
    // Agrupar historial por día
    const historyByDay = new Map()

    historyData.forEach((entry) => {
      if (!entry.changed_at) return

      const date = format(parseISO(entry.changed_at), "yyyy-MM-dd")
      if (!historyByDay.has(date)) {
        historyByDay.set(date, {
          date,
          paint_changes: 0,
          mechanical_changes: 0,
          total_changes: 0,
        })
      }

      const dayData = historyByDay.get(date)
      dayData.total_changes++

      if (entry.field_name === "paint_status") {
        dayData.paint_changes++
      } else if (entry.field_name === "mechanical_status") {
        dayData.mechanical_changes++
      }
    })

    // Convertir a array y ordenar por fecha
    return Array.from(historyByDay.values())
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .slice(-30) // Mostrar solo los últimos 30 días con datos
  }, [historyData])

  // Función para renderizar el gráfico seleccionado
  const renderChart = () => {
    if (chartType === "pie") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Paintbrush className="h-5 w-5" />
                Estado de Pintura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paintStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paintStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value} vehículos`, "Cantidad"]}
                      labelFormatter={(name) => `Estado: ${name}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Estado Mecánico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mechanicalStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {mechanicalStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value} vehículos`, "Cantidad"]}
                      labelFormatter={(name) => `Estado: ${name}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    } else if (chartType === "bar") {
      return (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribución de Estados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      name: "Pendiente",
                      Pintura: stats.pendingPaint,
                      Mecánica: stats.pendingMechanical,
                    },
                    {
                      name: "En proceso",
                      Pintura: stats.inProcessPaint,
                      Mecánica: stats.inProcessMechanical,
                    },
                    {
                      name: "Apto",
                      Pintura: stats.aptoPaint,
                      Mecánica: stats.aptoMechanical,
                    },
                    {
                      name: "No apto",
                      Pintura: stats.noAptoPaint,
                      Mecánica: stats.noAptoMechanical,
                    },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} vehículos`, ""]} />
                  <Legend />
                  <Bar dataKey="Pintura" fill="#3b82f6" />
                  <Bar dataKey="Mecánica" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )
    } else {
      // Line chart para tendencias
      return (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendencia de Cambios de Estado
            </CardTitle>
            <CardDescription>Cambios registrados en los últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} cambios`, ""]} />
                  <Legend />
                  <Line type="monotone" dataKey="paint_changes" name="Cambios de Pintura" stroke="#3b82f6" />
                  <Line type="monotone" dataKey="mechanical_changes" name="Cambios Mecánicos" stroke="#10b981" />
                  <Line type="monotone" dataKey="total_changes" name="Total Cambios" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Tabs value={chartType} onValueChange={(value: string) => setChartType(value as "bar" | "pie" | "line")}>
          <TabsList>
            <TabsTrigger value="bar" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Barras</span>
            </TabsTrigger>
            <TabsTrigger value="pie" className="flex items-center gap-1">
              <PieChartIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Circular</span>
            </TabsTrigger>
            <TabsTrigger value="line" className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Tendencias</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Período:</span>
          <Select value={timeRange} onValueChange={(value: string) => setTimeRange(value as "7" | "30" | "90" | "all")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
              <SelectItem value="all">Todo el historial</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Vehículos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-3xl font-bold">{stats.total}</div>
              <Car className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Completados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-3xl font-bold">{stats.fullyProcessed}</div>
                <div className="text-xs text-muted-foreground">{stats.completionPercentage}% del total</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Tiempo Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-3xl font-bold">{stats.avgDaysToInspection}</div>
                <div className="text-xs text-muted-foreground">días hasta peritaje</div>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-3xl font-bold">{Math.max(stats.pendingPaint, stats.pendingMechanical)}</div>
                <div className="text-xs text-muted-foreground">vehículos sin procesar</div>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      {renderChart()}

      {/* Tabla de resumen */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Estados</CardTitle>
          <CardDescription>Distribución detallada por estado y categoría</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Estado</th>
                  <th className="text-center py-3 px-4">Pintura</th>
                  <th className="text-center py-3 px-4">Mecánica</th>
                  <th className="text-center py-3 px-4">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-4 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    Pendiente
                  </td>
                  <td className="text-center py-3 px-4">{stats.pendingPaint}</td>
                  <td className="text-center py-3 px-4">{stats.pendingMechanical}</td>
                  <td className="text-center py-3 px-4 font-medium">{stats.pendingPaint + stats.pendingMechanical}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    En proceso
                  </td>
                  <td className="text-center py-3 px-4">{stats.inProcessPaint}</td>
                  <td className="text-center py-3 px-4">{stats.inProcessMechanical}</td>
                  <td className="text-center py-3 px-4 font-medium">
                    {stats.inProcessPaint + stats.inProcessMechanical}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    Apto
                  </td>
                  <td className="text-center py-3 px-4">{stats.aptoPaint}</td>
                  <td className="text-center py-3 px-4">{stats.aptoMechanical}</td>
                  <td className="text-center py-3 px-4 font-medium">{stats.aptoPaint + stats.aptoMechanical}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    No apto
                  </td>
                  <td className="text-center py-3 px-4">{stats.noAptoPaint}</td>
                  <td className="text-center py-3 px-4">{stats.noAptoMechanical}</td>
                  <td className="text-center py-3 px-4 font-medium">{stats.noAptoPaint + stats.noAptoMechanical}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t">
                  <td className="py-3 px-4 font-medium">Total</td>
                  <td className="text-center py-3 px-4 font-medium">{stats.total}</td>
                  <td className="text-center py-3 px-4 font-medium">{stats.total}</td>
                  <td className="text-center py-3 px-4 font-medium">{stats.total * 2}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
