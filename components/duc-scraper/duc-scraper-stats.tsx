"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"

interface DucScraperStats {
  total_records: number
  records_today: number
  records_this_week: number
  records_this_month: number
  last_import_date: string | null
  unique_matriculas: number
  unique_models: number
  unique_concesionarios: number
  average_price: number | null
  price_range: {
    min: number | null
    max: number | null
  }
  availability_distribution: {
    disponible: number
    reservado: number
    vendido: number
    otros: number
  }
}

interface ProcessingLog {
  id: string
  filter_config_id: string
  total_vehicles_found: number
  vehicles_processed: number
  vehicles_added_to_nuevas_entradas: number
  vehicles_skipped: number
  errors_count: number
  status: string
  started_at: string
  completed_at: string | null
  config_snapshot: any
}

export default function DucScraperStats() {
  const [stats, setStats] = useState<DucScraperStats | null>(null)
  const [recentLogs, setRecentLogs] = useState<ProcessingLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const loadStats = async () => {
    try {
      setIsLoading(true)
      
      // Obtener estadísticas básicas
      const { data: totalRecords } = await supabase
        .from("duc_scraper")
        .select("id", { count: "exact" })

      const { data: todayRecords } = await supabase
        .from("duc_scraper")
        .select("id", { count: "exact" })
        .gte("import_date", new Date().toISOString().split("T")[0])

      const { data: weekRecords } = await supabase
        .from("duc_scraper")
        .select("id", { count: "exact" })
        .gte("import_date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      const { data: monthRecords } = await supabase
        .from("duc_scraper")
        .select("id", { count: "exact" })
        .gte("import_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      const { data: lastImport } = await supabase
        .from("duc_scraper")
        .select("import_date")
        .order("import_date", { ascending: false })
        .limit(1)
        .single()

      const { data: uniqueMatriculas } = await supabase
        .from("duc_scraper")
        .select("Matrícula", { count: "exact" })
        .not("Matrícula", "is", null)

      const { data: uniqueModels } = await supabase
        .from("duc_scraper")
        .select("Modelo", { count: "exact" })
        .not("Modelo", "is", null)

      const { data: uniqueConcesionarios } = await supabase
        .from("duc_scraper")
        .select("Concesionario", { count: "exact" })
        .not("Concesionario", "is", null)

      // Obtener estadísticas de precios
      const { data: priceStats } = await supabase
        .from("duc_scraper")
        .select("Precio")
        .not("Precio", "is", null)

      // Obtener distribución de disponibilidad
      const { data: availabilityStats } = await supabase
        .from("duc_scraper")
        .select("Disponibilidad")

      // Calcular estadísticas de precios
      const prices = priceStats
        ?.map(item => parseFloat(item.Precio?.replace(/[^\d.,]/g, "").replace(",", ".") || "0"))
        .filter(price => !isNaN(price) && price > 0) || []

      const averagePrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null
      const priceRange = {
        min: prices.length > 0 ? Math.min(...prices) : null,
        max: prices.length > 0 ? Math.max(...prices) : null
      }

      // Calcular distribución de disponibilidad
      const availabilityDistribution = {
        disponible: 0,
        reservado: 0,
        vendido: 0,
        otros: 0
      }

      availabilityStats?.forEach(item => {
        const disponibilidad = item.Disponibilidad?.toLowerCase() || ""
        if (disponibilidad.includes("disponible")) {
          availabilityDistribution.disponible++
        } else if (disponibilidad.includes("reservado")) {
          availabilityDistribution.reservado++
        } else if (disponibilidad.includes("vendido")) {
          availabilityDistribution.vendido++
        } else {
          availabilityDistribution.otros++
        }
      })

      // Obtener logs recientes de procesamiento
      const { data: logs } = await supabase
        .from("filter_processing_log")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(10)

      setStats({
        total_records: totalRecords?.count || 0,
        records_today: todayRecords?.count || 0,
        records_this_week: weekRecords?.count || 0,
        records_this_month: monthRecords?.count || 0,
        last_import_date: lastImport?.import_date || null,
        unique_matriculas: uniqueMatriculas?.count || 0,
        unique_models: uniqueModels?.count || 0,
        unique_concesionarios: uniqueConcesionarios?.count || 0,
        average_price: averagePrice,
        price_range: priceRange,
        availability_distribution: availabilityDistribution
      })

      setRecentLogs(logs || [])

    } catch (error) {
      console.error("Error loading stats:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const refreshStats = async () => {
    setIsRefreshing(true)
    await loadStats()
    setIsRefreshing(false)
    toast({
      title: "Estadísticas actualizadas",
      description: "Los datos se han refrescado correctamente"
    })
  }

  useEffect(() => {
    loadStats()
  }, [])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cargando...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No se pudieron cargar las estadísticas</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con botón de refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Estadísticas del DUC Scraper</h2>
          <p className="text-muted-foreground">
            Última actualización: {stats.last_import_date ? new Date(stats.last_import_date).toLocaleString() : "Nunca"}
          </p>
        </div>
        <Button onClick={refreshStats} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>

      {/* Estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_records.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.records_today} hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matrículas Únicas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unique_matriculas.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.unique_models} modelos únicos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Precio Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.average_price ? `${stats.average_price.toLocaleString()}€` : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.price_range.min && stats.price_range.max 
                ? `${stats.price_range.min.toLocaleString()}€ - ${stats.price_range.max.toLocaleString()}€`
                : "Sin datos de precio"
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concesionarios</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unique_concesionarios}</div>
            <p className="text-xs text-muted-foreground">
              Distribuidos en {stats.unique_concesionarios} concesionarios
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribución de disponibilidad */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Disponibilidad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="bg-green-500">
                {stats.availability_distribution.disponible}
              </Badge>
              <span className="text-sm">Disponible</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {stats.availability_distribution.reservado}
              </Badge>
              <span className="text-sm">Reservado</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="destructive">
                {stats.availability_distribution.vendido}
              </Badge>
              <span className="text-sm">Vendido</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {stats.availability_distribution.otros}
              </Badge>
              <span className="text-sm">Otros</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs recientes de procesamiento */}
      {recentLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Procesamiento Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant={log.status === 'completed' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}
                    >
                      {log.status}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">
                        {log.total_vehicles_found} vehículos encontrados
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.vehicles_added_to_nuevas_entradas} añadidos, {log.vehicles_skipped} omitidos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.started_at).toLocaleString()}
                    </p>
                    {log.errors_count > 0 && (
                      <p className="text-xs text-red-500">
                        {log.errors_count} errores
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 