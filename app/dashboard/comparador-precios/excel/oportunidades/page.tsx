"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { CompactSearchWithModal } from "@/components/dashboard/compact-search-with-modal"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { TrendingUp, ArrowLeft, Package, PackagePlus, Sparkles, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Settings } from "lucide-react"
import { ExcelAnalysisModal } from "@/components/comparador/excel-analysis-modal"

interface Config {
  gastosTransporte: number
  porcentajeMargen: number
  estructura: number
}

export default function OportunidadesPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [vehiculosStock, setVehiculosStock] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [opcionesModal, setOpcionesModal] = useState<{open: boolean, vehiculo: any}>({open: false, vehiculo: null})
  const [competidoresModal, setCompetidoresModal] = useState<{open: boolean, vehiculo: any, competidores: any[]}>({open: false, vehiculo: null, competidores: []})
  const [modeloSeleccionado, setModeloSeleccionado] = useState<string>("all")
  
  // Configuración de costes (desde localStorage)
  const [config, setConfig] = useState<Config>({
    gastosTransporte: 0,
    porcentajeMargen: 0,
    estructura: 0
  })

  // Cargar config desde localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('excel_comparador_config')
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        setConfig(parsed)
      } catch (e) {
        console.error('Error cargando configuración:', e)
      }
    }
  }, [])
  
  useEffect(() => {
    cargarVehiculos()
    cargarStock()
  }, [])
  
  const cargarVehiculos = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/comparador/excel/get-all')
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setVehiculos(data.vehiculos || [])
        }
      }
    } catch (error: any) {
      console.error('❌ Error cargando vehículos:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los vehículos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const cargarStock = async () => {
    try {
      const { data, error } = await supabase
        .from('vehiculos_venta')
        .select('modelo, precio_venta_recomendado, marca')
        .in('estado', ['disponible', 'en_preparacion'])
      
      if (error) {
        console.warn('⚠️ No se pudo cargar stock:', error.message)
        return
      }
      setVehiculosStock(data || [])
    } catch (error: any) {
      console.warn('⚠️ Error cargando stock:', error.message)
    }
  }

  const cargarCompetidoresDetalle = async (vehiculo: any) => {
    try {
      const parsePrice = (precio: any) => {
        if (typeof precio === 'number') return precio
        if (typeof precio === 'string') {
          return parseFloat(precio.replace(/[€.\s]/g, '').replace(',', '.'))
        }
        return 0
      }
      
      const parseKm = (km: any) => {
        if (typeof km === 'number') return km
        if (typeof km === 'string') {
          return parseInt(km.replace(/[.\s]/g, ''))
        }
        return 0
      }
      
      let competidores: any[] = []
      let estrategia = ''
      
      // ESTRATEGIA 1: Búsqueda por modelo completo
      if (vehiculo.modelo) {
        let query = supabase
          .from('comparador_scraper')
          .select('*')
          .in('estado_anuncio', ['activo', 'nuevo', 'precio_bajado'])
          .ilike('modelo', `%${vehiculo.modelo}%`)
        
        if (vehiculo.fecha_matriculacion) {
          const fechaVehiculo = new Date(vehiculo.fecha_matriculacion)
          const añoVehiculo = fechaVehiculo.getFullYear()
          query = query.gte('año', (añoVehiculo - 1).toString())
          query = query.lte('año', (añoVehiculo + 1).toString())
        }
        
        if (vehiculo.km) {
          const kmMin = Math.max(0, vehiculo.km - 30000)
          const kmMax = vehiculo.km + 30000
          query = query.gte('km', kmMin.toString())
          query = query.lte('km', kmMax.toString())
        }
        
        const { data, error } = await query
        if (!error && data && data.length > 0) {
          competidores = data
          estrategia = 'exacta'
        }
      }
      
      // ESTRATEGIA 2: Búsqueda por partes del modelo
      if (competidores.length === 0 && vehiculo.modelo) {
        const partesModelo = vehiculo.modelo.match(/\b[M]?\d{2,3}[a-z]+\b/gi)
        if (partesModelo && partesModelo.length > 0) {
          const versionEspecifica = partesModelo[0]
          
          let query = supabase
            .from('comparador_scraper')
            .select('*')
            .in('estado_anuncio', ['activo', 'nuevo', 'precio_bajado'])
            .ilike('modelo', `%${versionEspecifica}%`)
          
          if (vehiculo.serie) {
            const serieLimpia = vehiculo.serie.replace(/serie/i, '').trim()
            query = query.ilike('modelo', `%${serieLimpia}%`)
          }
          
          if (vehiculo.fecha_matriculacion) {
            const fechaVehiculo = new Date(vehiculo.fecha_matriculacion)
            const añoVehiculo = fechaVehiculo.getFullYear()
            query = query.gte('año', (añoVehiculo - 1).toString())
            query = query.lte('año', (añoVehiculo + 1).toString())
          }
          
          if (vehiculo.km) {
            const kmMin = Math.max(0, vehiculo.km - 30000)
            const kmMax = vehiculo.km + 30000
            query = query.gte('km', kmMin.toString())
            query = query.lte('km', kmMax.toString())
          }
          
          const { data, error } = await query
          if (!error && data && data.length > 0) {
            competidores = data
            estrategia = 'parcial'
          }
        }
      }
      
      // Procesar competidores
      const competidoresProcesados = competidores.map((comp: any) => {
        let precioNuevo = null
        if (comp.precio_nuevo) {
          precioNuevo = parsePrice(comp.precio_nuevo)
        } else if (comp.precioNuevo) {
          precioNuevo = parsePrice(comp.precioNuevo)
        } else if (comp.precio_original) {
          precioNuevo = parsePrice(comp.precio_original)
        }
        
        return {
          precio: parsePrice(comp.precio),
          km: parseKm(comp.km),
          año: comp.año,
          modelo: comp.modelo,
          concesionario: comp.concesionario || 'Desconocido',
          url: comp.url,
          precioNuevo,
          fechaPrimeraMatriculacion: comp.fecha_primera_matriculacion || null,
          numeroBajadas: comp.numero_bajadas_precio || 0,
          importeTotalBajado: comp.importe_total_bajado || 0,
          primeraDeteccion: comp.primera_deteccion,
          estado: comp.estado_anuncio,
          dias: comp.primera_deteccion ? Math.floor((new Date().getTime() - new Date(comp.primera_deteccion).getTime()) / (1000 * 60 * 60 * 24)) : 0
        }
      }).filter(c => c.precio > 0 && c.km > 0)
      
      return competidoresProcesados
      
    } catch (error: any) {
      console.error('❌ Error inesperado cargando competidores:', error)
      return []
    }
  }

  const abrirModalCompetidores = async (vehiculo: any) => {
    if (vehiculo.num_competidores === 0) {
      toast({
        title: "Sin competidores",
        description: "No se encontraron competidores para este vehículo",
        variant: "destructive"
      })
      return
    }
    
    const competidores = await cargarCompetidoresDetalle(vehiculo)
    
    setCompetidoresModal({
      open: true,
      vehiculo,
      competidores
    })
  }

  // Función para calcular garantía automática
  const calcularGarantiaAutomatica = useCallback((vehiculo: any) => {
    if (!vehiculo.fecha_matriculacion) return { coste: 0, meses: 0, detalle: 'Sin fecha matriculación' }
    
    const fechaMatriculacion = new Date(vehiculo.fecha_matriculacion)
    const hoy = new Date()
    
    const finGarantiaFabrica = new Date(fechaMatriculacion)
    finGarantiaFabrica.setMonth(finGarantiaFabrica.getMonth() + 36)
    
    const finGarantiaFabricaMargen = new Date(finGarantiaFabrica)
    finGarantiaFabricaMargen.setMonth(finGarantiaFabricaMargen.getMonth() - 6)
    
    const finGarantiaNuestra = new Date(hoy)
    finGarantiaNuestra.setMonth(finGarantiaNuestra.getMonth() + 24)
    
    if (finGarantiaNuestra <= finGarantiaFabricaMargen) {
      return { coste: 0, meses: 0, detalle: 'Fábrica cubre todo' }
    }
    
    const mesesDiferencia = Math.ceil((finGarantiaNuestra.getTime() - finGarantiaFabricaMargen.getTime()) / (1000 * 60 * 60 * 24 * 30))
    
    let costeBase = 0
    if (mesesDiferencia <= 12) {
      costeBase = 600
    } else if (mesesDiferencia <= 18) {
      costeBase = 900
    } else {
      costeBase = 1200
    }
    
    const modelo = vehiculo.modelo || ''
    const esPremium = /\d{2,}[a-z]/i.test(modelo) && (() => {
      const match = modelo.match(/(\d{2,})[a-z]/i)
      return match && parseInt(match[1]) >= 30
    })()
    
    if (esPremium) {
      costeBase = Math.round(costeBase * 1.10)
    }
    
    return { coste: costeBase, meses: mesesDiferencia, detalle: `${mesesDiferencia} meses${esPremium ? ' (Premium +10%)' : ''}` }
  }, [])

  // Función para calcular precio de venta objetivo
  const calcularPrecioVentaObjetivo = useCallback((vehiculo: any, configToUse = config) => {
    if (!vehiculo.precio_salida_neto) return null
    
    const regFis = vehiculo.reg_fis?.toUpperCase() || ''
    const tieneIVA = regFis.includes('IVA')
    
    const garantiaInfo = calcularGarantiaAutomatica(vehiculo)
    
    let precioVenta = vehiculo.precio_salida_neto
    precioVenta += (vehiculo.daño_neto || 0)
    precioVenta += configToUse.gastosTransporte
    precioVenta += configToUse.estructura
    precioVenta += garantiaInfo.coste
    
    if (configToUse.porcentajeMargen > 0) {
      precioVenta = precioVenta * (1 + configToUse.porcentajeMargen / 100)
    }
    
    if (tieneIVA) {
      precioVenta = precioVenta * 1.21
    }
    
    return Math.round(precioVenta)
  }, [config, calcularGarantiaAutomatica])

  // Función para calcular puja máxima
  const calcularPujaMaxima = useCallback((vehiculo: any, configToUse = config) => {
    const precioCompetitivo = vehiculo.precio_competitivo
    if (!precioCompetitivo) return null

    const regFis = vehiculo.reg_fis?.toUpperCase() || ''
    const tieneIVA = regFis.includes('IVA')

    let pujaMaxima = precioCompetitivo

    pujaMaxima -= configToUse.gastosTransporte
    pujaMaxima -= configToUse.estructura

    const garantiaAuto = calcularGarantiaAutomatica(vehiculo)
    pujaMaxima -= garantiaAuto.coste

    if (configToUse.porcentajeMargen > 0) {
      pujaMaxima = pujaMaxima / (1 + configToUse.porcentajeMargen / 100)
    }

    if (vehiculo.daño_neto) {
      pujaMaxima -= vehiculo.daño_neto
    }

    if (tieneIVA) {
      pujaMaxima = pujaMaxima / 1.21
    }

    return Math.round(pujaMaxima)
  }, [config, calcularGarantiaAutomatica])

  // Clasificar oportunidades
  const oportunidades = useMemo(() => {
    const conStock: any[] = []
    const sinStock: any[] = []
    
    vehiculos.forEach((v: any) => {
      const precioVentaObjetivo = calcularPrecioVentaObjetivo(v)
      const precioCompetitivo = v.precio_competitivo
      
      if (!precioVentaObjetivo || !precioCompetitivo) return
      if (v.km && v.km > 115000) return
      
      const margen = precioCompetitivo - precioVentaObjetivo
      if (margen <= 0) return
      
      const modeloEnStock = vehiculosStock.find((s: any) => 
        s.modelo?.toLowerCase().trim() === v.modelo?.toLowerCase().trim()
      )
      
      const porcentajeMargen = precioVentaObjetivo ? (margen / precioVentaObjetivo) * 100 : 0
      const pujaMaxima = calcularPujaMaxima(v)
      
      const vehiculoConDatos = {
        ...v,
        margen,
        porcentajeMargen,
        precioVentaObjetivo,
        pujaMaxima
      }
      
      if (!modeloEnStock) {
        sinStock.push(vehiculoConDatos)
      } else {
        const precioStockActual = modeloEnStock.precio_venta_recomendado || 0
        const ahorro = precioStockActual - precioVentaObjetivo
        
        if (ahorro > 500) {
          conStock.push(vehiculoConDatos)
        }
      }
    })
    
    // Agrupar por modelo
    const agruparPorModelo = (vehiculos: any[]) => {
      const grupos: { [key: string]: any[] } = {}
      vehiculos.forEach(v => {
        const modelo = v.modelo || 'Sin modelo'
        if (!grupos[modelo]) {
          grupos[modelo] = []
        }
        grupos[modelo].push(v)
      })
      return grupos
    }
    
    return {
      conStock: agruparPorModelo(conStock.sort((a, b) => b.porcentajeMargen - a.porcentajeMargen)),
      sinStock: agruparPorModelo(sinStock.sort((a, b) => b.porcentajeMargen - a.porcentajeMargen))
    }
  }, [vehiculos, vehiculosStock, calcularPrecioVentaObjetivo, calcularPujaMaxima])

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mt-4">
            <Breadcrumbs />
          </div>
          <CompactSearchWithModal className="mt-4" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              Oportunidades de Compra
            </h1>
            <p className="text-muted-foreground">
              Vehículos con margen positivo organizados por disponibilidad en stock
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/comparador-precios/excel')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>

      {loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <BMWMSpinner size={48} className="mx-auto mb-3" />
            <p className="text-muted-foreground">Cargando oportunidades...</p>
          </CardContent>
        </Card>
      )}

      {!loading && (
        <Tabs defaultValue="sin-stock" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="sin-stock" className="flex items-center gap-2">
              <PackagePlus className="w-4 h-4" />
              No en Stock
              <Badge variant="outline" className="ml-1">
                {Object.keys(oportunidades.sinStock).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="con-stock" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Ya en Stock
              <Badge variant="outline" className="ml-1">
                {Object.keys(oportunidades.conStock).length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sin-stock">
            <Card>
              <CardHeader className="space-y-3 sticky top-0 z-20 bg-card">
                <CardTitle className="flex items-center gap-2">
                  <PackagePlus className="w-5 h-5 text-blue-500" />
                  Modelos Nuevos - No en Stock
                  <Badge variant="outline" className="ml-2">
                    {Object.keys(oportunidades.sinStock).length} modelos
                  </Badge>
                </CardTitle>
                
                {/* Selector de Modelos */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-muted-foreground">Ir a modelo:</label>
                  <Select value={modeloSeleccionado} onValueChange={(value) => {
                    setModeloSeleccionado(value)
                    if (value !== "all") {
                      setTimeout(() => {
                        const elemento = document.getElementById(`modelo-${value.replace(/\s/g, '-')}`)
                        if (elemento) {
                          elemento.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                      }, 100)
                    }
                  }}>
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Todos los modelos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los modelos</SelectItem>
                      {Object.keys(oportunidades.sinStock)
                        .sort()
                        .map((modelo) => (
                          <SelectItem key={modelo} value={modelo}>{modelo}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
              {Object.keys(oportunidades.sinStock).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PackagePlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No hay oportunidades de modelos nuevos</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(oportunidades.sinStock).map(([modelo, vehiculos]: [string, any]) => (
                    <div key={modelo} id={`modelo-${modelo.replace(/\s/g, '-')}`} className="space-y-3 scroll-mt-20">
                      <div className="flex items-center justify-between px-1">
                        <h3 className="font-bold text-lg">{modelo}</h3>
                        <Badge variant="outline" className="border-2 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-blue-500" />
                          {vehiculos.length} {vehiculos.length === 1 ? 'unidad' : 'unidades'}
                        </Badge>
                      </div>
                      
                      <div className="overflow-auto rounded-lg border">
                        <table className="w-full text-xs">
                          <thead className="bg-muted">
                            <tr className="border-b">
                              <th className="p-2 text-left font-semibold">Lote</th>
                              <th className="p-2 text-left font-semibold">Marca</th>
                              <th className="p-2 text-left font-semibold">Modelo</th>
                              <th className="p-2 text-left font-semibold">Matrícula</th>
                              <th className="p-2 text-left font-semibold">Fecha Matric.</th>
                              <th className="p-2 text-right font-semibold">KM</th>
                              <th className="p-2 text-right font-semibold">% Equip</th>
                              <th className="p-2 text-right font-semibold">Precio Salida</th>
                              <th className="p-2 text-right font-semibold">Daños</th>
                              <th className="p-2 text-right font-semibold bg-purple-500/5">Puja Máx</th>
                              <th className="p-2 text-right font-semibold bg-amber-500/5">Precio Venta</th>
                              <th className="p-2 text-right font-semibold bg-green-500/5">Competitivo</th>
                              <th className="p-2 text-center font-semibold">Comp.</th>
                              <th className="p-2 text-center font-semibold">Margen</th>
                            </tr>
                          </thead>
                          <tbody>
                            {vehiculos.map((v: any) => {
                              const regFis = v.reg_fis?.toUpperCase() || ''
                              const tieneIVA = regFis.includes('IVA')
                              const equipPorcentaje = v.equip_porcentaje || 0
                              const greenIntensity = Math.min(100, equipPorcentaje)
                              const textColor = equipPorcentaje > 0 
                                ? `hsl(142, 70%, ${60 - (greenIntensity * 0.3)}%)` 
                                : 'inherit'

                              return (
                                <tr key={v.id} className="border-b hover:bg-muted/50">
                                  <td className="p-1.5 text-xs">{v.lote || '-'}</td>
                                  <td className="p-1.5 text-xs">{v.marca || '-'}</td>
                                  <td className="p-1.5 text-xs" title={v.modelo}>
                                    <div className="max-w-[150px] truncate">
                                      {v.modelo || '-'}
                                    </div>
                                  </td>
                                  <td className="p-1.5 text-xs font-mono">{v.matricula || '-'}</td>
                                  <td className="p-1.5 text-xs">
                                    {v.fecha_matriculacion ? new Date(v.fecha_matriculacion).toLocaleDateString('es-ES') : '-'}
                                  </td>
                                  <td className="p-1.5 text-right text-xs">
                                    {v.km ? v.km.toLocaleString() : '-'}
                                  </td>
                                  <td 
                                    className="p-1.5 text-right text-xs font-medium cursor-pointer hover:bg-muted/50 transition-colors" 
                                    style={{ color: textColor }}
                                    onClick={() => setOpcionesModal({open: true, vehiculo: v})}
                                    title="Click para ver opciones detalladas"
                                  >
                                    {equipPorcentaje > 0 ? `${equipPorcentaje.toFixed(0)}%` : '0%'}
                                  </td>
                                  <td className="p-1.5 text-right text-xs">
                                    {v.precio_salida_neto ? `${v.precio_salida_neto.toLocaleString()}€` : '-'}
                                  </td>
                                  <td className="p-1.5 text-right text-red-500 text-xs">
                                    {v.daño_neto ? `${v.daño_neto.toLocaleString()}€` : '-'}
                                  </td>
                                  <td className="p-1.5 text-right bg-purple-500/5 font-bold text-xs text-purple-600">
                                    {v.pujaMaxima ? `${v.pujaMaxima.toLocaleString()}€` : '-'}
                                  </td>
                                  <td className="p-1.5 text-right bg-amber-500/5">
                                    <div className="flex items-center justify-end gap-1">
                                      <span className="font-bold text-xs">
                                        {v.precioVentaObjetivo ? `${v.precioVentaObjetivo.toLocaleString()}€` : '-'}
                                      </span>
                                      <Badge variant="outline" className="text-[7px] px-1 py-0">
                                        {tieneIVA ? 'IVA' : 'REBU'}
                                      </Badge>
                                    </div>
                                  </td>
                                  <td className="p-1.5 text-right bg-green-500/5 font-bold text-xs text-green-600">
                                    {v.precio_competitivo ? `${v.precio_competitivo.toLocaleString()}€` : '-'}
                                  </td>
                                  <td className="p-1.5 text-center">
                                    <Badge 
                                      variant="outline" 
                                      className="text-[10px] cursor-pointer hover:bg-primary/10 transition-colors"
                                      onClick={() => {
                                        if (v.num_competidores > 0) {
                                          abrirModalCompetidores(v)
                                        }
                                      }}
                                    >
                                      {v.num_competidores || 0}
                                    </Badge>
                                  </td>
                                  <td className="p-1.5">
                                    <div className="w-full text-xs font-bold flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md border-2 bg-green-500/10 border-green-500 text-green-700 dark:text-green-400">
                                      <span className="text-base">✓</span>
                                      <span className="text-base">+{v.margen.toLocaleString()}€</span>
                                      <span className="text-[10px]">({v.porcentajeMargen.toFixed(1)}%)</span>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="con-stock">
            <Card>
              <CardHeader className="space-y-3 sticky top-0 z-20 bg-card">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-green-500" />
                  Mejor Precio - Ya en Stock
                  <Badge variant="outline" className="ml-2">
                    {Object.keys(oportunidades.conStock).length} modelos
                  </Badge>
                </CardTitle>
                
                {/* Selector de Modelos */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-muted-foreground">Ir a modelo:</label>
                  <Select value={modeloSeleccionado} onValueChange={(value) => {
                    setModeloSeleccionado(value)
                    if (value !== "all") {
                      setTimeout(() => {
                        const elemento = document.getElementById(`modelo-${value.replace(/\s/g, '-')}`)
                        if (elemento) {
                          elemento.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                      }, 100)
                    }
                  }}>
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Todos los modelos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los modelos</SelectItem>
                      {Object.keys(oportunidades.conStock)
                        .sort()
                        .map((modelo) => (
                          <SelectItem key={modelo} value={modelo}>{modelo}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
              {Object.keys(oportunidades.conStock).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No hay oportunidades de modelos en stock</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(oportunidades.conStock).map(([modelo, vehiculos]: [string, any]) => (
                    <div key={modelo} id={`modelo-${modelo.replace(/\s/g, '-')}`} className="space-y-3 scroll-mt-20">
                      <div className="flex items-center justify-between px-1">
                        <h3 className="font-bold text-lg">{modelo}</h3>
                        <Badge variant="outline" className="border-2 flex items-center gap-1.5">
                          <DollarSign className="w-3 h-3 text-green-500" />
                          {vehiculos.length} {vehiculos.length === 1 ? 'unidad' : 'unidades'}
                        </Badge>
                      </div>
                      
                      <div className="overflow-auto rounded-lg border">
                        <table className="w-full text-xs">
                          <thead className="bg-muted">
                            <tr className="border-b">
                              <th className="p-2 text-left font-semibold">Lote</th>
                              <th className="p-2 text-left font-semibold">Marca</th>
                              <th className="p-2 text-left font-semibold">Modelo</th>
                              <th className="p-2 text-left font-semibold">Matrícula</th>
                              <th className="p-2 text-left font-semibold">Fecha Matric.</th>
                              <th className="p-2 text-right font-semibold">KM</th>
                              <th className="p-2 text-right font-semibold">% Equip</th>
                              <th className="p-2 text-right font-semibold">Precio Salida</th>
                              <th className="p-2 text-right font-semibold">Daños</th>
                              <th className="p-2 text-right font-semibold bg-purple-500/5">Puja Máx</th>
                              <th className="p-2 text-right font-semibold bg-amber-500/5">Precio Venta</th>
                              <th className="p-2 text-right font-semibold bg-green-500/5">Competitivo</th>
                              <th className="p-2 text-center font-semibold">Comp.</th>
                              <th className="p-2 text-center font-semibold">Margen</th>
                            </tr>
                          </thead>
                          <tbody>
                            {vehiculos.map((v: any) => {
                              const regFis = v.reg_fis?.toUpperCase() || ''
                              const tieneIVA = regFis.includes('IVA')
                              const equipPorcentaje = v.equip_porcentaje || 0
                              const greenIntensity = Math.min(100, equipPorcentaje)
                              const textColor = equipPorcentaje > 0 
                                ? `hsl(142, 70%, ${60 - (greenIntensity * 0.3)}%)` 
                                : 'inherit'

                              return (
                                <tr key={v.id} className="border-b hover:bg-muted/50">
                                  <td className="p-1.5 text-xs">{v.lote || '-'}</td>
                                  <td className="p-1.5 text-xs">{v.marca || '-'}</td>
                                  <td className="p-1.5 text-xs" title={v.modelo}>
                                    <div className="max-w-[150px] truncate">
                                      {v.modelo || '-'}
                                    </div>
                                  </td>
                                  <td className="p-1.5 text-xs font-mono">{v.matricula || '-'}</td>
                                  <td className="p-1.5 text-xs">
                                    {v.fecha_matriculacion ? new Date(v.fecha_matriculacion).toLocaleDateString('es-ES') : '-'}
                                  </td>
                                  <td className="p-1.5 text-right text-xs">
                                    {v.km ? v.km.toLocaleString() : '-'}
                                  </td>
                                  <td 
                                    className="p-1.5 text-right text-xs font-medium cursor-pointer hover:bg-muted/50 transition-colors" 
                                    style={{ color: textColor }}
                                    onClick={() => setOpcionesModal({open: true, vehiculo: v})}
                                    title="Click para ver opciones detalladas"
                                  >
                                    {equipPorcentaje > 0 ? `${equipPorcentaje.toFixed(0)}%` : '0%'}
                                  </td>
                                  <td className="p-1.5 text-right text-xs">
                                    {v.precio_salida_neto ? `${v.precio_salida_neto.toLocaleString()}€` : '-'}
                                  </td>
                                  <td className="p-1.5 text-right text-red-500 text-xs">
                                    {v.daño_neto ? `${v.daño_neto.toLocaleString()}€` : '-'}
                                  </td>
                                  <td className="p-1.5 text-right bg-purple-500/5 font-bold text-xs text-purple-600">
                                    {v.pujaMaxima ? `${v.pujaMaxima.toLocaleString()}€` : '-'}
                                  </td>
                                  <td className="p-1.5 text-right bg-amber-500/5">
                                    <div className="flex items-center justify-end gap-1">
                                      <span className="font-bold text-xs">
                                        {v.precioVentaObjetivo ? `${v.precioVentaObjetivo.toLocaleString()}€` : '-'}
                                      </span>
                                      <Badge variant="outline" className="text-[7px] px-1 py-0">
                                        {tieneIVA ? 'IVA' : 'REBU'}
                                      </Badge>
                                    </div>
                                  </td>
                                  <td className="p-1.5 text-right bg-green-500/5 font-bold text-xs text-green-600">
                                    {v.precio_competitivo ? `${v.precio_competitivo.toLocaleString()}€` : '-'}
                                  </td>
                                  <td className="p-1.5 text-center">
                                    <Badge 
                                      variant="outline" 
                                      className="text-[10px] cursor-pointer hover:bg-primary/10 transition-colors"
                                      onClick={() => {
                                        if (v.num_competidores > 0) {
                                          abrirModalCompetidores(v)
                                        }
                                      }}
                                    >
                                      {v.num_competidores || 0}
                                    </Badge>
                                  </td>
                                  <td className="p-1.5">
                                    <div className="w-full text-xs font-bold flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md border-2 bg-green-500/10 border-green-500 text-green-700 dark:text-green-400">
                                      <span className="text-base">✓</span>
                                      <span className="text-base">+{v.margen.toLocaleString()}€</span>
                                      <span className="text-[10px]">({v.porcentajeMargen.toFixed(1)}%)</span>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Modal de Opciones */}
      <Dialog open={opcionesModal.open} onOpenChange={(open) => setOpcionesModal({open, vehiculo: null})}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Opciones y Equipamiento
            </DialogTitle>
            <DialogDescription>
              {opcionesModal.vehiculo?.modelo} - {opcionesModal.vehiculo?.matricula}
              {opcionesModal.vehiculo?.equip_porcentaje > 0 && (
                <span className="ml-2 font-semibold" style={{ 
                  color: `hsl(142, 70%, ${60 - (Math.min(100, opcionesModal.vehiculo.equip_porcentaje) * 0.3)}%)` 
                }}>
                  ({opcionesModal.vehiculo.equip_porcentaje.toFixed(0)}% equipado)
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {opcionesModal.vehiculo?.opciones ? (
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {opcionesModal.vehiculo.opciones
                  .split(/[,;\n]/)
                  .map((opcion: string) => opcion.trim())
                  .filter((opcion: string) => opcion.length > 0)
                  .map((opcion: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span className="text-muted-foreground">{opcion}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No hay opciones registradas para este vehículo</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setOpcionesModal({open: false, vehiculo: null})}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Análisis de Competidores */}
      {competidoresModal.open && competidoresModal.vehiculo && (
        <ExcelAnalysisModal
          vehiculo={competidoresModal.vehiculo}
          competidores={competidoresModal.competidores}
          open={competidoresModal.open}
          onClose={() => setCompetidoresModal({open: false, vehiculo: null, competidores: []})}
          precioVentaObjetivo={calcularPrecioVentaObjetivo(competidoresModal.vehiculo)}
          config={config}
        />
      )}
    </div>
  )
}

