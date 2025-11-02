"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, RefreshCw } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function VisitHistory() {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<any[]>([])
  
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
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoading(true)

    const { data } = await supabase
      .from('visit_assignments')
      .select('*')
      .order('assigned_at', { ascending: false })
      .limit(500)

    setHistory(data || [])
    setLoading(false)
  }

  // Filtrar historial por fechas
  const filteredHistory = history.filter((visit) => {
    if (!dateFilter.startDate && !dateFilter.endDate) return true
    if (!visit.assigned_at) return false
    
    const fecha = new Date(visit.assigned_at)
    if (dateFilter.startDate && fecha < dateFilter.startDate) return false
    if (dateFilter.endDate && fecha > dateFilter.endDate) return false
    return true
  })

  const getTypeColor = (type: string) => {
    const colors: any = {
      'COCHE_VN': 'bg-blue-100 text-blue-800',
      'COCHE_VO': 'bg-green-100 text-green-800',
      'MOTO_VN': 'bg-purple-100 text-purple-800',
      'MOTO_VO': 'bg-orange-100 text-orange-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Historial de Visitas (Últimas 500)</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={loadHistory}
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
          {(dateFilter.startDate || dateFilter.endDate) && (
            <div className="text-sm text-muted-foreground mt-2">
              Filtrando: {dateFilter.startDate ? format(dateFilter.startDate, "dd/MM/yyyy", { locale: es }) : "..."} 
              {" → "} 
              {dateFilter.endDate ? format(dateFilter.endDate, "dd/MM/yyyy", { locale: es }) : "..."}
              {" "}({filteredHistory.length} registros)
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <BMWMSpinner size={32} />
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hay visitas registradas
            </div>
          ) : (
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha/Hora</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Asesor Asignado</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Redirigido</TableHead>
                <TableHead>Asignado Por</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell>
                    {format(new Date(visit.assigned_at), "dd/MM/yyyy HH:mm", { locale: es })}
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(visit.visit_type)}>
                      {visit.visit_type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{visit.advisor_name}</TableCell>
                  <TableCell>
                    {visit.client_name || '-'}
                    {visit.had_appointment && (
                      <Badge variant="outline" className="ml-2">Cita</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {visit.was_occupied ? (
                      <div className="text-sm">
                        <Badge variant="destructive">Redirigido</Badge>
                        <div className="text-muted-foreground">
                          → {visit.redirected_to_name}
                        </div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {visit.assigned_by_name}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>

    {/* Modal de filtro de fechas */}
    <Dialog open={showDateFilter} onOpenChange={setShowDateFilter}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Filtro de Fechas</DialogTitle>
          <DialogDescription>Selecciona un rango de fechas para filtrar el historial</DialogDescription>
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


