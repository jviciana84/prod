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
} from "recharts"
import { Download, RefreshCw, Filter, AlertCircle } from "lucide-react"
import { format, subMonths, startOfDay, endOfDay } from "date-fns"
import type { InformeIncidencias } from "@/types/incidencias"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Colores para el gráfico
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

// Tipos de incidencia válidos - ACTUALIZADOS
const TIPOS_INCIDENCIA_VALIDOS = [
  "Carrocería",
  "Mecánica",
  "Limpieza",
  "2ª llave",
  "CardKey",
  "Ficha técnica",
  "Permiso circulación",
]

export function InformesIncidencias() {
  const [informes, setInformes] = useState<InformeIncidencias[]>([])
  const [totalEntregasEnPeriodo, setTotalEntregasEnPeriodo] = useState<number>(0)
  const [totalEntregasUnicasConIncidencias, setTotalEntregasUnicasConIncidencias] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [periodoTiempo, setPeriodoTiempo] = useState<"7dias" | "30dias" | "90dias" | "365dias">("30dias")
  const [tipoGrafico, setTipoGrafico] = useState<"barras" | "circular">("barras")
  const [refreshing, setRefreshing] = useState(false)
  const [maxYAxisValue, setMaxYAxisValue] = useState<number>(10) // Valor inicial para el eje Y

  const supabase = createClientComponentClient()

  const getFechasPeriodo = useCallback(() => {
    const fechaActual = new Date()
    let fechaInicio: Date

    switch (periodoTiempo) {
      case "7dias":
        fechaInicio = subMonths(fechaActual, 0.25)
        break
      case "90dias":
        fechaInicio = subMonths(fechaActual, 3)
        break
      case "365dias":
        fechaInicio = subMonths(fechaActual, 12)
        break
      case "30dias":
      default:
        fechaInicio = subMonths(fechaActual, 1)
        break
    }
    return { fechaInicio: startOfDay(fechaInicio), fechaFin: endOfDay(fechaActual) }
  }, [periodoTiempo])

  const fetchTotalEntregas = async (fechaInicio: Date, fechaFin: Date) => {
    const { count, error: errorEntregas } = await supabase
      .from("entregas")
      .select("id", { count: "exact" })
      .not("fecha_entrega", "is", null) // Solo contar entregas con fecha_entrega
      .gte("fecha_entrega", fechaInicio.toISOString())
      .lte("fecha_entrega", fechaFin.toISOString())

    if (errorEntregas) {
      console.error("Error al cargar total de entregas:", errorEntregas)
      return 0
    }

    return count || 0
  }

  const fetchInformesDirect = async (fechaInicio: Date) => {
    try {
      console.log("🔍 Obteniendo informes de incidencias desde:", fechaInicio.toISOString())

      // 1. Obtener todas las entregas del período
      const { data: entregas, error: errorEntregas } = await supabase
        .from("entregas")
        .select("id, matricula, tipos_incidencia, incidencia, fecha_venta, created_at")
        .gte("fecha_venta", fechaInicio.toISOString())

      if (errorEntregas) {
        throw new Error(`Error al obtener entregas: ${errorEntregas.message}`)
      }

      console.log(`📊 Entregas encontradas en el período: ${entregas?.length || 0}`)

      // 2. Obtener historial de incidencias resueltas del período
      const { data: historialResueltas, error: errorHistorial } = await supabase
        .from("incidencias_historial")
        .select("entrega_id, matricula, tipo_incidencia, fecha, resuelta, accion")
        .gte("fecha", fechaInicio.toISOString())
        .eq("resuelta", true)

      if (errorHistorial) {
        throw new Error(`Error al obtener historial: ${errorHistorial.message}`)
      }

      console.log(`📋 Incidencias resueltas encontradas: ${historialResueltas?.length || 0}`)

      // 3. Procesar datos por tipo de incidencia
      const tiposIncidencia: Record<
        string,
        {
          total: number
          resueltas: number
          pendientes: number
          entregasConEstaIncidencia: number
        }
      > = {}

      // Inicializar contadores
      TIPOS_INCIDENCIA_VALIDOS.forEach((tipo) => {
        tiposIncidencia[tipo] = {
          total: 0,
          resueltas: 0,
          pendientes: 0,
          entregasConEstaIncidencia: 0,
        }
      })

      let entregasUnicasConIncidencias = 0
      const entregasConIncidenciasSet = new Set<string>()

      // 4. Contar TODAS las incidencias históricas (totales) desde incidencias_historial
      const { data: todasLasIncidencias, error: errorTodasIncidencias } = await supabase
        .from("incidencias_historial")
        .select("entrega_id, matricula, tipo_incidencia, fecha, accion")
        .gte("fecha", fechaInicio.toISOString())
        .neq("accion", "resuelta") // Excluir las acciones de resolución, solo contar las incidencias originales

      if (errorTodasIncidencias) {
        throw new Error(`Error al obtener todas las incidencias: ${errorTodasIncidencias.message}`)
      }

      console.log(`📊 Total de incidencias históricas encontradas: ${todasLasIncidencias?.length || 0}`)

      // 5. Contar totales por tipo desde el historial completo
      todasLasIncidencias?.forEach((incidencia) => {
        if (!TIPOS_INCIDENCIA_VALIDOS.includes(incidencia.tipo_incidencia)) return

        if (tiposIncidencia[incidencia.tipo_incidencia]) {
          tiposIncidencia[incidencia.tipo_incidencia].total += 1

          // Contar entregas únicas con esta incidencia
          entregasConIncidenciasSet.add(incidencia.entrega_id)
        }
      })

      // Actualizar el conteo de entregas con incidencias por tipo
      Object.keys(tiposIncidencia).forEach((tipo) => {
        // Contar entregas únicas que tienen este tipo de incidencia
        const entregasConEsteTipo = todasLasIncidencias
          ?.filter((inc) => inc.tipo_incidencia === tipo)
          .map((inc) => inc.entrega_id)

        tiposIncidencia[tipo].entregasConEstaIncidencia = new Set(entregasConEsteTipo).size
      })

      entregasUnicasConIncidencias = entregasConIncidenciasSet.size

      // 6. Contar incidencias resueltas desde historial (ya lo tenemos)
      const incidenciasResueltasPorTipo: Record<string, Set<string>> = {}

      historialResueltas?.forEach((incidencia) => {
        if (!TIPOS_INCIDENCIA_VALIDOS.includes(incidencia.tipo_incidencia)) return

        if (!incidenciasResueltasPorTipo[incidencia.tipo_incidencia]) {
          incidenciasResueltasPorTipo[incidencia.tipo_incidencia] = new Set()
        }

        // Usar matricula + tipo como clave única para evitar duplicados
        const claveUnica = `${incidencia.matricula}-${incidencia.tipo_incidencia}`
        incidenciasResueltasPorTipo[incidencia.tipo_incidencia].add(claveUnica)
      })

      // Actualizar contadores de resueltas
      Object.keys(incidenciasResueltasPorTipo).forEach((tipo) => {
        if (tiposIncidencia[tipo]) {
          tiposIncidencia[tipo].resueltas = incidenciasResueltasPorTipo[tipo].size
        }
      })

      // 7. Calcular pendientes (TOTAL - RESUELTAS)
      Object.keys(tiposIncidencia).forEach((tipo) => {
        tiposIncidencia[tipo].pendientes = Math.max(0, tiposIncidencia[tipo].total - tiposIncidencia[tipo].resueltas)
      })

      // 7. Formatear resultados
      const informesFormateados: InformeIncidencias[] = TIPOS_INCIDENCIA_VALIDOS.map((tipo) => {
        const stats = tiposIncidencia[tipo]
        return {
          tipo,
          total_incidencias: stats.total,
          resueltas: stats.resueltas,
          pendientes: stats.pendientes,
          entregas_con_esta_incidencia: stats.entregasConEstaIncidencia,
          tiempo_medio_resolucion: null, // TODO: Calcular tiempo medio si es necesario
          total_entregas_unicas_con_incidencias: entregasUnicasConIncidencias,
        }
      }).sort((a, b) => {
        if (a.total_incidencias === 0 && b.total_incidencias === 0) return a.tipo.localeCompare(b.tipo)
        if (a.total_incidencias === 0) return 1
        if (b.total_incidencias === 0) return -1
        return b.total_incidencias - a.total_incidencias
      })

      console.log("📈 Informes procesados:", informesFormateados)

      return {
        informes: informesFormateados,
        totalEntregasUnicasConIncidencias: entregasUnicasConIncidencias,
      }
    } catch (err) {
      console.error("Error al procesar informes:", err)
      throw err
    }
  }

  const fetchInformes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { fechaInicio, fechaFin } = getFechasPeriodo()

      const [informesResult, totalEntregas] = await Promise.all([
        fetchInformesDirect(fechaInicio),
        fetchTotalEntregas(fechaInicio, fechaFin),
      ])

      setTotalEntregasEnPeriodo(totalEntregas)

      if (informesResult.informes.length > 0) {
        setInformes(informesResult.informes)
        setTotalEntregasUnicasConIncidencias(informesResult.totalEntregasUnicasConIncidencias)

        // Calcular el valor máximo para el eje Y basado en los datos
        const maxValue = Math.max(
          ...informesResult.informes.map((i) => Math.max(i.total_incidencias, i.resueltas, i.pendientes)),
        )

        // Añadir un margen del 30% para mejor visualización
        setMaxYAxisValue(Math.ceil(maxValue * 1.3))
      } else {
        setInformes([])
        setTotalEntregasUnicasConIncidencias(0)
        setMaxYAxisValue(10) // Valor por defecto si no hay datos
      }
    } catch (err) {
      console.error("Error en la consulta:", err)
      setError(`Error en la consulta: ${err instanceof Error ? err.message : String(err)}`)
      setInformes([])
      setTotalEntregasUnicasConIncidencias(0)
    } finally {
      setLoading(false)
    }
  }, [getFechasPeriodo])

  useEffect(() => {
    fetchInformes()
  }, [fetchInformes])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchInformes()
    setRefreshing(false)
  }

  const handleExportarCSV = () => {
    let csvContent =
      "Tipo de Incidencia,Total Incidencias,Resueltas,Pendientes,Entregas con Incidencia,% Entregas con Incidencia,% Resolución\n"

    informes.forEach((informe) => {
      const porcentajeEntregasConIncidencia =
        totalEntregasEnPeriodo > 0
          ? ((informe.entregas_con_esta_incidencia / totalEntregasEnPeriodo) * 100).toFixed(1) + "%"
          : "0%"
      const porcentajeResolucion =
        informe.total_incidencias > 0 ? ((informe.resueltas / informe.total_incidencias) * 100).toFixed(1) + "%" : "0%"

      csvContent += `${informe.tipo},${informe.total_incidencias},${informe.resueltas},${informe.pendientes},${informe.entregas_con_esta_incidencia},${porcentajeEntregasConIncidencia},${porcentajeResolucion}\n`
    })

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `informe_incidencias_${format(new Date(), "yyyy-MM-dd")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getPeriodoTexto = useCallback(() => {
    switch (periodoTiempo) {
      case "7dias":
        return "últimos 7 días"
      case "90dias":
        return "últimos 3 meses"
      case "365dias":
        return "último año"
      default:
        return "último mes"
    }
  }, [periodoTiempo])

  const datosGraficoBarras = informes.map((informe) => ({
    name: informe.tipo,
    Resueltas: informe.resueltas,
    Pendientes: informe.pendientes,
  }))

  const datosGraficoCircular = informes.map((informe) => ({
    name: informe.tipo,
    value: informe.total_incidencias,
  }))

  const totalGlobalIncidencias = informes.reduce((sum, item) => sum + item.total_incidencias, 0)
  const totalGlobalResueltas = informes.reduce((sum, item) => sum + item.resueltas, 0)
  const totalGlobalPendientes = informes.reduce((sum, item) => sum + item.pendientes, 0)

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Informes de Incidencias</CardTitle>
            <CardDescription>Estadísticas de incidencias del {getPeriodoTexto()}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={periodoTiempo} onValueChange={(value: any) => setPeriodoTiempo(value)}>
              <SelectTrigger className="w-[140px] h-8">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7dias">Últimos 7 días</SelectItem>
                <SelectItem value="30dias">Último mes</SelectItem>
                <SelectItem value="90dias">Últimos 3 meses</SelectItem>
                <SelectItem value="365dias">Último año</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="h-8">
              {refreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportarCSV}
              className="h-8"
              disabled={informes.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loading ? (
              <>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </>
            ) : (
              <>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{totalGlobalIncidencias}</div>
                    <div className="text-sm text-muted-foreground">Total de incidencias</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-500">{totalGlobalResueltas}</div>
                    <div className="text-sm text-muted-foreground">Incidencias resueltas</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-red-500">{totalGlobalPendientes}</div>
                    <div className="text-sm text-muted-foreground">Incidencias pendientes</div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {informes.every((informe) => informe.total_incidencias === 0) && !loading && !error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-muted-foreground mb-4">
              ¡Excelente! No hay incidencias registradas para el período seleccionado ({getPeriodoTexto()})
            </div>
            <Button onClick={handleRefresh} variant="outline" className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" /> Actualizar datos
            </Button>
          </div>
        ) : (
          <>
            <Tabs value={tipoGrafico} onValueChange={(value: any) => setTipoGrafico(value)}>
              <TabsList className="mb-4">
                <TabsTrigger value="barras">Gráfico de Barras</TabsTrigger>
                <TabsTrigger value="circular">Gráfico Circular</TabsTrigger>
              </TabsList>
              <TabsContent value="barras" className="mt-0">
                {loading ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : (
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={datosGraficoBarras} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                        <YAxis
                          domain={[0, maxYAxisValue]}
                          allowDecimals={false}
                          tickCount={Math.min(10, maxYAxisValue + 1)}
                        />
                        <Tooltip formatter={(value) => [Number.parseInt(value.toString()), ""]} />
                        <Legend />
                        <Bar dataKey="Resueltas" stackId="a" fill="#4ade80" />
                        <Bar dataKey="Pendientes" stackId="a" fill="#f87171" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="circular" className="mt-0">
                {loading ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : (
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={datosGraficoCircular}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, value }) => `${name}: ${Number.parseInt(value.toString())}`}
                          outerRadius={150}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {datosGraficoCircular.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [Number.parseInt(value.toString()), "incidencias"]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="mt-8">
              <h3 className="text-lg font-medium mb-3">Detalle de Incidencias ({getPeriodoTexto()})</h3>
              <div className="text-sm text-muted-foreground mb-2">
                Total de entregas en el período:{" "}
                {loading ? <Skeleton className="h-4 w-10 inline-block" /> : totalEntregasEnPeriodo}
              </div>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="uppercase">TIPO DE INCIDENCIA</TableHead>
                        <TableHead className="text-right uppercase">TOTAL</TableHead>
                        <TableHead className="text-right uppercase">RESUELTAS</TableHead>
                        <TableHead className="text-right uppercase">PENDIENTES</TableHead>
                        <TableHead className="text-right uppercase">% ENTREGAS CON INCIDENCIA</TableHead>
                        <TableHead className="text-right uppercase">% RESOLUCIÓN</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {informes.map((informe) => {
                        const porcentajeEntregasConIncidencia =
                          totalEntregasEnPeriodo > 0
                            ? ((informe.entregas_con_esta_incidencia / totalEntregasEnPeriodo) * 100).toFixed(1) + "%"
                            : "0%"
                        const porcentajeResolucion =
                          informe.total_incidencias > 0
                            ? ((informe.resueltas / informe.total_incidencias) * 100).toFixed(1) + "%"
                            : "0%"
                        return (
                          <TableRow key={informe.tipo}>
                            <TableCell className="font-medium">{informe.tipo}</TableCell>
                            <TableCell className="text-right">{informe.total_incidencias}</TableCell>
                            <TableCell className="text-right text-green-600">{informe.resueltas}</TableCell>
                            <TableCell className="text-right text-red-600">{informe.pendientes}</TableCell>
                            <TableCell className="text-right">{porcentajeEntregasConIncidencia}</TableCell>
                            <TableCell className="text-right">{porcentajeResolucion}</TableCell>
                          </TableRow>
                        )
                      })}
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell>TOTAL GENERAL</TableCell>
                        <TableCell className="text-right">{totalGlobalIncidencias}</TableCell>
                        <TableCell className="text-right text-green-600">{totalGlobalResueltas}</TableCell>
                        <TableCell className="text-right text-red-600">{totalGlobalPendientes}</TableCell>
                        <TableCell className="text-right">
                          {totalEntregasEnPeriodo > 0 && totalEntregasUnicasConIncidencias > 0
                            ? `${((totalEntregasUnicasConIncidencias / totalEntregasEnPeriodo) * 100).toFixed(1)}%`
                            : "0%"}
                        </TableCell>
                        <TableCell className="text-right">
                          {totalGlobalIncidencias > 0
                            ? `${((totalGlobalResueltas / totalGlobalIncidencias) * 100).toFixed(1)}%`
                            : "0%"}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
