"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { CompactSearchWithModal } from "@/components/dashboard/compact-search-with-modal"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { Upload, Search, Filter, RefreshCw, ArrowLeft, Trash2, FileDown, Settings, TrendingUp, Info } from "lucide-react"
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

const generarVariantesModelo = (modelo?: string | null, marca?: string | null): string[] => {
  if (!modelo) return []

  const variantes = new Set<string>()
  const limpiarEspacios = (texto: string) => texto.replace(/\s+/g, " ").trim()
  const base = limpiarEspacios(modelo)
  if (!base) return []

  const marcaUpper = marca?.trim().toUpperCase()
  const agregar = (valor?: string) => {
    if (valor) variantes.add(limpiarEspacios(valor))
  }

  agregar(base)

  // Separar marca si ya está incluida
  const sinMarcaBMW = base.replace(/^BMW\s+/i, "").trim()
  if (sinMarcaBMW !== base) agregar(sinMarcaBMW)

  const sinMarcaMINI = base.replace(/^MINI\s+/i, "").trim()
  if (sinMarcaMINI !== base) agregar(sinMarcaMINI)

  // Quitar "Serie X" del inicio (con o sin marca delante)
  const serieInicio = base.replace(/^(BMW|MINI)\s+Serie\s*\d+\s*/i, "").trim()
  if (serieInicio && serieInicio !== base) agregar(serieInicio)

  const serieSinMarca = base.replace(/^Serie\s*\d+\s*/i, "").trim()
  if (serieSinMarca && serieSinMarca !== base) agregar(serieSinMarca)

  // Añadir combinaciones con la marca detectada
  const posiblesMarcas = new Set<string>()
  if (marcaUpper) {
    posiblesMarcas.add(marcaUpper)
  }
  if (/^BMW/i.test(base)) posiblesMarcas.add("BMW")
  if (/^MINI/i.test(base)) posiblesMarcas.add("MINI")

  for (const variante of Array.from(variantes)) {
    for (const marcaNormalizada of posiblesMarcas) {
      if (!variante.toUpperCase().startsWith(marcaNormalizada)) {
        agregar(`${marcaNormalizada} ${variante}`)
      }
    }
  }

  return Array.from(variantes).filter(Boolean)
}

export default function ExcelComparadorPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [vehiculosStock, setVehiculosStock] = useState<any[]>([])
  const [sinDatosDetalles, setSinDatosDetalles] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [uploadingExcel, setUploadingExcel] = useState(false)
  const [recalculando, setRecalculando] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [marcaFilter, setMarcaFilter] = useState("all")
  const [rentabilidadFilter, setRentabilidadFilter] = useState("all")
  const [modeloFilter, setModeloFilter] = useState("all")
  const [configOpen, setConfigOpen] = useState(false)
  const [competidoresModal, setCompetidoresModal] = useState<{open: boolean, vehiculo: any, competidores: any[]}>({open: false, vehiculo: null, competidores: []})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [opcionesModal, setOpcionesModal] = useState<{open: boolean, vehiculo: any}>({open: false, vehiculo: null})
  
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

  const cargarCompetidoresDetalle = async (vehiculo: any) => {
    try {
      console.log('🔍 Cargando competidores para:', vehiculo.modelo, 'Serie:', vehiculo.serie)
      
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
      
      const variantesModelo = generarVariantesModelo(vehiculo.modelo, vehiculo.marca)

      const ejecutarBusqueda = async (termino: string) => {
        let query = supabase
          .from('comparador_scraper')
          .select('*')
          .in('estado_anuncio', ['activo', 'nuevo', 'precio_bajado'])
          .ilike('modelo', `%${termino}%`)

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
        if (error) {
          console.warn('⚠️ Error buscando competidores para', termino, error.message)
          return []
        }
        return data || []
      }

      // ESTRATEGIA 1: Variantes normalizadas del modelo
      for (const variante of variantesModelo) {
        const resultados = await ejecutarBusqueda(variante)
        if (resultados.length > 0) {
          competidores = resultados
          estrategia = `exacta-${variante}`
          break
        }
      }

      // ESTRATEGIA 2: Buscar por versión específica si no hubo coincidencias
      if (competidores.length === 0) {
        for (const variante of variantesModelo) {
          const versiones = variante.match(/\b[M]?\d{2,3}[a-z]+\b/gi) || []
          for (const version of versiones) {
            const resultados = await ejecutarBusqueda(version)
            if (resultados.length > 0) {
              competidores = resultados
              estrategia = `version-${version}`
              break
            }
          }
          if (competidores.length > 0) break
        }
      }
      
      // Procesar competidores
      const competidoresProcesados = competidores.map((comp: any) => {
        // Parsear precio nuevo desde múltiples campos posibles
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
      
      console.log(`✅ ${competidoresProcesados.length} competidores cargados (${estrategia})`)
      if (competidoresProcesados.length > 0) {
        const muestra = competidores[0] // RAW de la BD
        console.log('🔍 RAW de BD:', {
          precio_nuevo: muestra.precio_nuevo,
          precioNuevo: muestra.precioNuevo,
          precio_original: muestra.precio_original,
          precio: muestra.precio
        })
        console.log('🔍 Procesado:', {
          precio: competidoresProcesados[0].precio,
          precioNuevo: competidoresProcesados[0].precioNuevo,
          km: competidoresProcesados[0].km,
          concesionario: competidoresProcesados[0].concesionario
        })
      }
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
    
    // Cargar competidores
    const competidores = await cargarCompetidoresDetalle(vehiculo)
    
    setCompetidoresModal({
      open: true,
      vehiculo,
      competidores
    })
  }

  const recalcularPrecios = async () => {
    setRecalculando(true)
    try {
      console.log('🔄 Recalculando precios de la red...')
      
      const response = await fetch('/api/comparador/excel/recalcular-precios', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al recalcular precios')
      }
      
      toast({
        title: "✅ Precios recalculados",
        description: `${data.actualizados} vehículos actualizados. ${data.sinDatos} sin datos. Revisa consola para detalles.`,
      })
      
      // Recargar datos
      await cargarVehiculos()
      
    } catch (error: any) {
      console.error('❌ Error recalculando:', error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setRecalculando(false)
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

    // Quitar IVA primero (inverso del cálculo de venta)
    if (tieneIVA) {
      pujaMaxima = pujaMaxima / 1.21
    }

    // Quitar margen porcentual
    if (configToUse.porcentajeMargen > 0) {
      pujaMaxima = pujaMaxima / (1 + configToUse.porcentajeMargen / 100)
    }

    // Quitar costes añadidos tras el margen en orden inverso al cálculo original
    const garantiaAuto = calcularGarantiaAutomatica(vehiculo)
    pujaMaxima -= garantiaAuto.coste
    pujaMaxima -= configToUse.estructura
    pujaMaxima -= configToUse.gastosTransporte

    // Quitar daños si los tiene
    if (vehiculo.daño_neto) {
      pujaMaxima -= vehiculo.daño_neto
    }

    return Math.round(pujaMaxima)
  }, [config, calcularGarantiaAutomatica])

  const calcularPrecioDesdeBase = useCallback((vehiculo: any, base: number | null, aplicarMargen: boolean) => {
    if (base === null || base === undefined) return null

    const regFis = vehiculo.reg_fis?.toUpperCase() || ''
    const tieneIVA = regFis.includes('IVA')
    const garantiaInfo = calcularGarantiaAutomatica(vehiculo)

    let resultado = base
    resultado += vehiculo.daño_neto || 0
    resultado += config.gastosTransporte
    resultado += config.estructura
    resultado += garantiaInfo.coste

    if (aplicarMargen && config.porcentajeMargen > 0) {
      resultado = resultado * (1 + config.porcentajeMargen / 100)
    }

    if (tieneIVA) {
      resultado = resultado * 1.21
    }

    return Math.round(resultado)
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
      const pujaMaxima = calcularPujaMaxima(v)
      const precioVentaDesdePuja = calcularPrecioDesdeBase(v, pujaMaxima, true)
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
  }, [vehiculos, searchTerm, marcaFilter, modeloFilter, rentabilidadFilter, calcularPrecioVentaObjetivo, calcularPujaMaxima, calcularPrecioDesdeBase])
  
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
      if (margen === undefined || margen === null) {
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
  }, [vehiculos, calcularPrecioVentaObjetivo, calcularPujaMaxima, calcularPrecioDesdeBase])

  // Modelos únicos (memoizado)
  const modelosUnicos = useMemo(() => {
    return Array.from(new Set(vehiculos.map((v: any) => v.modelo).filter(Boolean))).sort()
  }, [vehiculos])

  const obtenerDetalleSinDatos = useCallback(async (vehiculo: any) => {
    if (!vehiculo?.modelo) {
      return 'Modelo'
    }

    try {
      const estadoFiltro = ['activo', 'nuevo', 'precio_bajado']
      const variantes = generarVariantesModelo(vehiculo.modelo, vehiculo.marca)
      if (variantes.length === 0) {
        return 'Modelo'
      }

      const contar = async (termino: string, aplicarRangoAño = false, aplicarRangoKm = false) => {
        let query = supabase
          .from('comparador_scraper')
          .select('id', { count: 'exact', head: true })
          .in('estado_anuncio', estadoFiltro)
          .ilike('modelo', `%${termino}%`)

        if (aplicarRangoAño && vehiculo.fecha_matriculacion) {
          const añoBase = new Date(vehiculo.fecha_matriculacion).getFullYear()
          query = query
            .gte('año', (añoBase - 1).toString())
            .lte('año', (añoBase + 1).toString())
        }

        if (aplicarRangoKm) {
          const kmNumerico = typeof vehiculo.km === 'number'
            ? vehiculo.km
            : typeof vehiculo.km === 'string'
              ? parseInt(vehiculo.km.replace(/[.\s]/g, ''), 10)
              : null

          if (typeof kmNumerico === 'number' && !Number.isNaN(kmNumerico)) {
            const kmMin = Math.max(0, kmNumerico - 30000)
            const kmMax = kmNumerico + 30000
            query = query
              .gte('km', kmMin.toString())
              .lte('km', kmMax.toString())
          } else {
            return 0
          }
        }

        const { count } = await query
        return count || 0
      }

      let coincidenciasModelo = 0
      let varianteSeleccionada = ''
      for (const variante of variantes) {
        coincidenciasModelo = await contar(variante, false, false)
        if (coincidenciasModelo > 0) {
          varianteSeleccionada = variante
          break
        }
      }

      if (coincidenciasModelo === 0) {
        return 'Modelo'
      }

      const coincidenciasModeloAño = await contar(varianteSeleccionada, true, false)
      if (coincidenciasModeloAño === 0) {
        return 'Fecha'
      }

      const coincidenciasCompleto = await contar(varianteSeleccionada, true, true)
      if (coincidenciasCompleto === 0) {
        return 'Km'
      }

      return 'Recalcular'
    } catch (error: any) {
      console.error('❌ Error analizando sin datos:', error)
      return 'Error'
    }
  }, [supabase])

  useEffect(() => {
    const pendientes = vehiculos.filter(
      (v: any) =>
        (!v.precio_competitivo || Number.isNaN(v.precio_competitivo)) &&
        v.id &&
        !sinDatosDetalles[v.id]
    )

    if (pendientes.length === 0) return

    let cancelado = false

    ;(async () => {
      for (const vehiculo of pendientes) {
        const detalle = await obtenerDetalleSinDatos(vehiculo)
        if (!cancelado) {
          setSinDatosDetalles((prev) => ({
            ...prev,
            [vehiculo.id]: detalle,
          }))
        }
      }
    })()

    return () => {
      cancelado = true
    }
  }, [vehiculos, sinDatosDetalles, obtenerDetalleSinDatos])

  return (
    <>
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mt-4">
            <Breadcrumbs />
          </div>
          <CompactSearchWithModal className="mt-4" />
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Upload className="h-8 w-8 text-primary" />
            Excel - Análisis de Rentabilidad
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/comparador-precios')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            {vehiculos.length > 0 && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={recalcularPrecios}
                disabled={recalculando}
                title="Recalcular precios de la red con búsqueda mejorada"
              >
                {recalculando ? (
                  <BMWMSpinner size={16} />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            )}
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setConfigOpen(true)}
              title="Configurar costes y margen"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={exportarAExcel}
              title="Exportar a Excel"
            >
              <FileDown className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => document.getElementById('excel-upload')?.click()}
              disabled={uploadingExcel}
              title="Cargar Excel de subasta"
            >
              {uploadingExcel ? (
                <BMWMSpinner size={16} />
              ) : (
                <Upload className="w-4 h-4" />
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
                title="Eliminar todos los vehículos"
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
              .slice(0, 11)
              .map((v: any) => {
                // Borde verde elegante según rentabilidad
                const greenIntensity = Math.min(1, (v.porcentajeMargen / 15))
                const borderLeftColor = `hsl(142, 60%, ${70 - (greenIntensity * 30)}%)`
                
                return (
                  <div 
                    key={v.id}
                    className="text-[9px] p-1.5 rounded border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                    style={{ 
                      borderLeftColor: borderLeftColor,
                      borderLeftWidth: '3px'
                    }}
                    onClick={() => {
                      if (v.num_competidores > 0) {
                        abrirModalCompetidores(v)
                      }
                    }}
                    title="Click para ver análisis de competidores"
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
            
            {/* Botón Ver Más (última posición) */}
            <div 
              className="text-[9px] p-1.5 rounded border-2 border-green-500 bg-green-500/10 hover:bg-green-500/20 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1"
              onClick={() => router.push('/dashboard/comparador-precios/excel/oportunidades')}
              title="Ver todas las oportunidades"
            >
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-[10px] font-bold text-green-700 dark:text-green-500">Ver todas</span>
            </div>

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
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setInfoModalOpen(true)}
                className="h-8 w-8 p-0"
                title="Información sobre el análisis"
              >
                <Info className="w-4 h-4" />
              </Button>
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
                    const garantiaInfo = calcularGarantiaAutomatica(vehiculo)

                    const calcularPrecioDesdeBase = (base: number | null, aplicarMargen: boolean) => {
                      if (base === null || base === undefined) return null
                      let resultado = base
                      resultado += vehiculo.daño_neto || 0
                      resultado += config.gastosTransporte
                      resultado += config.estructura
                      resultado += garantiaInfo.coste
                      if (aplicarMargen && config.porcentajeMargen > 0) {
                        resultado = resultado * (1 + config.porcentajeMargen / 100)
                      }
                      if (tieneIVA) {
                        resultado = resultado * 1.21
                      }
                      return Math.round(resultado)
                    }

                    const precioVentaDesdePuja = pujaMaxima ? calcularPrecioDesdeBase(pujaMaxima, true) : null
                    const margenDesdePuja = precioCompetitivo && precioVentaDesdePuja !== null
                      ? Math.round(precioCompetitivo - precioVentaDesdePuja)
                      : null
                    const clasesMargenBase = "w-full flex flex-col items-center gap-[2px] leading-tight py-1.5 px-2 rounded-md border-2"
                    const clasesMargen = rentable
                      ? `${clasesMargenBase} bg-green-500/10 border-green-500 text-green-700 dark:text-green-400`
                      : `${clasesMargenBase} bg-red-500/10 border-red-500 text-red-700 dark:text-red-400`

                    const añoVehiculo = vehiculo.fecha_matriculacion ? new Date(vehiculo.fecha_matriculacion).getFullYear() : null
                    const rangoAños = añoVehiculo ? `${añoVehiculo - 1} - ${añoVehiculo + 1}` : 'sin fecha'
                    const kmValor = typeof vehiculo.km === 'number'
                      ? vehiculo.km
                      : typeof vehiculo.km === 'string'
                        ? parseInt(vehiculo.km.replace(/[.\s]/g, ''), 10)
                        : null
                    const rangoKm = typeof kmValor === 'number' && !isNaN(kmValor)
                      ? `${Math.max(0, kmValor - 30000).toLocaleString()} - ${(kmValor + 30000).toLocaleString()} km`
                      : 'sin kilometraje'

                    return (
                      <tr key={vehiculo.id} className="border-b hover:bg-muted/50">
                        <td className="p-1.5 text-xs">{vehiculo.lote || '-'}</td>
                        <td className="p-1.5 text-xs">{vehiculo.marca || '-'}</td>
                        <td className="p-1.5 text-xs" title={vehiculo.modelo}>
                          <div className={`max-w-[150px] truncate ${
                            vehiculo.num_competidores > 0 && vehiculo.num_competidores <= 3 
                              ? 'text-amber-500 font-medium' 
                              : ''
                          }`}>
                            {vehiculo.modelo || '-'}
                          </div>
                        </td>
                        <td className="p-1.5 text-xs font-mono">{vehiculo.matricula || '-'}</td>
                        <td className="p-1.5 text-xs">
                          {vehiculo.fecha_matriculacion ? new Date(vehiculo.fecha_matriculacion).toLocaleDateString('es-ES') : '-'}
                        </td>
                        <td className="p-1.5 text-right text-xs">
                          {vehiculo.km ? vehiculo.km.toLocaleString() : '-'}
                        </td>
                        <td 
                          className="p-1.5 text-right text-xs font-medium cursor-pointer hover:bg-muted/50 transition-colors" 
                          style={{ color: textColor }}
                          onClick={() => setOpcionesModal({open: true, vehiculo})}
                          title="Click para ver opciones detalladas"
                        >
                          {equipPorcentaje > 0 ? `${equipPorcentaje.toFixed(0)}%` : '0%'}
                        </td>
                        <td className="p-1.5 text-right text-xs">
                          {vehiculo.precio_salida_neto ? `${vehiculo.precio_salida_neto.toLocaleString()}€` : '-'}
                        </td>
                        <td className="p-1.5 text-right text-red-500 text-xs">
                          {vehiculo.daño_neto ? `${vehiculo.daño_neto.toLocaleString()}€` : '-'}
                        </td>
                        <td className="p-1.5 text-right bg-purple-500/5 text-xs">
                          {pujaMaxima ? (
                            <div className="flex flex-col items-end gap-[2px] leading-tight">
                              <span className="font-semibold text-purple-600">{pujaMaxima.toLocaleString()}€</span>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Puja máx.</span>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="p-1.5 text-right bg-amber-500/5">
                          {precioVentaObjetivo ? (
                            <div className="flex flex-col items-end gap-[2px] leading-tight">
                              <div
                                className="flex items-center justify-end gap-1 cursor-help"
                                title={
                                  `Desglose:\n` +
                                  `• Precio Salida: ${vehiculo.precio_salida_neto?.toLocaleString()}€\n` +
                                  `• Daños: ${vehiculo.daño_neto?.toLocaleString() || 0}€\n` +
                                  `• Transporte: ${config.gastosTransporte}€\n` +
                                  `• Estructura: ${config.estructura}€\n` +
                                  `• Garantía (auto): ${garantiaInfo.coste}€ (${garantiaInfo.detalle})\n` +
                                  `• Margen ${config.porcentajeMargen}%\n` +
                                  `• IVA: ${tieneIVA ? '21%' : 'REBU 0%'}`
                                }
                              >
                                <span className="font-bold text-xs">
                                  {precioVentaObjetivo.toLocaleString()}€
                                </span>
                                <Badge variant="outline" className="text-[7px] px-1 py-0">
                                  {tieneIVA ? 'IVA' : 'REBU'}
                                </Badge>
                              </div>
                              {precioVentaDesdePuja && (
                                <span className="text-[10px] text-muted-foreground">
                                  Puja Máx = {precioVentaDesdePuja.toLocaleString()}€
                                </span>
                              )}
                            </div>
                          ) : '-'}
                        </td>
                        <td className="p-1.5 text-right bg-green-500/5 text-xs">
                          {precioCompetitivo ? (
                            <div className="flex flex-col items-end gap-[2px] leading-tight">
                              <span className="font-bold text-green-600">{precioCompetitivo.toLocaleString()}€</span>
                              {precioVentaDesdePuja && (
                                <span className="text-[10px] text-muted-foreground">
                                  Puja Máx = {precioVentaDesdePuja.toLocaleString()}€
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-[2px] leading-tight text-[10px] text-muted-foreground max-w-[180px] text-right">
                              <span className="uppercase tracking-wide font-semibold text-amber-500">Sin datos</span>
                              <span>{sinDatosDetalles[vehiculo.id] || 'Analizando motivos...'}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-1.5 text-center">
                          <Badge 
                            variant="outline" 
                            className="text-[10px] cursor-pointer hover:bg-primary/10 transition-colors"
                            onClick={() => {
                              if (vehiculo.num_competidores > 0) {
                                abrirModalCompetidores(vehiculo)
                              }
                            }}
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
                            <div className={clasesMargen}>
                              <span className="text-base">{rentable ? "✓" : "✗"}</span>
                              <span className="text-xs font-bold">{margen > 0 ? '+' : ''}{margen.toLocaleString()}€</span>
                              {margenDesdePuja !== null && (
                                <span className="text-[10px] text-muted-foreground">
                                  Puja Máx = {margenDesdePuja > 0 ? '+' : ''}{margenDesdePuja.toLocaleString()}€
                                </span>
                              )}
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
          competidores={competidoresModal.competidores}
          open={competidoresModal.open}
          onClose={() => setCompetidoresModal({open: false, vehiculo: null, competidores: []})}
          precioVentaObjetivo={calcularPrecioVentaObjetivo(competidoresModal.vehiculo)}
          config={config}
        />
      )}

      {/* Modal de Información del Análisis */}
      <Dialog open={infoModalOpen} onOpenChange={setInfoModalOpen}>
        <DialogContent className="max-w-[1100px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Info className="w-6 h-6 text-primary" />
              Cómo Funciona el Análisis de Rentabilidad
            </DialogTitle>
            <DialogDescription>
              Explicación detallada del sistema de comparación, búsqueda de competidores y recomendación de precios
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 py-4">
            {/* COLUMNA IZQUIERDA: Datos de la Red */}
            <div className="space-y-6">
            {/* 1. Búsqueda de Competidores */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-500" />
                1. Búsqueda de Competidores en la Red
              </h3>
              <div className="pl-7 space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Para cada vehículo del Excel, buscamos competidores similares en <strong>BMW Premium Selection</strong> y <strong>MINI Next</strong> usando dos estrategias:
                </p>
                
                <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                  <p className="font-semibold mb-2 text-blue-700 dark:text-blue-400">📌 Estrategia 1: Búsqueda Exacta</p>
                  <ul className="space-y-1 text-muted-foreground ml-4">
                    <li>• Busca por el <strong>modelo completo</strong> del Excel (ej: "Serie 1 118d")</li>
                    <li>• Filtra por <strong>año ±1</strong> (si es 2023, busca 2022-2024)</li>
                    <li>• Filtra por <strong>KM ±30.000</strong> (si es 50.000 km, busca 20.000-80.000 km)</li>
                    <li>• Solo anuncios <strong>activos</strong> (no vendidos ni reservados)</li>
                  </ul>
                </div>

                <div className="bg-amber-500/10 p-4 rounded-lg border border-amber-500/20">
                  <p className="font-semibold mb-2 text-amber-700 dark:text-amber-400">📌 Estrategia 2: Búsqueda por Versión Específica</p>
                  <p className="text-muted-foreground mb-2">Si no encuentra resultados con la estrategia 1, busca por la <strong>versión específica</strong>:</p>
                  <ul className="space-y-1 text-muted-foreground ml-4">
                    <li>• Extrae la versión del modelo: <strong>118d</strong>, <strong>320i</strong>, <strong>M135i</strong>, etc.</li>
                    <li>• <span className="text-amber-600 font-medium">IMPORTANTE:</span> Busca la versión <strong>completa con la letra</strong> (d, i, xd, etc.)</li>
                    <li>• Ejemplo: "118d" <strong>NO</strong> trae "118i" ni "120d" (solo 118d exacto)</li>
                    <li>• Añade la <strong>serie</strong> para mayor precisión (ej: "Serie 1" + "118d")</li>
                    <li>• Aplica los mismos filtros: <strong>año ±1</strong> y <strong>KM ±30.000</strong></li>
                  </ul>
                </div>

                <div className="bg-muted p-3 rounded border text-xs text-muted-foreground">
                  <strong>💡 Nota sobre modelos M:</strong> Los modelos M (M135i, M240i, M3, etc.) se buscan con la "M" incluida, diferenciándolos de versiones normales.
                </div>
              </div>
            </div>

            {/* 2. Cálculo de Precios */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                2. Cálculo de Precio Competitivo
              </h3>
              <div className="pl-7 space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Una vez encontrados los competidores similares, calculamos el <strong>precio competitivo</strong>:
                </p>
                
                <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-green-600/20 px-2 py-1 rounded">1</span>
                    <p className="text-muted-foreground"><strong>Precio Medio Red</strong> = Promedio de todos los precios encontrados</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-green-600/20 px-2 py-1 rounded">2</span>
                    <p className="text-muted-foreground"><strong>Precio Competitivo</strong> = Precio Medio × 0.98 (2% más barato)</p>
                  </div>
                </div>

                <p className="text-muted-foreground italic">
                  El precio competitivo es <strong>2% más bajo</strong> que la media de la red, garantizando que nuestro precio sea atractivo sin sacrificar margen.
                </p>
              </div>
            </div>
            </div>

            {/* COLUMNA DERECHA: Cálculos Nuestros */}
            <div className="space-y-6">
            {/* 3. Cálculo de Precio de Venta Objetivo */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-500" />
                3. Cálculo de Precio de Venta Objetivo
              </h3>
              <div className="pl-7 space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Calculamos cuánto nos costaría <strong>vender el vehículo</strong> teniendo en cuenta todos los gastos:
                </p>
                
                <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
                  <p className="font-semibold mb-3 text-purple-700 dark:text-purple-400">Fórmula de Precio de Venta:</p>
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">+</span>
                      <span>Precio Salida (del Excel)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">+</span>
                      <span>Daños (si tiene)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">+</span>
                      <span>Transporte (configurable)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">+</span>
                      <span>Estructura (configurable)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">+</span>
                      <span className="text-green-600 font-semibold">Garantía (automática)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">×</span>
                      <span>(1 + Margen % / 100)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">×</span>
                      <span>IVA (si aplica: 1.21, si no: 1.00)</span>
                    </div>
                    <div className="border-t border-purple-500/30 mt-2 pt-2 flex items-center gap-2">
                      <span className="font-bold text-purple-700 dark:text-purple-400">=</span>
                      <span className="font-bold text-purple-700 dark:text-purple-400">Precio Venta Objetivo</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-500/10 p-3 rounded border border-green-500/20">
                  <p className="font-semibold mb-2 text-green-700 dark:text-green-400 flex items-center gap-1.5">
                    <span>✓</span> Garantía Automática
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">Se calcula automáticamente según:</p>
                  <ul className="space-y-1 text-xs text-muted-foreground ml-4">
                    <li>• Garantía fábrica: 36 meses desde 1ª matriculación</li>
                    <li>• Garantía fábrica con margen: -6 meses de seguridad</li>
                    <li>• Garantía nuestra: HOY + 24 meses</li>
                    <li>• Si nuestra &gt; fábrica → Contratar diferencia</li>
                    <li>• Tarifas: 1-12m=600€ | 13-18m=900€ | 19-24m=1200€</li>
                    <li>• Modelos Premium ≥30 (30d, 40i, 50i): +10%</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 4. Determinación de Rentabilidad */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="text-2xl">💰</span>
                4. Determinación de Rentabilidad
              </h3>
              <div className="pl-7 space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Comparamos el <strong>Precio Competitivo</strong> (de la red) con nuestro <strong>Precio de Venta Objetivo</strong>:
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded border-2 border-green-500">
                    <span className="text-2xl">✓</span>
                    <div>
                      <p className="font-semibold text-green-700 dark:text-green-400">RENTABLE</p>
                      <p className="text-xs text-muted-foreground">Precio Competitivo &gt; Precio Venta Objetivo</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded border-2 border-red-500">
                    <span className="text-2xl">✗</span>
                    <div>
                      <p className="font-semibold text-red-700 dark:text-red-400">NO RENTABLE</p>
                      <p className="text-xs text-muted-foreground">Precio Competitivo ≤ Precio Venta Objetivo</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-amber-500/10 rounded border-2 border-amber-500">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="font-semibold text-amber-700 dark:text-amber-400">NO INTERESANTE</p>
                      <p className="text-xs text-muted-foreground">Vehículo con más de 115.000 km</p>
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground font-semibold mt-4">
                  Margen = Precio Competitivo - Precio Venta Objetivo
                </p>
                <p className="text-xs text-muted-foreground italic">
                  El margen te dice cuánto ganarías vendiendo al precio competitivo de la red.
                </p>
                
                <div className="bg-muted p-3 rounded border text-xs text-muted-foreground mt-3">
                  <strong>💡 Nota sobre kilometraje:</strong> Los vehículos con más de 115.000 km se marcan automáticamente como "No interesante" y se excluyen de las oportunidades de compra, independientemente de su rentabilidad.
                </div>
              </div>
            </div>

            {/* 5. Puja Máxima */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                5. Cálculo de Puja Máxima
              </h3>
              <div className="pl-7 space-y-3 text-sm">
                <p className="text-muted-foreground">
                  La <strong>Puja Máxima</strong> es el precio máximo que puedes ofertar en subasta (sin IVA) para vender al precio competitivo:
                </p>
                
                <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
                  <p className="font-semibold mb-3 text-purple-700 dark:text-purple-400">Cálculo Inverso:</p>
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">1.</span>
                      <span>Partir del <strong>Precio Competitivo</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">-</span>
                      <span>Transporte, Estructura, Garantía</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">÷</span>
                      <span>(1 + Margen %)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">-</span>
                      <span>Daños</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">÷</span>
                      <span>IVA (si aplica: 1.21, si no: 1.00)</span>
                    </div>
                    <div className="border-t border-purple-500/30 mt-2 pt-2 flex items-center gap-2">
                      <span className="font-bold text-purple-700 dark:text-purple-400">=</span>
                      <span className="font-bold text-purple-700 dark:text-purple-400">Puja Máxima (sin IVA)</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground italic bg-muted p-2 rounded">
                  💡 Si pujas por encima de este precio, no podrás vender de forma competitiva con margen suficiente.
                </p>
              </div>
            </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setInfoModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
    </>
  )
}

