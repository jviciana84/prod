"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
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
  ResponsiveContainer
} from "recharts"
import { 
  Printer, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  Award,
  Target,
  BarChart3,
  FileText,
  ArrowLeft,
  RefreshCw
} from "lucide-react"

export default function InformePreciosPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [stats, setStats] = useState({
    posicionGeneral: 0,
    precioMedioNuestro: 0,
    precioMedioCompetencia: 0,
    oportunidades: 0,
    totalComparables: 0
  })
  
  // Cargar datos desde API
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const response = await fetch(`${baseUrl}/api/comparador/analisis`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Error al cargar datos')
        }
        
        const data = await response.json()
        
        if (data.success) {
          setStats(data.stats)
          setVehiculos(data.vehiculos)
        } else {
          throw new Error('Respuesta sin éxito')
        }
      } catch (error: any) {
        console.error('Error cargando datos:', error)
        setError(error.message)
        setVehiculos([])
      } finally {
        setLoading(false)
      }
    }
    
    cargarDatos()
  }, [])

  // Función para imprimir con jsPDF
  const handlePrint = async () => {
    try {
      const { jsPDF } = await import('jspdf')
      const html2canvas = (await import('html2canvas')).default
      
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      const contentWidth = pageWidth - (margin * 2)
      
      const estadisticas = calcularEstadisticas()
      if (!estadisticas) return
      
      const ahora = new Date()
      const codigoCVO = `CVO-${ahora.getFullYear()}${String(ahora.getMonth() + 1).padStart(2, '0')}${String(ahora.getDate()).padStart(2, '0')}-${String(ahora.getHours()).padStart(2, '0')}${String(ahora.getMinutes()).padStart(2, '0')}${String(ahora.getSeconds()).padStart(2, '0')}`
      const fechaCompleta = ahora.toLocaleString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      
      // PORTADA
      pdf.setFillColor(30, 41, 59)
      pdf.rect(0, 0, pageWidth, pageHeight, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(52)
      pdf.setFont('helvetica', 'bold')
      pdf.text('CVO', pageWidth / 2, 55, { align: 'center' })
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text('COMPARADOR DE VEHÍCULOS DE OCASIÓN', pageWidth / 2, 65, { align: 'center' })
      pdf.setFontSize(32)
      pdf.setFont('helvetica', 'bold')
      pdf.text('INFORME EJECUTIVO', pageWidth / 2, 105, { align: 'center' })
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Análisis Competitivo de Precios', pageWidth / 2, 120, { align: 'center' })
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('QUADIS MUNICH', pageWidth / 2, 140, { align: 'center' })
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Referencia: ${codigoCVO}`, pageWidth / 2, 155, { align: 'center' })
      pdf.setFontSize(9)
      pdf.text(fechaCompleta, pageWidth / 2, 163, { align: 'center' })
      
      pdf.save(`Informe_CVO_${codigoCVO}.pdf`)
      
    } catch (error) {
      console.error('Error generando PDF:', error)
      alert('Error al generar el PDF. Por favor, intenta de nuevo.')
    }
  }

  // Calcular estadísticas
  const calcularEstadisticas = () => {
    if (vehiculos.length === 0) return null

    const competitivos = vehiculos.filter(v => v.posicion === 'competitivo').length
    const justos = vehiculos.filter(v => v.posicion === 'justo').length
    const altos = vehiculos.filter(v => v.posicion === 'alto').length

    const mejorOpcion = vehiculos.filter(v => {
      if (v.competidores > 0 && v.precioMinimoCompetencia) {
        return v.nuestroPrecio < v.precioMinimoCompetencia
      }
      return v.competidores === 0
    }).length
    
    const peorOpcion = vehiculos.filter(v => {
      if (v.competidores > 0 && v.precioMaximoCompetencia) {
        return v.nuestroPrecio > v.precioMaximoCompetencia
      }
      return false
    }).length
    
    const opcionMedia = vehiculos.length - mejorOpcion - peorOpcion

    const año2025 = vehiculos.filter(v => parseInt(v.año) === 2025).length
    const año2024 = vehiculos.filter(v => parseInt(v.año) === 2024).length
    const año2023 = vehiculos.filter(v => parseInt(v.año) === 2023).length
    const añoAntes2023 = vehiculos.filter(v => parseInt(v.año) < 2023).length

    const menosDe30k = vehiculos.filter(v => v.km < 30000).length
    const entre30y60k = vehiculos.filter(v => v.km >= 30000 && v.km < 60000).length
    const entre60y100k = vehiculos.filter(v => v.km >= 60000 && v.km < 100000).length
    const masDe100k = vehiculos.filter(v => v.km >= 100000).length

    const menosDe30d = vehiculos.filter(v => v.diasEnStock && v.diasEnStock < 30).length
    const entre30y60d = vehiculos.filter(v => v.diasEnStock && v.diasEnStock >= 30 && v.diasEnStock < 60).length
    const entre60y90d = vehiculos.filter(v => v.diasEnStock && v.diasEnStock >= 60 && v.diasEnStock < 90).length
    const masDe90d = vehiculos.filter(v => v.diasEnStock && v.diasEnStock >= 90).length

    const menosDe30kEur = vehiculos.filter(v => v.nuestroPrecio < 30000).length
    const entre30y50k = vehiculos.filter(v => v.nuestroPrecio >= 30000 && v.nuestroPrecio < 50000).length
    const entre50y75k = vehiculos.filter(v => v.nuestroPrecio >= 50000 && v.nuestroPrecio < 75000).length
    const masDe75k = vehiculos.filter(v => v.nuestroPrecio >= 75000).length

    const precioPromedio = vehiculos.reduce((sum, v) => sum + (Number(v.nuestroPrecio) || 0), 0) / vehiculos.length
    const kmPromedio = vehiculos.reduce((sum, v) => sum + (Number(v.km) || 0), 0) / vehiculos.length
    const descuentoPromedio = vehiculos
      .filter(v => v.descuentoNuestro)
      .reduce((sum, v) => sum + (Number(v.descuentoNuestro) || 0), 0) / vehiculos.filter(v => v.descuentoNuestro).length || 0
    const diasStockPromedio = vehiculos
      .filter(v => v.diasEnStock)
      .reduce((sum, v) => sum + (Number(v.diasEnStock) || 0), 0) / vehiculos.filter(v => v.diasEnStock).length || 0

    const top5Caros = [...vehiculos]
      .filter(v => v.nuestroPrecio)
      .sort((a, b) => (b.nuestroPrecio || 0) - (a.nuestroPrecio || 0))
      .slice(0, 5)
    
    const top5Baratos = [...vehiculos]
      .filter(v => v.nuestroPrecio)
      .sort((a, b) => (a.nuestroPrecio || 0) - (b.nuestroPrecio || 0))
      .slice(0, 5)

    const top5TiempoStock = [...vehiculos]
      .filter(v => v.diasEnStock)
      .sort((a, b) => (b.diasEnStock || 0) - (a.diasEnStock || 0))
      .slice(0, 5)

    const top5MejorPosicionados = [...vehiculos]
      .filter(v => v.porcentajeDifAjustado !== null)
      .sort((a, b) => (a.porcentajeDifAjustado || 0) - (b.porcentajeDifAjustado || 0))
      .slice(0, 5)

    return {
      competitivos,
      justos,
      altos,
      mejorOpcion,
      peorOpcion,
      opcionMedia,
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

  const fechaInforme = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  // Loading y Error states
  if (loading) {
    return (
      <div className="p-4 md:p-5 space-y-4 pb-20">
        <Breadcrumbs className="mt-4" />
        <Card>
          <CardContent className="p-12 text-center">
            <BMWMSpinner size={48} className="mx-auto mb-3" />
            <p className="text-muted-foreground">Cargando informe...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !estadisticas) {
    return (
      <div className="p-4 md:p-5 space-y-4 pb-20">
        <Breadcrumbs className="mt-4" />
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-destructive" />
            <p className="text-destructive font-semibold mb-2">Error al cargar informe</p>
            <p className="text-sm text-muted-foreground mb-4">{error || 'No hay datos disponibles'}</p>
            <Button onClick={() => window.location.reload()} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

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

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Breadcrumbs 
            className="mt-4"
            segments={[
              { title: "Dashboard", href: "/dashboard" },
              { title: "Comparador de Precios", href: "/dashboard/comparador-precios" },
              { title: "Informe", href: "/dashboard/comparador-precios/informe" }
            ]}
          />
          <div className="flex items-center gap-2 mt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <Button onClick={handlePrint} size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Informe de Precios</h1>
            <p className="text-muted-foreground">Análisis Competitivo Detallado</p>
          </div>
        </div>
      </div>

      {/* Contenido del Informe */}
      <div className="space-y-6">
        
        {/* Resumen Ejecutivo */}
        <Card>
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
                <p className="text-2xl font-bold">{vehiculos.length}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Distribución por Posición</CardTitle>
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

          <Card>
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

          <Card>
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Distribución Días en Stock</CardTitle>
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Distribución por Precio</CardTitle>
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Posición en el Mercado</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Mejor Opción', value: estadisticas.mejorOpcion, color: '#22c55e' },
                      { name: 'Opción Media', value: estadisticas.opcionMedia, color: '#f59e0b' },
                      { name: 'Peor Opción', value: estadisticas.peorOpcion, color: '#ef4444' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Rankings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-500" />
                Top 5 - Más Caros
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
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-green-500" />
                Top 5 - Más Baratos
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
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-500" />
                Top 5 - Mejor Posicionados
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
                        <p className="text-xs text-muted-foreground">{v.modelo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{v.nuestroPrecio?.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                Top 5 - Más Tiempo en Stock
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
                        <p className="text-xs text-muted-foreground">{v.modelo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-500">{v.diasEnStock} días</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Listado Completo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Listado Completo - {vehiculos.length} Vehículos
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
                  {vehiculos.map((v, idx) => (
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
                          {v.posicion === 'competitivo' ? 'C' : v.posicion === 'alto' ? 'A' : 'J'}
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

        {/* Grid: Análisis por Modelo + Recomendaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Análisis por Modelo */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Análisis por Modelo</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const modelosAgrupados = vehiculos.reduce((acc: any, v) => {
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
                  acc[modelo].precioPromedio += Number(v.nuestroPrecio) || 0
                  acc[modelo].kmPromedio += Number(v.km) || 0
                  acc[modelo].diasPromedio += Number(v.diasEnStock) || 0
                  if (v.posicion === 'competitivo') acc[modelo].competitivos++
                  if (v.posicion === 'alto') acc[modelo].altos++
                  return acc
                }, {})

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
                          <th className="p-2 text-right">Días Stock</th>
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

          {/* Recomendaciones Estratégicas */}
          <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Recomendaciones Estratégicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {estadisticas.altos > 0 && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm font-semibold text-red-500 mb-2">Acción Urgente</p>
                <p className="text-xs text-muted-foreground">
                  <strong>{estadisticas.altos} vehículos</strong> con precios altos. Se recomienda ajustar precios.
                </p>
              </div>
            )}
            
            {estadisticas.masDe90d > 0 && (
              <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <p className="text-sm font-semibold text-orange-500 mb-2">Stock Prolongado</p>
                <p className="text-xs text-muted-foreground">
                  <strong>{estadisticas.masDe90d} vehículos</strong> llevan más de 90 días en stock.
                </p>
              </div>
            )}
            
            {estadisticas.competitivos > vehiculos.length * 0.5 && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm font-semibold text-green-500 mb-2">Buen Posicionamiento</p>
                <p className="text-xs text-muted-foreground">
                  <strong>{((estadisticas.competitivos / vehiculos.length) * 100).toFixed(0)}%</strong> de vehículos con precios competitivos.
                </p>
              </div>
            )}

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm font-semibold text-blue-500 mb-2">Conclusión General</p>
              <p className="text-xs text-muted-foreground">
                Posición general: <strong>{stats.posicionGeneral > 0 ? `+${stats.posicionGeneral.toFixed(1)}%` : `${stats.posicionGeneral.toFixed(1)}%`}</strong> vs mercado.
              </p>
            </div>
          </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

