"use client"

import type React from "react"

import { useState } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import { Pencil, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { ExpenseType } from "@/lib/types/transport"

interface ExpenseTypesManagerProps {
  initialExpenseTypes: ExpenseType[]
}

export default function ExpenseTypesManager({ initialExpenseTypes }: ExpenseTypesManagerProps) {
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>(initialExpenseTypes)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentExpenseType, setCurrentExpenseType] = useState<ExpenseType | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_active: checked }))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      is_active: true,
    })
  }

  const handleAddExpenseType = async () => {
    if (!formData.name) {
      toast({
        title: "Error",
        description: "El nombre del tipo de gasto es obligatorio",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { data, error } = await supabase.from("expense_types").insert(formData).select()

      if (error) throw error

      setExpenseTypes([...expenseTypes, data[0]])
      setIsAddDialogOpen(false)
      resetForm()

      toast({
        title: "Tipo de gasto añadido",
        description: "El tipo de gasto ha sido añadido exitosamente",
      })
    } catch (error: any) {
      console.error("Error al añadir tipo de gasto:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo añadir el tipo de gasto",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditExpenseType = async () => {
    if (!currentExpenseType || !formData.name) {
      toast({
        title: "Error",
        description: "El nombre del tipo de gasto es obligatorio",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { data, error } = await supabase
        .from("expense_types")
        .update(formData)
        .eq("id", currentExpenseType.id)
        .select()

      if (error) throw error

      setExpenseTypes(expenseTypes.map((type) => (type.id === currentExpenseType.id ? data[0] : type)))
      setIsEditDialogOpen(false)
      setCurrentExpenseType(null)
      resetForm()

      toast({
        title: "Tipo de gasto actualizado",
        description: "El tipo de gasto ha sido actualizado exitosamente",
      })
    } catch (error: any) {
      console.error("Error al actualizar tipo de gasto:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el tipo de gasto",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteExpenseType = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este tipo de gasto? Esta acción no se puede deshacer.")) return

    try {
      const { error } = await supabase.from("expense_types").delete().eq("id", id)

      if (error) throw error

      setExpenseTypes(expenseTypes.filter((type) => type.id !== id))

      toast({
        title: "Tipo de gasto eliminado",
        description: "El tipo de gasto ha sido eliminado exitosamente",
      })
    } catch (error: any) {
      console.error("Error al eliminar tipo de gasto:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el tipo de gasto",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (expenseType: ExpenseType) => {
    setCurrentExpenseType(expenseType)
    setFormData({
      name: expenseType.name,
      description: expenseType.description || "",
      is_active: expenseType.is_active,
    })
    setIsEditDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Añadir Tipo de Gasto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Tipo de Gasto</DialogTitle>
              <DialogDescription>Introduce los datos del nuevo tipo de gasto</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nombre *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="col-span-3"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is_active" className="text-right">
                  Activo
                </Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Switch id="is_active" checked={formData.is_active} onCheckedChange={handleSwitchChange} />
                  <Label htmlFor="is_active" className="text-sm text-muted-foreground">
                    {formData.is_active ? "Activo" : "Inactivo"}
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleAddExpenseType} disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Tipo de Gasto</DialogTitle>
              <DialogDescription>Modifica los datos del tipo de gasto</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Nombre *
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Descripción
                </Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="col-span-3"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-is_active" className="text-right">
                  Activo
                </Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Switch id="edit-is_active" checked={formData.is_active} onCheckedChange={handleSwitchChange} />
                  <Label htmlFor="edit-is_active" className="text-sm text-muted-foreground">
                    {formData.is_active ? "Activo" : "Inactivo"}
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleEditExpenseType} disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenseTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No hay tipos de gastos registrados
                </TableCell>
              </TableRow>
            ) : (
              expenseTypes.map((expenseType) => (
                <TableRow key={expenseType.id}>
                  <TableCell className="font-medium">{expenseType.name}</TableCell>
                  <TableCell>{expenseType.description || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={expenseType.is_active ? "default" : "secondary"}>
                      {expenseType.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(expenseType)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteExpenseType(expenseType.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
