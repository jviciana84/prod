"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts"
import { 
  Printer, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  DollarSign,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  Award,
  Target,
  BarChart3
} from "lucide-react"

interface InformeComparadorProps {
  open: boolean
  onClose: () => void
  vehiculos: any[]
  stats: any
  filter: string
}

export function InformeComparador({ open, onClose, vehiculos, stats, filter }: InformeComparadorProps) {
  
  // Agregar estilos para impresión
  useEffect(() => {
    if (open) {
      const style = document.createElement('style')
      style.id = 'print-styles'
      style.textContent = `
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          [role="dialog"] {
            position: static !important;
            max-width: 100% !important;
            max-height: 100% !important;
            overflow: visible !important;
          }
          [role="dialog"] * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .print\\:break-before {
            page-break-before: always;
            break-before: page;
          }
        }
      `
      document.head.appendChild(style)
      
      return () => {
        const existing = document.getElementById('print-styles')
        if (existing) existing.remove()
      }
    }
  }, [open])

  // Función para imprimir
  const handlePrint = () => {
    window.print()
  }

  // Filtrar vehículos según el filtro actual
  const vehiculosFiltrados = filter === 'all' 
    ? vehiculos 
    : vehiculos.filter(v => v.posicion === filter)

  // Calcular estadísticas avanzadas
  const calcularEstadisticas = () => {
    if (vehiculosFiltrados.length === 0) return null

    // Por posición
    const competitivos = vehiculosFiltrados.filter(v => v.posicion === 'competitivo').length
    const justos = vehiculosFiltrados.filter(v => v.posicion === 'justo').length
    const altos = vehiculosFiltrados.filter(v => v.posicion === 'alto').length

    // Por antigüedad
    const año2025 = vehiculosFiltrados.filter(v => parseInt(v.año) === 2025).length
    const año2024 = vehiculosFiltrados.filter(v => parseInt(v.año) === 2024).length
    const año2023 = vehiculosFiltrados.filter(v => parseInt(v.año) === 2023).length
    const añoAntes2023 = vehiculosFiltrados.filter(v => parseInt(v.año) < 2023).length

    // Por rango de KM
    const menosDe30k = vehiculosFiltrados.filter(v => v.km < 30000).length
    const entre30y60k = vehiculosFiltrados.filter(v => v.km >= 30000 && v.km < 60000).length
    const entre60y100k = vehiculosFiltrados.filter(v => v.km >= 60000 && v.km < 100000).length
    const masDe100k = vehiculosFiltrados.filter(v => v.km >= 100000).length

    // Por días en stock
    const menosDe30d = vehiculosFiltrados.filter(v => v.diasEnStock && v.diasEnStock < 30).length
    const entre30y60d = vehiculosFiltrados.filter(v => v.diasEnStock && v.diasEnStock >= 30 && v.diasEnStock < 60).length
    const entre60y90d = vehiculosFiltrados.filter(v => v.diasEnStock && v.diasEnStock >= 60 && v.diasEnStock < 90).length
    const masDe90d = vehiculosFiltrados.filter(v => v.diasEnStock && v.diasEnStock >= 90).length

    // Por rango de precio
    const menosDe30kEur = vehiculosFiltrados.filter(v => v.nuestroPrecio < 30000).length
    const entre30y50k = vehiculosFiltrados.filter(v => v.nuestroPrecio >= 30000 && v.nuestroPrecio < 50000).length
    const entre50y75k = vehiculosFiltrados.filter(v => v.nuestroPrecio >= 50000 && v.nuestroPrecio < 75000).length
    const masDe75k = vehiculosFiltrados.filter(v => v.nuestroPrecio >= 75000).length

    // Promedios
    const precioPromedio = vehiculosFiltrados.reduce((sum, v) => sum + (v.nuestroPrecio || 0), 0) / vehiculosFiltrados.length
    const kmPromedio = vehiculosFiltrados.reduce((sum, v) => sum + (v.km || 0), 0) / vehiculosFiltrados.length
    const descuentoPromedio = vehiculosFiltrados
      .filter(v => v.descuentoNuestro)
      .reduce((sum, v) => sum + v.descuentoNuestro, 0) / vehiculosFiltrados.filter(v => v.descuentoNuestro).length || 0
    const diasStockPromedio = vehiculosFiltrados
      .filter(v => v.diasEnStock)
      .reduce((sum, v) => sum + v.diasEnStock, 0) / vehiculosFiltrados.filter(v => v.diasEnStock).length || 0

    // Top 5 más caros y más baratos
    const top5Caros = [...vehiculosFiltrados]
      .filter(v => v.nuestroPrecio)
      .sort((a, b) => (b.nuestroPrecio || 0) - (a.nuestroPrecio || 0))
      .slice(0, 5)
    
    const top5Baratos = [...vehiculosFiltrados]
      .filter(v => v.nuestroPrecio)
      .sort((a, b) => (a.nuestroPrecio || 0) - (b.nuestroPrecio || 0))
      .slice(0, 5)

    // Top 5 más tiempo en stock
    const top5TiempoStock = [...vehiculosFiltrados]
      .filter(v => v.diasEnStock)
      .sort((a, b) => (b.diasEnStock || 0) - (a.diasEnStock || 0))
      .slice(0, 5)

    // Top 5 mejor posicionados
    const top5MejorPosicionados = [...vehiculosFiltrados]
      .filter(v => v.porcentajeDifAjustado !== null)
      .sort((a, b) => (a.porcentajeDifAjustado || 0) - (b.porcentajeDifAjustado || 0))
      .slice(0, 5)

    return {
      competitivos,
      justos,
      altos,
      año2025,
      año2024,
      año2023,
      añoAntes2023,
      menosDe30k,
      entre30y60k,
      entre60y100k,
      masDe100k,
      menosDe30d,
      entre30y60d,
      entre60y90d,
      masDe90d,
      menosDe30kEur,
      entre30y50k,
      entre50y75k,
      masDe75k,
      precioPromedio,
      kmPromedio,
      descuentoPromedio,
      diasStockPromedio,
      top5Caros,
      top5Baratos,
      top5TiempoStock,
      top5MejorPosicionados
    }
  }

  const estadisticas = calcularEstadisticas()
  if (!estadisticas) return null

  // Preparar datos para gráficos
  const dataPosicion = [
    { name: 'Competitivos', value: estadisticas.competitivos, color: '#22c55e' },
    { name: 'Justos', value: estadisticas.justos, color: '#eab308' },
    { name: 'Altos', value: estadisticas.altos, color: '#ef4444' }
  ]

  const dataAntiguedad = [
    { name: '2025', value: estadisticas.año2025 },
    { name: '2024', value: estadisticas.año2024 },
    { name: '2023', value: estadisticas.año2023 },
    { name: '<2023', value: estadisticas.añoAntes2023 }
  ]

  const dataKilometraje = [
    { name: '<30k', value: estadisticas.menosDe30k },
    { name: '30-60k', value: estadisticas.entre30y60k },
    { name: '60-100k', value: estadisticas.entre60y100k },
    { name: '>100k', value: estadisticas.masDe100k }
  ]

  const dataDiasStock = [
    { name: '<30d', value: estadisticas.menosDe30d, color: '#22c55e' },
    { name: '30-60d', value: estadisticas.entre30y60d, color: '#eab308' },
    { name: '60-90d', value: estadisticas.entre60y90d, color: '#f97316' },
    { name: '>90d', value: estadisticas.masDe90d, color: '#ef4444' }
  ]

  const dataPrecio = [
    { name: '<30k€', value: estadisticas.menosDe30kEur },
    { name: '30-50k€', value: estadisticas.entre30y50k },
    { name: '50-75k€', value: estadisticas.entre50y75k },
    { name: '>75k€', value: estadisticas.masDe75k }
  ]

  const fechaInforme = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto print:max-w-full print:max-h-full">
        <DialogHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Informe Detallado - Análisis Competitivo de Precios
            </DialogTitle>
            <Button onClick={handlePrint} size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </DialogHeader>

        {/* Contenido del Informe */}
        <div className="space-y-6 print:space-y-4">
          
          {/* Cabecera del Informe (para impresión) */}
          <div className="hidden print:block border-b-2 border-primary pb-4 mb-6">
            <h1 className="text-3xl font-bold mb-2">Informe de Análisis Competitivo</h1>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Fecha:</strong> {fechaInforme}</p>
                <p><strong>Total vehículos analizados:</strong> {vehiculosFiltrados.length}</p>
                <p><strong>Filtro aplicado:</strong> {
                  filter === 'all' ? 'Todos los vehículos' :
                  filter === 'competitivo' ? 'Precios Competitivos' :
                  filter === 'justo' ? 'Precios Justos' : 'Precios Altos'
                }</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">Motor Munich - Quadis</p>
                <p className="text-sm text-muted-foreground">Departamento Comercial</p>
              </div>
            </div>
          </div>

          {/* Resumen Ejecutivo */}
          <Card className="print:break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Resumen Ejecutivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Package className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{vehiculosFiltrados.length}</p>
                  <p className="text-xs text-muted-foreground">Vehículos Analizados</p>
                </div>
                <div className="text-center p-4 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{estadisticas.competitivos}</p>
                  <p className="text-xs text-muted-foreground">Precios Competitivos</p>
                </div>
                <div className="text-center p-4 bg-red-500/10 rounded-lg">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                  <p className="text-2xl font-bold">{estadisticas.altos}</p>
                  <p className="text-xs text-muted-foreground">Precios Altos</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold">{estadisticas.precioPromedio.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</p>
                  <p className="text-xs text-muted-foreground">Precio Promedio</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">KM Promedio</p>
                  <p className="text-xl font-bold">{estadisticas.kmPromedio.toLocaleString('es-ES', { maximumFractionDigits: 0 })} km</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Descuento Promedio</p>
                  <p className="text-xl font-bold text-green-500">{estadisticas.descuentoPromedio.toFixed(1)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Días en Stock Promedio</p>
                  <p className="text-xl font-bold">{estadisticas.diasStockPromedio.toFixed(0)} días</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gráficos de Distribución */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
            
            {/* Distribución por Posición */}
            <Card className="print:break-inside-avoid">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Distribución por Posición Competitiva</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={dataPosicion}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dataPosicion.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribución por Antigüedad */}
            <Card className="print:break-inside-avoid">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Distribución por Año</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dataAntiguedad}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribución por Kilometraje */}
            <Card className="print:break-inside-avoid">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Distribución por Kilometraje</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dataKilometraje}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribución por Días en Stock */}
            <Card className="print:break-inside-avoid">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Distribución por Días en Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dataDiasStock}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8">
                      {dataDiasStock.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribución por Rango de Precio */}
            <Card className="print:break-inside-avoid md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Distribución por Rango de Precio</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dataPrecio}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top 5 Más Caros */}
          <Card className="print:break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-500" />
                Top 5 - Vehículos Más Caros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {estadisticas.top5Caros.map((v, idx) => (
                  <div key={v.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-muted-foreground/50">#{idx + 1}</span>
                      <div>
                        <p className="font-semibold">{v.matricula}</p>
                        <p className="text-xs text-muted-foreground">{v.modelo} • {v.año} • {v.km?.toLocaleString()} km</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{v.nuestroPrecio?.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</p>
                      <Badge variant={v.posicion === 'alto' ? 'destructive' : 'outline'} className="text-xs">
                        {v.posicion === 'competitivo' ? '✓' : v.posicion === 'alto' ? '⚠' : '≈'} {v.posicion}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top 5 Más Baratos */}
          <Card className="print:break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-green-500" />
                Top 5 - Vehículos Más Baratos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {estadisticas.top5Baratos.map((v, idx) => (
                  <div key={v.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-muted-foreground/50">#{idx + 1}</span>
                      <div>
                        <p className="font-semibold">{v.matricula}</p>
                        <p className="text-xs text-muted-foreground">{v.modelo} • {v.año} • {v.km?.toLocaleString()} km</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{v.nuestroPrecio?.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</p>
                      <Badge variant={v.posicion === 'competitivo' ? 'default' : 'outline'} className="text-xs">
                        {v.posicion === 'competitivo' ? '✓' : v.posicion === 'alto' ? '⚠' : '≈'} {v.posicion}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top 5 Mejor Posicionados */}
          <Card className="print:break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-500" />
                Top 5 - Mejor Posicionados (Precio/Calidad)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {estadisticas.top5MejorPosicionados.map((v, idx) => (
                  <div key={v.id} className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-green-500">#{idx + 1}</span>
                      <div>
                        <p className="font-semibold">{v.matricula}</p>
                        <p className="text-xs text-muted-foreground">{v.modelo} • {v.año} • {v.km?.toLocaleString()} km</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{v.nuestroPrecio?.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</p>
                      <p className="text-xs text-green-500 font-medium">
                        {v.porcentajeDifAjustado?.toFixed(1)}% mejor que mercado
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top 5 Más Tiempo en Stock */}
          <Card className="print:break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                Top 5 - Más Tiempo en Stock (Acción Urgente)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {estadisticas.top5TiempoStock.map((v, idx) => (
                  <div key={v.id} className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-red-500">#{idx + 1}</span>
                      <div>
                        <p className="font-semibold">{v.matricula}</p>
                        <p className="text-xs text-muted-foreground">{v.modelo} • {v.nuestroPrecio?.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-500">{v.diasEnStock} días</p>
                      <p className="text-xs text-muted-foreground">
                        Recomendado: {v.precioRecomendado?.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tabla Detallada de Todos los Vehículos */}
          <Card className="print:break-before">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Listado Completo - {vehiculosFiltrados.length} Vehículos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr className="border-b">
                      <th className="p-2 text-left">Matrícula</th>
                      <th className="p-2 text-left">Modelo</th>
                      <th className="p-2 text-center">Año</th>
                      <th className="p-2 text-right">KM</th>
                      <th className="p-2 text-right">Precio</th>
                      <th className="p-2 text-right">Desc%</th>
                      <th className="p-2 text-right">Recomendado</th>
                      <th className="p-2 text-center">Posición</th>
                      <th className="p-2 text-center">Días Stock</th>
                      <th className="p-2 text-center">Competidores</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehiculosFiltrados.map((v, idx) => (
                      <tr key={v.id} className={`border-b hover:bg-muted/50 ${idx % 2 === 0 ? 'bg-muted/20' : ''}`}>
                        <td className="p-2 font-medium">{v.matricula}</td>
                        <td className="p-2 text-muted-foreground">{v.modelo}</td>
                        <td className="p-2 text-center">{v.año}</td>
                        <td className="p-2 text-right">{v.km?.toLocaleString()}</td>
                        <td className="p-2 text-right font-semibold">{v.nuestroPrecio?.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</td>
                        <td className="p-2 text-right text-green-500">{v.descuentoNuestro?.toFixed(1)}%</td>
                        <td className="p-2 text-right font-medium text-blue-500">{v.precioRecomendado?.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</td>
                        <td className="p-2 text-center">
                          <Badge 
                            variant={v.posicion === 'competitivo' ? 'default' : 'outline'}
                            className={`text-[10px] ${
                              v.posicion === 'competitivo' ? 'bg-green-500' :
                              v.posicion === 'alto' ? 'bg-red-500 text-white' :
                              'bg-yellow-500 text-white'
                            }`}
                          >
                            {v.posicion === 'competitivo' ? '✓' : v.posicion === 'alto' ? '⚠' : '≈'}
                          </Badge>
                        </td>
                        <td className={`p-2 text-center ${v.diasEnStock > 60 ? 'text-red-500 font-bold' : ''}`}>
                          {v.diasEnStock || '-'}
                        </td>
                        <td className="p-2 text-center">{v.competidores || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Análisis por Modelo */}
          <Card className="print:break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Análisis por Modelo</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                // Agrupar por modelo
                const modelosAgrupados = vehiculosFiltrados.reduce((acc: any, v) => {
                  const modelo = v.modelo || 'Sin modelo'
                  if (!acc[modelo]) {
                    acc[modelo] = {
                      count: 0,
                      precioPromedio: 0,
                      kmPromedio: 0,
                      competitivos: 0,
                      altos: 0,
                      diasPromedio: 0
                    }
                  }
                  acc[modelo].count++
                  acc[modelo].precioPromedio += v.nuestroPrecio || 0
                  acc[modelo].kmPromedio += v.km || 0
                  acc[modelo].diasPromedio += v.diasEnStock || 0
                  if (v.posicion === 'competitivo') acc[modelo].competitivos++
                  if (v.posicion === 'alto') acc[modelo].altos++
                  return acc
                }, {})

                // Calcular promedios y ordenar por cantidad
                const modelosArray = Object.entries(modelosAgrupados).map(([modelo, data]: [string, any]) => ({
                  modelo,
                  count: data.count,
                  precioPromedio: data.precioPromedio / data.count,
                  kmPromedio: data.kmPromedio / data.count,
                  diasPromedio: data.diasPromedio / data.count,
                  competitivos: data.competitivos,
                  altos: data.altos
                })).sort((a, b) => b.count - a.count)

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted">
                        <tr className="border-b">
                          <th className="p-2 text-left">Modelo</th>
                          <th className="p-2 text-center">Unidades</th>
                          <th className="p-2 text-right">Precio Medio</th>
                          <th className="p-2 text-right">KM Medio</th>
                          <th className="p-2 text-center">Competitivos</th>
                          <th className="p-2 text-center">Altos</th>
                          <th className="p-2 text-right">Días Stock Medio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modelosArray.map((m, idx) => (
                          <tr key={m.modelo} className={`border-b ${idx % 2 === 0 ? 'bg-muted/20' : ''}`}>
                            <td className="p-2 font-medium">{m.modelo}</td>
                            <td className="p-2 text-center">{m.count}</td>
                            <td className="p-2 text-right">{m.precioPromedio.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</td>
                            <td className="p-2 text-right">{m.kmPromedio.toLocaleString('es-ES', { maximumFractionDigits: 0 })} km</td>
                            <td className="p-2 text-center text-green-500">{m.competitivos}</td>
                            <td className="p-2 text-center text-red-500">{m.altos}</td>
                            <td className="p-2 text-right">{m.diasPromedio.toFixed(0)}d</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          {/* Recomendaciones Generales */}
          <Card className="print:break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4" />
                Recomendaciones Estratégicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {estadisticas.altos > 0 && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-red-500 mb-2">⚠️ Acción Urgente</p>
                  <p className="text-xs text-muted-foreground">
                    Tienes <strong>{estadisticas.altos} vehículos con precios altos</strong>. Se recomienda ajustar precios para mejorar competitividad y reducir días en stock.
                  </p>
                </div>
              )}
              
              {estadisticas.masDe90d > 0 && (
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-orange-500 mb-2">⏰ Stock Prolongado</p>
                  <p className="text-xs text-muted-foreground">
                    <strong>{estadisticas.masDe90d} vehículos</strong> llevan más de 90 días en stock. Considera descuentos adicionales del 5-10% para venta rápida.
                  </p>
                </div>
              )}
              
              {estadisticas.competitivos > vehiculosFiltrados.length * 0.5 && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-green-500 mb-2">✅ Buen Posicionamiento</p>
                  <p className="text-xs text-muted-foreground">
                    <strong>{((estadisticas.competitivos / vehiculosFiltrados.length) * 100).toFixed(0)}% de tus vehículos</strong> tienen precios competitivos. Mantén esta estrategia.
                  </p>
                </div>
              )}

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm font-semibold text-blue-500 mb-2">📊 Conclusión General</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tu posición general es <strong>{stats.posicionGeneral > 0 ? `${stats.posicionGeneral.toFixed(1)}% por encima` : `${Math.abs(stats.posicionGeneral).toFixed(1)}% por debajo`}</strong> del mercado. 
                  {stats.posicionGeneral < 0 ? ' Excelente posicionamiento competitivo.' : ' Considera ajustar precios para mejorar posición.'}
                  {' '}Tienes <strong>{stats.oportunidades} oportunidades</strong> de mejora identificadas.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer para impresión */}
          <div className="hidden print:block text-center text-xs text-muted-foreground pt-6 border-t mt-6">
            <p>Informe generado el {fechaInforme}</p>
            <p>Sistema de Análisis Competitivo - Motor Munich / Quadis</p>
            <p className="mt-2">Página {'{pageNumber}'} de {'{totalPages}'}</p>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}

