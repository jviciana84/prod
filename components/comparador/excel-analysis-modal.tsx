"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingDown, Target, Euro, ExternalLink, BarChart3, Link as LinkIcon } from 'lucide-react'
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"

interface Props {
  open: boolean
  onClose: () => void
  vehiculo: any
  competidores: any[]
  precioVentaObjetivo: number | null
  config: any
}

export function ExcelAnalysisModal({ open, onClose, vehiculo, competidores, precioVentaObjetivo, config }: Props) {
  const [mostrarDesglose, setMostrarDesglose] = useState(false)
  
  if (!vehiculo) return null

  const regFis = vehiculo.reg_fis?.toUpperCase() || ''
  const tieneIVA = regFis.includes('IVA')
  
  const precioMedioRed = vehiculo.precio_medio_red || 0
  const precioCompetitivo = vehiculo.precio_competitivo || precioMedioRed
  
  // Calcular garantía automática para este vehículo
  const calcularGarantiaAuto = (vehiculo: any) => {
    if (!vehiculo.fecha_matriculacion) return { coste: 0, meses: 0, detalle: 'Sin fecha' }
    
    const fechaMatriculacion = new Date(vehiculo.fecha_matriculacion)
    const hoy = new Date()
    
    const finGarantiaFabrica = new Date(fechaMatriculacion)
    finGarantiaFabrica.setMonth(finGarantiaFabrica.getMonth() + 36)
    
    const finGarantiaFabricaMargen = new Date(finGarantiaFabrica)
    finGarantiaFabricaMargen.setMonth(finGarantiaFabricaMargen.getMonth() - 6)
    
    const finGarantiaNuestra = new Date(hoy)
    finGarantiaNuestra.setMonth(finGarantiaNuestra.getMonth() + 24)
    
    if (finGarantiaNuestra <= finGarantiaFabricaMargen) {
      return { coste: 0, meses: 0, detalle: 'Fábrica cubre' }
    }
    
    const mesesDiferencia = Math.ceil((finGarantiaNuestra.getTime() - finGarantiaFabricaMargen.getTime()) / (1000 * 60 * 60 * 24 * 30))
    
    let costeBase = 0
    if (mesesDiferencia <= 12) costeBase = 600
    else if (mesesDiferencia <= 18) costeBase = 900
    else costeBase = 1200
    
    const modelo = vehiculo.modelo || ''
    const esPremium = /\d{2,}[a-z]/i.test(modelo) && (() => {
      const match = modelo.match(/(\d{2,})[a-z]/i)
      return match && parseInt(match[1]) >= 30
    })()
    
    if (esPremium) {
      costeBase = Math.round(costeBase * 1.10)
    }
    
    return { 
      coste: costeBase, 
      meses: mesesDiferencia,
      detalle: `${mesesDiferencia}m${esPremium ? ' +10%' : ''}`,
      esPremium
    }
  }
  
  const garantiaInfo = calcularGarantiaAuto(vehiculo)
  
  // Calcular margen real
  const margen = precioCompetitivo && precioVentaObjetivo 
    ? precioCompetitivo - precioVentaObjetivo
    : null
  
  // Determinar posición basada en MARGEN REAL
  let posicion = 'justo'
  if (margen) {
    if (margen > 0) posicion = 'competitivo' // Rentable
    else if (margen < -1000) posicion = 'alto' // Muy caro
  }

  // SCATTER DATA - Los datos YA vienen procesados de la página
  const competidoresArray = Array.isArray(competidores) ? competidores : []
  const scatterData = [
    // Competidores primero (azules)
    ...competidoresArray
      .filter((comp: any) => comp.km && comp.precio && comp.km > 0 && comp.precio > 0)
      .map((comp: any) => ({
        km: comp.km,
        precio: comp.precio,
        precioNuevo: comp.precioNuevo,
        tipo: 'competencia',
        concesionario: comp.concesionario,
        modelo: comp.modelo,
        año: comp.año,
        url: comp.url
      })),
    // Tu precio venta (rojo)
    {
      km: Number(vehiculo.km) || 0,
      precio: precioVentaObjetivo || 0,
      tipo: 'nuestro',
      matricula: vehiculo.matricula,
      modelo: vehiculo.modelo,
      año: vehiculo.fecha_matriculacion ? new Date(vehiculo.fecha_matriculacion).getFullYear() : null
    },
    // Precio competitivo (verde) - AL FINAL para renderizarse encima
    {
      km: Number(vehiculo.km) || 0,
      precio: precioCompetitivo || 0,
      tipo: 'competitivo',
      modelo: vehiculo.modelo,
      año: vehiculo.fecha_matriculacion ? new Date(vehiculo.fecha_matriculacion).getFullYear() : null
    }
  ]

  console.log('📊 Datos gráfico scatter:', {
    totalPuntos: scatterData.length,
    competidores: scatterData.filter(d => d.tipo === 'competencia').length,
    nuestro: scatterData.filter(d => d.tipo === 'nuestro').length,
    competitivo: scatterData.filter(d => d.tipo === 'competitivo').length,
    ejemploCompetidor: scatterData.find(d => d.tipo === 'competencia'),
    ejemploNuestro: scatterData.find(d => d.tipo === 'nuestro'),
    ejemploCompetitivo: scatterData.find(d => d.tipo === 'competitivo')
  })

  // Tooltip EXACTO del original del comparador
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null
    
    const data = payload[0].payload
    const tipo = data.tipo
    
    let emoji = '🔵'
    let titulo = data.concesionario || 'Desconocido'
    
    if (tipo === 'nuestro') {
      emoji = '🔴'
      titulo = `${data.matricula} (Mi vehículo)`
    } else if (tipo === 'competitivo') {
      emoji = '🟢'
      titulo = 'Precio Competitivo'
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
                📌 Precio igual desde 1ª Publicación
              </div>
            )}
            {data.url && (
              <div className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                🔗 Click para ver anuncio
              </div>
            )}
        </div>
      </Card>
    )
  }

  // Encontrar mejor oferta - Los datos YA están procesados
  const mejorOferta = competidoresArray.length > 0 
    ? competidoresArray.filter(c => c.precio && c.km).sort((a, b) => a.precio - b.precio)[0]
    : null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header - EXACTO DEL ORIGINAL */}
        <div className="space-y-3 pb-4 border-b">
          <div className="grid grid-cols-[1fr,auto] gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl">
                  Análisis de Viabilidad - {vehiculo.matricula}
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm">
                {vehiculo.modelo} • {vehiculo.fecha_matriculacion ? new Date(vehiculo.fecha_matriculacion).getFullYear() : '-'} • {vehiculo.km?.toLocaleString()} km
              </DialogDescription>
            </div>

            {/* Card de Recomendación */}
            <Card 
              className={`min-w-[400px] cursor-pointer transition-all hover:scale-[1.02] ${
                posicion === 'competitivo' 
                  ? 'shadow-[0_0_20px_rgba(34,197,94,0.4)] border-green-500/50 hover:shadow-[0_0_25px_rgba(34,197,94,0.6)]' 
                  : posicion === 'alto'
                  ? 'shadow-[0_0_20px_rgba(239,68,68,0.4)] border-red-500/50 hover:shadow-[0_0_25px_rgba(239,68,68,0.6)]'
                  : 'shadow-[0_0_20px_rgba(234,179,8,0.4)] border-yellow-500/50 hover:shadow-[0_0_25px_rgba(234,179,8,0.6)]'
              }`}
              onClick={() => setMostrarDesglose(!mostrarDesglose)}
            >
              <CardContent className="p-3 space-y-0.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span className="text-sm font-semibold">Viabilidad de Compra</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">(click para desglose)</span>
                </div>
                <div className="flex items-center gap-2">
                  {posicion === "competitivo" && <Badge className="bg-green-500 text-[10px] h-5 shrink-0">✓ Viable</Badge>}
                  {posicion === "alto" && <Badge variant="destructive" className="text-[10px] h-5 shrink-0">⚠ Caro</Badge>}
                  {posicion === "justo" && <Badge className="bg-yellow-500 text-[10px] h-5 shrink-0">≈ Ajustado</Badge>}
                  <span className="text-xs">
                    Margen: <strong className={`text-base ${margen && margen > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {margen ? (margen > 0 ? '+' : '') + margen.toLocaleString() : '-'}€
                    </strong>
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desglose */}
          {mostrarDesglose && (
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Euro className="w-4 h-4" />
                  Desglose del Cálculo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted/50 p-3 rounded-md space-y-2">
                  <div className="text-xs font-semibold">1️⃣ Tus Costes</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Precio salida:</span>
                      <span className="font-medium">{vehiculo.precio_salida_neto?.toLocaleString()}€</span>
                    </div>
                    {vehiculo.daño_neto > 0 && (
                      <div className="flex justify-between text-red-500">
                        <span>+ Daños:</span>
                        <span>+{vehiculo.daño_neto?.toLocaleString()}€</span>
                      </div>
                    )}
                    {config.gastosTransporte > 0 && (
                      <div className="flex justify-between text-orange-500">
                        <span>+ Transporte:</span>
                        <span>+{config.gastosTransporte}€</span>
                      </div>
                    )}
                    {config.estructura > 0 && (
                      <div className="flex justify-between text-orange-500">
                        <span>+ Estructura:</span>
                        <span>+{config.estructura}€</span>
                      </div>
                    )}
                    {garantiaInfo.coste > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>+ Garantía (auto):</span>
                        <span>+{garantiaInfo.coste}€ ({garantiaInfo.detalle})</span>
                      </div>
                    )}
                    {config.porcentajeMargen > 0 && (
                      <div className="flex justify-between text-blue-500">
                        <span>+ Margen ({config.porcentajeMargen}%):</span>
                        <span>+{Math.round((vehiculo.precio_salida_neto + (vehiculo.daño_neto || 0) + config.gastosTransporte + config.estructura + garantiaInfo.coste) * config.porcentajeMargen / 100)}€</span>
                      </div>
                    )}
                    {tieneIVA && (
                      <div className="flex justify-between text-green-600">
                        <span>+ IVA (21%):</span>
                        <span>+{Math.round((vehiculo.precio_salida_neto + (vehiculo.daño_neto || 0) + config.gastosTransporte + config.estructura + garantiaInfo.coste + ((vehiculo.precio_salida_neto + (vehiculo.daño_neto || 0) + config.gastosTransporte + config.estructura + garantiaInfo.coste) * config.porcentajeMargen / 100)) * 0.21)}€</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold pt-1 border-t">
                      <span>= Precio venta necesario:</span>
                      <span>{precioVentaObjetivo?.toLocaleString()}€</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 p-3 rounded-md space-y-2">
                  <div className="text-xs font-semibold">2️⃣ Mercado Real</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Precio medio ({competidoresArray.length} coches):</span>
                      <span className="font-medium text-blue-400">{precioMedioRed?.toLocaleString()}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Precio competitivo:</span>
                      <span className="font-medium text-green-400">{precioCompetitivo?.toLocaleString()}€</span>
                    </div>
                  </div>
                </div>

                <div className={`p-3 rounded-md space-y-2 ${
                  posicion === 'competitivo' ? 'bg-green-500/10' :
                  posicion === 'alto' ? 'bg-red-500/10' : 'bg-yellow-500/10'
                }`}>
                  <div className="text-xs font-semibold">3️⃣ Viabilidad</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tu precio venta:</span>
                      <span className="font-medium">{precioVentaObjetivo?.toLocaleString()}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Margen potencial:</span>
                      <span className={`font-medium ${margen && margen > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {margen ? (margen > 0 ? '+' : '') + margen.toLocaleString() : '-'}€
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold pt-1 border-t">
                      <span>💡 Conclusión:</span>
                      <span>
                        {posicion === 'competitivo' ? '✅ Compra viable' : 
                         posicion === 'alto' ? '❌ Precio elevado' : 
                         '⚠️ Ajustado'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-5 gap-2">
              <Card>
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground">Tu Precio Venta</div>
                  <div className="text-base font-bold">{precioVentaObjetivo?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€</div>
                  <div className="text-xs text-muted-foreground">{tieneIVA ? 'con IVA' : 'REBU'}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground">Precio Medio</div>
                  <div className="text-base font-bold">{precioMedioRed.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€</div>
                  <div className="text-xs text-muted-foreground">Red</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground">Diferencia €</div>
                  <div className={`text-base font-bold ${margen && margen > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {margen ? (margen > 0 ? '+' : '') + margen.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}€
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground">% vs Mercado</div>
                  <div className={`text-base font-bold ${margen && margen > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {margen && precioVentaObjetivo ? ((margen / precioVentaObjetivo) * 100).toFixed(1) : '0'}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground">Competidores</div>
                  <div className="text-base font-bold">{competidoresArray.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico + Mejor Oferta */}
            {competidoresArray.length > 0 && (
              <div className="grid grid-cols-[1fr,300px] gap-4 items-start">
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
                        
                        <text x="50%" y="15" textAnchor="middle" fontSize="11" fill="currentColor">
                          <tspan fill="#3b82f6" fontSize="16">● </tspan>
                          <tspan fill="currentColor">Competencia   </tspan>
                          <tspan fill="#ef4444" fontSize="16">● </tspan>
                          <tspan fill="currentColor">Tu Venta   </tspan>
                          <tspan fill="#22c55e" fontSize="16">● </tspan>
                          <tspan fill="currentColor">Competitivo</tspan>
                        </text>
                        
                        <Scatter 
                          data={scatterData}
                          isAnimationActive={false}
                          shape={(props: any) => {
                            const { cx, cy, payload } = props
                            let fill = '#3b82f6' // Azul competencia
                            if (payload.tipo === 'nuestro') fill = '#ef4444' // Rojo tu precio
                            if (payload.tipo === 'competitivo') fill = '#22c55e' // Verde competitivo
                            
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
                      💡 🔵 Competencia | 🔴 Tu Precio Venta | 🟢 Precio Competitivo
                    </p>
                  </CardContent>
                </Card>

                {/* Mejor Oferta */}
                {mejorOferta && (
                  <Card className="h-full flex flex-col">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-green-500" />
                        Mejor Oferta RED
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 flex-1 flex flex-col">
                      {(() => {
                        const competidoresReales = competidoresArray.filter((c: any) => {
                          if (!c.concesionario) return false
                          const concLower = c.concesionario.toLowerCase()
                          return !concLower.includes('quadis') && !concLower.includes('duc')
                        })
                        
                        if (competidoresReales.length === 0) return <p className="text-xs text-muted-foreground">No hay competidores</p>
                        
                        const mejorOferta = competidoresReales
                          .filter((c: any) => c.precio && c.km)
                          .sort((a: any, b: any) => a.precio - b.precio)[0]
                        
                        if (!mejorOferta) return <p className="text-xs text-muted-foreground">Sin datos</p>
                        
                        const descuento = mejorOferta.precioNuevo 
                          ? ((mejorOferta.precioNuevo - mejorOferta.precio) / mejorOferta.precioNuevo * 100)
                          : null
                        
                        return (
                          <div className="space-y-3 flex-1 flex flex-col">
                            <div 
                              className="aspect-video bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-green-600/10 rounded-md relative group cursor-pointer border border-green-500/30 hover:border-green-500/50 transition-all flex items-center justify-center"
                              onClick={() => mejorOferta.url && window.open(mejorOferta.url, '_blank')}
                            >
                              <div className="text-center p-3 w-full">
                                <div className="mb-2">
                                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20 mb-1">
                                    <TrendingDown className="w-6 h-6 text-green-500" />
                                  </div>
                                  <p className="text-[10px] font-semibold text-green-500">🏆 MEJOR OFERTA</p>
                                </div>
                                
                                <p className="text-2xl font-bold mb-1">{mejorOferta.precio?.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</p>
                                <p className="text-xs text-muted-foreground mb-1">{mejorOferta.km?.toLocaleString()} km</p>
                                {descuento && (
                                  <Badge className="bg-green-500 text-white text-[10px] h-4">{descuento.toFixed(0)}% desc.</Badge>
                                )}
                              </div>
                              
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
                )}
              </div>
            )}

            {/* Mini Cards - EXACTAS DEL ORIGINAL */}
            {competidoresArray.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Competidores Directos ({competidoresArray.length})</h3>
                <div className="grid grid-cols-3 gap-2">
                  {competidoresArray.map((comp: any, idx: number) => {
                    const modeloCompleto = comp.modelo || 'N/A'
                    const modeloLower = modeloCompleto.toLowerCase()
                    
                    let marca = ''
                    if (modeloLower.includes('bmw') || modeloLower.match(/^(i\d|ix|serie|x\d|z\d|m\d)/i)) {
                      marca = 'BMW'
                    } else if (modeloLower.includes('mini')) {
                      marca = 'MINI'
                    }
                    
                    const cvMatch = modeloCompleto.match(/\s(\d+)\s*CV\s*$/)
                    let cv = cvMatch ? cvMatch[1] : ''
                    
                    if (!cv) {
                      const cvMatch2 = modeloCompleto.match(/(\d+)\s*CV/)
                      cv = cvMatch2 ? cvMatch2[1] : ''
                    }
                    
                    const tieneBajada = comp.numeroBajadas > 0
                    
                    return (
                      <Card 
                        key={idx} 
                        className={`bg-muted/30 hover:bg-muted/50 ${tieneBajada ? 'border-green-500' : ''}`}
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
                                {comp.km?.toLocaleString() || '-'} km • {comp.año || 'N/A'}
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
                                {comp.dias === 1 ? '1 día' : comp.dias > 1 ? `${comp.dias} días` : 'Hoy'}
                                {comp.precioNuevo && <span> • Nuevo: {comp.precioNuevo.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</span>}
                                {' • Desc: '}{comp.precioNuevo ? ((1 - comp.precio/comp.precioNuevo) * 100).toFixed(2) : 'N/A'}%
                              </div>
                              {tieneBajada ? (
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
                              <div className={`text-xs ${comp.precio > (precioVentaObjetivo || 0) ? 'text-red-500' : 'text-green-500'}`}>
                                {comp.precio > (precioVentaObjetivo || 0) ? '+' : ''}{(comp.precio - (precioVentaObjetivo || 0)).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
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

            {competidoresArray.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-semibold mb-2">No se encontraron competidores</p>
                <p className="text-sm">No hay vehículos similares en la red para comparar</p>
              </div>
            )}
          </div>
      </DialogContent>
    </Dialog>
  )
}
