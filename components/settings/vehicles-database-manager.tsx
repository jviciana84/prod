"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Pencil, Plus, Trash2, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Vehicle {
  id: number
  license_plate: string
  brand?: string
  model: string
  year?: number
  fuel_type?: string
  power?: number
  displacement?: number
  category?: string
  first_registration_date?: string
  source: string
  created_at: string
  last_updated: string
}

export default function VehiclesDatabaseManager() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    license_plate: "",
    brand: "",
    model: "",
    year: "",
    fuel_type: "",
  })

  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Cargar vehículos al montar el componente
  useEffect(() => {
    fetchVehicles()
  }, [])

  // Filtrar vehículos cuando cambia el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVehicles(vehicles)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = vehicles.filter(
      (vehicle) =>
        vehicle.license_plate.toLowerCase().includes(term) ||
        vehicle.brand?.toLowerCase().includes(term) ||
        vehicle.model.toLowerCase().includes(term) ||
        vehicle.fuel_type?.toLowerCase().includes(term) ||
        (vehicle.year && vehicle.year.toString().includes(term)),
    )

    setFilteredVehicles(filtered)
  }, [searchTerm, vehicles])

  const fetchVehicles = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("vehicles_database")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      setVehicles(data || [])
      setFilteredVehicles(data || [])
    } catch (error: any) {
      console.error("Error al cargar vehículos:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los vehículos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({
      license_plate: "",
      brand: "",
      model: "",
      year: "",
      fuel_type: "",
    })
  }

  const validateLicensePlate = (value: string) => {
    // Formato actual: 4 números + 3 letras (sin Ñ, Q, CH, LL)
    const currentFormat = /^\d{4}[BCDFGHJKLMNPRSTVWXYZ]{3}$/i
    // Formato antiguo: 1-2 letras + 4 números + 1-2 letras (opcional con guiones)
    const oldFormat = /^[A-Z]{1,2}[-]?[0-9]{4}[-]?[A-Z]{1,2}$/i

    return currentFormat.test(value) || oldFormat.test(value)
  }

  const handleAddVehicle = async () => {
    // Validar campos obligatorios
    if (!formData.license_plate || !formData.model) {
      toast({
        title: "Campos incompletos",
        description: "La matrícula y el modelo son obligatorios",
        variant: "destructive",
      })
      return
    }

    // Validar formato de matrícula
    if (!validateLicensePlate(formData.license_plate)) {
      toast({
        title: "Formato de matrícula incorrecto",
        description: "Introduce una matrícula válida (ej: 1234ABC o AB-1234-CD)",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Preparar datos para enviar
      const dataToSend = {
        license_plate: formData.license_plate.toUpperCase(),
        brand: formData.brand || null,
        model: formData.model,
        year: formData.year ? Number.parseInt(formData.year) : null,
        fuel_type: formData.fuel_type || null,
        source: "manual",
      }

      // Enviar datos a la base de datos
      const { data, error } = await supabase.from("vehicles_database").insert(dataToSend).select()

      if (error) throw error

      toast({
        title: "Vehículo añadido",
        description: "El vehículo ha sido añadido exitosamente",
      })

      // Actualizar la lista de vehículos
      setVehicles([data[0], ...vehicles])
      setIsAddDialogOpen(false)
      resetForm()
    } catch (error: any) {
      console.error("Error al añadir vehículo:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo añadir el vehículo",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditVehicle = async () => {
    if (!currentVehicle) return

    // Validar campos obligatorios
    if (!formData.license_plate || !formData.model) {
      toast({
        title: "Campos incompletos",
        description: "La matrícula y el modelo son obligatorios",
        variant: "destructive",
      })
      return
    }

    // Validar formato de matrícula
    if (!validateLicensePlate(formData.license_plate)) {
      toast({
        title: "Formato de matrícula incorrecto",
        description: "Introduce una matrícula válida (ej: 1234ABC o AB-1234-CD)",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Preparar datos para enviar
      const dataToSend = {
        license_plate: formData.license_plate.toUpperCase(),
        brand: formData.brand || null,
        model: formData.model,
        year: formData.year ? Number.parseInt(formData.year) : null,
        fuel_type: formData.fuel_type || null,
        last_updated: new Date().toISOString(),
      }

      // Actualizar en la base de datos
      const { data, error } = await supabase
        .from("vehicles_database")
        .update(dataToSend)
        .eq("id", currentVehicle.id)
        .select()

      if (error) throw error

      toast({
        title: "Vehículo actualizado",
        description: "El vehículo ha sido actualizado exitosamente",
      })

      // Actualizar la lista de vehículos
      setVehicles(vehicles.map((v) => (v.id === currentVehicle.id ? data[0] : v)))
      setIsEditDialogOpen(false)
      setCurrentVehicle(null)
      resetForm()
    } catch (error: any) {
      console.error("Error al actualizar vehículo:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el vehículo",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteVehicle = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este vehículo? Esta acción no se puede deshacer.")) return

    try {
      const { error } = await supabase.from("vehicles_database").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Vehículo eliminado",
        description: "El vehículo ha sido eliminado exitosamente",
      })

      // Actualizar la lista de vehículos
      setVehicles(vehicles.filter((v) => v.id !== id))
    } catch (error: any) {
      console.error("Error al eliminar vehículo:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el vehículo",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (vehicle: Vehicle) => {
    setCurrentVehicle(vehicle)
    setFormData({
      license_plate: vehicle.license_plate,
      brand: vehicle.brand || "",
      model: vehicle.model,
      year: vehicle.year ? vehicle.year.toString() : "",
      fuel_type: vehicle.fuel_type || "",
    })
    setIsEditDialogOpen(true)
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "manual":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            Manual
          </Badge>
        )
      case "transport_table":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            Transporte
          </Badge>
        )
      default:
        return <Badge variant="outline">{source}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por matrícula, marca, modelo..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Añadir Vehículo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Vehículo</DialogTitle>
              <DialogDescription>Introduce los datos del vehículo</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="license_plate" className="text-right">
                  Matrícula *
                </Label>
                <Input
                  id="license_plate"
                  name="license_plate"
                  value={formData.license_plate}
                  onChange={handleInputChange}
                  className="col-span-3 uppercase"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="brand" className="text-right">
                  Marca
                </Label>
                <Input
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="model" className="text-right">
                  Modelo *
                </Label>
                <Input
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="year" className="text-right">
                  Año
                </Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="col-span-3"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fuel_type" className="text-right">
                  Combustible
                </Label>
                <Select
                  name="fuel_type"
                  value={formData.fuel_type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, fuel_type: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccionar combustible" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin especificar</SelectItem>
                    <SelectItem value="Gasolina">Gasolina</SelectItem>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                    <SelectItem value="Híbrido">Híbrido</SelectItem>
                    <SelectItem value="Eléctrico">Eléctrico</SelectItem>
                    <SelectItem value="GLP">GLP</SelectItem>
                    <SelectItem value="GNC">GNC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleAddVehicle} disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Vehículo</DialogTitle>
              <DialogDescription>Modifica los datos del vehículo</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_license_plate" className="text-right">
                  Matrícula *
                </Label>
                <Input
                  id="edit_license_plate"
                  name="license_plate"
                  value={formData.license_plate}
                  onChange={handleInputChange}
                  className="col-span-3 uppercase"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_brand" className="text-right">
                  Marca
                </Label>
                <Input
                  id="edit_brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_model" className="text-right">
                  Modelo *
                </Label>
                <Input
                  id="edit_model"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_year" className="text-right">
                  Año
                </Label>
                <Input
                  id="edit_year"
                  name="year"
                  type="number"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="col-span-3"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_fuel_type" className="text-right">
                  Combustible
                </Label>
                <Select
                  name="fuel_type"
                  value={formData.fuel_type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, fuel_type: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccionar combustible" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin especificar</SelectItem>
                    <SelectItem value="Gasolina">Gasolina</SelectItem>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                    <SelectItem value="Híbrido">Híbrido</SelectItem>
                    <SelectItem value="Eléctrico">Eléctrico</SelectItem>
                    <SelectItem value="GLP">GLP</SelectItem>
                    <SelectItem value="GNC">GNC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleEditVehicle} disabled={isSubmitting}>
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
              <TableHead>Matrícula</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Año</TableHead>
              <TableHead>Combustible</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Última Actualización</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Cargando vehículos...
                </TableCell>
              </TableRow>
            ) : filteredVehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No se encontraron vehículos
                </TableCell>
              </TableRow>
            ) : (
              filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.license_plate}</TableCell>
                  <TableCell>{vehicle.brand || "-"}</TableCell>
                  <TableCell>{vehicle.model}</TableCell>
                  <TableCell>{vehicle.year || "-"}</TableCell>
                  <TableCell>{vehicle.fuel_type || "-"}</TableCell>
                  <TableCell>{getSourceBadge(vehicle.source)}</TableCell>
                  <TableCell>{new Date(vehicle.last_updated).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(vehicle)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteVehicle(vehicle.id)}>
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
