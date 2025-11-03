// ============================================
// PÁGINA: Administración de Recepción
// ============================================
// Propósito: Gestión de asesores y estadísticas
// Patrón: CONSULTAS directas + MUTACIONES por API Routes
// ============================================

"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/singleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { CompactSearchWithModal } from "@/components/dashboard/compact-search-with-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdvisorsManagement } from "@/components/recepcion/advisors-management"
import { VisitStatistics } from "@/components/recepcion/visit-statistics"
import { VisitHistory } from "@/components/recepcion/visit-history"
import { VacationManager } from "@/components/recepcion/vacation-manager"
import { Users, BarChart3, History, Calendar } from "lucide-react"

export default function RecepcionAdminPage() {
  const supabase = getSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total_advisors: 0,
    active_advisors: 0,
    on_vacation: 0,
    visits_today: 0,
    visits_this_month: 0
  })

  // ✅ CONSULTA - Cliente directo (correcto según guía)
  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)

    try {
      // Estadísticas de asesores
      const { data: advisors } = await supabase
        .from('advisors')
        .select('is_active, is_on_vacation, visits_today')

      const totalAdvisors = advisors?.length || 0
      const activeAdvisors = advisors?.filter(a => a.is_active && !a.is_on_vacation).length || 0
      const onVacation = advisors?.filter(a => a.is_on_vacation).length || 0
      const visitsToday = advisors?.reduce((sum, a) => sum + (a.visits_today || 0), 0) || 0

      // Visitas del mes
      const firstDayOfMonth = new Date()
      firstDayOfMonth.setDate(1)
      firstDayOfMonth.setHours(0, 0, 0, 0)

      const { count: visitsThisMonth } = await supabase
        .from('visit_assignments')
        .select('*', { count: 'exact', head: true })
        .gte('assigned_at', firstDayOfMonth.toISOString())

      setStats({
        total_advisors: totalAdvisors,
        active_advisors: activeAdvisors,
        on_vacation: onVacation,
        visits_today: visitsToday,
        visits_this_month: visitsThisMonth || 0
      })

    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Breadcrumbs className="mt-4" />
          <CompactSearchWithModal className="mt-4" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          Administración de Recepción
        </h1>
        <p className="text-muted-foreground">
          Gestión de asesores, vacaciones y estadísticas de distribución de visitas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Asesores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_advisors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.active_advisors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              De Vacaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.on_vacation}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Visitas Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.visits_today}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Visitas Este Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.visits_this_month}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs con contenido */}
      <Tabs defaultValue="asesores" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="asesores" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Asesores
          </TabsTrigger>
          <TabsTrigger value="vacaciones" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Vacaciones
          </TabsTrigger>
          <TabsTrigger value="estadisticas" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Estadísticas
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="asesores" className="space-y-4">
          <AdvisorsManagement onUpdate={loadStats} />
        </TabsContent>

        <TabsContent value="vacaciones" className="space-y-4">
          <VacationManager onUpdate={loadStats} />
        </TabsContent>

        <TabsContent value="estadisticas" className="space-y-4">
          <VisitStatistics />
        </TabsContent>

        <TabsContent value="historial" className="space-y-4">
          <VisitHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}


