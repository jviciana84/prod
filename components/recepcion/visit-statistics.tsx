"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/singleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, RefreshCw } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function VisitStatistics() {
  const supabase = getSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  const [allAssignments, setAllAssignments] = useState<any[]>([])
  
  // Estados para el filtro de fechas
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [dateFilter, setDateFilter] = useState<{ startDate: Date | null; endDate: Date | null }>({ startDate: null, endDate: null })

  // Filtros rápidos
  const quickFilters = [
    { label: "Últimos 7 días", days: 7 },
    { label: "Últimos 30 días", days: 30 },
    { label: "Últimos 90 días", days: 90 },
    { label: "Último año", days: 365 },
  ]

  useEffect(() => {
    loadStatistics()
  }, [])

  useEffect(() => {
    // Recalcular estadísticas cuando cambia el filtro
    calculateStatistics()
  }, [dateFilter, allAssignments])

  const loadStatistics = async () => {
    setLoading(true)

    // Obtener todas las asignaciones del mes actual (o más si no hay filtro)
    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    firstDayOfMonth.setHours(0, 0, 0, 0)

    const { data: assignments } = await supabase
      .from('visit_assignments')
      .select('advisor_name, visit_type, assigned_at')
      .gte('assigned_at', firstDayOfMonth.toISOString())
      .order('assigned_at', { ascending: false })

    setAllAssignments(assignments || [])
    setLoading(false)
  }

  const calculateStatistics = () => {
    // Filtrar asignaciones por fecha
    let filtered = allAssignments

    if (dateFilter.startDate || dateFilter.endDate) {
      filtered = allAssignments.filter((assignment) => {
        if (!assignment.assigned_at) return false
        const fecha = new Date(assignment.assigned_at)
        if (dateFilter.startDate && fecha < dateFilter.startDate) return false
        if (dateFilter.endDate && fecha > dateFilter.endDate) return false
        return true
      })
    }

    // Agrupar por asesor
    const grouped = filtered.reduce((acc: any, curr) => {
      if (!acc[curr.advisor_name]) {
        acc[curr.advisor_name] = {
          name: curr.advisor_name,
          COCHE_VN: 0,
          COCHE_VO: 0,
          MOTO_VN: 0,
          MOTO_VO: 0,
          total: 0
        }
      }
      acc[curr.advisor_name][curr.visit_type]++
      acc[curr.advisor_name].total++
      return acc
    }, {})

    setData(Object.values(grouped))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <BMWMSpinner size={32} />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Distribución de Visitas por Asesor</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={loadStatistics}
                disabled={loading}
                className="h-9 w-9"
                title="Actualizar"
              >
                {loading ? <BMWMSpinner size={16} /> : <RefreshCw className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowDateFilter(true)}
                className="h-9 w-9"
                title="Filtrar por fechas"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {(dateFilter.startDate || dateFilter.endDate) ? (
            <div className="text-sm text-muted-foreground mt-2">
              Filtrando: {dateFilter.startDate ? format(dateFilter.startDate, "dd/MM/yyyy", { locale: es }) : "..."} 
              {" → "} 
              {dateFilter.endDate ? format(dateFilter.endDate, "dd/MM/yyyy", { locale: es }) : "..."}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground mt-2">
              Mostrando: Mes actual
            </div>
          )}
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hay estadísticas disponibles
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="COCHE_VN" fill="#3b82f6" name="Coche VN" />
                <Bar dataKey="COCHE_VO" fill="#10b981" name="Coche VO" />
                <Bar dataKey="MOTO_VN" fill="#8b5cf6" name="Moto VN" />
                <Bar dataKey="MOTO_VO" fill="#f97316" name="Moto VO" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Modal de filtro de fechas */}
      <Dialog open={showDateFilter} onOpenChange={setShowDateFilter}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filtro de Fechas</DialogTitle>
            <DialogDescription>Selecciona un rango de fechas para filtrar las estadísticas</DialogDescription>
          </DialogHeader>
          <div className="mb-4">
            <div className="font-semibold mb-2">Filtros rápidos</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {quickFilters.map((f) => (
                <Button
                  key={f.label}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const end = new Date()
                    const start = new Date()
                    start.setDate(end.getDate() - f.days + 1)
                    setDateFilter({ startDate: start, endDate: end })
                  }}
                >
                  {f.label}
                </Button>
              ))}
            </div>
            <div className="font-semibold mb-2">Rango personalizado</div>
            <div className="flex gap-2 mb-2">
              <div className="flex-1">
                <label className="block text-xs mb-1">Fecha inicio</label>
                <Input
                  type="date"
                  value={dateFilter.startDate ? dateFilter.startDate.toISOString().slice(0, 10) : ""}
                  onChange={e => setDateFilter(df => ({ ...df, startDate: e.target.value ? new Date(e.target.value) : null }))}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1">Fecha fin</label>
                <Input
                  type="date"
                  value={dateFilter.endDate ? dateFilter.endDate.toISOString().slice(0, 10) : ""}
                  onChange={e => setDateFilter(df => ({ ...df, endDate: e.target.value ? new Date(e.target.value) : null }))}
                />
              </div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <Button variant="ghost" size="sm" onClick={() => setDateFilter({ startDate: null, endDate: null })}>
                Limpiar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowDateFilter(false)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowDateFilter(false)}
                  disabled={!dateFilter.startDate && !dateFilter.endDate}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}


