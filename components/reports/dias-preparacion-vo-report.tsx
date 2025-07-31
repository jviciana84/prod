"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, User, TrendingUp, BarChart3, Clock, Filter, Download, Printer, Bug } from "lucide-react"
import { addDays, format, differenceInDays, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { createClient } from "@/lib/supabase/client"
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

type DiasPreparacionData = {
  id: string
  matricula: string
  asesor: string
  fecha_venta: string
  fecha_validacion: string
  fecha_completado: string
  dias_venta_completado: number
  dias_validado_completado: number
  estado: string
}

type EstadisticasAsesor = {
  asesor: string
  total_vehiculos: number
  media_dias: number
  dias_min: number
  dias_max: number
  vehiculos_completados: number
  vehiculos_pendientes: number
}

export default function DiasPreparacionVOReport() {
  const [data, setData] = useState<DiasPreparacionData[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasAsesor[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  })
  const [selectedAsesor, setSelectedAsesor] = useState<string>("todos")
  const [asesores, setAsesores] = useState<string[]>([])

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [dateRange, selectedAsesor])

  const fetchData = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('sales_vehicles')
        .select('*')
        .gte('sale_date', dateRange.from.toISOString())
        .lte('sale_date', dateRange.to.toISOString())

      if (selectedAsesor !== "todos") {
        query = query.eq('advisor', selectedAsesor)
      }

      const { data: rawData, error } = await query

      if (error) {
        console.error('Error fetching data:', error)
        return
      }

      // Procesar datos para calcular días de preparación
      const processedData = rawData?.map(item => {
        const fechaVenta = item.sale_date ? parseISO(item.sale_date) : null
        const fechaValidacion = item.validation_date ? parseISO(item.validation_date) : null
        const fechaCyp = item.cyp_date ? parseISO(item.cyp_date) : null
        const fechaFoto360 = item.photo_360_date ? parseISO(item.photo_360_date) : null

        let diasVentaCompletado = 0
        let diasValidadoCompletado = 0
        let estado = "Pendiente"
        let fechaCompletado = null

        // Verificar si está COMPLETADO (ambos CyP y Foto360 tienen fecha)
        if (fechaCyp && fechaFoto360) {
          // Tomar la fecha más reciente entre CyP y Foto360 como fecha de completado
          fechaCompletado = new Date(Math.max(fechaCyp.getTime(), fechaFoto360.getTime()))
          diasVentaCompletado = fechaVenta ? differenceInDays(fechaCompletado, fechaVenta) : 0
          diasValidadoCompletado = fechaValidacion ? differenceInDays(fechaCompletado, fechaValidacion) : 0
          estado = "Completado"
        } 
        // Verificar si está VALIDADO (tiene fecha de validación pero no está completo)
        else if (fechaValidacion && (!fechaCyp || !fechaFoto360)) {
          diasVentaCompletado = fechaVenta ? differenceInDays(fechaValidacion, fechaVenta) : 0
          diasValidadoCompletado = 0 // No está completado aún
          estado = "Validado"
        }
        // Si no tiene fecha de validación, está PENDIENTE
        else {
          diasVentaCompletado = 0
          diasValidadoCompletado = 0
          estado = "Pendiente"
        }

        return {
          id: item.id,
          matricula: item.license_plate,
          asesor: item.advisor,
          fecha_venta: item.sale_date,
          fecha_validacion: item.validation_date,
          fecha_completado: fechaCompletado?.toISOString(),
          fecha_cyp: item.cyp_date,
          fecha_foto360: item.photo_360_date,
          dias_venta_completado: diasVentaCompletado,
          dias_validado_completado: diasValidadoCompletado,
          estado
        }
      }) || []

      setData(processedData)

      // Calcular estadísticas por asesor
      const asesoresStats = processedData.reduce((acc, item) => {
        if (!acc[item.asesor]) {
          acc[item.asesor] = {
            asesor: item.asesor,
            total_vehiculos: 0,
            dias_venta_completado: [],
            dias_validado_completado: [],
            vehiculos_completados: 0,
            vehiculos_pendientes: 0
          }
        }

        acc[item.asesor].total_vehiculos++
        acc[item.asesor].dias_venta_completado.push(item.dias_venta_completado)
        acc[item.asesor].dias_validado_completado.push(item.dias_validado_completado)

        if (item.estado === "Completado") {
          acc[item.asesor].vehiculos_completados++
        } else {
          acc[item.asesor].vehiculos_pendientes++
        }

        return acc
      }, {} as Record<string, any>)

      const estadisticasCalculadas = Object.values(asesoresStats).map((stats: any) => {
        const diasVentaCompletado = stats.dias_venta_completado.filter((d: number) => d > 0)
        const diasValidadoCompletado = stats.dias_validado_completado.filter((d: number) => d > 0)
        
        return {
          asesor: stats.asesor,
          total_vehiculos: stats.total_vehiculos,
          media_dias: diasVentaCompletado.length > 0 ? 
            Math.round(diasVentaCompletado.reduce((a: number, b: number) => a + b, 0) / diasVentaCompletado.length) : 0,
          media_dias_venta: diasVentaCompletado.length > 0 ? 
            Math.round(diasVentaCompletado.reduce((a: number, b: number) => a + b, 0) / diasVentaCompletado.length) : 0,
          media_dias_validado: diasValidadoCompletado.length > 0 ? 
            Math.round(diasValidadoCompletado.reduce((a: number, b: number) => a + b, 0) / diasValidadoCompletado.length) : 0,
          dias_min: diasVentaCompletado.length > 0 ? Math.min(...diasVentaCompletado) : 0,
          dias_max: diasVentaCompletado.length > 0 ? Math.max(...diasVentaCompletado) : 0,
          dias_min_validado: diasValidadoCompletado.length > 0 ? Math.min(...diasValidadoCompletado) : 0,
          dias_max_validado: diasValidadoCompletado.length > 0 ? Math.max(...diasValidadoCompletado) : 0,
          vehiculos_completados: stats.vehiculos_completados,
          vehiculos_pendientes: stats.vehiculos_pendientes
        }
      })

      setEstadisticas(estadisticasCalculadas)
      setAsesores([...new Set(processedData.map(item => item.asesor))])

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const headers = ['Matrícula', 'Asesor', 'Fecha Venta', 'Fecha Validación', 'Fecha CyP', 'Fecha Foto360', 'Fecha Completado', 'Días Venta-Completado', 'Días Validado-Completado', 'Estado']
    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        item.matricula,
        item.asesor,
        item.fecha_venta,
        item.fecha_validacion,
        item.fecha_cyp || '',
        item.fecha_foto360 || '',
        item.fecha_completado || '',
        item.dias_venta_completado,
        item.dias_validado_completado,
        item.estado
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dias-preparacion-vo-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  const handlePrintReport = () => {
    if (data.length === 0) {
      alert('No hay datos para imprimir')
      return
    }

    // Generar HTML para imprimir
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Informe Días Preparación VO</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 15px; font-size: 12px; }
          .header { margin-bottom: 20px; position: relative; min-height: 120px; }
          .logo-cvo { width: 180px; height: auto; display: block; margin-bottom: 2px; margin-left: 0; }
          .cvo-line { width: 180px; height: 3px; background: #222; margin: 4px 0 16px 0; border: none; }
          .header-title { font-size: 1.7em; font-weight: bold; margin: 0 0 0 0; text-align: center; width: 100%; }
          .header-content { text-align: center; padding-top: 0; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
          .stat-card { border: 1px solid #ccc; padding: 10px; text-align: center; }
          .stat-number { font-size: 24px; font-weight: bold; color: #333; }
          .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
          .asesor-section { margin: 20px 0; page-break-inside: avoid; }
          .asesor-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #333; }
          .asesor-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 10px 0; }
          .asesor-stat { border: 1px solid #eee; padding: 8px; text-align: center; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 10px; }
          .table th, .table td { border: 1px solid #ccc; padding: 6px; text-align: left; }
          .table th { background: #f5f5f5; font-weight: bold; }
          .status-completado { background: #d4edda; color: #155724; }
          .status-validado { background: #d1ecf1; color: #0c5460; }
          .status-pendiente { background: #fff3cd; color: #856404; }
          .filters { margin: 20px 0; padding: 10px; background: #f9f9f9; border-radius: 5px; }
          .filter-item { margin: 5px 0; }
          @media print { 
            body { margin: 0; } 
            .page-break { page-break-before: always; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cvo-KUNh8rXJGJ38lK00MJ9JTEci2nGA5o.png" alt="CVO Logo" class="logo-cvo" style="width: auto; height: auto;" />
          <hr class="cvo-line" />
          <div class="header-title">INFORME DÍAS PREPARACIÓN VO</div>
          <div class="header-content">
            <p>Fecha: ${new Date().toLocaleDateString('es-ES')}</p>
            <p>Período: ${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}</p>
            <p>Total: ${data.length} vehículos</p>
          </div>
        </div>

        <div class="filters">
          <div class="filter-item"><strong>Asesor:</strong> ${selectedAsesor === 'todos' ? 'Todos los asesores' : selectedAsesor}</div>
          <div class="filter-item"><strong>Fecha desde:</strong> ${format(dateRange.from, 'dd/MM/yyyy')}</div>
          <div class="filter-item"><strong>Fecha hasta:</strong> ${format(dateRange.to, 'dd/MM/yyyy')}</div>
        </div>
    `

    // Estadísticas globales
    if (estadisticasGlobales) {
      htmlContent += `
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${estadisticasGlobales.total_vehiculos}</div>
            <div class="stat-label">Total Vehículos</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${estadisticasGlobales.media_dias_venta}</div>
            <div class="stat-label">Media Días Venta</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${estadisticasGlobales.media_dias_validado}</div>
            <div class="stat-label">Media Días Validado</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${estadisticasGlobales.vehiculos_completados}</div>
            <div class="stat-label">Completados</div>
          </div>
        </div>
      `
    }

    // Estadísticas por asesor
    if (estadisticas.length > 0) {
      htmlContent += `<div class="page-break"></div>`
      htmlContent += `<h2>Estadísticas por Asesor</h2>`
      
      estadisticas.forEach((stats, index) => {
        htmlContent += `
          <div class="asesor-section">
            <div class="asesor-title">${stats.asesor} (${stats.total_vehiculos} vehículos)</div>
            <div class="asesor-stats">
              <div class="asesor-stat">
                <div class="stat-number">${stats.media_dias_venta}</div>
                <div class="stat-label">Media días Venta</div>
              </div>
              <div class="asesor-stat">
                <div class="stat-number">${stats.media_dias_validado}</div>
                <div class="stat-label">Media días Validado</div>
              </div>
              <div class="asesor-stat">
                <div class="stat-number">${stats.vehiculos_completados}</div>
                <div class="stat-label">Completados</div>
              </div>
              <div class="asesor-stat">
                <div class="stat-number">${stats.vehiculos_pendientes}</div>
                <div class="stat-label">Pendientes</div>
              </div>
            </div>
          </div>
        `
      })
    }

    // Tabla detallada
    htmlContent += `<div class="page-break"></div>`
    htmlContent += `<h2>Detalle de Vehículos</h2>`
    htmlContent += `
      <table class="table">
        <thead>
          <tr>
            <th>Matrícula</th>
            <th>Asesor</th>
            <th>Fecha Venta</th>
            <th>Fecha Validación</th>
            <th>Fecha CyP</th>
            <th>Fecha Foto360</th>
            <th>Fecha Completado</th>
            <th>Días Venta</th>
            <th>Días Validado</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
    `

    data.forEach((item) => {
      const fechaVenta = item.fecha_venta ? format(parseISO(item.fecha_venta), 'dd/MM/yyyy', { locale: es }) : '-'
      const fechaValidacion = item.fecha_validacion ? format(parseISO(item.fecha_validacion), 'dd/MM/yyyy', { locale: es }) : '-'
      const fechaCyp = item.fecha_cyp ? format(parseISO(item.fecha_cyp), 'dd/MM/yyyy', { locale: es }) : '-'
      const fechaFoto360 = item.fecha_foto360 ? format(parseISO(item.fecha_foto360), 'dd/MM/yyyy', { locale: es }) : '-'
      const fechaCompletado = item.fecha_completado ? format(parseISO(item.fecha_completado), 'dd/MM/yyyy', { locale: es }) : '-'
      
      const statusClass = item.estado === 'Completado' ? 'status-completado' : 
                         item.estado === 'Validado' ? 'status-validado' : 'status-pendiente'

      htmlContent += `
        <tr>
          <td>${item.matricula}</td>
          <td>${item.asesor}</td>
          <td>${fechaVenta}</td>
          <td>${fechaValidacion}</td>
          <td>${fechaCyp}</td>
          <td>${fechaFoto360}</td>
          <td>${fechaCompletado}</td>
          <td>${item.dias_venta_completado}</td>
          <td>${item.dias_validado_completado}</td>
          <td class="${statusClass}">${item.estado}</td>
        </tr>
      `
    })

    htmlContent += `
        </tbody>
      </table>
      </body>
      </html>
    `

    // Abrir ventana de impresión
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      
      // Esperar un poco y luego imprimir
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    } else {
      alert("No se pudo abrir la ventana de impresión")
    }
  }

  const handleDebug = () => {
    if (data.length === 0) {
      alert('No hay datos para debuggear')
      return
    }

    // Mostrar los primeros 5 registros procesados
    console.log('=== DEBUG: DATOS PROCESADOS ===')
    data.slice(0, 5).forEach((item, index) => {
      console.log(`Registro ${index + 1}:`, {
        matricula: item.matricula,
        asesor: item.asesor,
        fecha_venta: item.fecha_venta,
        fecha_validacion: item.fecha_validacion,
        fecha_cyp: item.fecha_cyp,
        fecha_foto360: item.fecha_foto360,
        fecha_completado: item.fecha_completado,
        dias_venta_completado: item.dias_venta_completado,
        dias_validado_completado: item.dias_validado_completado,
        estado: item.estado
      })
    })

    // Mostrar estadísticas
    console.log('=== DEBUG: ESTADÍSTICAS ===')
    console.log('Estadísticas globales:', estadisticasGlobales)
    console.log('Estadísticas por asesor:', estadisticas)

    // Mostrar datos para gráficos
    console.log('=== DEBUG: DATOS PARA GRÁFICOS ===')
    console.log('Chart data:', chartData)
    console.log('Estado chart data:', estadoChartData)

    alert('Datos de debug mostrados en la consola del navegador (F12)')
  }

  const estadisticasGlobales = estadisticas.length > 0 ? {
    total_vehiculos: estadisticas.reduce((sum, item) => sum + item.total_vehiculos, 0),
    media_dias_venta: Math.round(estadisticas.reduce((sum, item) => sum + (item.media_dias_venta || 0), 0) / estadisticas.length) || 0,
    media_dias_validado: Math.round(estadisticas.reduce((sum, item) => sum + (item.media_dias_validado || 0), 0) / estadisticas.length) || 0,
    vehiculos_completados: estadisticas.reduce((sum, item) => sum + item.vehiculos_completados, 0),
    vehiculos_pendientes: estadisticas.reduce((sum, item) => sum + item.vehiculos_pendientes, 0)
  } : null

  // Datos para gráficos
  const chartData = estadisticas.map(stats => ({
    name: stats.asesor,
    mediaDiasVenta: stats.media_dias_venta || 0,
    mediaDiasValidado: stats.media_dias_validado || 0,
    completados: stats.vehiculos_completados || 0,
    pendientes: stats.vehiculos_pendientes || 0,
    total: stats.total_vehiculos || 0
  }))

  const estadoChartData = estadisticasGlobales ? [
    { name: 'Completados', value: estadisticasGlobales.vehiculos_completados, color: '#10b981' },
    { name: 'Pendientes', value: estadisticasGlobales.vehiculos_pendientes, color: '#f59e0b' }
  ] : []

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Fecha desde</Label>
              <Input
                type="date"
                value={format(dateRange.from, 'yyyy-MM-dd')}
                onChange={(e) => setDateRange(prev => ({
                  ...prev,
                  from: e.target.value ? new Date(e.target.value) : addDays(new Date(), -30)
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha hasta</Label>
              <Input
                type="date"
                value={format(dateRange.to, 'yyyy-MM-dd')}
                onChange={(e) => setDateRange(prev => ({
                  ...prev,
                  to: e.target.value ? new Date(e.target.value) : new Date()
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Asesor</Label>
              <Select value={selectedAsesor} onValueChange={setSelectedAsesor}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar asesor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los asesores</SelectItem>
                  {asesores.map(asesor => (
                    <SelectItem key={asesor} value={asesor}>{asesor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={exportToCSV} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
            <div className="flex items-end">
              <Button onClick={handlePrintReport} className="w-full">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir PDF
              </Button>
            </div>
            <div className="flex items-end">
              <Button onClick={handleDebug} className="w-full">
                <Bug className="mr-2 h-4 w-4" />
                Debug Datos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas Globales */}
      {estadisticasGlobales && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vehículos</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticasGlobales.total_vehiculos || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Media Días Venta</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticasGlobales.media_dias_venta || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Media Días Validado</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticasGlobales.media_dias_validado || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completados</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticasGlobales.vehiculos_completados || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticasGlobales.vehiculos_pendientes || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos */}
      {!loading && chartData.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Gráfico de barras - Media de días por asesor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Media de Días por Asesor
              </CardTitle>
              <CardDescription>
                Comparativa de días promedio desde venta y desde validación hasta completado por asesor comercial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [`${value} días`, 'Media días']}
                    labelStyle={{ color: '#666' }}
                  />
                  <Legend />
                  <Bar dataKey="mediaDiasVenta" fill="#0088FE" name="Media días Venta" />
                  <Bar dataKey="mediaDiasValidado" fill="#00C49F" name="Media días Validado" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico circular - Estados de vehículos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Estado de Vehículos
              </CardTitle>
              <CardDescription>
                Distribución de vehículos por estado de preparación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={estadoChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {estadoChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de líneas - Vehículos por asesor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Vehículos por Asesor
              </CardTitle>
              <CardDescription>
                Total de vehículos procesados por cada asesor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completados" fill="#10b981" name="Completados" />
                  <Bar dataKey="pendientes" fill="#f59e0b" name="Pendientes" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de líneas - Evolución temporal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Evolución de Días de Preparación
              </CardTitle>
              <CardDescription>
                Tendencias en los tiempos de preparación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [`${value} días`, 'Media días']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="mediaDiasVenta" 
                    stroke="#0088FE" 
                    strokeWidth={2}
                    name="Media días Venta"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mediaDiasValidado" 
                    stroke="#00C49F" 
                    strokeWidth={2}
                    name="Media días Validado"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Estadísticas por Asesor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Estadísticas por Asesor
          </CardTitle>
          <CardDescription>
            Análisis detallado de tiempos de preparación por asesor comercial
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando datos...</div>
          ) : (
            <div className="space-y-4">
              {estadisticas.map((stats, index) => (
                <div key={stats.asesor} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{stats.asesor}</h3>
                    <span className="text-sm text-muted-foreground">
                      {stats.total_vehiculos} vehículos
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Media días Venta:</span>
                      <div className="font-semibold">{stats.media_dias_venta || 0} días</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Media días Validado:</span>
                      <div className="font-semibold">{stats.media_dias_validado || 0} días</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Completados:</span>
                      <div className="font-semibold text-green-600">{stats.vehiculos_completados || 0}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pendientes:</span>
                      <div className="font-semibold text-orange-600">{stats.vehiculos_pendientes || 0}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla de Datos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Detalle de Vehículos
          </CardTitle>
          <CardDescription>
            Lista detallada de vehículos con sus tiempos de preparación
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando datos...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Matrícula</th>
                    <th className="text-left p-2">Asesor</th>
                    <th className="text-left p-2">Fecha Venta</th>
                    <th className="text-left p-2">Fecha Validación</th>
                    <th className="text-left p-2">Fecha CyP</th>
                    <th className="text-left p-2">Fecha Foto360</th>
                    <th className="text-left p-2">Fecha Completado</th>
                    <th className="text-left p-2">Días Venta</th>
                    <th className="text-left p-2">Días Validado</th>
                    <th className="text-left p-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-mono">{item.matricula}</td>
                      <td className="p-2">{item.asesor}</td>
                      <td className="p-2">{item.fecha_venta ? format(parseISO(item.fecha_venta), 'dd/MM/yyyy', { locale: es }) : '-'}</td>
                      <td className="p-2">{item.fecha_validacion ? format(parseISO(item.fecha_validacion), 'dd/MM/yyyy', { locale: es }) : '-'}</td>
                      <td className="p-2">{item.fecha_cyp ? format(parseISO(item.fecha_cyp), 'dd/MM/yyyy', { locale: es }) : '-'}</td>
                      <td className="p-2">{item.fecha_foto360 ? format(parseISO(item.fecha_foto360), 'dd/MM/yyyy', { locale: es }) : '-'}</td>
                      <td className="p-2">{item.fecha_completado ? format(parseISO(item.fecha_completado), 'dd/MM/yyyy', { locale: es }) : '-'}</td>
                      <td className="p-2 font-mono">{item.dias_venta_completado}</td>
                      <td className="p-2 font-mono">{item.dias_validado_completado}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.estado === 'Completado' ? 'bg-green-100 text-green-800' :
                          item.estado === 'Validado' ? 'bg-blue-100 text-blue-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {item.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 