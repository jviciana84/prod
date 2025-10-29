"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function VisitHistory() {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoading(true)

    const { data } = await supabase
      .from('visit_assignments')
      .select('*')
      .order('assigned_at', { ascending: false })
      .limit(100)

    setHistory(data || [])
    setLoading(false)
  }

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
    <Card>
      <CardHeader>
        <CardTitle>Historial de Visitas (Últimas 100)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : history.length === 0 ? (
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
              {history.map((visit) => (
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
  )
}

