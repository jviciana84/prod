"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { differenceInDays } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import type { PhotoVehicle } from "./photos-table"

interface Photographer {
  id: string
  user_id: string
  display_name: string
  total_assigned: number
  total_completed: number
  error_count: number
  average_time?: number
}

interface TimeMetrics {
  registrationToApto: number[]
  aptoToPhotographed: number[]
  totalProcess: number[]
}

export default function PhotosSummary() {
  const [vehicles, setVehicles] = useState<PhotoVehicle[]>([])
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [timeMetrics, setTimeMetrics] = useState<TimeMetrics>({
    registrationToApto: [],
    aptoToPhotographed: [],
    totalProcess: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Cargar datos
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Obtener vehículos
      const { data: vehiclesData, error: vehiclesError } = await supabase.from("fotos").select("*")

      if (vehiclesError) throw vehiclesError

      // Obtener fotógrafos
      const { data: photographersData, error: photographersError } = await supabase.from("photo_assignments").select(`
          id,
          user_id,
          percentage,
          is_active,
          user:user_id(id, email)
        `)

      if (photographersError) throw photographersError

      // Calcular métricas de tiempo
      const metrics: TimeMetrics = {
        registrationToApto: [],
        aptoToPhotographed: [],
        totalProcess: [],
      }

      // Procesar vehículos para métricas
      vehiclesData.forEach((vehicle) => {
        // Días desde registro hasta apto
        if (vehicle.disponible && vehicle.paint_apto_date) {
          const days = differenceInDays(new Date(vehicle.paint_apto_date), new Date(vehicle.disponible))
          if (days >= 0) metrics.registrationToApto.push(days)
        }

        // Días desde apto hasta fotografiado
        if (vehicle.paint_apto_date && vehicle.photos_completed && vehicle.photos_completed_date) {
          const days = differenceInDays(new Date(vehicle.photos_completed_date), new Date(vehicle.paint_apto_date))
          if (days >= 0) metrics.aptoToPhotographed.push(days)
        }

        // Días totales del proceso
        if (vehicle.disponible && vehicle.photos_completed && vehicle.photos_completed_date) {
          const days = differenceInDays(new Date(vehicle.photos_completed_date), new Date(vehicle.disponible))
          if (days >= 0) metrics.totalProcess.push(days)
        }
      })

      // Calcular estadísticas por fotógrafo
      const photographerStats: Photographer[] = []

      for (const photographer of photographersData) {
        // Filtrar vehículos asignados a este fotógrafo
        const assignedVehicles = vehiclesData.filter((v) => v.assigned_to === photographer.user_id)
        const completedVehicles = assignedVehicles.filter((v) => v.photos_completed)
        const errorCount = assignedVehicles.reduce((sum, v) => sum + (v.error_count || 0), 0)

        // Calcular tiempo promedio para completar
        const completionTimes = assignedVehicles
          .filter((v) => v.photos_completed && v.paint_apto_date && v.photos_completed_date)
          .map((v) => differenceInDays(new Date(v.photos_completed_date!), new Date(v.paint_apto_date!)))
          .filter((days) => days >= 0)

        const averageTime =
          completionTimes.length > 0 ? completionTimes.reduce((sum, days) => sum + days, 0) / completionTimes.length : 0

        photographerStats.push({
          id: photographer.id,
          user_id: photographer.user_id,
          display_name: photographer.user?.email || `Usuario ${photographer.user_id}`,
          total_assigned: assignedVehicles.length,
          total_completed: completedVehicles.length,
          error_count: errorCount,
          average_time: averageTime,
        })
      }

      setVehicles(vehiclesData || [])
      setPhotographers(photographerStats || [])
      setTimeMetrics(metrics)
    } catch (error) {
      console.error("Error al cargar datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Calcular estadísticas
  const totalVehicles = vehicles.length
  const pendingVehicles = vehicles.filter((v) => !v.photos_completed && v.estado_pintura !== "vendido").length
  const completedVehicles = vehicles.filter((v) => v.photos_completed).length
  const aptoVehicles = vehicles.filter((v) => v.estado_pintura === "apto").length
  const noAptoVehicles = vehicles.filter((v) => v.estado_pintura === "no_apto").length
  const pendienteVehicles = vehicles.filter((v) => v.estado_pintura === "pendiente").length
  const totalErrors = vehicles.reduce((sum, v) => sum + (v.error_count || 0), 0)

  // Calcular promedios de tiempo
  const avgRegistrationToApto =
    timeMetrics.registrationToApto.length > 0
      ? timeMetrics.registrationToApto.reduce((sum, days) => sum + days, 0) / timeMetrics.registrationToApto.length
      : 0

  const avgAptoToPhotographed =
    timeMetrics.aptoToPhotographed.length > 0
      ? timeMetrics.aptoToPhotographed.reduce((sum, days) => sum + days, 0) / timeMetrics.aptoToPhotographed.length
      : 0

  const avgTotalProcess =
    timeMetrics.totalProcess.length > 0
      ? timeMetrics.totalProcess.reduce((sum, days) => sum + days, 0) / timeMetrics.totalProcess.length
      : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tarjeta de estado general */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Estado General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total vehículos:</span>
                <span className="font-medium">{totalVehicles}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pendientes:</span>
                <span className="font-medium">{pendingVehicles}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completados:</span>
                <span className="font-medium">{completedVehicles}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tasa de completado:</span>
                <span className="font-medium">
                  {totalVehicles > 0 ? ((completedVehicles / totalVehicles) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta de estado de pintura */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Estado de Pintura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pendiente:</span>
                <Badge variant="outline" className="bg-gray-100 text-gray-800">
                  {pendienteVehicles}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Apto:</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {aptoVehicles}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">No apto:</span>
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  {noAptoVehicles}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tasa de aptos:</span>
                <span className="font-medium">
                  {totalVehicles > 0 ? ((aptoVehicles / totalVehicles) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta de tiempos promedio */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tiempos Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registro a Apto:</span>
                <span className="font-medium">{avgRegistrationToApto.toFixed(1)} días</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Apto a Fotografiado:</span>
                <span className="font-medium">{avgAptoToPhotographed.toFixed(1)} días</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Proceso completo:</span>
                <span className="font-medium">{avgTotalProcess.toFixed(1)} días</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta de errores */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Errores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total errores:</span>
                <span className="font-medium text-red-500">{totalErrors}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tasa de error:</span>
                <span className="font-medium">
                  {totalVehicles > 0 ? ((totalErrors / totalVehicles) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vehículos con errores:</span>
                <span className="font-medium">{vehicles.filter((v) => v.error_count > 0).length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pestañas para diferentes vistas */}
      <Tabs defaultValue="photographers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="photographers">Fotógrafos</TabsTrigger>
          <TabsTrigger value="times">Tiempos</TabsTrigger>
          <TabsTrigger value="errors">Errores</TabsTrigger>
        </TabsList>

        {/* Contenido de la pestaña de fotógrafos */}
        <TabsContent value="photographers" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Rendimiento por Fotógrafo</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fotógrafo</TableHead>
                    <TableHead>Asignados</TableHead>
                    <TableHead>Completados</TableHead>
                    <TableHead>Tasa</TableHead>
                    <TableHead>Errores</TableHead>
                    <TableHead>Tiempo Promedio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {photographers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        No hay datos de fotógrafos disponibles
                      </TableCell>
                    </TableRow>
                  ) : (
                    photographers.map((photographer, index) => (
                      <TableRow key={`photographer-${photographer.user_id}-${index}`}>
                        <TableCell className="font-medium">{photographer.display_name}</TableCell>
                        <TableCell>{photographer.total_assigned}</TableCell>
                        <TableCell>{photographer.total_completed}</TableCell>
                        <TableCell>
                          {photographer.total_assigned > 0
                            ? ((photographer.total_completed / photographer.total_assigned) * 100).toFixed(1)
                            : 0}
                          %
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              photographer.error_count > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                            }
                          >
                            {photographer.error_count}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {photographer.average_time !== undefined
                            ? `${photographer.average_time.toFixed(1)} días`
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contenido de la pestaña de tiempos */}
        <TabsContent value="times" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Distribución de Tiempos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Tiempo desde registro hasta apto</h3>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">0-3 días</div>
                      <div className="text-2xl font-bold">
                        {timeMetrics.registrationToApto.filter((days) => days <= 3).length}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">4-7 días</div>
                      <div className="text-2xl font-bold">
                        {timeMetrics.registrationToApto.filter((days) => days > 3 && days <= 7).length}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">8-14 días</div>
                      <div className="text-2xl font-bold">
                        {timeMetrics.registrationToApto.filter((days) => days > 7 && days <= 14).length}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">15+ días</div>
                      <div className="text-2xl font-bold">
                        {timeMetrics.registrationToApto.filter((days) => days > 14).length}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Tiempo desde apto hasta fotografiado</h3>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">0-3 días</div>
                      <div className="text-2xl font-bold">
                        {timeMetrics.aptoToPhotographed.filter((days) => days <= 3).length}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">4-7 días</div>
                      <div className="text-2xl font-bold">
                        {timeMetrics.aptoToPhotographed.filter((days) => days > 3 && days <= 7).length}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">8-14 días</div>
                      <div className="text-2xl font-bold">
                        {timeMetrics.aptoToPhotographed.filter((days) => days > 7 && days <= 14).length}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">15+ días</div>
                      <div className="text-2xl font-bold">
                        {timeMetrics.aptoToPhotographed.filter((days) => days > 14).length}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Tiempo total del proceso</h3>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">0-7 días</div>
                      <div className="text-2xl font-bold">
                        {timeMetrics.totalProcess.filter((days) => days <= 7).length}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">8-14 días</div>
                      <div className="text-2xl font-bold">
                        {timeMetrics.totalProcess.filter((days) => days > 7 && days <= 14).length}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">15-30 días</div>
                      <div className="text-2xl font-bold">
                        {timeMetrics.totalProcess.filter((days) => days > 14 && days <= 30).length}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">30+ días</div>
                      <div className="text-2xl font-bold">
                        {timeMetrics.totalProcess.filter((days) => days > 30).length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contenido de la pestaña de errores */}
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Análisis de Errores</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Errores</TableHead>
                    <TableHead>Fotógrafo Original</TableHead>
                    <TableHead>Último Error</TableHead>
                    <TableHead>Estado Actual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.filter((v) => v.error_count > 0).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        No hay vehículos con errores registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    vehicles
                      .filter((v) => v.error_count > 0)
                      .sort((a, b) => b.error_count - a.error_count)
                      .map((vehicle) => (
                        <TableRow key={`vehicle-${vehicle.id}-${vehicle.license_plate}`}>
                          <TableCell className="font-medium">{vehicle.license_plate}</TableCell>
                          <TableCell>{vehicle.model}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-red-100 text-red-800">
                              {vehicle.error_count}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {photographers.find((p) => p.user_id === vehicle.original_assigned_to)?.display_name || "-"}
                          </TableCell>
                          <TableCell>{vehicle.last_error_by ? "Admin" : "-"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={vehicle.photos_completed ? "default" : "outline"}
                              className={
                                vehicle.photos_completed ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                              }
                            >
                              {vehicle.photos_completed ? "Completado" : "Pendiente"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
