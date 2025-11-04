"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { CompactSearchWithModal } from "@/components/dashboard/compact-search-with-modal"
import { InformeComparador } from "@/components/dashboard/informe-comparador"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { TrendingDown, TrendingUp, Minus, Target, Euro, AlertCircle, ExternalLink, Search, Filter, RefreshCw, BarChart3, Edit, Trash2, Link as LinkIcon, Settings, FileText, Printer } from "lucide-react"
import { BMWLogo, MINILogo } from "@/components/ui/brand-logos"
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
    
    const tieneBajada = data.numeroBajadas > 0
    
    return (
      <Card className={`p-3 shadow-lg max-w-xs ${tieneBajada ? 'animate-pulse-border' : ''}`}>
        <div className="space-y-1">
          <div className="font-semibold text-sm">
            {emoji} {titulo}
          </div>
          <div className="text-xs text-muted-foreground">
            {data.modelo && /\s\d+$/.test(data.modelo) ? `${data.modelo} CV` : data.modelo}
            {` `}
            {data.fechaPrimeraMatriculacion ? (
              <span>• {data.fechaPrimeraMatriculacion}</span>
            ) : (
              <span className="text-amber-500 font-mono">• No Hard scraping</span>
            )}
            {typeof data.dias === 'number' && data.dias >= 0 && (
              <span>
                {` • `}
                {data.dias === 1 ? '1 día' : data.dias > 1 ? `${data.dias} días` : 'Hoy'}
              </span>
            )}
          </div>
          <div className="text-xs">
            <strong>{data.precio?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€</strong> • {data.km?.toLocaleString()} km
            {data.año && <span> • {data.año}</span>}
          </div>
            {data.precioNuevo && (
              <div className="text-xs text-muted-foreground">
                Nuevo: {data.precioNuevo.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€ ({((1 - data.precio/data.precioNuevo) * 100).toFixed(2)}% desc.)
              </div>
            )}
            {data.numeroBajadas > 0 ? (
              <div className="text-xs text-green-600 font-medium mt-1">
                🔽 Bajada: -{data.importeTotalBajado?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€ ({data.numeroBajadas} {data.numeroBajadas === 1 ? 'vez' : 'veces'})
              </div>
            ) : data.tipo !== 'nuestro' && (
              <div className="text-xs text-blue-500/70 mt-1">
                💎 Precio igual desde 1ª Publicación
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
  const [mostrarDesglose, setMostrarDesglose] = useState(false)
  
  if (!vehicle) return null

  // Preparar datos para el gráfico con 3 tipos: nuestro, quadis, competencia
  // El punto rojo (nuestro) va AL FINAL para renderizarse encima
  const scatterData = [
    // Competidores + Quadis primero
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
        modelo: comp.modelo || vehicle.modelo, // Usar modelo procesado del competidor
        año: comp.año,
        url: comp.url,
        dias: comp.dias,
        fechaPrimeraMatriculacion: comp.fechaPrimeraMatriculacion || null,
        numeroBajadas: comp.numeroBajadas || 0,
        importeTotalBajado: comp.importeTotalBajado || 0
      }
    }),
    // Nuestro vehículo AL FINAL (se renderiza encima)
    {
      km: vehicle.km,
      precio: vehicle.nuestroPrecio,
      precioNuevo: vehicle.precioNuevo,
      tipo: 'nuestro', // nuestro | quadis | competencia
      matricula: vehicle.matricula,
      modelo: vehicle.modelo,
      año: vehicle.año
    }
  ]

  const handleScatterClick = (data: any) => {
    if (data && data.url) {
      window.open(data.url, '_blank')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header: Título (2 líneas) + Recomendación clickable (2 líneas) */}
        <div className="space-y-3 pb-4 border-b">
          <div className="grid grid-cols-[1fr,auto] gap-4">
            {/* Columna izquierda: Título en 2 líneas */}
            <div className="space-y-0.5">
              {/* Línea 1: Título + botón */}
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl">
                  Análisis Competitivo - {vehicle.matricula}
                </DialogTitle>
                {vehicle.enlaceAnuncio && (
                  <Button size="sm" variant="outline" asChild className="h-6 text-xs">
                    <a href={vehicle.enlaceAnuncio} target="_blank" rel="noopener noreferrer">
                      <LinkIcon className="w-3 h-3 mr-1" />
                      Ver anuncio
                    </a>
                  </Button>
                )}
              </div>
              {/* Línea 2: Subtítulo */}
              <DialogDescription className="text-sm">
                {/\s\d+$/.test(vehicle.modelo) ? `${vehicle.modelo} CV` : vehicle.modelo} • {vehicle.año} • {vehicle.km.toLocaleString()} km • Precio nuevo: {vehicle.precioNuevo.toLocaleString()}€
              </DialogDescription>
            </div>

            {/* Columna derecha: Recomendación CLICKABLE (2 líneas) */}
            <Card 
              className={`min-w-[400px] cursor-pointer transition-all hover:scale-[1.02] ${
                vehicle.posicion === 'competitivo' 
                  ? 'shadow-[0_0_20px_rgba(34,197,94,0.4)] border-green-500/50 hover:shadow-[0_0_25px_rgba(34,197,94,0.6)]' 
                  : vehicle.posicion === 'alto'
                  ? 'shadow-[0_0_20px_rgba(239,68,68,0.4)] border-red-500/50 hover:shadow-[0_0_25px_rgba(239,68,68,0.6)]'
                  : 'shadow-[0_0_20px_rgba(234,179,8,0.4)] border-yellow-500/50 hover:shadow-[0_0_25px_rgba(234,179,8,0.6)]'
              }`}
              onClick={() => setMostrarDesglose(!mostrarDesglose)}
            >
              <CardContent className="p-3 space-y-0.5">
                {/* Línea 1: Etiqueta + hint */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span className="text-sm font-semibold">Recomendación Estratégica</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">(click para desglose)</span>
                </div>
                {/* Línea 2: Badge + Precio recomendado */}
                <div className="flex items-center gap-2">
                  {vehicle.posicion === "competitivo" && <Badge className="bg-green-500 text-[10px] h-5 shrink-0">✓ Competitivo</Badge>}
                  {vehicle.posicion === "alto" && <Badge variant="destructive" className="text-[10px] h-5 shrink-0">⚠ Alto</Badge>}
                  {vehicle.posicion === "justo" && <Badge className="bg-yellow-500 text-[10px] h-5 shrink-0">≈ Justo</Badge>}
                  <span className="text-xs">
                    Precio sugerido: <strong className="text-foreground text-base">{vehicle.precioRecomendado?.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</strong>
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desglose del Cálculo (se muestra al hacer click) */}
          {mostrarDesglose && (
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Euro className="w-4 h-4" />
                  Desglose del Análisis de Precio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Paso 1: Valor teórico */}
                {vehicle.valorEsperadoTeorico && (
                  <div className="bg-muted/50 p-3 rounded-md space-y-2">
                    <div className="text-xs font-semibold text-foreground">1️⃣ Valor Teórico por Depreciación</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Precio nuevo original:</span>
                        <span className="font-medium">{vehicle.precioNuevo?.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</span>
                      </div>
                      {vehicle.ajusteAño > 0 && (
                        <div className="flex justify-between text-orange-500">
                          <span>- Depreciación por antigüedad ({vehicle.año}):</span>
                          <span>-{vehicle.ajusteAño.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</span>
                        </div>
                      )}
                      {vehicle.ajusteKm > 0 && (
                        <div className="flex justify-between text-orange-500">
                          <span>- Depreciación por km ({vehicle.km.toLocaleString()} km):</span>
                          <span>-{vehicle.ajusteKm.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold pt-1 border-t">
                        <span>= Valor teórico esperado:</span>
                        <span>{vehicle.valorEsperadoTeorico.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Paso 2: Mercado real */}
                <div className="bg-blue-500/10 p-3 rounded-md space-y-2">
                  <div className="text-xs font-semibold text-foreground">2️⃣ Precio Real del Mercado</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Precio medio ({vehicle.competidores} coches):</span>
                      <span className="font-medium text-blue-400">{vehicle.precioRealMercado?.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</span>
                    </div>
                    {vehicle.kmMedioCompetencia && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">KM medio competencia:</span>
                        <span className="font-medium">{vehicle.kmMedioCompetencia.toLocaleString()} km</span>
                      </div>
                    )}
                    {vehicle.kmMedioCompetencia && vehicle.km && (
                      <div className="flex justify-between text-orange-500">
                        <span>Ajuste por diferencia KM ({(vehicle.km - vehicle.kmMedioCompetencia).toLocaleString()} km):</span>
                        <span>{((vehicle.km - vehicle.kmMedioCompetencia) * 0.10).toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</span>
                      </div>
                    )}
                    {vehicle.analisisMercado && (
                      <div className="text-xs text-muted-foreground italic pt-1 border-t">
                        {vehicle.analisisMercado}
                      </div>
                    )}
                  </div>
                </div>

                {/* Paso 3: Tu precio vs mercado */}
                <div className={`p-3 rounded-md space-y-2 ${
                  vehicle.posicion === 'competitivo' ? 'bg-green-500/10' :
                  vehicle.posicion === 'alto' ? 'bg-red-500/10' : 'bg-yellow-500/10'
                }`}>
                  <div className="text-xs font-semibold text-foreground">3️⃣ Tu Posicionamiento</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tu precio actual:</span>
                      <span className="font-medium">{vehicle.nuestroPrecio.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Diferencia vs mercado:</span>
                      <span className={`font-medium ${vehicle.diferencia < 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {vehicle.diferencia > 0 ? '+' : ''}{vehicle.diferencia.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€ ({vehicle.porcentajeDif?.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold pt-1 border-t">
                      <span>💡 Precio recomendado:</span>
                      <span className="text-foreground">{vehicle.precioRecomendado?.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</span>
                    </div>
                    {vehicle.recomendacion && (
                      <div className="text-xs text-muted-foreground italic pt-2">
                        {vehicle.recomendacion}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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

          {/* Gráfico de Dispersión + Mejor Oferta */}
          {vehicle.competidoresDetalle.length > 0 && (
            <div className="grid grid-cols-[1fr,300px] gap-4 items-start">
              {/* Gráfico */}
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Comparativa de Resultados RED
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
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

            {/* Mejor Oferta de la RED */}
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-green-500" />
                  Mejor Oferta RED
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 flex flex-col">
                {(() => {
                  // Encontrar el competidor con MEJOR SCORE NORMALIZADO
                  // (más barato considerando km, año y opcionales)
                  const competidoresReales = vehicle.competidoresDetalle.filter((c: any) => {
                    if (!c.concesionario) return false
                    const concLower = c.concesionario.toLowerCase()
                    return !concLower.includes('quadis') && !concLower.includes('duc')
                  })
                  
                  if (competidoresReales.length === 0) return <p className="text-xs text-muted-foreground">No hay competidores disponibles</p>
                  
                  // Ordenar por MEJOR SCORE (más negativo = mejor oferta)
                  const competidoresConScore = competidoresReales.filter((c: any) => c.score !== null && c.precio && c.km)
                  
                  const mejorOferta = competidoresConScore.length > 0
                    ? competidoresConScore.sort((a: any, b: any) => a.score - b.score)[0] // Score más negativo primero
                    : competidoresReales.filter((c: any) => c.precio && c.km)[0] // Fallback si no hay scores
                  
                  if (!mejorOferta) return <p className="text-xs text-muted-foreground">Sin datos suficientes</p>
                  
                  const descuento = mejorOferta.precioNuevo 
                    ? ((mejorOferta.precioNuevo - mejorOferta.precio) / mejorOferta.precioNuevo * 100)
                    : null
                  
                  return (
                    <div className="space-y-3 flex-1 flex flex-col">
                      {/* Card visual de mejor oferta - ajustado al espacio */}
                      <div 
                        className="aspect-video bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-green-600/10 rounded-md relative group cursor-pointer border border-green-500/30 hover:border-green-500/50 transition-all flex items-center justify-center"
                        onClick={() => mejorOferta.url && window.open(mejorOferta.url, '_blank')}
                      >
                        <div className="text-center p-3 w-full">
                          {/* Icono + etiqueta compactos */}
                          <div className="mb-2">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20 mb-1">
                              <TrendingDown className="w-6 h-6 text-green-500" />
                            </div>
                            <p className="text-[10px] font-semibold text-green-500">🏆 MEJOR OFERTA</p>
                          </div>
                          
                          {/* Precio destacado */}
                          <p className="text-2xl font-bold mb-1">{mejorOferta.precio?.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</p>
                          
                          {/* Km y descuento */}
                          <p className="text-xs text-muted-foreground mb-1">{mejorOferta.km?.toLocaleString()} km</p>
                          {descuento && (
                            <Badge className="bg-green-500 text-white text-[10px] h-4">{descuento.toFixed(0)}% desc.</Badge>
                          )}
                        </div>
                        
                        {/* Overlay al hover */}
                        {mejorOferta.url && (
                          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="text-center text-white px-2">
                              <ExternalLink className="w-8 h-8 mx-auto mb-2" />
                              <p className="text-sm font-semibold">Abrir Anuncio</p>
                              <p className="text-xs text-white/70 mt-1 truncate">{mejorOferta.concesionario}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Info del competidor */}
                      <div className="space-y-2 flex-1">
                        <div>
                          <div className="text-xs font-semibold text-green-500 mb-0.5">
                            🏆 Mejor Relación Precio/Calidad
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {mejorOferta.concesionario}
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Precio:</span>
                            <span className="font-semibold text-base">{mejorOferta.precio?.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Kilometraje:</span>
                            <span>{mejorOferta.km?.toLocaleString()} km</span>
                          </div>
                          {mejorOferta.precioNuevo && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Precio nuevo:</span>
                              <span className="text-xs">{mejorOferta.precioNuevo.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</span>
                            </div>
                          )}
                          {descuento && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Descuento:</span>
                              <span className="text-green-500 font-medium">{descuento.toFixed(1)}%</span>
                            </div>
                          )}
                          {mejorOferta.score !== null && mejorOferta.score !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Score valor:</span>
                              <span className={`font-medium ${mejorOferta.score < 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {mejorOferta.score.toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {mejorOferta.url && (
                          <Button 
                            size="sm" 
                            className="w-full h-8 text-xs mt-auto"
                            onClick={() => window.open(mejorOferta.url, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Abrir Anuncio Completo
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </div>
          )}

          {/* Lista de Competidores */}
          {vehicle.competidoresDetalle.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Competidores Directos ({vehicle.competidoresDetalle.length})</h3>
              <div className="grid grid-cols-3 gap-2">
                {vehicle.competidoresDetalle.map((comp: any) => {
                  // Extraer información del modelo
                  const modeloCompleto = comp.modelo || 'N/A'
                  const modeloLower = modeloCompleto.toLowerCase()
                  
                  // Detectar marca
                  let marca = ''
                  if (modeloLower.includes('bmw') || modeloLower.match(/^(i\d|ix|serie|x\d|z\d|m\d)/i)) {
                    marca = 'BMW'
                  } else if (modeloLower.includes('mini')) {
                    marca = 'MINI'
                  }
                  
                  // Extraer CV del final del modelo
                  const cvMatch = modeloCompleto.match(/\s(\d+)\s*CV\s*$/)
                  let cv = cvMatch ? cvMatch[1] : ''
                  
                  // Si no encontró CV al final, intentar buscar en cualquier parte
                  if (!cv) {
                    const cvMatch2 = modeloCompleto.match(/(\d+)\s*CV/)
                    cv = cvMatch2 ? cvMatch2[1] : ''
                  }
                  
                  const tieneBajada = comp.numeroBajadas > 0
                  
                  return (
                    <Card 
                      key={comp.id} 
                      className={`bg-muted/30 hover:bg-muted/50 ${
                        tieneBajada ? 'border-green-500' : ''
                      }`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{comp.concesionario}</div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {marca && <span className="font-medium">{marca}</span>}
                              {marca && ' '}
                              <span>{modeloCompleto}</span>
                              {cv && !modeloCompleto.includes('CV') && <span> {cv} CV</span>}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {comp.km?.toLocaleString()} km • {comp.año || 'N/A'}
                              {comp.fechaPrimeraMatriculacion ? (
                                <span> • {(() => {
                                  const fecha = new Date(comp.fechaPrimeraMatriculacion)
                                  const dia = fecha.getDate().toString().padStart(2, '0')
                                  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0')
                                  const año = fecha.getFullYear()
                                  return `${dia}/${mes}/${año}`
                                })()}</span>
                              ) : (
                                <span className="text-amber-500 font-mono"> • No Hard scraping</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {comp.dias === 1 ? '1 día' : comp.dias > 1 ? `${comp.dias} días` : 'Hoy'} • Desc: {comp.precioNuevo ? ((1 - comp.precio/comp.precioNuevo) * 100).toFixed(2) : 'N/A'}%
                            </div>
                            {comp.numeroBajadas > 0 ? (
                              <div className="text-xs text-green-600 font-medium mt-1">
                                🔽 Bajada: -{comp.importeTotalBajado?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€ ({comp.numeroBajadas} {comp.numeroBajadas === 1 ? 'vez' : 'veces'})
                              </div>
                            ) : (
                              <div className="text-xs text-blue-500/70 mt-1">
                                💎 Precio igual desde 1ª Publicación
                              </div>
                            )}
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
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ComparadorPreciosPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [filter, setFilter] = useState<"all" | "competitivo" | "justo" | "alto">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [modeloFilter, setModeloFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [configOpen, setConfigOpen] = useState(false)
  const [informeOpen, setInformeOpen] = useState(false)
  
  // Estados para restricción de acceso
  const [mostrarRestriccion, setMostrarRestriccion] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  
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
  
  // Parámetros de valoración (configurables en modal)
  const [parametros, setParametros] = useState({
    depreciacionAño1: 15,
    depreciacionAño2: 25,
    depreciacionAño3Plus: 10,
    costoPorKm: 0.10,  // Ajustado a realidad mercado ocasión
    umbralCompetitivo: -3,  // Ajustado (antes -5)
    umbralAlto: 3,  // Ajustado (antes 5)
    diasStockAlerta: 60
  })
  
  // Filtros de tolerancia del card
  const [toleranciaKm, setToleranciaKm] = useState("10000")
  const [toleranciaAñoCard, setToleranciaAñoCard] = useState("1")
  const [toleranciaCvCard, setToleranciaCvCard] = useState("20")
  const [marcaFilter, setMarcaFilter] = useState("all") // BMW, MINI, all
  const [combustibleFilter, setCombustibleFilter] = useState("all") // PHEV, BEV, Gasolina, Diesel, all

  // Verificar si es admin y aplicar restricción
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && user.email === 'viciana84@gmail.com') {
        setIsAdmin(true)
      } else {
        // NO es admin → Iniciar timer de 10s
        const timer10s = setTimeout(() => {
          setMostrarRestriccion(true)
          
          // Después de 3s más → redirect
          const timer3s = setTimeout(() => {
            router.push('/dashboard')
          }, 3000)
          
          return () => clearTimeout(timer3s)
        }, 10000)
        
        return () => clearTimeout(timer10s)
      }
    }
    
    checkUser()
  }, [])

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

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Construir URL absoluta con parámetros de tolerancia del card
      const params = new URLSearchParams({
        toleranciaCv: toleranciaCvCard,
        toleranciaAño: toleranciaAñoCard,
        toleranciaKm: toleranciaKm
      })
      
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const response = await fetch(`${baseUrl}/api/comparador/analisis?${params}`)
      
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

  // Cargar datos desde API
  useEffect(() => {
    cargarDatos()
  }, [])
  
  // Recargar cuando cambien los filtros de tolerancia
  useEffect(() => {
    if (ultimaActualizacion) { // Solo recargar si ya se cargó una vez
      const timer = setTimeout(() => {
        cargarDatos()
      }, 500) // Debounce de 500ms
      
      return () => clearTimeout(timer)
    }
  }, [toleranciaKm, toleranciaAñoCard, toleranciaCvCard])

  const handleRecalcular = () => {
    // TODO: Implementar recálculo con tolerancias
    cargarDatos()
  }

  // Obtener modelos únicos para el filtro (con CV al final)
  const modelosUnicos = Array.from(new Set(vehiculos.map((v: any) => {
    // Añadir CV si el modelo termina en número
    return v.modelo && /\s\d+$/.test(v.modelo) ? `${v.modelo} CV` : v.modelo
  }))).sort()
  
  // Filtrar modelos por marca seleccionada
  const modelosFiltradosPorMarca = marcaFilter === "all" 
    ? modelosUnicos 
    : modelosUnicos.filter((m: string) => {
        const mLower = m.toLowerCase()
        if (marcaFilter === "BMW") {
          return mLower.includes('bmw') || mLower.match(/^(i\d|ix|serie|x\d|z\d)/i)
        } else if (marcaFilter === "MINI") {
          return mLower.includes('mini')
        }
        return true
      })

  const filteredVehicles = vehiculos.filter((v: any) => {
    const matchFilter = filter === "all" || v.posicion === filter
    const matchSearch = searchTerm === "" || 
      v.matricula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.modelo?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Comparar modelo con CV incluido
    const modeloConCv = v.modelo && /\s\d+$/.test(v.modelo) ? `${v.modelo} CV` : v.modelo
    const matchModelo = modeloFilter === "all" || modeloConCv === modeloFilter
    
    // Filtrar por marca
    const matchMarca = marcaFilter === "all" || 
      (marcaFilter === "BMW" && (v.modelo?.toLowerCase().includes('bmw') || v.modelo?.match(/^(i\d|ix|serie|x\d|z\d)/i))) ||
      (marcaFilter === "MINI" && v.modelo?.toLowerCase().includes('mini'))
    
    // Filtrar por tipo de combustible (detectar del modelo)
    const matchCombustible = combustibleFilter === "all" || (() => {
      const modeloLower = v.modelo?.toLowerCase() || ''
      if (combustibleFilter === "BEV") {
        return modeloLower.includes('edrive') || modeloLower.match(/\bi\d|^ix/i) || modeloLower.includes('electric')
      } else if (combustibleFilter === "PHEV") {
        return modeloLower.includes('phev') || modeloLower.match(/\d{3}e\b/i) || (modeloLower.includes('cooper') && modeloLower.includes(' se'))
      } else if (combustibleFilter === "Gasolina") {
        return modeloLower.match(/\d{3}i\b/i) || modeloLower.includes('gasolina')
      } else if (combustibleFilter === "Diesel") {
        return modeloLower.match(/\d{3}d\b/i) || modeloLower.includes('diesel')
      }
      return true
    })()
    
    return matchFilter && matchSearch && matchModelo && matchMarca && matchCombustible
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
      {/* Overlay de Restricción de Acceso */}
      {mostrarRestriccion && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center space-y-4 animate-in fade-in duration-500">
            <AlertCircle className="w-20 h-20 text-red-500 mx-auto animate-pulse" />
            <h1 className="text-4xl font-bold text-white">
              Página Restringida
            </h1>
            <p className="text-2xl text-white/80">
              Jordi Viciana
            </p>
            <p className="text-sm text-white/60">
              Redirigiendo al dashboard...
            </p>
          </div>
        </div>
      )}
      
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
                    costoPorKm: 0.10,
                    umbralCompetitivo: -3,
                    umbralAlto: 3,
                    diasStockAlerta: 60,
                    toleranciaKw: 15,
                    toleranciaAño: 1
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
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            Comparador de Precios
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {ultimaActualizacion 
                ? `Actualizado: ${ultimaActualizacion.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                : 'Cargando...'}
            </Badge>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setInformeOpen(true)}
              title="Generar informe detallado"
            >
              <FileText className="w-4 h-4" />
            </Button>
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
        <CardContent>
          {/* Layout 3 columnas: 50% - 40% - 10% con misma altura */}
          <div className="grid grid-cols-[1fr_0.8fr_0.2fr] gap-3 items-stretch">
            
            {/* COLUMNA 1 (50%) - Búsqueda + Tolerancias + Filtros Rápidos */}
            <div className="flex flex-col gap-2">
              {/* Fila 1: Buscador */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por matrícula o modelo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
              
              {/* Fila 2: Tolerancias (labels dentro del selector) */}
              <div className="grid grid-cols-3 gap-2">
                <Select value={toleranciaAñoCard} onValueChange={setToleranciaAñoCard}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Año ±" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.25">Año ± 3m</SelectItem>
                    <SelectItem value="0.5">Año ± 6m</SelectItem>
                    <SelectItem value="0.75">Año ± 9m</SelectItem>
                    <SelectItem value="1">Año ± 1a</SelectItem>
                    <SelectItem value="2">Año ± 2a</SelectItem>
                    <SelectItem value="3">Año ± 3a</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={toleranciaCvCard} onValueChange={setToleranciaCvCard}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="CV ±" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">CV ± 10</SelectItem>
                    <SelectItem value="15">CV ± 15</SelectItem>
                    <SelectItem value="20">CV ± 20</SelectItem>
                    <SelectItem value="30">CV ± 30</SelectItem>
                    <SelectItem value="40">CV ± 40</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={toleranciaKm} onValueChange={setToleranciaKm}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="km ±" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5000">km ± 5k</SelectItem>
                    <SelectItem value="10000">km ± 10k</SelectItem>
                    <SelectItem value="15000">km ± 15k</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Fila 3: Filtros Rápidos */}
              <div className="flex flex-wrap gap-1.5">
                <Button 
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                  className="h-8 text-xs flex-1"
                >
                  Todos ({vehiculos.length})
                </Button>
                <Button 
                  variant={filter === "competitivo" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("competitivo")}
                  className={`h-8 text-xs flex-1 ${filter === "competitivo" ? "" : "hover:bg-green-500/10"}`}
                >
                  <TrendingDown className="w-3 h-3 mr-1" />
                  Competitivos ({vehiculos.filter((v: any) => v.posicion === "competitivo").length})
                </Button>
                <Button 
                  variant={filter === "justo" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("justo")}
                  className={`h-8 text-xs flex-1 ${filter === "justo" ? "" : "hover:bg-yellow-500/10"}`}
                >
                  <Minus className="w-3 h-3 mr-1" />
                  Justos ({vehiculos.filter((v: any) => v.posicion === "justo").length})
                </Button>
                <Button 
                  variant={filter === "alto" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("alto")}
                  className={`h-8 text-xs flex-1 ${filter === "alto" ? "" : "hover:bg-red-500/10"}`}
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Altos ({vehiculos.filter((v: any) => v.posicion === "alto").length})
                </Button>
              </div>
            </div>
            
            {/* COLUMNA 2 (40%) - Marcas + Combustible + Modelo */}
            <div className="flex flex-col gap-2">
              {/* Fila 1: Botones BMW y MINI (misma altura que buscador col1) */}
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant={marcaFilter === "BMW" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setMarcaFilter(marcaFilter === "BMW" ? "all" : "BMW")
                    setModeloFilter("all")
                  }}
                  className="h-9 text-xs justify-start"
                >
                  <BMWLogo className="w-4 h-4 mr-1" />
                  BMW
                </Button>
                <Button 
                  variant={marcaFilter === "MINI" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setMarcaFilter(marcaFilter === "MINI" ? "all" : "MINI")
                    setModeloFilter("all")
                  }}
                  className="h-9 text-xs justify-start"
                >
                  <MINILogo className="w-4 h-4 mr-1" />
                  MINI
                </Button>
              </div>
              
              {/* Fila 2: Botones Combustible */}
              <div className="grid grid-cols-4 gap-1">
                <Button 
                  variant={combustibleFilter === "PHEV" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCombustibleFilter(combustibleFilter === "PHEV" ? "all" : "PHEV")}
                  className="h-8 text-[10px] px-0.5"
                  title="Híbrido Enchufable"
                >
                  PHEV
                </Button>
                <Button 
                  variant={combustibleFilter === "BEV" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCombustibleFilter(combustibleFilter === "BEV" ? "all" : "BEV")}
                  className="h-8 text-[10px] px-0.5"
                  title="Eléctrico"
                >
                  BEV
                </Button>
                <Button 
                  variant={combustibleFilter === "Gasolina" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCombustibleFilter(combustibleFilter === "Gasolina" ? "all" : "Gasolina")}
                  className="h-8 text-[10px] px-0.5"
                  title="Gasolina"
                >
                  Gasolina
                </Button>
                <Button 
                  variant={combustibleFilter === "Diesel" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCombustibleFilter(combustibleFilter === "Diesel" ? "all" : "Diesel")}
                  className="h-8 text-[10px] px-0.5"
                  title="Diésel"
                >
                  Diesel
                </Button>
              </div>
              
              {/* Fila 3: Selector Modelo */}
              <Select value={modeloFilter} onValueChange={setModeloFilter}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Modelo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los modelos</SelectItem>
                  {modelosFiltradosPorMarca.map((modelo) => (
                    <SelectItem key={modelo} value={modelo}>{modelo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* COLUMNA 3 (10%) - Acciones */}
            <div className="flex flex-col justify-between h-full">
              {/* Botón Recalcular (alineado con buscador) */}
              <Button 
                size="sm" 
                className="h-9 w-full text-xs px-2"
                onClick={handleRecalcular}
                disabled={loading}
                title="Recalcular"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              
              {/* Espaciador para empujar botón Limpiar hacia abajo */}
              <div className="flex-1"></div>
              
              {/* Botón Limpiar (alineado con selector modelo) */}
              <Button 
                size="sm" 
                variant="outline"
                className="h-9 w-full text-xs px-2"
                onClick={() => {
                  setMarcaFilter("all")
                  setCombustibleFilter("all")
                  setModeloFilter("all")
                  setSearchTerm("")
                  setFilter("all")
                }}
                title="Limpiar filtros"
              >
                <span className="text-base">✕</span>
              </Button>
            </div>
            
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <BMWMSpinner size={48} className="mx-auto mb-3" />
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

      {/* Grid de Vehículos - 3 COLUMNAS */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                  <div className="text-xs text-muted-foreground truncate">
                    {vehicle.modelo ? (
                      // Si el modelo termina en número (CV), añadir " CV"
                      /\s\d+$/.test(vehicle.modelo) ? `${vehicle.modelo} CV` : vehicle.modelo
                    ) : 'Sin modelo'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {vehicle.año || 'N/A'} • {vehicle.km ? `${vehicle.km.toLocaleString()} km` : 'N/A'}
                    {vehicle.fechaPrimeraMatriculacion ? (
                      <span className="ml-1">• {vehicle.fechaPrimeraMatriculacion}</span>
                    ) : (
                      <span className="ml-1 text-amber-500 font-mono">• No hard scraping</span>
                    )}
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
              <div className="space-y-1 text-xs mb-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>
                    Mercado: {vehicle.precioMedioCompetencia ? `${vehicle.precioMedioCompetencia.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€` : 'N/A'} 
                    {vehicle.descuentoMedioCompetencia ? ` (${vehicle.descuentoMedioCompetencia.toFixed(2)}%)` : ''}
                  </span>
                  <span>{vehicle.competidores || 0} competidores</span>
                </div>
                {vehicle.precioRecomendado && (
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-medium">
                      💡 Recomendado: {vehicle.precioRecomendado.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€
                    </span>
                    {vehicle.diasEnStock > 0 && (
                      <span className={vehicle.diasEnStock > 60 ? 'text-red-500' : 'text-muted-foreground'}>
                        {vehicle.diasEnStock}d stock
                      </span>
                    )}
                  </div>
                )}
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

      {/* Modal de Informe */}
      <InformeComparador
        open={informeOpen}
        onClose={() => setInformeOpen(false)}
        vehiculos={vehiculos}
        stats={stats}
        filter={filter}
      />
    </div>
    </>
  )
}

