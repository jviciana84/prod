"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, RefreshCw, Printer } from "lucide-react"
import { PrintExportButton } from "./print-export-button"
import { differenceInDays, parseISO, format } from "date-fns"
import { es } from "date-fns/locale"

interface Vehicle {
  id: number
  license_plate: string
  model: string
  paint_status: string
  assigned_to: string | null
  photos_completed: boolean
  photos_completed_date: string | null
  created_at: string
  assigned_user?: {
    id: string
    email: string
    full_name: string | null
  } | null
  photographer?:
    | {
        id: number
        user_id: string
        display_name: string
        percentage: number
      }[]
    | null
}

interface Photographer {
  id: number
  user_id: string
  display_name: string
  percentage: number
  created_at: string
  updated_at: string
}

interface PhotosManagerProps {
  initialVehicles: Vehicle[]
  photographers: Photographer[]
}

export default function PhotosManager({ initialVehicles, photographers }: PhotosManagerProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles)
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("pending")
  const [photographerFilter, setPhotographerFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Estadísticas
  const pendingCount = vehicles.filter((v) => !v.photos_completed).length
  const completedCount = vehicles.filter((v) => v.photos_completed).length
  const totalCount = vehicles.length

  // Filtrar vehículos cuando cambien los filtros o los datos
  useEffect(() => {
    filterVehicles()
  }, [searchTerm, statusFilter, photographerFilter, vehicles])

  const filterVehicles = () => {
    let filtered = [...vehicles]

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (vehicle) => vehicle.license_plate.toLowerCase().includes(term) || vehicle.model.toLowerCase().includes(term),
      )
    }

    // Filtrar por estado
    if (statusFilter !== "all") {
      if (statusFilter === "completed") {
        filtered = filtered.filter((vehicle) => vehicle.photos_completed)
      } else if (statusFilter === "pending") {
        filtered = filtered.filter((vehicle) => !vehicle.photos_completed)
      }
    }

    // Filtrar por fotógrafo
    if (photographerFilter !== "all") {
      filtered = filtered.filter((vehicle) => vehicle.assigned_to === photographerFilter)
    }

    setFilteredVehicles(filtered)
  }

  // Cargar datos actualizados
  const fetchVehicles = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("stock")
        .select(`
          *,
          assigned_user:assigned_to(id, email, full_name),
          photographer:photo_assignments(id, user_id, display_name, percentage)
        `)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error al cargar datos de vehículos:", error)
        return
      }

      setVehicles(data || [])
    } catch (err) {
      console.error("Error al cargar datos de vehículos:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Manejar cambio de estado de fotografía
  const handlePhotoStatusChange = async (id: number, completed: boolean) => {
    try {
      const updateData = {
        photos_completed: completed,
        photos_completed_date: completed ? new Date().toISOString() : null,
      }

      const { error } = await supabase.from("stock").update(updateData).eq("id", id)

      if (error) throw error

      // Actualizar localmente
      setVehicles(vehicles.map((vehicle) => (vehicle.id === id ? { ...vehicle, ...updateData } : vehicle)))

      toast({
        title: completed ? "Fotografías completadas" : "Estado actualizado",
        description: completed
          ? "Se ha marcado el vehículo como fotografiado"
          : "Se ha desmarcado el estado de fotografiado",
      })
    } catch (error: any) {
      console.error("Error al actualizar estado de fotografía:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado",
        variant: "destructive",
      })
    }
  }

  // Manejar cambio de estado de pintura
  const handlePaintStatusChange = async (id: number, status: string) => {
    try {
      const { error } = await supabase.from("stock").update({ paint_status: status }).eq("id", id)

      if (error) throw error

      // Actualizar localmente
      setVehicles(vehicles.map((vehicle) => (vehicle.id === id ? { ...vehicle, paint_status: status } : vehicle)))

      toast({
        title: "Estado de pintura actualizado",
        description: `Se ha actualizado el estado de pintura a: ${status}`,
      })
    } catch (error: any) {
      console.error("Error al actualizar estado de pintura:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado de pintura",
        variant: "destructive",
      })
    }
  }

  // Manejar cambio de fotógrafo asignado
  const handlePhotographerChange = async (id: number, photographerId: string | null) => {
    try {
      const { error } = await supabase.from("stock").update({ assigned_to: photographerId }).eq("id", id)

      if (error) throw error

      // Actualizar localmente
      setVehicles(
        vehicles.map((vehicle) => (vehicle.id === id ? { ...vehicle, assigned_to: photographerId } : vehicle)),
      )

      toast({
        title: "Fotógrafo asignado",
        description: photographerId
          ? "Se ha asignado un nuevo fotógrafo al vehículo"
          : "Se ha eliminado la asignación de fotógrafo",
      })
    } catch (error: any) {
      console.error("Error al asignar fotógrafo:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo asignar el fotógrafo",
        variant: "destructive",
      })
    }
  }

  // Calcular días pendientes
  const calculatePendingDays = (vehicle: Vehicle) => {
    if (!vehicle.created_at) return "-"

    const creationDate = parseISO(vehicle.created_at)
    const today = new Date()

    let days: number

    if (vehicle.photos_completed && vehicle.photos_completed_date) {
      const completionDate = parseISO(vehicle.photos_completed_date)
      days = differenceInDays(completionDate, creationDate)
    } else {
      days = differenceInDays(today, creationDate)
    }

    // Determinar el color según la escala
    let color = ""
    if (days <= 3) {
      color = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
    } else if (days <= 7) {
      color = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
    } else {
      color = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    }

    return { days, color }
  }

  // Obtener el nombre del fotógrafo asignado
  const getAssignedPhotographerName = (vehicle: Vehicle) => {
    if (!vehicle.assigned_to) return "-"

    // Primero intentar obtener el nombre de la relación photographer
    if (vehicle.photographer && vehicle.photographer.length > 0) {
      const photographer = vehicle.photographer.find((p) => p.user_id === vehicle.assigned_to)
      if (photographer && photographer.display_name) {
        return photographer.display_name
      }
    }

    // Si no, intentar obtener el nombre de la relación assigned_user
    if (vehicle.assigned_user) {
      return vehicle.assigned_user.full_name || vehicle.assigned_user.email
    }

    return vehicle.assigned_to
  }

  // Función para imprimir la tabla (mantenida para compatibilidad)
  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast({
        title: "Error",
        description: "No se pudo abrir la ventana de impresión",
        variant: "destructive",
      })
      return
    }

    // Estilos para la impresión
    const styles = `
      <style>
        body { font-family: Arial, sans-serif; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .title { font-size: 24px; font-weight: bold; }
        .date { font-size: 14px; }
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none; }
        }
      </style>
    `

    // Crear contenido HTML para imprimir
    let printContent = `
      <html>
      <head>
        <title>Listado de Vehículos Pendientes de Fotografiar</title>
        ${styles}
      </head>
      <body>
        <div class="header">
          <div class="title">Listado de Vehículos Pendientes de Fotografiar</div>
          <div class="date">Fecha: ${format(new Date(), "dd/MM/yyyy", { locale: es })}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>MATRÍCULA</th>
              <th>MODELO</th>
              <th>ESTADO PINTURA</th>
              <th>ASIGNADO</th>
              <th>DÍAS PENDIENTE</th>
            </tr>
          </thead>
          <tbody>
    `

    // Añadir filas de la tabla
    filteredVehicles.forEach((vehicle) => {
      if (!vehicle.photos_completed) {
        const pendingDays = calculatePendingDays(vehicle)
        printContent += `
          <tr>
            <td>${vehicle.license_plate}</td>
            <td>${vehicle.model}</td>
            <td>${vehicle.paint_status || "pendiente"}</td>
            <td>${getAssignedPhotographerName(vehicle)}</td>
            <td>${pendingDays.days}</td>
          </tr>
        `
      }
    })

    // Cerrar tabla y documento
    printContent += `
          </tbody>
        </table>
        <div style="margin-top: 20px;">
          <p>Total vehículos pendientes: ${pendingCount}</p>
        </div>
        <button class="no-print" onclick="window.print()">Imprimir</button>
      </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(printContent)
    printWindow.document.close()
  }

  return (
    <div className="space-y-4">
      {/* Resumen de vehículos pendientes */}
      <div className="bg-muted/50 p-4 rounded-md">
        <h3 className="text-lg font-medium mb-2">Resumen</h3>
        <div className="flex flex-wrap gap-4">
          <div>
            <span className="font-medium">Pendientes:</span> {pendingCount}
          </div>
          <div>
            <span className="font-medium">Completados:</span> {completedCount}
          </div>
          <div>
            <span className="font-medium">Total:</span> {totalCount}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por matrícula o modelo..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="completed">Fotografiados</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
          </SelectContent>
        </Select>
        <Select value={photographerFilter} onValueChange={setPhotographerFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrar por fotógrafo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los fotógrafos</SelectItem>
            <SelectItem value="null">Sin asignar</SelectItem>
            {photographers.filter((p, i, arr) => arr.findIndex(x => x.user_id === p.user_id) === i).map((photographer, index) => (
              <SelectItem key={`photographer-${photographer.user_id}-${index}`} value={photographer.user_id}>
                {photographer.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchVehicles} disabled={isLoading} className="h-10 w-10">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <PrintExportButton
            vehicles={filteredVehicles}
            searchQuery={searchTerm}
            statusFilter={statusFilter}
            photographerFilter={photographerFilter}
            photographers={photographers}
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="font-semibold">MATRÍCULA</TableHead>
              <TableHead className="font-semibold">MODELO</TableHead>
              <TableHead className="font-semibold">DISPONIBLE</TableHead>
              <TableHead className="font-semibold">ESTADO PINTURA</TableHead>
              <TableHead className="font-semibold">ASIGNADO</TableHead>
              <TableHead className="font-semibold">FOTOGRAFIADO</TableHead>
              <TableHead className="font-semibold">DÍAS PENDIENTE</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex justify-center items-center">
                    <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                    <span>Cargando datos...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredVehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                  No se encontraron vehículos
                </TableCell>
              </TableRow>
            ) : (
              filteredVehicles.filter((v, i, arr) =>
                arr.findIndex(x => x.id === v.id || x.license_plate === v.license_plate) === i
              ).map((vehicle) => {
                const pendingDays = calculatePendingDays(vehicle)
                return (
                  <TableRow key={`vehicle-${vehicle.id}-${vehicle.license_plate}`}>
                    <TableCell className="font-medium py-0.5">{vehicle.license_plate}</TableCell>
                    <TableCell className="py-0.5">{vehicle.model}</TableCell>
                    <TableCell className="py-0.5">
                      <Badge variant={vehicle.photos_completed ? "outline" : "default"}>
                        {vehicle.photos_completed ? "No" : "Sí"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-0.5">
                      <Select
                        value={vehicle.paint_status || "pendiente"}
                        onValueChange={(value) => handlePaintStatusChange(vehicle.id, value)}
                      >
                        <SelectTrigger className="h-8 w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="bueno">Bueno</SelectItem>
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="malo">Malo</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-0.5">
                      <Select
                        value={vehicle.assigned_to || "null"}
                        onValueChange={(value) => handlePhotographerChange(vehicle.id, value === "null" ? null : value)}
                      >
                        <SelectTrigger className="h-8 w-[150px]">
                          <SelectValue placeholder="Sin asignar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null">Sin asignar</SelectItem>
                          {photographers.filter((p, i, arr) => arr.findIndex(x => x.user_id === p.user_id) === i).map((photographer, index) => (
                            <SelectItem key={`photographer-${photographer.user_id}-${index}`} value={photographer.user_id}>
                              {photographer.display_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-0.5">
                      <Checkbox
                        checked={vehicle.photos_completed}
                        onCheckedChange={(checked) => handlePhotoStatusChange(vehicle.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell className="py-0.5">
                      {typeof pendingDays.days === "number" ? (
                        <Badge variant="outline" className={pendingDays.color}>
                          {pendingDays.days}
                        </Badge>
                      ) : (
                        <Badge variant="outline">{pendingDays.days}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
