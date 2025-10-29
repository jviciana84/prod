"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { CompactSearchWithModal } from "@/components/dashboard/compact-search-with-modal"
import { TrendingDown, TrendingUp, Minus, Target, Euro, AlertCircle, ExternalLink, Search, Filter, RefreshCw, BarChart3, Edit, Trash2, Link as LinkIcon, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from "recharts"

// MOCK DATA eliminado - Solo se usarán datos reales de la API

function PriceThermometer({ porcentaje, diferencia }: { porcentaje: number | null, diferencia: number | null }) {
  // Manejar valores nulos
  if (porcentaje === null || diferencia === null) {
    return (
      <div className="flex items-center gap-2 min-w-[200px]">
        <Minus className="w-4 h-4 text-muted-foreground" />
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-muted" style={{ width: '0%' }} />
        </div>
        <span className="text-xs font-medium text-muted-foreground">N/A</span>
      </div>
    )
  }

  const getColor = () => {
    if (porcentaje <= -3) return "bg-green-500"
    if (porcentaje <= 3) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getWidth = () => {
    const abs = Math.abs(porcentaje)
    return Math.min(abs * 10, 100)
  }

  const getIcon = () => {
    if (porcentaje <= -3) return <TrendingDown className="w-4 h-4 text-green-500" />
    if (porcentaje <= 3) return <Minus className="w-4 h-4 text-yellow-500" />
    return <TrendingUp className="w-4 h-4 text-red-500" />
  }

  return (
    <div className="flex items-center gap-2 min-w-[200px]">
      {getIcon()}
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor()} transition-all`}
          style={{ width: `${getWidth()}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${porcentaje <= -3 ? 'text-green-500' : porcentaje <= 3 ? 'text-yellow-500' : 'text-red-500'}`}>
        {diferencia > 0 ? '+' : ''}{diferencia.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
      </span>
    </div>
  )
}

// Custom Tooltip para el gráfico
function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload[0]) {
    const data = payload[0].payload
    const tipo = data.tipo // 'nuestro' | 'quadis' | 'competencia'
    
    let emoji = '🔵'
    let titulo = data.concesionario || 'Desconocido'
    
    if (tipo === 'nuestro') {
      emoji = '🔴'
      titulo = `${data.matricula} (Mi vehículo)`
    } else if (tipo === 'quadis') {
      emoji = '🟢'
      titulo = `${data.concesionario} (Quadis)`
    }
    
    return (
      <Card className="p-3 shadow-lg max-w-xs">
        <div className="space-y-1">
          <div className="font-semibold text-sm">
            {emoji} {titulo}
          </div>
          <div className="text-xs text-muted-foreground">
            {data.modelo}
          </div>
          <div className="text-xs">
            <strong>{data.precio?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€</strong> • {data.km?.toLocaleString()} km
          </div>
          {data.precioNuevo && (
            <div className="text-xs text-muted-foreground">
              Nuevo: {data.precioNuevo.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€ ({((1 - data.precio/data.precioNuevo) * 100).toFixed(2)}% desc.)
            </div>
          )}
          {data.url && (
            <div className="text-xs text-blue-500 mt-1">
              🔗 Click para ver anuncio
            </div>
          )}
        </div>
      </Card>
    )
  }
  return null
}

function CompetitorDetailModal({ vehicle, open, onClose }: { vehicle: any, open: boolean, onClose: () => void }) {
  if (!vehicle) return null

  // Preparar datos para el gráfico con 3 tipos: nuestro, quadis, competencia
  const scatterData = [
    // Nuestro vehículo específico (el que estamos viendo)
    {
      km: vehicle.km,
      precio: vehicle.nuestroPrecio,
      precioNuevo: vehicle.precioNuevo,
      tipo: 'nuestro', // nuestro | quadis | competencia
      matricula: vehicle.matricula,
      modelo: vehicle.modelo,
      año: vehicle.año
    },
    // Competidores + Quadis
    ...vehicle.competidoresDetalle.map((comp: any) => {
      const esQuadis = comp.concesionario && (
        comp.concesionario.toLowerCase().includes('quadis') || 
        comp.concesionario.toLowerCase().includes('duc')
      )
      return {
        km: comp.km,
        precio: comp.precio,
        precioNuevo: comp.precioNuevo,
        tipo: esQuadis ? 'quadis' : 'competencia',
        concesionario: comp.concesionario,
        modelo: vehicle.modelo,
        año: comp.año,
        url: comp.url,
        dias: comp.dias
      }
    })
  ]

  const handleScatterClick = (data: any) => {
    if (data && data.url) {
      window.open(data.url, '_blank')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header con título a la izquierda y recomendación a la derecha */}
        <div className="grid grid-cols-[1fr,auto] gap-4 pb-4 border-b">
          {/* Columna izquierda: Título */}
          <div className="space-y-1">
            <DialogTitle className="text-xl flex items-center gap-2">
              Análisis Competitivo - {vehicle.matricula}
              {vehicle.enlaceAnuncio && (
                <Button size="sm" variant="outline" asChild>
                  <a href={vehicle.enlaceAnuncio} target="_blank" rel="noopener noreferrer">
                    <LinkIcon className="w-3 h-3 mr-1" />
                    Ver nuestro anuncio
                  </a>
                </Button>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {vehicle.modelo} • {vehicle.año} • {vehicle.km.toLocaleString()} km • Precio nuevo: {vehicle.precioNuevo.toLocaleString()}€
            </DialogDescription>
          </div>

          {/* Columna derecha: Recomendación */}
          <Card className={`min-w-[380px] ${
            vehicle.posicion === 'competitivo' 
              ? 'shadow-[0_0_20px_rgba(34,197,94,0.4)] border-green-500/50' 
              : vehicle.posicion === 'alto'
              ? 'shadow-[0_0_20px_rgba(239,68,68,0.4)] border-red-500/50'
              : 'shadow-[0_0_20px_rgba(234,179,8,0.4)] border-yellow-500/50'
          }`}>
            <CardContent className="p-3 space-y-1">
              {/* Línea 1: Etiqueta */}
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4" />
                <span className="text-sm font-semibold">Recomendación Estratégica</span>
              </div>
              {/* Línea 2: Badge + Texto */}
              {vehicle.posicion === "competitivo" && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500 text-[10px] h-5 shrink-0">✓ Competitivo</Badge>
                  <p className="text-xs text-muted-foreground">
                    {vehicle.recomendacion || `Precio mejor que mercado. Valor esperado: ${vehicle.valorEsperadoNuestro?.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€`}
                  </p>
                </div>
              )}
              {vehicle.posicion === "alto" && (
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-[10px] h-5 shrink-0">⚠ Alto</Badge>
                  <p className="text-xs text-muted-foreground">
                    {vehicle.recomendacion || `Precio elevado. Valor esperado: ${vehicle.valorEsperadoNuestro?.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€`}
                  </p>
                </div>
              )}
              {vehicle.posicion === "justo" && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-500 text-[10px] h-5 shrink-0">≈ Justo</Badge>
                  <p className="text-xs text-muted-foreground">
                    {vehicle.recomendacion || 'En línea con mercado. Precio adecuado.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {/* KPIs Compactos */}
          <div className="grid grid-cols-5 gap-2">
            <Card>
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground">Nuestro Precio</div>
                <div className="text-base font-bold">{vehicle.nuestroPrecio.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€</div>
                <div className="text-xs text-green-500">{vehicle.descuentoNuestro?.toFixed(2)}% desc.</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground">Precio Medio</div>
                <div className="text-base font-bold">{vehicle.precioMedioCompetencia.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€</div>
                <div className="text-xs text-muted-foreground">{vehicle.descuentoMedioCompetencia?.toFixed(2)}% desc.</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground">Diferencia €</div>
                <div className={`text-base font-bold ${vehicle.diferencia < 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {vehicle.diferencia > 0 ? '+' : ''}{vehicle.diferencia.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground">Ventaja Descuento</div>
                <div className={`text-base font-bold ${(vehicle.descuentoNuestro - vehicle.descuentoMedioCompetencia) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {(vehicle.descuentoNuestro - vehicle.descuentoMedioCompetencia) > 0 ? '+' : ''}{(vehicle.descuentoNuestro - vehicle.descuentoMedioCompetencia).toFixed(2)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground">Competidores</div>
                <div className="text-base font-bold">{vehicle.competidores}</div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Dispersión */}
          {vehicle.competidoresDetalle.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Comparativa de Resultados RED
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <ScatterChart margin={{ top: 30, right: 10, bottom: 35, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      type="number" 
                      dataKey="km" 
                      name="Kilómetros" 
                      label={{ value: 'Kilómetros', position: 'insideBottom', offset: -5 }}
                      tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="precio" 
                      name="Precio" 
                      label={{ value: 'Precio (€)', angle: -90, position: 'insideLeft' }}
                      tickFormatter={(value) => `${(value/1000).toFixed(0)}k€`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                    
                    {/* Leyenda manual (arriba del gráfico) */}
                    <text x="50%" y="15" textAnchor="middle" fontSize="12" fill="currentColor">
                      <tspan fill="#3b82f6" fontSize="16">● </tspan>
                      <tspan fill="currentColor">Competencia   </tspan>
                      <tspan fill="#22c55e" fontSize="16">● </tspan>
                      <tspan fill="currentColor">Quadis   </tspan>
                      <tspan fill="#ef4444" fontSize="16">● </tspan>
                      <tspan fill="currentColor">Mi vehículo</tspan>
                    </text>
                    
                    {/* UN SOLO Scatter con shape custom según tipo */}
                    <Scatter 
                      data={scatterData}
                      isAnimationActive={false}
                      shape={(props: any) => {
                        const { cx, cy, payload } = props
                        let fill = '#3b82f6' // Azul por defecto
                        
                        if (payload.tipo === 'quadis') fill = '#22c55e' // Verde
                        if (payload.tipo === 'nuestro') fill = '#ef4444' // Rojo
                        
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={6}
                            fill={fill}
                            stroke="none"
                            style={{ cursor: payload.url ? 'pointer' : 'default' }}
                            onClick={() => {
                              if (payload.url) {
                                window.open(payload.url, '_blank')
                              }
                            }}
                          />
                        )
                      }}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  💡 Click en los puntos azules (competencia) o verdes (Quadis) para abrir el anuncio
                </p>
              </CardContent>
            </Card>
          )}

          {/* Lista de Competidores */}
          {vehicle.competidoresDetalle.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Competidores Directos ({vehicle.competidoresDetalle.length})</h3>
              <div className="grid grid-cols-2 gap-2">
                {vehicle.competidoresDetalle.map((comp: any) => (
                  <Card key={comp.id} className="bg-muted/30 hover:bg-muted/50 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{comp.concesionario}</div>
                          <div className="text-xs text-muted-foreground">
                            {comp.km?.toLocaleString()} km • {comp.dias} días
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Desc: {comp.precioNuevo ? ((1 - comp.precio/comp.precioNuevo) * 100).toFixed(2) : 'N/A'}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm">{comp.precio?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€</div>
                          <div className={`text-xs ${comp.precio > vehicle.nuestroPrecio ? 'text-red-500' : 'text-green-500'}`}>
                            {comp.precio > vehicle.nuestroPrecio ? '+' : ''}{(comp.precio - vehicle.nuestroPrecio).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                          </div>
                          {comp.url && (
                            <Button size="sm" variant="ghost" className="h-6 px-2 mt-1" asChild>
                              <a href={comp.url} target="_blank" rel="noopener noreferrer">
                                <LinkIcon className="w-3 h-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ComparadorPreciosPage() {
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [filter, setFilter] = useState<"all" | "competitivo" | "justo" | "alto">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [modeloFilter, setModeloFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [configOpen, setConfigOpen] = useState(false)
  
  // Datos reales de la API (NO usar datos mock)
  const [stats, setStats] = useState({
    posicionGeneral: 0,
    precioMedioNuestro: 0,
    precioMedioCompetencia: 0,
    oportunidades: 0,
    totalComparables: 0
  })
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null)
  
  // Parámetros de valoración (configurables)
  const [parametros, setParametros] = useState({
    depreciacionAño1: 15,
    depreciacionAño2: 25,
    depreciacionAño3Plus: 10,
    costoPorKm: 0.15,
    umbralCompetitivo: -5,
    umbralAlto: 5,
    diasStockAlerta: 60
  })
  
  // Filtros de tolerancia
  const [toleranciaKm, setToleranciaKm] = useState("10000")
  const [toleranciaMeses, setToleranciaMeses] = useState("9")
  const [toleranciaCV, setToleranciaCV] = useState("20")

  // Cargar parámetros desde localStorage
  useEffect(() => {
    const savedParams = localStorage.getItem('comparador_parametros')
    if (savedParams) {
      try {
        setParametros(JSON.parse(savedParams))
      } catch (e) {
        console.error('Error cargando parámetros:', e)
      }
    }
  }, [])

  // Cargar datos desde API
  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/comparador/analisis')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al cargar datos')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
        setVehiculos(data.vehiculos)
        setUltimaActualizacion(new Date())
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

  const handleRecalcular = () => {
    // TODO: Implementar recálculo con tolerancias
    cargarDatos()
  }

  // Obtener modelos únicos para el filtro
  const modelosUnicos = Array.from(new Set(vehiculos.map((v: any) => v.modelo)))

  const filteredVehicles = vehiculos.filter((v: any) => {
    const matchFilter = filter === "all" || v.posicion === filter
    const matchSearch = searchTerm === "" || 
      v.matricula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.modelo?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchModelo = modeloFilter === "all" || v.modelo === modeloFilter
    
    return matchFilter && matchSearch && matchModelo
  })

  // Función para formatear tiempo relativo
  const formatearTiempoRelativo = (fecha: Date | null) => {
    if (!fecha) return 'Nunca'
    const ahora = new Date()
    const diffMs = ahora.getTime() - fecha.getTime()
    const diffMinutos = Math.floor(diffMs / 60000)
    
    if (diffMinutos < 1) return 'Ahora'
    if (diffMinutos < 60) return `Hace ${diffMinutos}m`
    const diffHoras = Math.floor(diffMinutos / 60)
    if (diffHoras < 24) return `Hace ${diffHoras}h`
    return `Hace ${Math.floor(diffHoras / 24)}d`
  }

  return (
    <>
      {/* Modal de Configuración */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuración del Algoritmo de Valoración
            </DialogTitle>
            <DialogDescription>
              Ajusta los parámetros para personalizar cómo se calculan los valores esperados y la competitividad de precios
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Depreciación por Año */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Depreciación por Antigüedad</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Primer año (%)</label>
                  <Input 
                    type="number" 
                    value={parametros.depreciacionAño1}
                    onChange={(e) => setParametros({...parametros, depreciacionAño1: Number(e.target.value)})}
                    className="h-8"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Segundo año (% acum.)</label>
                  <Input 
                    type="number" 
                    value={parametros.depreciacionAño2}
                    onChange={(e) => setParametros({...parametros, depreciacionAño2: Number(e.target.value)})}
                    className="h-8"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Año 3+ (% anual)</label>
                  <Input 
                    type="number" 
                    value={parametros.depreciacionAño3Plus}
                    onChange={(e) => setParametros({...parametros, depreciacionAño3Plus: Number(e.target.value)})}
                    className="h-8"
                  />
                </div>
              </div>
            </div>

            {/* Depreciación por KM */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Depreciación por Kilometraje</h3>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Coste por km (€)</label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={parametros.costoPorKm}
                  onChange={(e) => setParametros({...parametros, costoPorKm: Number(e.target.value)})}
                  className="h-8 max-w-xs"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ejemplo: 20.000 km × {parametros.costoPorKm}€ = {(20000 * parametros.costoPorKm).toLocaleString()}€ de depreciación
                </p>
              </div>
            </div>

            {/* Umbrales de Clasificación */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Umbrales de Clasificación</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Competitivo (score ≤ %)</label>
                  <Input 
                    type="number" 
                    value={parametros.umbralCompetitivo}
                    onChange={(e) => setParametros({...parametros, umbralCompetitivo: Number(e.target.value)})}
                    className="h-8"
                  />
                  <p className="text-xs text-green-500 mt-1">🟢 Precio excelente</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Alto (score ≥ %)</label>
                  <Input 
                    type="number" 
                    value={parametros.umbralAlto}
                    onChange={(e) => setParametros({...parametros, umbralAlto: Number(e.target.value)})}
                    className="h-8"
                  />
                  <p className="text-xs text-red-500 mt-1">🔴 Precio elevado</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Entre {parametros.umbralCompetitivo}% y {parametros.umbralAlto}% = 🟡 Precio justo
              </p>
            </div>

            {/* Días en Stock */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Alerta de Stock</h3>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Días para mostrar alerta</label>
                <Input 
                  type="number" 
                  value={parametros.diasStockAlerta}
                  onChange={(e) => setParametros({...parametros, diasStockAlerta: Number(e.target.value)})}
                  className="h-8 max-w-xs"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Se mostrará advertencia si el vehículo lleva más de {parametros.diasStockAlerta} días sin vender
                </p>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-between pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setParametros({
                    depreciacionAño1: 15,
                    depreciacionAño2: 25,
                    depreciacionAño3Plus: 10,
                    costoPorKm: 0.15,
                    umbralCompetitivo: -5,
                    umbralAlto: 5,
                    diasStockAlerta: 60
                  })
                }}
              >
                Restaurar valores por defecto
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setConfigOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => {
                  // Guardar en localStorage
                  localStorage.setItem('comparador_parametros', JSON.stringify(parametros))
                  setConfigOpen(false)
                  // Recargar datos con nuevos parámetros
                  cargarDatos()
                }}>
                  Guardar y Aplicar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Breadcrumbs className="mt-4" />
          <CompactSearchWithModal className="mt-4" />
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Comparador de Precios</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {ultimaActualizacion 
                ? `Actualizado: ${ultimaActualizacion.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                : 'Cargando...'}
            </Badge>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setConfigOpen(true)}
              title="Configurar parámetros de valoración"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs Compactos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Target className="w-3 h-3 text-muted-foreground" />
              <div className="text-xs text-muted-foreground">Posición General</div>
            </div>
            <div className={`text-xl font-bold mt-1 ${stats.posicionGeneral < 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.posicionGeneral > 0 ? '+' : ''}{stats.posicionGeneral}%
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.posicionGeneral < 0 ? 'Mejor mercado' : 'Peor mercado'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Euro className="w-3 h-3 text-muted-foreground" />
              <div className="text-xs text-muted-foreground">Precio Medio Nuestro</div>
            </div>
            <div className="text-xl font-bold mt-1">
              {stats.precioMedioNuestro ? `${stats.precioMedioNuestro.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€` : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground">
              vs {stats.precioMedioCompetencia ? `${stats.precioMedioCompetencia.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€` : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3 h-3 text-muted-foreground" />
              <div className="text-xs text-muted-foreground">Oportunidades</div>
            </div>
            <div className="text-xl font-bold mt-1 text-amber-500">
              {stats.oportunidades || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              Ajustes pendientes
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
              <div className="text-xs text-muted-foreground">Stock Analizado</div>
            </div>
            <div className="text-xl font-bold mt-1">
              {stats.totalComparables || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              Comparables
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros Avanzados */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros y Tolerancias RED BMW Group
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Fila 1: Búsqueda y Modelo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por matrícula o modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Select value={modeloFilter} onValueChange={setModeloFilter}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Filtrar por modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los modelos</SelectItem>
                {modelosUnicos.map((modelo) => (
                  <SelectItem key={modelo} value={modelo}>{modelo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fila 2: Tolerancias */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            <div className="col-span-1">
              <label className="text-xs text-muted-foreground">Antigüedad ±</label>
              <Select value={toleranciaMeses} onValueChange={setToleranciaMeses}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 meses</SelectItem>
                  <SelectItem value="6">6 meses</SelectItem>
                  <SelectItem value="9">9 meses</SelectItem>
                  <SelectItem value="12">12 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1">
              <label className="text-xs text-muted-foreground">Potencia ±</label>
              <Select value={toleranciaCV} onValueChange={setToleranciaCV}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 CV</SelectItem>
                  <SelectItem value="20">20 CV</SelectItem>
                  <SelectItem value="30">30 CV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1">
              <label className="text-xs text-muted-foreground">Kilómetros ±</label>
              <Select value={toleranciaKm} onValueChange={setToleranciaKm}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5000">5.000 Km</SelectItem>
                  <SelectItem value="10000">10.000 Km</SelectItem>
                  <SelectItem value="15000">15.000 Km</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3 flex items-end">
              <Button 
                size="sm" 
                className="h-8 w-full text-xs"
                onClick={handleRecalcular}
                disabled={loading}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Cargando...' : 'Recalcular'}
              </Button>
            </div>
          </div>

          {/* Fila 3: Filtros Rápidos */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              className="h-8 text-xs"
            >
              Todos ({vehiculos.length})
            </Button>
            <Button 
              variant={filter === "competitivo" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("competitivo")}
              className={`h-8 text-xs ${filter === "competitivo" ? "" : "hover:bg-green-500/10"}`}
            >
              <TrendingDown className="w-3 h-3 mr-1" />
              Competitivos ({vehiculos.filter((v: any) => v.posicion === "competitivo").length})
            </Button>
            <Button 
              variant={filter === "justo" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("justo")}
              className={`h-8 text-xs ${filter === "justo" ? "" : "hover:bg-yellow-500/10"}`}
            >
              <Minus className="w-3 h-3 mr-1" />
              Justos ({vehiculos.filter((v: any) => v.posicion === "justo").length})
            </Button>
            <Button 
              variant={filter === "alto" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("alto")}
              className={`h-8 text-xs ${filter === "alto" ? "" : "hover:bg-red-500/10"}`}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Altos ({vehiculos.filter((v: any) => v.posicion === "alto").length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <RefreshCw className="w-12 h-12 mx-auto mb-3 text-muted-foreground animate-spin" />
            <p className="text-muted-foreground">Cargando análisis de precios...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {!loading && error && (
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-destructive" />
            <p className="text-destructive font-semibold mb-2">Error al cargar datos</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={cargarDatos} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Grid de Vehículos - 2 COLUMNAS */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filteredVehicles.map((vehicle: any) => (
          <Card key={vehicle.id} className="hover:bg-muted/30 transition-colors">
            <CardContent className="p-3">
              {/* Header con info básica */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm flex items-center gap-2">
                    {vehicle.matricula}
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        vehicle.posicion === "competitivo" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                        vehicle.posicion === "justo" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                        "bg-red-500/10 text-red-500 border-red-500/20"
                      }`}
                    >
                      {vehicle.posicion === "competitivo" ? "✓ Competitivo" :
                       vehicle.posicion === "justo" ? "≈ Justo" : "⚠ Alto"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{vehicle.modelo || 'Sin modelo'}</div>
                  <div className="text-xs text-muted-foreground">
                    {vehicle.año || 'N/A'} • {vehicle.km ? `${vehicle.km.toLocaleString()} km` : 'N/A'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold">
                    {vehicle.nuestroPrecio ? `${vehicle.nuestroPrecio.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€` : 'Sin precio'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {vehicle.descuentoNuestro ? `${vehicle.descuentoNuestro.toFixed(2)}% desc.` : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Termómetro */}
              <div className="mb-2">
                <PriceThermometer porcentaje={vehicle.porcentajeDif} diferencia={vehicle.diferencia} />
              </div>

              {/* Info adicional compacta */}
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>
                  Mercado: {vehicle.precioMedioCompetencia ? `${vehicle.precioMedioCompetencia.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€` : 'N/A'} 
                  {vehicle.descuentoMedioCompetencia ? ` (${vehicle.descuentoMedioCompetencia.toFixed(2)}%)` : ''}
                </span>
                <span>{vehicle.competidores || 0} competidores</span>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 h-7 text-xs"
                  onClick={() => setSelectedVehicle(vehicle)}
                >
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Ver Gráfico
                </Button>
                <Button variant="outline" size="sm" className="h-7 px-2">
                  <Edit className="w-3 h-3" />
                </Button>
                {vehicle.enlaceAnuncio && (
                  <Button variant="outline" size="sm" className="h-7 px-2" asChild>
                    <a href={vehicle.enlaceAnuncio} target="_blank" rel="noopener noreferrer">
                      <LinkIcon className="w-3 h-3" />
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="sm" className="h-7 px-2 hover:bg-red-500/10 hover:text-red-500">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {!loading && filteredVehicles.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No hay vehículos que coincidan con los filtros</p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Detalles */}
      <CompetitorDetailModal 
        vehicle={selectedVehicle}
        open={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
      />
    </div>
    </>
  )
}

