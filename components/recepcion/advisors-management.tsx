// ============================================
// COMPONENTE: Gestión de Asesores
// ============================================
// Patrón: CONSULTAS directas + MUTACIONES por API
// ============================================

"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Advisor {
  id: string
  full_name: string
  email?: string
  phone?: string
  specialization: string[]
  is_active: boolean
  is_occupied: boolean
  is_on_vacation: boolean
  total_visits: number
  visits_today: number
  current_turn_priority: number
}

interface AdvisorsManagementProps {
  onUpdate?: () => void
}

export function AdvisorsManagement({ onUpdate }: AdvisorsManagementProps) {
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const [advisors, setAdvisors] = useState<Advisor[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Advisor | null>(null)

  // Formulario
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    specialization: [] as string[]
  })

  // ✅ CONSULTA - Cliente directo (correcto según guía)
  useEffect(() => {
    loadAdvisors()
  }, [])

  const loadAdvisors = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('advisors')
      .select('*')
      .order('is_active', { ascending: false })
      .order('full_name', { ascending: true })

    if (error) {
      console.error('Error cargando asesores:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los asesores",
        variant: "destructive"
      })
    } else {
      setAdvisors(data || [])
    }
    setLoading(false)
  }

  const handleSpecializationChange = (type: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      specialization: checked
        ? [...prev.specialization, type]
        : prev.specialization.filter(t => t !== type)
    }))
  }

  // ✅ MUTACIÓN - API Route (correcto según guía)
  const handleSubmit = async () => {
    if (!formData.full_name || formData.specialization.length === 0) {
      toast({
        title: "Error",
        description: "Nombre y al menos una especialización son requeridos",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      if (editing) {
        // Actualizar
        const response = await fetch('/api/advisors/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            advisor_id: editing.id,
            updates: formData
          })
        })

        if (!response.ok) throw new Error('Error al actualizar')

        toast({
          title: "✅ Actualizado",
          description: "Asesor actualizado correctamente"
        })
      } else {
        // Crear
        const response = await fetch('/api/advisors/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (!response.ok) throw new Error('Error al crear')

        toast({
          title: "✅ Creado",
          description: "Asesor creado correctamente"
        })
      }

      // Recargar lista
      await loadAdvisors()
      onUpdate?.()
      handleCloseDialog()

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

  // ✅ MUTACIÓN - API Route (correcto según guía)
  const handleToggleActive = async (advisor: Advisor) => {
    try {
      const response = await fetch('/api/advisors/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advisor_id: advisor.id,
          updates: { is_active: !advisor.is_active }
        })
      })

      if (!response.ok) throw new Error('Error al actualizar')

      toast({
        title: "✅ Actualizado",
        description: `Asesor ${!advisor.is_active ? 'activado' : 'desactivado'}`
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

  // ✅ MUTACIÓN - API Route (correcto según guía)
  const handleToggleOccupied = async (advisor: Advisor) => {
    try {
      const response = await fetch('/api/advisors/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advisor_id: advisor.id,
          updates: { is_occupied: !advisor.is_occupied }
        })
      })

      if (!response.ok) throw new Error('Error al actualizar')

      toast({
        title: "✅ Actualizado",
        description: `Asesor marcado como ${!advisor.is_occupied ? 'ocupado' : 'disponible'}`
      })

      await loadAdvisors()

    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleEdit = (advisor: Advisor) => {
    setEditing(advisor)
    setFormData({
      full_name: advisor.full_name,
      email: advisor.email || "",
      phone: advisor.phone || "",
      specialization: advisor.specialization
    })
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditing(null)
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      specialization: []
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestión de Asesores</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Asesor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editing ? 'Editar Asesor' : 'Nuevo Asesor'}
              </DialogTitle>
              <DialogDescription>
                Configura los datos del asesor y sus especializaciones
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre Completo *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Juan Pérez"
                />
                <p className="text-xs text-muted-foreground">
                  Para VN: agregar asesor sin vincularlo a usuario del sistema
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="juan@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono (Opcional)</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="666 123 456"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Especializaciones *</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'COCHE_VN', label: 'Coche Vehículo Nuevo' },
                    { value: 'COCHE_VO', label: 'Coche Vehículo Ocasión' },
                    { value: 'MOTO_VN', label: 'Moto Vehículo Nuevo' },
                    { value: 'MOTO_VO', label: 'Moto Vehículo Ocasión' }
                  ].map(({ value, label }) => (
                    <div key={value} className="flex items-center space-x-2">
                      <Checkbox
                        id={value}
                        checked={formData.specialization.includes(value)}
                        onCheckedChange={(checked) => handleSpecializationChange(value, checked as boolean)}
                      />
                      <label htmlFor={value} className="text-sm cursor-pointer">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando...</>
                ) : (
                  editing ? 'Actualizar' : 'Crear'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : advisors.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No hay asesores registrados
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email/Teléfono</TableHead>
                <TableHead>Especializaciones</TableHead>
                <TableHead>Visitas Hoy</TableHead>
                <TableHead>Total Visitas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advisors.map((advisor) => (
                <TableRow key={advisor.id}>
                  <TableCell className="font-medium">{advisor.full_name}</TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {advisor.email && <div>{advisor.email}</div>}
                      {advisor.phone && <div>{advisor.phone}</div>}
                      {!advisor.email && !advisor.phone && <span>-</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {advisor.specialization.map(spec => (
                        <Badge key={spec} variant="outline" className="text-xs">
                          {spec.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{advisor.visits_today}</TableCell>
                  <TableCell>{advisor.total_visits}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant={advisor.is_active ? "default" : "secondary"}>
                        {advisor.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                      {advisor.is_occupied && (
                        <Badge variant="destructive">Ocupado</Badge>
                      )}
                      {advisor.is_on_vacation && (
                        <Badge variant="outline" className="bg-orange-100">Vacaciones</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(advisor)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(advisor)}
                      >
                        {advisor.is_active ? 'Desactivar' : 'Activar'}
                      </Button>
                      {advisor.is_active && !advisor.is_on_vacation && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleOccupied(advisor)}
                        >
                          {advisor.is_occupied ? 'Disponible' : 'Ocupado'}
                        </Button>
                      )}
                    </div>
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


