"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { CompactSearchWithModal } from "@/components/dashboard/compact-search-with-modal"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { Upload, Search, Filter, RefreshCw, ArrowLeft, Trash2, FileDown, Settings, TrendingUp } from "lucide-react"
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
import { useToast } from "@/hooks/use-toast"
import { ExcelAnalysisModal } from "@/components/comparador/excel-analysis-modal"

interface Config {
  gastosTransporte: number
  porcentajeMargen: number
  estructura: number
}

export default function ExcelComparadorPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [vehiculosStock, setVehiculosStock] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingExcel, setUploadingExcel] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [marcaFilter, setMarcaFilter] = useState("all")
  const [rentabilidadFilter, setRentabilidadFilter] = useState("all")
  const [modeloFilter, setModeloFilter] = useState("all")
  const [configOpen, setConfigOpen] = useState(false)
  const [competidoresModal, setCompetidoresModal] = useState<{open: boolean, vehiculo: any}>({open: false, vehiculo: null})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  // Configuración de costes (aplicada)
  const [config, setConfig] = useState<Config>({
    gastosTransporte: 0,
    porcentajeMargen: 0,
    estructura: 0
  })

  // Configuración temporal (solo para el modal)
  const [tempConfig, setTempConfig] = useState<Config>(config)

  // Cargar config desde localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('excel_comparador_config')
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        setConfig(parsed)
        setTempConfig(parsed)
      } catch (e) {
        console.error('Error cargando configuración:', e)
      }
    }
  }, [])

  // Sincronizar tempConfig cuando se abre el modal
  useEffect(() => {
    if (configOpen) {
      setTempConfig(config)
    }
  }, [configOpen, config])
  
  useEffect(() => {
    cargarVehiculos()
    cargarStock()
  }, [])
  
  const cargarVehiculos = async () => {
    setLoading(true)
    try {
      console.log('🔍 Cargando vehículos desde API...')
      
      const response = await fetch('/api/comparador/excel/get-all')
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          console.log('✅ Vehículos cargados:', data.vehiculos?.length || 0)
          setVehiculos(data.vehiculos || [])
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Error al cargar vehículos')
      }
    } catch (error: any) {
      console.error('❌ Error cargando vehículos:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los vehículos",
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
        console.warn('⚠️ No se pudo cargar stock (no crítico):', error.message)
        return
      }
      setVehiculosStock(data || [])
      console.log(`✅ Stock cargado: ${data?.length || 0} vehículos`)
    } catch (error: any) {
      console.warn('⚠️ Error cargando stock (no crítico):', error.message)
      // No es crítico, solo afecta a las oportunidades
    }
  }
  
  const confirmarEliminar = async () => {
    try {
      const { error } = await supabase
        .from('vehiculos_excel_comparador')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
      
      if (error) throw error
      
      toast({
        title: "✅ Vehículos eliminados",
        description: "Todos los vehículos del Excel han sido eliminados",
      })
      
      setVehiculos([])
      setDeleteDialogOpen(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setUploadingExcel(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/comparador/excel/upload', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar Excel')
      }
      
      toast({
        title: "✅ Excel cargado correctamente",
        description: `${data.vehiculos?.length || 0} vehículos procesados. Recargando...`,
      })
      
      // Recargar datos
      await cargarVehiculos()
      
    } catch (error: any) {
      console.error('Error cargando Excel:', error)
      toast({
        title: "❌ Error al cargar Excel",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setUploadingExcel(false)
      event.target.value = ''
    }
  }

  const exportarAExcel = () => {
    // TODO: Implementar exportación
    toast({
      title: "Exportando...",
      description: "Funcionalidad en desarrollo",
    })
  }

  // Función para calcular garantía automática
  const calcularGarantiaAutomatica = useCallback((vehiculo: any) => {
    if (!vehiculo.fecha_matriculacion) return { coste: 0, meses: 0, detalle: 'Sin fecha matriculación' }
    
    const fechaMatriculacion = new Date(vehiculo.fecha_matriculacion)
    const hoy = new Date()
    
    // 1. Fin garantía fábrica (36 meses desde matriculación)
    const finGarantiaFabrica = new Date(fechaMatriculacion)
    finGarantiaFabrica.setMonth(finGarantiaFabrica.getMonth() + 36)
    
    // 2. Fin garantía fábrica CON MARGEN (- 6 meses)
    const finGarantiaFabricaMargen = new Date(finGarantiaFabrica)
    finGarantiaFabricaMargen.setMonth(finGarantiaFabricaMargen.getMonth() - 6)
    
    // 3. Fin garantía nuestra (HOY + 24 meses)
    const finGarantiaNuestra = new Date(hoy)
    finGarantiaNuestra.setMonth(finGarantiaNuestra.getMonth() + 24)
    
    // 4. Calcular meses a contratar
    if (finGarantiaNuestra <= finGarantiaFabricaMargen) {
      return { 
        coste: 0, 
        meses: 0, 
        detalle: 'Fábrica cubre todo',
        finGarantiaFabricaMargen,
        finGarantiaNuestra
      }
    }
    
    const mesesDiferencia = Math.ceil((finGarantiaNuestra.getTime() - finGarantiaFabricaMargen.getTime()) / (1000 * 60 * 60 * 24 * 30))
    
    // 5. Determinar coste según meses
    let costeBase = 0
    if (mesesDiferencia <= 12) {
      costeBase = 600
    } else if (mesesDiferencia <= 18) {
      costeBase = 900
    } else {
      costeBase = 1200
    }
    
    // 6. Detectar modelos premium (≥30)
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
      detalle: `${mesesDiferencia} meses${esPremium ? ' (Premium +10%)' : ''}`,
      finGarantiaFabricaMargen,
      finGarantiaNuestra,
      esPremium
    }
  }, [])

  // Función para calcular precio de venta objetivo (memoizada)
  const calcularPrecioVentaObjetivo = useCallback((vehiculo: any, configToUse = config) => {
    if (!vehiculo.precio_salida_neto) return null
    
    const regFis = vehiculo.reg_fis?.toUpperCase() || ''
    const tieneIVA = regFis.includes('IVA')
    
    // Garantía automática
    const garantiaInfo = calcularGarantiaAutomatica(vehiculo)
    
    // Calcular precio base + gastos
    let precioVenta = vehiculo.precio_salida_neto
    precioVenta += (vehiculo.daño_neto || 0)
    precioVenta += configToUse.gastosTransporte
    precioVenta += configToUse.estructura
    precioVenta += garantiaInfo.coste
    
    // Aplicar margen
    if (configToUse.porcentajeMargen > 0) {
      precioVenta = precioVenta * (1 + configToUse.porcentajeMargen / 100)
    }
    
    // Aplicar IVA solo si es IVA
    if (tieneIVA) {
      precioVenta = precioVenta * 1.21
    }
    
    return Math.round(precioVenta)
  }, [config, calcularGarantiaAutomatica])

  // Función para calcular puja máxima (memoizada)
  const calcularPujaMaxima = useCallback((vehiculo: any, configToUse = config) => {
    const precioCompetitivo = vehiculo.precio_competitivo
    if (!precioCompetitivo) return null

    const regFis = vehiculo.reg_fis?.toUpperCase() || ''
    const tieneIVA = regFis.includes('IVA')

    // Partir del precio competitivo (ya tiene IVA de la red)
    let pujaMaxima = precioCompetitivo

    // Quitar gastos
    pujaMaxima -= configToUse.gastosTransporte
    pujaMaxima -= configToUse.estructura

    // Quitar garantía automática
    const garantiaAuto = calcularGarantiaAutomatica(vehiculo)
    pujaMaxima -= garantiaAuto.coste

    // Quitar margen
    if (configToUse.porcentajeMargen > 0) {
      pujaMaxima = pujaMaxima / (1 + configToUse.porcentajeMargen / 100)
    }

    // Quitar daños si los tiene
    if (vehiculo.daño_neto) {
      pujaMaxima -= vehiculo.daño_neto
    }

    // Quitar IVA para obtener precio neto de puja
    if (tieneIVA) {
      pujaMaxima = pujaMaxima / 1.21
    }

    return Math.round(pujaMaxima)
  }, [config, calcularGarantiaAutomatica])

  // Filtrar vehículos (memoizado)
  const filteredVehicles = useMemo(() => {
    return vehiculos.filter((v: any) => {
      const matchSearch = searchTerm === "" || 
        v.matricula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.lote?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchMarca = marcaFilter === "all" || v.marca === marcaFilter
      
      const matchModelo = modeloFilter === "all" || v.modelo === modeloFilter
      
      // Filtro de rentabilidad
      const precioVentaObjetivo = calcularPrecioVentaObjetivo(v)
      const precioCompetitivo = v.precio_competitivo
      const matchRentabilidad = rentabilidadFilter === "all" || (() => {
        if (!precioVentaObjetivo || !precioCompetitivo) {
          return rentabilidadFilter === "sin-datos"
        }
        const margen = precioCompetitivo - precioVentaObjetivo
        if (rentabilidadFilter === "rentable") return margen > 0
        if (rentabilidadFilter === "no-rentable") return margen <= 0
        return false
      })()
      
      return matchSearch && matchMarca && matchModelo && matchRentabilidad
    })
  }, [vehiculos, searchTerm, marcaFilter, modeloFilter, rentabilidadFilter, calcularPrecioVentaObjetivo])
  
  // Calcular stats (memoizado)
  const stats = useMemo(() => {
    let rentables = 0
    let noRentables = 0
    let sinDatos = 0
    
    vehiculos.forEach((v: any) => {
      const precioVentaObjetivo = calcularPrecioVentaObjetivo(v)
      const precioCompetitivo = v.precio_competitivo || null
      
      if (!precioVentaObjetivo || !precioCompetitivo) {
        sinDatos++
        return
      }
      
      const margen = precioCompetitivo - precioVentaObjetivo
      
      if (!margen) {
        sinDatos++
      } else if (margen > 0) {
        rentables++
      } else {
        noRentables++
      }
    })
    
    return {
      total: vehiculos.length,
      rentables,
      noRentables,
      sinDatos
    }
  }, [vehiculos, calcularPrecioVentaObjetivo])

  // Modelos únicos (memoizado)
  const modelosUnicos = useMemo(() => {
    return Array.from(new Set(vehiculos.map((v: any) => v.modelo).filter(Boolean))).sort()
  }, [vehiculos])

  return (
    <>
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Breadcrumbs className="mt-4" />
          <CompactSearchWithModal className="mt-4" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/comparador-precios')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Upload className="h-8 w-8 text-primary" />
              Excel - Análisis de Rentabilidad
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setConfigOpen(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurar
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={exportarAExcel}
            >
              <FileDown className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => document.getElementById('excel-upload')?.click()}
              disabled={uploadingExcel}
            >
              {uploadingExcel ? (
                <>
                  <BMWMSpinner size={16} className="mr-2" />
                  Cargando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Cargar Excel
                </>
              )}
            </Button>
            <input
              id="excel-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              className="hidden"
            />
            {vehiculos.length > 0 && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setDeleteDialogOpen(true)}
                className="hover:bg-red-500/10 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* KPIs, Filtros y Oportunidades */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Total Vehículos</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Rentables</div>
            <div className="text-2xl font-bold text-green-500">{stats.rentables}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">No Rentables</div>
            <div className="text-2xl font-bold text-red-500">{stats.noRentables}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Sin Datos</div>
            <div className="text-2xl font-bold text-muted-foreground">{stats.sinDatos}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/30 cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => setConfigOpen(true)}>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Settings className="w-3 h-3" />
              Configuración
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transp:</span>
                <span className="font-medium">{config.gastosTransporte}€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Margen:</span>
                <span className="font-medium">{config.porcentajeMargen}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estruc:</span>
                <span className="font-medium">{config.estructura}€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Garant:</span>
                <span className="font-medium text-green-500">Auto</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Oportunidades */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {/* Filtros */}
        <Card className="col-span-2">
        <CardContent className="p-3">
          <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-medium">Filtros</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Buscar: Matrícula, modelo, lote..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 text-xs"
            />
            
            <Select value={marcaFilter} onValueChange={setMarcaFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las marcas</SelectItem>
                <SelectItem value="BMW">BMW</SelectItem>
                <SelectItem value="MINI">MINI</SelectItem>
              </SelectContent>
            </Select>

            <Select value={modeloFilter} onValueChange={setModeloFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los modelos</SelectItem>
                {modelosUnicos.map((modelo) => (
                  <SelectItem key={modelo} value={modelo}>{modelo}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={rentabilidadFilter} onValueChange={setRentabilidadFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Rentabilidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las rentabilidades</SelectItem>
                <SelectItem value="rentable">✓ Rentables</SelectItem>
                <SelectItem value="no-rentable">✗ No Rentables</SelectItem>
                <SelectItem value="sin-datos">Sin Datos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Interesantes */}
      <Card className="col-span-3">
        <CardContent className="p-2">
          <div className="text-xs text-muted-foreground mb-2 font-medium flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Oportunidades de Compra
          </div>
          <div className="grid grid-cols-6 gap-1">
            {vehiculos
              .map((v: any) => {
                const precioVentaObjetivo = calcularPrecioVentaObjetivo(v)
                const precioCompetitivo = v.precio_competitivo
                const pujaMaxima = calcularPujaMaxima(v)
                if (!precioVentaObjetivo || !precioCompetitivo) return null
                
                // Filtrar vehículos con más de 115.000 km
                if (v.km && v.km > 115000) return null
                
                const margen = precioCompetitivo - precioVentaObjetivo
                if (margen <= 0) return null
                
                // Buscar si el modelo existe en stock
                const modeloEnStock = vehiculosStock.find((s: any) => 
                  s.modelo?.toLowerCase().trim() === v.modelo?.toLowerCase().trim()
                )
                
                // Tipo de oportunidad (sin emojis)
                let esOportunidad = false
                
                if (!modeloEnStock) {
                  // Modelo NO en stock + tiene margen = OPORTUNIDAD
                  esOportunidad = true
                } else {
                  // Modelo SÍ en stock, pero podemos comprar MÁS BARATO
                  const precioStockActual = modeloEnStock.precio_venta_recomendado || 0
                  const pujaMaximaSinIva = pujaMaxima || 0
                  const ahorro = precioStockActual - precioVentaObjetivo
                  
                  if (ahorro > 500) {
                    // Podemos vender más barato que el actual
                    esOportunidad = true
                  }
                }
                
                if (!esOportunidad) return null
                
                const porcentajeMargen = precioVentaObjetivo ? (margen / precioVentaObjetivo) * 100 : 0
                
                return {
                  ...v,
                  margen,
                  porcentajeMargen,
                  precioVentaObjetivo
                }
              })
              .filter(Boolean)
              .sort((a: any, b: any) => b.porcentajeMargen - a.porcentajeMargen)
              .slice(0, 12)
              .map((v: any) => {
                // Borde verde elegante según rentabilidad
                const greenIntensity = Math.min(1, (v.porcentajeMargen / 15))
                const borderLeftColor = `hsl(142, 60%, ${70 - (greenIntensity * 30)}%)`
                
                return (
                  <div 
                    key={v.id}
                    className="text-[9px] p-1.5 rounded border bg-card hover:bg-muted/50 transition-colors cursor-default"
                    style={{ 
                      borderLeftColor: borderLeftColor,
                      borderLeftWidth: '3px'
                    }}
                  >
                    <div className="font-medium truncate text-[9px] leading-tight mb-0.5">{v.modelo}</div>
                    <div className="flex items-center justify-between text-[8px] mb-1">
                      <span className="text-muted-foreground truncate">{v.matricula}</span>
                      {v.lote && <span className="text-muted-foreground/70 ml-1 shrink-0">{v.lote}</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[9px]">+{v.margen.toLocaleString()}€</span>
                      <span className="text-muted-foreground text-[8px] font-medium">{v.porcentajeMargen.toFixed(1)}%</span>
                    </div>
                  </div>
                )
              })}
            {vehiculos.filter((v: any) => {
              const precioVentaObjetivo = calcularPrecioVentaObjetivo(v)
              const precioCompetitivo = v.precio_competitivo
              if (!precioVentaObjetivo || !precioCompetitivo) return false
              return (precioCompetitivo - precioVentaObjetivo) > 0
            }).length === 0 && (
              <div className="text-[10px] text-muted-foreground text-center py-3 col-span-6">
                No hay oportunidades detectadas
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <BMWMSpinner size={48} className="mx-auto mb-3" />
            <p className="text-muted-foreground">Cargando vehículos...</p>
          </CardContent>
        </Card>
      )}

      {/* Tabla de vehículos */}
      {!loading && vehiculos.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Vehículos de Excel - Análisis de Rentabilidad
                <Badge variant="outline" className="ml-2">{filteredVehicles.length} de {vehiculos.length}</Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[600px]">
              <table className="w-full text-xs">
                <thead className="bg-muted sticky top-0 z-10">
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
                  {filteredVehicles.map((vehiculo: any) => {
                    const precioVentaObjetivo = calcularPrecioVentaObjetivo(vehiculo)
                    const precioCompetitivo = vehiculo.precio_competitivo
                    const pujaMaxima = calcularPujaMaxima(vehiculo)
                    const margen = precioVentaObjetivo && precioCompetitivo 
                      ? precioCompetitivo - precioVentaObjetivo 
                      : null
                    const rentable = margen !== null && margen > 0
                    
                    const regFis = vehiculo.reg_fis?.toUpperCase() || ''
                    const tieneIVA = regFis.includes('IVA')

                    // Color verde por % de equipamiento
                    const equipPorcentaje = vehiculo.equip_porcentaje || 0
                    const greenIntensity = Math.min(100, equipPorcentaje)
                    const textColor = equipPorcentaje > 0 
                      ? `hsl(142, 70%, ${60 - (greenIntensity * 0.3)}%)` 
                      : 'inherit'

                    // Determinar si es "No interesante" (>115.000 km)
                    const esNoInteresante = vehiculo.km && vehiculo.km > 115000

                    return (
                      <tr key={vehiculo.id} className="border-b hover:bg-muted/50">
                        <td className="p-1.5 text-xs">{vehiculo.lote || '-'}</td>
                        <td className="p-1.5 text-xs">{vehiculo.marca || '-'}</td>
                        <td className="p-1.5 text-xs" title={vehiculo.modelo}>
                          <div className="max-w-[150px] truncate">{vehiculo.modelo || '-'}</div>
                        </td>
                        <td className="p-1.5 text-xs font-mono">{vehiculo.matricula || '-'}</td>
                        <td className="p-1.5 text-xs">
                          {vehiculo.fecha_matriculacion ? new Date(vehiculo.fecha_matriculacion).toLocaleDateString('es-ES') : '-'}
                        </td>
                        <td className="p-1.5 text-right text-xs">
                          {vehiculo.km ? vehiculo.km.toLocaleString() : '-'}
                        </td>
                        <td className="p-1.5 text-right text-xs font-medium" style={{ color: textColor }}>
                          {equipPorcentaje > 0 ? `${equipPorcentaje.toFixed(0)}%` : '0%'}
                        </td>
                        <td className="p-1.5 text-right text-xs">
                          {vehiculo.precio_salida_neto ? `${vehiculo.precio_salida_neto.toLocaleString()}€` : '-'}
                        </td>
                        <td className="p-1.5 text-right text-red-500 text-xs">
                          {vehiculo.daño_neto ? `${vehiculo.daño_neto.toLocaleString()}€` : '-'}
                        </td>
                        <td className="p-1.5 text-right bg-purple-500/5 font-bold text-xs text-purple-600">
                          {pujaMaxima ? `${pujaMaxima.toLocaleString()}€` : '-'}
                        </td>
                        <td className="p-1.5 text-right bg-amber-500/5">
                          {precioVentaObjetivo ? (
                            <div
                              className="flex items-center justify-end gap-1 cursor-help"
                              title={(() => {
                                const garantiaInfo = calcularGarantiaAutomatica(vehiculo)
                                return `Desglose:\n` +
                                  `• Precio Salida: ${vehiculo.precio_salida_neto?.toLocaleString()}€\n` +
                                  `• Daños: ${vehiculo.daño_neto?.toLocaleString() || 0}€\n` +
                                  `• Transporte: ${config.gastosTransporte}€\n` +
                                  `• Estructura: ${config.estructura}€\n` +
                                  `• Garantía (auto): ${garantiaInfo.coste}€ (${garantiaInfo.detalle})\n` +
                                  `• Margen ${config.porcentajeMargen}%\n` +
                                  `• IVA: ${tieneIVA ? '21%' : 'REBU 0%'}`
                              })()}
                            >
                              <span className="font-bold text-xs">
                                {precioVentaObjetivo.toLocaleString()}€
                              </span>
                              <Badge variant="outline" className="text-[7px] px-1 py-0">
                                {tieneIVA ? 'IVA' : 'REBU'}
                              </Badge>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="p-1.5 text-right bg-green-500/5 font-bold text-xs text-green-600">
                          {precioCompetitivo ? `${precioCompetitivo.toLocaleString()}€` : (
                            <span className="text-muted-foreground text-[10px]">-</span>
                          )}
                        </td>
                        <td className="p-1.5 text-center">
                          <Badge 
                            variant="outline" 
                            className="text-[10px] cursor-pointer hover:bg-primary/10 transition-colors"
                            onClick={() => vehiculo.num_competidores > 0 && setCompetidoresModal({open: true, vehiculo})}
                          >
                            {vehiculo.num_competidores || 0}
                          </Badge>
                        </td>
                        <td className="p-1.5">
                          {esNoInteresante ? (
                            <Badge className="w-full text-[10px] bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400">
                              No interesante
                            </Badge>
                          ) : margen !== null && precioVentaObjetivo && precioCompetitivo ? (
                            <div className={`w-full text-xs font-bold flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md border-2 ${
                              rentable 
                                ? "bg-green-500/10 border-green-500 text-green-700 dark:text-green-400" 
                                : "bg-red-500/10 border-red-500 text-red-700 dark:text-red-400"
                            }`}>
                              <span className="text-base">{rentable ? "✓" : "✗"}</span>
                              <span className="text-base">{margen > 0 ? '+' : ''}{margen.toLocaleString()}€</span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="w-full text-[10px]">-</Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && vehiculos.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-semibold mb-2">No hay vehículos cargados</p>
            <p className="text-sm text-muted-foreground mb-4">
              Carga un archivo Excel para comenzar
            </p>
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={() => document.getElementById('excel-upload-empty')?.click()}
                disabled={uploadingExcel}
              >
                {uploadingExcel ? (
                  <>
                    <BMWMSpinner size={16} className="mr-2" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Cargar Excel
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard/comparador-precios')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </div>
            <input
              id="excel-upload-empty"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              className="hidden"
            />
          </CardContent>
        </Card>
      )}

      {!loading && filteredVehicles.length === 0 && vehiculos.length > 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No hay vehículos que coincidan con los filtros</p>
          </CardContent>
        </Card>
      )}
    </div>

      {/* Dialog de Confirmación para Eliminar */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Eliminar todos los vehículos
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar TODOS los vehículos del Excel? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmarEliminar}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar Todos
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Configuración */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-[740px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuración de Costes y Margen
            </DialogTitle>
            <DialogDescription>
              Configura los parámetros para calcular el precio de venta objetivo
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* Campos editables en una sola fila */}
            <div className="grid grid-cols-3 gap-4 mb-6 pb-4 border-b">
              <div>
                <label className="text-xs font-medium block mb-1.5">Transporte (€)</label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={tempConfig.gastosTransporte}
                  onChange={(e) => setTempConfig({...tempConfig, gastosTransporte: Number(e.target.value)})}
                  className="h-9"
                />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1.5">Estructura (€)</label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={tempConfig.estructura}
                  onChange={(e) => setTempConfig({...tempConfig, estructura: Number(e.target.value)})}
                  className="h-9"
                />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1.5">Margen (%)</label>
                <Input 
                  type="number" 
                  step="0.1"
                  value={tempConfig.porcentajeMargen}
                  onChange={(e) => setTempConfig({...tempConfig, porcentajeMargen: Number(e.target.value)})}
                  className="h-9"
                />
              </div>
            </div>

            {/* Layout: 40% IVA y Costes | 60% Garantía */}
            <div className="grid grid-cols-[2fr,3fr] gap-4">
              {/* Columna izquierda: IVA y Cálculo Costes */}
              <div className="space-y-4">
                {/* IVA Automático */}
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-xs font-semibold mb-2 text-foreground">📊 IVA Automático</p>
                  <p className="text-xs text-muted-foreground">
                    Se aplica según REG FIS del Excel: <strong className="text-foreground">IVA = +21%</strong> | <strong className="text-foreground">REBU = 0%</strong>
                  </p>
                </div>

                {/* Cálculo Precio Venta */}
                <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <p className="text-xs font-semibold mb-2 text-foreground">💰 Cálculo Costes</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><strong className="text-foreground">Precio Salida</strong></p>
                    <p>+ Daños</p>
                    <p>+ Transporte</p>
                    <p>+ Estructura</p>
                    <p>+ Garantía (auto)</p>
                    <p>+ Margen (%)</p>
                    <p>+ IVA (auto)</p>
                    <p className="pt-1 border-t border-amber-500/20 font-semibold text-foreground">= Precio Venta</p>
                  </div>
                </div>
              </div>

              {/* Columna derecha: Explicación Garantía Automática */}
              <div className="p-5 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Garantía Automática
                </p>
                <div className="space-y-4 text-xs text-muted-foreground">
                  <div>
                    <p className="font-medium text-foreground mb-2">Cálculo automático por vehículo:</p>
                    <div className="pl-3 space-y-2">
                      <p>1. Garantía fábrica: <strong className="text-foreground">36 meses desde matriculación</strong></p>
                      <p>2. Garantía fábrica con margen seguridad: <strong className="text-foreground">-6 meses</strong></p>
                      <p>3. Garantía que debemos dar: <strong className="text-foreground">HOY + 24 meses</strong></p>
                      <p>4. Si nuestra &gt; fábrica con margen → <strong className="text-foreground">Contratar diferencia</strong></p>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-green-500/20">
                    <p className="font-semibold text-foreground mb-3">Tarifas de Garantía:</p>
                    <div className="grid grid-cols-3 gap-3 pl-3">
                      <p>• 1-12 meses: <strong className="text-foreground">600€</strong></p>
                      <p>• 13-18 meses: <strong className="text-foreground">900€</strong></p>
                      <p>• 19-24 meses: <strong className="text-foreground">1.200€</strong></p>
                    </div>
                    <p className="pl-3 mt-3 text-amber-600 font-medium">• Modelos Premium ≥30 (30d, 40i, 50i): <strong>+10%</strong></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setTempConfig({
                    gastosTransporte: 0,
                    porcentajeMargen: 0,
                    estructura: 0
                  })
                }}
              >
                Restaurar por defecto
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setConfigOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => {
                  setConfig(tempConfig)
                  localStorage.setItem('excel_comparador_config', JSON.stringify(tempConfig))
                  setConfigOpen(false)
                  toast({
                    title: "✅ Configuración guardada",
                    description: "Los cálculos se han actualizado",
                  })
                }}>
                  Guardar y Aplicar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Análisis de Competidores */}
      {competidoresModal.open && competidoresModal.vehiculo && (
        <ExcelAnalysisModal
          vehiculo={competidoresModal.vehiculo}
          open={competidoresModal.open}
          onClose={() => setCompetidoresModal({open: false, vehiculo: null})}
          config={config}
          calcularPrecioVentaObjetivo={calcularPrecioVentaObjetivo}
          calcularGarantiaAutomatica={calcularGarantiaAutomatica}
        />
      )}
    </>
  )
}

