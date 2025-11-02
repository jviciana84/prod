"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface VacationManagerProps {
  onUpdate?: () => void
}

export function VacationManager({ onUpdate }: VacationManagerProps) {
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const [advisors, setAdvisors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedAdvisor, setSelectedAdvisor] = useState<any>(null)

  const [formData, setFormData] = useState({
    vacation_start: "",
    vacation_end: "",
    vacation_notes: ""
  })

  useEffect(() => {
    loadAdvisors()
  }, [])

  const loadAdvisors = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('advisors')
      .select('*')
      .eq('is_active', true)
      .order('full_name', { ascending: true })

    setAdvisors(data || [])
    setLoading(false)
  }

  const handleSetVacation = async () => {
    if (!selectedAdvisor || !formData.vacation_start || !formData.vacation_end) {
      toast({
        title: "Error",
        description: "Fechas de inicio y fin son requeridas",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/advisors/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advisor_id: selectedAdvisor.id,
          updates: {
            is_on_vacation: true,
            ...formData
          }
        })
      })

      if (!response.ok) throw new Error('Error al establecer vacaciones')

      toast({
        title: "✅ Vacaciones configuradas",
        description: `Vacaciones establecidas para ${selectedAdvisor.full_name}`
      })

      await loadAdvisors()
      onUpdate?.()
      setDialogOpen(false)
      setFormData({ vacation_start: "", vacation_end: "", vacation_notes: "" })

    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEndVacation = async (advisor: any) => {
    try {
      const response = await fetch('/api/advisors/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advisor_id: advisor.id,
          updates: {
            is_on_vacation: false,
            vacation_start: null,
            vacation_end: null,
            vacation_notes: null
          }
        })
      })

      if (!response.ok) throw new Error('Error al finalizar vacaciones')

      toast({
        title: "✅ Vacaciones finalizadas",
        description: `${advisor.full_name} ha vuelto de vacaciones`
      })

      await loadAdvisors()
      onUpdate?.()

    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Vacaciones</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <BMWMSpinner size={32} />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asesor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead>Fecha Fin</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advisors.map((advisor) => (
                <TableRow key={advisor.id}>
                  <TableCell className="font-medium">{advisor.full_name}</TableCell>
                  <TableCell>
                    {advisor.is_on_vacation ? (
                      <Badge className="bg-orange-500 text-white border-orange-600">De Vacaciones</Badge>
                    ) : (
                      <Badge variant="default">Activo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {advisor.vacation_start && format(new Date(advisor.vacation_start), "dd/MM/yyyy", { locale: es })}
                  </TableCell>
                  <TableCell>
                    {advisor.vacation_end && format(new Date(advisor.vacation_end), "dd/MM/yyyy", { locale: es })}
                  </TableCell>
                  <TableCell>{advisor.vacation_notes || '-'}</TableCell>
                  <TableCell>
                    {advisor.is_on_vacation ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEndVacation(advisor)}
                      >
                        Finalizar Vacaciones
                      </Button>
                    ) : (
                      <Dialog open={dialogOpen && selectedAdvisor?.id === advisor.id} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => setSelectedAdvisor(advisor)}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Establecer Vacaciones
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Establecer Vacaciones</DialogTitle>
                            <DialogDescription>
                              Configurar período de vacaciones para {advisor.full_name}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="vacation_start">Fecha de Inicio</Label>
                              <Input
                                id="vacation_start"
                                type="date"
                                value={formData.vacation_start}
                                onChange={(e) => setFormData({ ...formData, vacation_start: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="vacation_end">Fecha de Fin</Label>
                              <Input
                                id="vacation_end"
                                type="date"
                                value={formData.vacation_end}
                                onChange={(e) => setFormData({ ...formData, vacation_end: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="vacation_notes">Notas (opcional)</Label>
                              <Textarea
                                id="vacation_notes"
                                value={formData.vacation_notes}
                                onChange={(e) => setFormData({ ...formData, vacation_notes: e.target.value })}
                                placeholder="Motivo de las vacaciones..."
                              />
                            </div>
                          </div>

                          <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleSetVacation} disabled={loading}>
                              {loading ? <><BMWMSpinner size={16} className="mr-2" /> Guardando...</> : 'Guardar'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
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


