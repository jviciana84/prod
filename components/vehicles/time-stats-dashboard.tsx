"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/singleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Clock, Wrench } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"

interface TimeStats {
  avg_body_pending_time: number | null
  avg_body_in_process_time: number | null
  avg_body_total_time: number | null
  avg_mechanical_pending_time: number | null
  avg_mechanical_in_process_time: number | null
  avg_mechanical_total_time: number | null
  count_body_pending: number
  count_body_in_process: number
  count_body_completed: number
  count_mechanical_pending: number
  count_mechanical_in_process: number
  count_mechanical_completed: number
}

// Función para formatear tiempo en segundos a formato legible
const formatTimeElapsed = (seconds: number | null | undefined): string => {
  if (!seconds) return "-"

  const days = Math.floor(seconds / (24 * 3600))
  const hours = Math.floor((seconds % (24 * 3600)) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

export default function TimeStatsDashboard() {
  const [stats, setStats] = useState<TimeStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("body")

  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)
      try {
        // Obtener estadísticas de tiempos
        const { data, error } = await supabase.rpc("get_time_stats")

        if (error) {
          console.error("Error al obtener estadísticas:", error)
          return
        }

        setStats(data)
      } catch (err) {
        console.error("Error al procesar estadísticas:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <BMWMSpinner size={30} />
        <span className="ml-2">Cargando estadísticas...</span>
      </div>
    )
  }

  if (!stats) {
    return <div className="text-center text-muted-foreground py-8">No se pudieron cargar las estadísticas</div>
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="body" className="flex items-center gap-1">
            <Wrench className="h-4 w-4" />
            <span>Carrocería</span>
          </TabsTrigger>
          <TabsTrigger value="mechanical" className="flex items-center gap-1">
            <Wrench className="h-4 w-4" />
            <span>Mecánica</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="body" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-amber-500" />
                  Fase Pendiente
                </CardTitle>
                <CardDescription>Tiempo medio en estado pendiente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatTimeElapsed(stats.avg_body_pending_time)}</div>
                <div className="text-sm text-muted-foreground mt-2">
                  {stats.count_body_pending} vehículos en esta fase
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Wrench className="h-4 w-4 mr-2 text-blue-500" />
                  Fase En Proceso
                </CardTitle>
                <CardDescription>Tiempo medio en estado en proceso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatTimeElapsed(stats.avg_body_in_process_time)}</div>
                <div className="text-sm text-muted-foreground mt-2">
                  {stats.count_body_in_process} vehículos en esta fase
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-green-500" />
                  Tiempo Total
                </CardTitle>
                <CardDescription>Tiempo medio total del proceso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatTimeElapsed(stats.avg_body_total_time)}</div>
                <div className="text-sm text-muted-foreground mt-2">
                  {stats.count_body_completed} vehículos completados
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mechanical" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-amber-500" />
                  Fase Pendiente
                </CardTitle>
                <CardDescription>Tiempo medio en estado pendiente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatTimeElapsed(stats.avg_mechanical_pending_time)}</div>
                <div className="text-sm text-muted-foreground mt-2">
                  {stats.count_mechanical_pending} vehículos en esta fase
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Wrench className="h-4 w-4 mr-2 text-blue-500" />
                  Fase En Proceso
                </CardTitle>
                <CardDescription>Tiempo medio en estado en proceso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatTimeElapsed(stats.avg_mechanical_in_process_time)}</div>
                <div className="text-sm text-muted-foreground mt-2">
                  {stats.count_mechanical_in_process} vehículos en esta fase
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-green-500" />
                  Tiempo Total
                </CardTitle>
                <CardDescription>Tiempo medio total del proceso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatTimeElapsed(stats.avg_mechanical_total_time)}</div>
                <div className="text-sm text-muted-foreground mt-2">
                  {stats.count_mechanical_completed} vehículos completados
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
