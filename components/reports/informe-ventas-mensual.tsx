"use client"

import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@/lib/supabase/client-singleton"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
  AreaChart,
  Area,
} from "recharts"
import { 
  Download, 
  RefreshCw, 
  Filter, 
  TrendingUp, 
  Euro, 
  Users, 
  MapPin, 
  Car,
  CreditCard,
  Percent,
  Calendar,
  Target
} from "lucide-react"
import { format, subMonths, startOfMonth, endOfMonth, parseISO, getMonth, getYear, startOfWeek, endOfWeek } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarioSemanalSelector } from "./calendario-semanal-selector"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { MapaEspanaSVGReal } from "./mapa-espana-svg-real"
import { MapaDebug } from "./mapa-debug"
import type { VentaMensual, EstadisticasVentas } from "@/types/ventas"

// Colores para los gráficos
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ff6b6b", "#4ecdc4"]

// Función para normalizar nombres de provincias
const normalizarProvincia = (provincia: string): string => {
  if (!provincia) return 'Sin provincia'
  
  // Convertir a minúsculas y luego capitalizar primera letra
  const normalizada = provincia.toLowerCase().trim()
  
  // Casos especiales para provincias con nombres compuestos
  const casosEspeciales: Record<string, string> = {
    'barcelona': 'Barcelona',
    'madrid': 'Madrid',
    'valencia': 'Valencia',
    'sevilla': 'Sevilla',
    'malaga': 'Málaga',
    'bilbao': 'Bilbao',
    'zaragoza': 'Zaragoza',
    'murcia': 'Murcia',
    'alicante': 'Alicante',
    'cordoba': 'Córdoba',
    'granada': 'Granada',
    'valladolid': 'Valladolid',
    'oviedo': 'Oviedo',
    'vigo': 'Vigo',
    'gijon': 'Gijón',
    'hospitalet': 'L\'Hospitalet',
    'a coruna': 'A Coruña',
    'vitoria': 'Vitoria',
    'gran canaria': 'Gran Canaria',
    'tenerife': 'Tenerife',
    'badajoz': 'Badajoz',
    'elche': 'Elche',
    'mostoles': 'Móstoles',
    'alcala de henares': 'Alcalá de Henares',
    'fuenlabrada': 'Fuenlabrada',
    'leganes': 'Leganés',
    'getafe': 'Getafe',
    'alcorcon': 'Alcorcón',
    'torrejon de ardoz': 'Torrejón de Ardoz',
    'parla': 'Parla',
    'alcobendas': 'Alcobendas',
    'san sebastian de los reyes': 'San Sebastián de los Reyes',
    'pozuelo de alarcon': 'Pozuelo de Alarcón',
    'coslada': 'Coslada',
    'las rozas de madrid': 'Las Rozas de Madrid',
    'majadahonda': 'Majadahonda',
    'rivas-vaciamadrid': 'Rivas-Vaciamadrid',
    'valdemoro': 'Valdemoro',
    'collado villalba': 'Collado Villalba',
    'san fernando de henares': 'San Fernando de Henares',
    'tres cantos': 'Tres Cantos',
    'boadilla del monte': 'Boadilla del Monte',
    'pinto': 'Pinto',
    'colmenar viejo': 'Colmenar Viejo',
    'san martin de la vega': 'San Martín de la Vega',
    'arganda del rey': 'Arganda del Rey',
    'torrelodones': 'Torrelodones',
    'navalcarnero': 'Navalcarnero',
    'villaviciosa de odon': 'Villaviciosa de Odón',
    'mejorada del campo': 'Mejorada del Campo',
    'velilla de san antonio': 'Velilla de San Antonio',
    'lleida': 'Lleida',
    'girona': 'Girona',
    'tarragona': 'Tarragona',
    'huelva': 'Huelva',
    'cadiz': 'Cádiz',
    'jaen': 'Jaén',
    'almeria': 'Almería',
    'albacete': 'Albacete',
    'ciudad real': 'Ciudad Real',
    'castellon': 'Castellón',
    'tortosa': 'Tortosa',
    'palma': 'Palma',
    'ceuta': 'Ceuta',
    'melilla': 'Melilla',
    'baleares': 'Baleares',
    'canarias': 'Canarias',
    'asturias': 'Asturias',
    'cantabria': 'Cantabria',
    'galicia': 'Galicia',
    'pais vasco': 'País Vasco',
    'navarra': 'Navarra',
    'aragon': 'Aragón',
    'la rioja': 'La Rioja',
    'castilla y leon': 'Castilla y León',
    'castilla-la mancha': 'Castilla-La Mancha',
    'extremadura': 'Extremadura',
    'andalucia': 'Andalucía',
    'region de murcia': 'Región de Murcia',
    'comunidad valenciana': 'Comunidad Valenciana',
    'cataluna': 'Cataluña',
    'principado de asturias': 'Principado de Asturias'
  }
  
  // Buscar en casos especiales
  if (casosEspeciales[normalizada]) {
    return casosEspeciales[normalizada]
  }
  
  // Si no está en casos especiales, aplicar capitalización general
  return normalizada.charAt(0).toUpperCase() + normalizada.slice(1)
}


export function InformeVentasMensual() {
  const [showDebug, setShowDebug] = useState(false)
  const [ventas, setVentas] = useState<VentaMensual[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasVentas | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mesSeleccionado, setMesSeleccionado] = useState<string>(format(new Date(), "yyyy-MM"))
  const [refreshing, setRefreshing] = useState(false)
  const [tipoGrafico, setTipoGrafico] = useState<"barras" | "circular" | "linea" | "area">("barras")
  
  // Estados para vista semanal
  const [vistaActual, setVistaActual] = useState<"mensual" | "semanal">("mensual")
  const [semanaSeleccionada, setSemanaSeleccionada] = useState<{ inicio: Date; fin: Date; numero: number } | null>(null)

  const supabase = createClientComponentClient()

  const getFechasMes = useCallback((mesString: string) => {
    const [year, month] = mesString.split("-").map(Number)
    const fechaInicio = startOfMonth(new Date(year, month - 1))
    const fechaFin = endOfMonth(new Date(year, month - 1))
    return { fechaInicio, fechaFin }
  }, [])

  const fetchVentasMensual = async (mesString: string) => {
    try {
      setLoading(true)
      const { fechaInicio, fechaFin } = getFechasMes(mesString)

      console.log("🔍 Obteniendo ventas del mes:", mesString)
      console.log("📅 Desde:", fechaInicio.toISOString())
      console.log("📅 Hasta:", fechaFin.toISOString())

      const { data: ventasData, error } = await supabase
        .from("sales_vehicles")
        .select(`
          id,
          license_plate,
          model,
          brand,
          sale_date,
          advisor,
          advisor_name,
          price,
          payment_method,
          client_name,
          client_postal_code,
          client_province,
          client_city,
          discount,
          vehicle_type,
          created_at
        `)
        .gte("sale_date", fechaInicio.toISOString())
        .lte("sale_date", fechaFin.toISOString())
        .order("sale_date", { ascending: false })

      if (error) {
        throw new Error(`Error al obtener ventas: ${error.message}`)
      }

      console.log(`📊 Ventas encontradas: ${ventasData?.length || 0}`)
      setVentas(ventasData || [])
      return ventasData || []
    } catch (error: any) {
      console.error("Error al cargar ventas:", error)
      setError(error.message)
      return []
    } finally {
      setLoading(false)
    }
  }

  const fetchVentasSemanal = async (inicio: Date, fin: Date) => {
    try {
      setLoading(true)

      console.log("🔍 Obteniendo ventas de la semana")
      console.log("📅 Desde:", inicio.toISOString())
      console.log("📅 Hasta:", fin.toISOString())

      const { data: ventasData, error } = await supabase
        .from("sales_vehicles")
        .select(`
          id,
          license_plate,
          model,
          brand,
          sale_date,
          advisor,
          advisor_name,
          price,
          payment_method,
          client_name,
          client_postal_code,
          client_province,
          client_city,
          discount,
          vehicle_type,
          created_at
        `)
        .gte("sale_date", inicio.toISOString())
        .lte("sale_date", fin.toISOString())
        .order("sale_date", { ascending: false })

      if (error) {
        throw new Error(`Error al obtener ventas: ${error.message}`)
      }

      console.log(`📊 Ventas encontradas: ${ventasData?.length || 0}`)
      setVentas(ventasData || [])
      return ventasData || []
    } catch (error: any) {
      console.error("Error al cargar ventas:", error)
      setError(error.message)
      return []
    } finally {
      setLoading(false)
    }
  }

  const calcularEstadisticas = useCallback((ventasData: VentaMensual[]) => {
    if (!ventasData || ventasData.length === 0) {
      return null
    }

    // Estadísticas básicas
    const totalVentas = ventasData.length
    const totalIngresos = ventasData.reduce((sum, venta) => sum + (venta.price || 0), 0)
    const promedioPrecio = totalIngresos / totalVentas

    // Análisis de financiación
    const ventasFinanciadas = ventasData.filter(v => 
      v.payment_method?.toLowerCase().includes('financiado') || 
      v.payment_method?.toLowerCase().includes('financiación')
    ).length
    const ventasContado = totalVentas - ventasFinanciadas
    const porcentajeFinanciacion = (ventasFinanciadas / totalVentas) * 100

    // Top asesores
    const asesoresMap = new Map<string, { ventas: number; ingresos: number }>()
    ventasData.forEach(venta => {
      const advisor = venta.advisor_name || venta.advisor
      const current = asesoresMap.get(advisor) || { ventas: 0, ingresos: 0 }
      asesoresMap.set(advisor, {
        ventas: current.ventas + 1,
        ingresos: current.ingresos + (venta.price || 0)
      })
    })
    const topAsesores = Array.from(asesoresMap.entries())
      .map(([advisor, data]) => ({ advisor, ...data }))
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, 10)

    // Ventas por método de pago
    const metodosPagoMap = new Map<string, number>()
    ventasData.forEach(venta => {
      const metodo = venta.payment_method || 'No especificado'
      metodosPagoMap.set(metodo, (metodosPagoMap.get(metodo) || 0) + 1)
    })
    const ventasPorMetodoPago = Array.from(metodosPagoMap.entries())
      .map(([metodo, cantidad]) => ({
        metodo,
        cantidad,
        porcentaje: (cantidad / totalVentas) * 100
      }))
      .sort((a, b) => b.cantidad - a.cantidad)

    // Ventas por marca
    const marcasMap = new Map<string, { cantidad: number; ingresos: number }>()
    ventasData.forEach(venta => {
      const marca = venta.brand || 'Sin marca'
      const current = marcasMap.get(marca) || { cantidad: 0, ingresos: 0 }
      marcasMap.set(marca, {
        cantidad: current.cantidad + 1,
        ingresos: current.ingresos + (venta.price || 0)
      })
    })
    const ventasPorMarca = Array.from(marcasMap.entries())
      .map(([marca, data]) => ({ marca, ...data }))
      .sort((a, b) => b.cantidad - a.cantidad)

    // Ventas por provincia y códigos postales
    const provinciasMap = new Map<string, { cantidad: number; ingresos: number; codigosPostales: Map<string, { cantidad: number; ingresos: number }> }>()
    ventasData.forEach(venta => {
      const provincia = normalizarProvincia(venta.client_province || 'Sin provincia')
      const codigoPostal = venta.client_postal_code || 'Sin código'
      
      const currentProvincia = provinciasMap.get(provincia) || { 
        cantidad: 0, 
        ingresos: 0, 
        codigosPostales: new Map() 
      }
      
      // Actualizar datos de provincia
      currentProvincia.cantidad += 1
      currentProvincia.ingresos += (venta.price || 0)
      
      // Actualizar datos de código postal
      const currentCP = currentProvincia.codigosPostales.get(codigoPostal) || { cantidad: 0, ingresos: 0 }
      currentProvincia.codigosPostales.set(codigoPostal, {
        cantidad: currentCP.cantidad + 1,
        ingresos: currentCP.ingresos + (venta.price || 0)
      })
      
      provinciasMap.set(provincia, currentProvincia)
    })
    
    const ventasPorProvincia = Array.from(provinciasMap.entries())
      .map(([provincia, data]) => ({ provincia, ...data }))
      .sort((a, b) => b.cantidad - a.cantidad)
    
    // Datos geográficos para el mapa
    const datosGeograficos = Array.from(provinciasMap.entries())
      .map(([provincia, data]) => ({
        provincia,
        cantidad: data.cantidad,
        ingresos: data.ingresos,
        codigosPostales: Array.from(data.codigosPostales.entries())
          .map(([codigo, cpData]) => ({
            codigo,
            cantidad: cpData.cantidad,
            ingresos: cpData.ingresos
          }))
          .sort((a, b) => b.cantidad - a.cantidad)
      }))
      .sort((a, b) => b.cantidad - a.cantidad)

    // Ventas por día del mes
    const diasMap = new Map<string, { cantidad: number; ingresos: number }>()
    ventasData.forEach(venta => {
      const dia = format(parseISO(venta.sale_date), "dd/MM")
      const current = diasMap.get(dia) || { cantidad: 0, ingresos: 0 }
      diasMap.set(dia, {
        cantidad: current.cantidad + 1,
        ingresos: current.ingresos + (venta.price || 0)
      })
    })
    const ventasPorMes = Array.from(diasMap.entries())
      .map(([mes, data]) => ({ mes, ...data }))
      .sort((a, b) => {
        const [diaA] = a.mes.split('/').map(Number)
        const [diaB] = b.mes.split('/').map(Number)
        return diaA - diaB
      })

    // Distribución de precios
    const rangosPrecio = [
      { min: 0, max: 10000, label: "0-10k €" },
      { min: 10000, max: 20000, label: "10k-20k €" },
      { min: 20000, max: 30000, label: "20k-30k €" },
      { min: 30000, max: 50000, label: "30k-50k €" },
      { min: 50000, max: Infinity, label: "50k+ €" }
    ]
    
    const distribucionPrecios = rangosPrecio.map(rango => {
      const cantidad = ventasData.filter(v => {
        const precio = v.price || 0
        return precio >= rango.min && precio < rango.max
      }).length
      return {
        rango: rango.label,
        cantidad,
        porcentaje: (cantidad / totalVentas) * 100
      }
    })

    // Descuentos aplicados
    const descuentosMap = new Map<string, number>()
    ventasData.forEach(venta => {
      const descuento = venta.discount || 'Sin descuento'
      descuentosMap.set(descuento, (descuentosMap.get(descuento) || 0) + 1)
    })
    const descuentosAplicados = Array.from(descuentosMap.entries())
      .map(([descuento, cantidad]) => ({
        descuento,
        cantidad,
        porcentaje: (cantidad / totalVentas) * 100
      }))
      .sort((a, b) => b.cantidad - a.cantidad)

    return {
      totalVentas,
      totalIngresos,
      promedioPrecio,
      ventasFinanciadas,
      ventasContado,
      porcentajeFinanciacion,
      topAsesores,
      ventasPorMetodoPago,
      ventasPorMarca,
      ventasPorProvincia,
      ventasPorMes,
      distribucionPrecios,
      descuentosAplicados,
      datosGeograficos
    }
  }, [])

  const cargarDatos = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    
    const ventasData = await fetchVentasMensual(mesSeleccionado)
    const stats = calcularEstadisticas(ventasData)
    setEstadisticas(stats)
    
    setRefreshing(false)
  }, [mesSeleccionado, calcularEstadisticas])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const handleMesChange = (nuevoMes: string) => {
    setMesSeleccionado(nuevoMes)
  }

  const handleSemanaSeleccionada = async (inicio: Date, fin: Date, numeroSemana: number) => {
    setSemanaSeleccionada({ inicio, fin, numero: numeroSemana })
    setRefreshing(true)
    setError(null)
    
    const ventasData = await fetchVentasSemanal(inicio, fin)
    const stats = calcularEstadisticas(ventasData)
    setEstadisticas(stats)
    
    setRefreshing(false)
  }

  const handleVistaChange = (vista: "mensual" | "semanal") => {
    setVistaActual(vista)
    if (vista === "mensual") {
      setSemanaSeleccionada(null)
      cargarDatos()
    }
  }

  const exportarDatos = () => {
    if (!ventas.length) return

    const csvContent = [
      // Headers
      ["Matrícula", "Modelo", "Marca", "Fecha Venta", "Asesor", "Precio", "Método Pago", "Cliente", "Código Postal", "Provincia", "Descuento"].join(","),
      // Data
      ...ventas.map(venta => [
        venta.license_plate,
        venta.model,
        venta.brand || "",
        format(parseISO(venta.sale_date), "dd/MM/yyyy"),
        venta.advisor_name || venta.advisor,
        venta.price || 0,
        venta.payment_method,
        venta.client_name || "",
        venta.client_postal_code || "",
        normalizarProvincia(venta.client_province || ""),
        venta.discount || ""
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    
    const nombreArchivo = vistaActual === "mensual" 
      ? `ventas_mensual_${mesSeleccionado}.csv`
      : `ventas_semanal_semana${semanaSeleccionada?.numero || 'X'}.csv`
    
    link.setAttribute("download", nombreArchivo)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <Skeleton className="h-4 w-24" />
                </CardTitle>
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={vistaActual} onValueChange={(v) => handleVistaChange(v as "mensual" | "semanal")}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mensual">Mensual</SelectItem>
              <SelectItem value="semanal">Semanal</SelectItem>
            </SelectContent>
          </Select>

          {vistaActual === "mensual" ? (
            <Select value={mesSeleccionado} onValueChange={handleMesChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Seleccionar mes" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(12)].map((_, i) => {
                  const fecha = subMonths(new Date(), i)
                  const valor = format(fecha, "yyyy-MM")
                  const etiqueta = format(fecha, "MMMM yyyy", { locale: es })
                  return (
                    <SelectItem key={valor} value={valor}>
                      {etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1)}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          ) : (
            <CalendarioSemanalSelector 
              onSemanaSeleccionada={handleSemanaSeleccionada}
              semanaActual={semanaSeleccionada}
            />
          )}

          <Select value={tipoGrafico} onValueChange={(value: any) => setTipoGrafico(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="barras">Barras</SelectItem>
              <SelectItem value="circular">Circular</SelectItem>
              <SelectItem value="linea">Línea</SelectItem>
              <SelectItem value="area">Área</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={cargarDatos} disabled={refreshing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button onClick={exportarDatos} disabled={!ventas.length} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      {estadisticas && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.totalVentas}</div>
              <p className="text-xs text-muted-foreground">
                {format(parseISO(mesSeleccionado + "-01"), "MMMM yyyy", { locale: es })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {estadisticas.totalIngresos.toLocaleString("es-ES", {
                  style: "currency",
                  currency: "EUR"
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Promedio: {estadisticas.promedioPrecio.toLocaleString("es-ES", {
                  style: "currency",
                  currency: "EUR"
                })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Financiación</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.ventasFinanciadas}</div>
              <p className="text-xs text-muted-foreground">
                {estadisticas.porcentajeFinanciacion.toFixed(1)}% del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Asesor</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {estadisticas.topAsesores[0]?.ventas || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {estadisticas.topAsesores[0]?.advisor || "Sin datos"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs con diferentes análisis */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="asesores">Asesores</TabsTrigger>
          <TabsTrigger value="geografia">Geografía</TabsTrigger>
          <TabsTrigger value="precios">Precios</TabsTrigger>
          <TabsTrigger value="financiacion">Financiación</TabsTrigger>
          <TabsTrigger value="detalle">Detalle</TabsTrigger>
        </TabsList>

        {/* Tab General */}
        <TabsContent value="general" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Evolución de Ventas</CardTitle>
                <CardDescription>Ventas diarias durante el mes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  {tipoGrafico === "linea" ? (
                    <LineChart data={estadisticas?.ventasPorMes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="cantidad" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  ) : tipoGrafico === "area" ? (
                    <AreaChart data={estadisticas?.ventasPorMes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="cantidad" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                    </AreaChart>
                  ) : (
                    <BarChart data={estadisticas?.ventasPorMes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="cantidad" fill="#8884d8" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ventas por Marca</CardTitle>
                <CardDescription>Distribución por fabricante</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  {tipoGrafico === "circular" ? (
                    <PieChart>
                      <Pie
                        data={estadisticas?.ventasPorMarca}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ marca, cantidad }) => `${marca}: ${cantidad}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="cantidad"
                      >
                        {estadisticas?.ventasPorMarca.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  ) : (
                    <BarChart data={estadisticas?.ventasPorMarca}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="marca" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="cantidad" fill="#00C49F" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Asesores */}
        <TabsContent value="asesores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Asesores</CardTitle>
              <CardDescription>Rendimiento por asesor comercial</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {estadisticas?.topAsesores.map((asesor, index) => (
                  <div key={asesor.advisor} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={index < 3 ? "default" : "secondary"}>
                        #{index + 1}
                      </Badge>
                      <span className="font-medium">{asesor.advisor}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {asesor.ventas} ventas
                      </span>
                      <span className="font-medium">
                        {asesor.ingresos.toLocaleString("es-ES", {
                          style: "currency",
                          currency: "EUR"
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Geografía */}
        <TabsContent value="geografia" className="space-y-6">
          {/* Layout principal: Mapa (2/3) + Ventas por Provincia (1/3) */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            {/* Mapa - ocupa 2/3 del ancho */}
            <Card className="flex flex-col h-[720px] lg:col-span-2">
              <CardHeader className="flex-shrink-0">
                <div>
                  <CardTitle>Distribución Geográfica de Ventas</CardTitle>
                  <CardDescription>Densidad de ventas por provincia</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-6">
                {showDebug ? <MapaDebug /> : <MapaEspanaSVGReal />}
              </CardContent>
            </Card>

            {/* Card de Ventas por Provincia - ocupa 1/3 del ancho */}
            <Card className="h-[720px]">
              <CardHeader>
                <CardTitle>Ventas por Provincia</CardTitle>
                <CardDescription>Distribución detallada de ventas por provincia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[620px] overflow-y-auto">
                  {estadisticas?.ventasPorProvincia.map((provincia, index) => (
                    <div key={provincia.provincia} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-center gap-3">
                        <Badge variant={index < 3 ? "default" : "secondary"}>
                          #{index + 1}
                        </Badge>
                        <span className="font-medium">{provincia.provincia}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {provincia.cantidad} ventas
                        </span>
                        <span className="font-medium">
                          {provincia.ingresos.toLocaleString("es-ES", {
                            style: "currency",
                            currency: "EUR"
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico adicional */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución Geográfica de Ventas</CardTitle>
              <CardDescription>Comparativa de ventas por provincia</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={estadisticas?.ventasPorProvincia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="provincia" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cantidad" fill="#FFBB28" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Precios */}
        <TabsContent value="precios" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Precios</CardTitle>
                <CardDescription>Rangos de precios de venta</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  {tipoGrafico === "circular" ? (
                    <PieChart>
                      <Pie
                        data={estadisticas?.distribucionPrecios}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ rango, cantidad }) => `${rango}: ${cantidad}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="cantidad"
                      >
                        {estadisticas?.distribucionPrecios.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  ) : (
                    <BarChart data={estadisticas?.distribucionPrecios}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rango" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="cantidad" fill="#FF8042" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Descuentos Aplicados</CardTitle>
                <CardDescription>Tipos de descuentos más comunes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {estadisticas?.descuentosAplicados.map((descuento, index) => (
                    <div key={descuento.descuento} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{descuento.descuento}</span>
                        <span className="text-sm text-muted-foreground">
                          {descuento.cantidad} ventas ({descuento.porcentaje.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={descuento.porcentaje} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Financiación */}
        <TabsContent value="financiacion" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Métodos de Pago</CardTitle>
                <CardDescription>Distribución por forma de pago</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  {tipoGrafico === "circular" ? (
                    <PieChart>
                      <Pie
                        data={estadisticas?.ventasPorMetodoPago}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ metodo, cantidad }) => `${metodo}: ${cantidad}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="cantidad"
                      >
                        {estadisticas?.ventasPorMetodoPago.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  ) : (
                    <BarChart data={estadisticas?.ventasPorMetodoPago}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="metodo" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="cantidad" fill="#82ca9d" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen Financiación</CardTitle>
                <CardDescription>Análisis de financiación vs contado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Ventas Financiadas</span>
                      <span className="text-sm text-muted-foreground">
                        {estadisticas?.ventasFinanciadas} ({estadisticas?.porcentajeFinanciacion.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={estadisticas?.porcentajeFinanciacion || 0} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Ventas al Contado</span>
                      <span className="text-sm text-muted-foreground">
                        {estadisticas?.ventasContado} ({(100 - (estadisticas?.porcentajeFinanciacion || 0)).toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={100 - (estadisticas?.porcentajeFinanciacion || 0)} className="h-2" />
                  </div>

                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {estadisticas?.ventasFinanciadas}
                        </div>
                        <div className="text-xs text-muted-foreground">Financiadas</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {estadisticas?.ventasContado}
                        </div>
                        <div className="text-xs text-muted-foreground">Contado</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Detalle */}
        <TabsContent value="detalle" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Ventas</CardTitle>
              <CardDescription>Lista completa de ventas del mes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Asesor</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Método Pago</TableHead>
                      <TableHead>Provincia</TableHead>
                      <TableHead>Descuento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ventas.map((venta) => (
                      <TableRow key={venta.id}>
                        <TableCell className="font-medium">{venta.license_plate}</TableCell>
                        <TableCell>{venta.model}</TableCell>
                        <TableCell>{venta.advisor_name || venta.advisor}</TableCell>
                        <TableCell>
                          {venta.price?.toLocaleString("es-ES", {
                            style: "currency",
                            currency: "EUR"
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{venta.payment_method}</Badge>
                        </TableCell>
                        <TableCell>{normalizarProvincia(venta.client_province || "Sin datos")}</TableCell>
                        <TableCell>{venta.discount || "Sin descuento"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
