"use client"

import { useState, useEffect, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Search,
  RefreshCw,
  AlertTriangle,
  Trash2,
  AlertOctagon,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Camera,
  Users,
  AlertCircle,
  Hash,
  CheckSquare,
  Ban,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { differenceInDays } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

export interface PhotoVehicle {
  id: string
  license_plate: string
  model: string
  disponible: string // Fecha en formato ISO
  estado_pintura: "pendiente" | "apto" | "no_apto"
  paint_status_date: string | null // Fecha en formato ISO
  paint_apto_date: string | null // Fecha en formato ISO
  assigned_to: string | null // UUID del fotógrafo
  photos_completed: boolean
  photos_completed_date: string | null // Fecha en formato ISO
  error_count: number
  last_error_by: string | null // UUID del usuario que marcó el error
  original_assigned_to: string | null // UUID del fotógrafo original
  created_at: string // Fecha en formato ISO
  updated_at: string // Fecha en formato ISO
  nuevas_entradas_id: string | null // UUID de la entrada original
}

interface Photographer {
  id: string
  user_id: string
  display_name: string
  is_active: boolean
}

export default function PhotosTable() {
  const [vehicles, setVehicles] = useState<PhotoVehicle[]>([])
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [photographerFilter, setPhotographerFilter] = useState<string>("all")
  const [paintStatusFilter, setpaintStatusFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [activePhotoTab, setActivePhotoTab] = useState<string>("all")
  
  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)
  const [paginatedVehicles, setPaginatedVehicles] = useState<PhotoVehicle[]>([])
  const [totalPages, setTotalPages] = useState(1)
  
  // Usar el hook de autenticación
  const { user, profile, loading: authLoading } = useAuth()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Calcular si es admin basado en el perfil
  const isAdmin = useMemo(() => {
    if (!profile?.role) return false
    
    const roles = typeof profile.role === 'string' 
      ? profile.role.split(", ").map(r => r.trim().toLowerCase())
      : [profile.role.toLowerCase()]
    
    console.log("Roles del perfil:", roles)
    
    const hasAdminRole = roles.some(role => 
      role === 'admin' || 
      role === 'supervisor' || 
      role === 'director' ||
      role.includes('admin') ||
      role.includes('supervisor') ||
      role.includes('director')
    )
    
    console.log("¿Es admin?", hasAdminRole)
    return hasAdminRole
  }, [profile?.role])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Obtener vehículos
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from("fotos")
        .select("*")
        .order("disponible", { ascending: false })

      if (vehiclesError) throw vehiclesError

      // Obtener fotógrafos asignados (sin usar relaciones implícitas)
      const { data: photographersData, error: photographersError } = await supabase
        .from("fotos_asignadas")
        .select("*")
        .eq("is_active", true)

      if (photographersError) throw photographersError

      // Obtener información de usuarios para los fotógrafos
      const userIds = photographersData.map((p) => p.user_id)

      // Solo hacer la consulta si hay IDs de usuario
      let usersData = []
      if (userIds.length > 0) {
        // Primero intentar obtener datos de profiles (con alias y full_name)
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, alias, full_name")
          .in("id", userIds)

        if (!profilesError && profiles) {
          usersData = profiles
        } else {
          // Si no hay profiles, usar auth.users como fallback
          const { data: users, error: usersError } = await supabase
            .from("auth.users")
            .select("id, email")
            .in("id", userIds)

          if (!usersError) {
            usersData = users || []
          }
        }
      }

      // Combinar datos de fotógrafos con datos de usuarios
      const formattedPhotographers = photographersData.map((p) => {
        const user = usersData.find((u) => u.id === p.user_id)
        let displayName = `Usuario ${p.user_id.substring(0, 8)}...`

        if (user) {
          if (user.alias) {
            displayName = user.alias
          } else if (user.full_name) {
            displayName = user.full_name
          } else if (user.email) {
            displayName = user.email
          }
        }

        return {
          id: p.id,
          user_id: p.user_id,
          display_name: displayName,
          is_active: p.is_active,
        }
      })

      setVehicles(vehiclesData || [])
      setPhotographers(formattedPhotographers || [])
    } catch (error) {
      console.error("Error al cargar datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const pendingCount = vehicles.filter((v) => !v.photos_completed).length
  const completedCount = vehicles.filter((v) => v.photos_completed).length
  const totalCount = vehicles.length
  const aptoCount = vehicles.filter((v) => v.estado_pintura === "apto").length
  const noAptoCount = vehicles.filter((v) => v.estado_pintura === "no_apto").length
  const pendienteCount = vehicles.filter((v) => v.estado_pintura === "pendiente").length
  const errorCount = vehicles.reduce((sum, v) => sum + (v.error_count || 0), 0)

  const [filteredVehicles, setFilteredVehicles] = useState<PhotoVehicle[]>([])

  useEffect(() => {
    const baseFilteredVehicles = vehicles.filter((vehicle) => {
      const matchesSearch =
        searchTerm === "" ||
        vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "completed" && vehicle.photos_completed) ||
        (statusFilter === "pending" && !vehicle.photos_completed)

      const matchesPhotographer =
        photographerFilter === "all" ||
        (photographerFilter === "null" && !vehicle.assigned_to) ||
        vehicle.assigned_to === photographerFilter

      const matchesPaintStatus = paintStatusFilter === "all" || vehicle.estado_pintura === paintStatusFilter

      return matchesSearch && matchesStatus && matchesPhotographer && matchesPaintStatus
    })

    if (activePhotoTab === "all") {
      setFilteredVehicles(baseFilteredVehicles)
      return
    }

    if (activePhotoTab === "sold_without_photos") {
      // Obtener vehículos vendidos sin fotos completadas
      const fetchSoldWithoutPhotos = async () => {
        try {
          const { data: soldVehicles, error } = await supabase
            .from("sales_vehicles")
            .select("license_plate, sold_before_photos_ready")
            .eq("sold_before_photos_ready", true)

          if (error) throw error

          const soldLicensePlates = soldVehicles.map((v) => v.license_plate)
          const soldWithoutPhotos = baseFilteredVehicles.filter((vehicle) =>
            soldLicensePlates.includes(vehicle.license_plate),
          )

          setFilteredVehicles(soldWithoutPhotos)
        } catch (error) {
          console.error("Error al cargar vehículos vendidos sin fotos:", error)
          setFilteredVehicles(baseFilteredVehicles)
        }
      }

      fetchSoldWithoutPhotos()
    } else {
      setFilteredVehicles(baseFilteredVehicles)
    }
  }, [vehicles, searchTerm, statusFilter, photographerFilter, paintStatusFilter, activePhotoTab])

  // Actualizar la paginación cuando cambian los vehículos filtrados o la página actual
  useEffect(() => {
    const totalItems = filteredVehicles.length
    const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage)
    setTotalPages(calculatedTotalPages || 1)

    // Asegurarse de que la página actual no exceda el total de páginas
    const safePage = Math.min(currentPage, calculatedTotalPages || 1)
    if (safePage !== currentPage) {
      setCurrentPage(safePage)
    }

    // Calcular los índices de inicio y fin para la página actual
    const startIndex = (safePage - 1) * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems)

    // Obtener los elementos para la página actual
    const currentItems = filteredVehicles.slice(startIndex, endIndex)
    setPaginatedVehicles(currentItems)
  }, [filteredVehicles, currentPage, itemsPerPage])

  // Función para cambiar de página
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number.parseInt(value, 10))
    setCurrentPage(1) // Resetear a la primera página al cambiar el número de filas por página
  }

  const handleOpenAssignments = () => {
    // Navegar a la página de asignaciones de fotógrafos
    window.location.href = "/dashboard/photos/assignments"
  }

  const calculatePendingDays = (vehicle: PhotoVehicle) => {
    let days = 0
    let color = "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"

    if (vehicle.photos_completed) {
      return { days: 0, color }
    }

    if (vehicle.estado_pintura === "apto" && vehicle.paint_apto_date) {
      days = differenceInDays(new Date(), new Date(vehicle.paint_apto_date))
    } else {
      days = differenceInDays(new Date(), new Date(vehicle.disponible))
    }

    if (days <= 3) {
      color = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
    } else if (days <= 7) {
      color = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
    } else {
      color = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    }

    return { days, color }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const handlePhotoStatusChange = async (id: string, completed: boolean) => {
    try {
      const updates = {
        photos_completed: completed,
        photos_completed_date: completed ? new Date().toISOString() : null,
      }

      const { error } = await supabase.from("fotos").update(updates).eq("id", id)

      if (error) throw error

      setVehicles((prev) =>
        prev.map((vehicle) =>
          vehicle.id === id
            ? {
                ...vehicle,
                photos_completed: completed,
                photos_completed_date: completed ? new Date().toISOString() : null,
              }
            : vehicle,
        ),
      )

      toast({
        title: "Estado actualizado",
        description: `El vehículo ha sido marcado como ${completed ? "fotografiado" : "pendiente"}.`,
      })
    } catch (error) {
      console.error("Error al cambiar estado de fotografía:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  const handlePaintStatusChange = async (id: string) => {
    try {
      // Obtener el vehículo actual
      const vehicle = vehicles.find((v) => v.id === id)

      if (!vehicle) {
        throw new Error("Vehículo no encontrado")
      }

      // Si ya está en estado "apto", no permitir cambios
      if (vehicle.estado_pintura === "apto") {
        toast({
          title: "No permitido",
          description: "No puedes cambiar el estado de un vehículo marcado como apto por el pintor.",
          variant: "destructive",
        })
        return
      }

      // Solo permitir cambiar de "pendiente" a "no_apto"
      if (vehicle.estado_pintura === "pendiente") {
        const now = new Date().toISOString()
        const updates = {
          estado_pintura: "no_apto" as const,
          paint_status_date: now,
        }

        const { error } = await supabase.from("fotos").update(updates).eq("id", id)

        if (error) throw error

        setVehicles((prev) =>
          prev.map((v) =>
            v.id === id
              ? {
                  ...v,
                  estado_pintura: "no_apto",
                  paint_status_date: now,
                }
              : v,
          ),
        )

        toast({
          title: "Estado de pintura actualizado",
          description: "El estado de pintura ha sido marcado como 'No Apto'.",
        })
      } else if (vehicle.estado_pintura === "no_apto") {
        // Permitir volver a "pendiente" desde "no_apto"
        const now = new Date().toISOString()
        const updates = {
          estado_pintura: "pendiente" as const,
          paint_status_date: now,
        }

        const { error } = await supabase.from("fotos").update(updates).eq("id", id)

        if (error) throw error

        setVehicles((prev) =>
          prev.map((v) =>
            v.id === id
              ? {
                  ...v,
                  estado_pintura: "pendiente",
                  paint_status_date: now,
                }
              : v,
          ),
        )

        toast({
          title: "Estado de pintura actualizado",
          description: "El estado de pintura ha sido marcado como 'Pendiente'.",
        })
      }
    } catch (error) {
      console.error("Error al cambiar estado de pintura:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de pintura. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  const handlePhotographerChange = async (id: string, photographerId: string | null) => {
    try {
      const { error } = await supabase.from("fotos").update({ assigned_to: photographerId }).eq("id", id)

      if (error) throw error

      setVehicles((prev) =>
        prev.map((vehicle) => (vehicle.id === id ? { ...vehicle, assigned_to: photographerId } : vehicle)),
      )

      const photographerName = photographerId
        ? photographers.find((p) => p.user_id === photographerId)?.display_name || "Fotógrafo"
        : "ninguno"

      toast({
        title: "Fotógrafo actualizado",
        description: `Se ha asignado ${photographerName} al vehículo.`,
      })
    } catch (error) {
      console.error("Error al cambiar fotógrafo asignado:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el fotógrafo asignado. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  const handleMarkAsError = async (id: string) => {
    try {
      const { data: vehicle, error: fetchError } = await supabase.from("fotos").select("*").eq("id", id).single()

      if (fetchError) throw fetchError

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Usuario no autenticado")

      const updates = {
        photos_completed: false,
        photos_completed_date: null,
        error_count: (vehicle.error_count || 0) + 1,
        last_error_by: user.id,
        original_assigned_to: vehicle.original_assigned_to || vehicle.assigned_to,
      }

      const { error } = await supabase.from("fotos").update(updates).eq("id", id)

      if (error) throw error

      setVehicles((prev) =>
        prev.map((v) =>
          v.id === id
            ? {
                ...v,
                photos_completed: false,
                photos_completed_date: null,
                error_count: (v.error_count || 0) + 1,
                last_error_by: user.id,
                original_assigned_to: v.original_assigned_to || v.assigned_to,
              }
            : v,
        ),
      )

      toast({
        title: "Marcado como erróneo",
        description: "El vehículo ha sido marcado como erróneo y vuelve a estar pendiente.",
      })
    } catch (error) {
      console.error("Error al marcar como erróneo:", error)
      toast({
        title: "Error",
        description: "No se pudo marcar el vehículo como erróneo. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteVehicle = async (id: string, licensePlate: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el vehículo con matrícula ${licensePlate}?`)) {
      return
    }

    try {
      const { error } = await supabase.from("fotos").delete().eq("id", id)

      if (error) throw error

      setVehicles((prev) => prev.filter((vehicle) => vehicle.id !== id))

      toast({
        title: "Vehículo eliminado",
        description: `El vehículo con matrícula ${licensePlate} ha sido eliminado.`,
      })
    } catch (error) {
      console.error("Error al eliminar vehículo:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el vehículo. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Estadísticas en cards individuales */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Pendientes */}
        <Card className="p-4 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pendientes</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </Card>

        {/* Completados */}
        <Card className="p-4 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completados</p>
              <p className="text-2xl font-bold">{completedCount}</p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        {/* Errores */}
        <Card className="p-4 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Errores</p>
              <p className="text-2xl font-bold text-red-500">{errorCount}</p>
            </div>
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>

        {/* Aptos */}
        <Card className="p-4 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Aptos</p>
              <p className="text-2xl font-bold text-green-500">{aptoCount}</p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        {/* No Aptos/Pendientes */}
        <Card className="p-4 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">No Aptos/Pendientes</p>
              <p className="text-2xl font-bold text-amber-500">{noAptoCount + pendienteCount}</p>
            </div>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <Ban className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </Card>

        {/* Total */}
        <Card className="p-4 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{totalCount}</p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Hash className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Card principal con filtros y tabla */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Camera className="h-6 w-6 text-yellow-600" />
            <div>
              <CardTitle>Gestión de Vehículos</CardTitle>
              <CardDescription>Filtra y gestiona el estado de las fotografías</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-2">
              <Button
                variant={activePhotoTab === "all" ? "default" : "outline"}
                onClick={() => setActivePhotoTab("all")}
                size="sm"
              >
                Todos
              </Button>
              <Button
                variant={activePhotoTab === "sold_without_photos" ? "default" : "outline"}
                onClick={() => setActivePhotoTab("sold_without_photos")}
                size="sm"
              >
                Vendidos sin fotografías
              </Button>
            </div>
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
                {photographers.map((photographer) => (
                  <SelectItem key={photographer.user_id} value={photographer.user_id}>
                    {photographer.display_name || `Usuario ${photographer.user_id.substring(0, 8)}...`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paintStatusFilter} onValueChange={setpaintStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar por pintura" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="apto">Apto</SelectItem>
                <SelectItem value="no_apto">No apto</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={fetchData} disabled={isLoading} className="h-10 w-10">
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              {console.log("Estado isAdmin en render:", isAdmin)}
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleOpenAssignments}
                  className="h-10 px-3"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Asignaciones
                </Button>
              )}
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
                  <TableHead className="font-semibold">ACCIONES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                        <span>Cargando datos...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                      No se encontraron vehículos
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedVehicles.map((vehicle) => {
                    const { days, color } = calculatePendingDays(vehicle)
                    return (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium py-0.5">{vehicle.license_plate}</TableCell>
                        <TableCell className="py-0.5">{vehicle.model}</TableCell>
                        <TableCell className="py-0.5">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{formatDate(vehicle.disponible)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-0.5">
                          {vehicle.estado_pintura === "apto" ? (
                            <div className="flex items-center justify-center h-8 w-full border border-green-300 dark:border-green-700 rounded-md px-2 text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {formatDate(vehicle.paint_apto_date || vehicle.paint_status_date)}
                            </div>
                          ) : vehicle.estado_pintura === "no_apto" ? (
                            <button
                              className="flex items-center justify-center h-8 w-full rounded-md px-2 bg-red-100 text-red-800 border border-red-300 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700 dark:hover:bg-red-800/50 transition-colors"
                              onClick={() => handlePaintStatusChange(vehicle.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              No Apto
                            </button>
                          ) : (
                            <button
                              className="flex items-center justify-center h-8 w-full rounded-md px-2 bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-300 hover:text-amber-950 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-800 dark:hover:text-amber-100 transition-colors"
                              onClick={() => handlePaintStatusChange(vehicle.id)}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Pendiente
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-0.5">
                          <Select
                            value={vehicle.assigned_to || "null"}
                            onValueChange={(value) => handlePhotographerChange(vehicle.id, value || null)}
                          >
                            <SelectTrigger className="w-full h-8">
                              <SelectValue placeholder="Sin asignar">
                                {vehicle.assigned_to
                                  ? photographers.find((p) => p.user_id === vehicle.assigned_to)?.display_name ||
                                    "Usuario desconocido"
                                  : "Sin asignar"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="null">Sin asignar</SelectItem>
                              {photographers.map((photographer) => (
                                <SelectItem key={photographer.user_id} value={photographer.user_id}>
                                  {photographer.display_name || `Usuario ${photographer.user_id.substring(0, 8)}...`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-0.5">
                          {vehicle.photos_completed ? (
                            <div className="flex items-center justify-center h-8 w-full border border-green-300 dark:border-green-700 rounded-md px-2 text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {formatDate(vehicle.photos_completed_date)}
                            </div>
                          ) : (
                            <button
                              className="flex items-center justify-center h-8 w-full rounded-md px-2 bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-300 hover:text-amber-950 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-800 dark:hover:text-amber-100 transition-colors"
                              onClick={() => handlePhotoStatusChange(vehicle.id, true)}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Pendiente
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-0.5">
                          {typeof days === "number" ? (
                            <Badge variant="outline" className={color}>
                              {days}
                            </Badge>
                          ) : (
                            <Badge variant="outline">-</Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-0.5">
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                              onClick={() => handleDeleteVehicle(vehicle.id, vehicle.license_plate)}
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            {vehicle.photos_completed && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-amber-500 hover:text-amber-600"
                                onClick={() => handleMarkAsError(vehicle.id)}
                                title="Marcar como erróneo"
                              >
                                <AlertOctagon className="h-4 w-4" />
                              </Button>
                            )}
                            {vehicle.error_count > 0 && (
                              <Badge
                                variant="outline"
                                className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {vehicle.error_count}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between px-2 py-4">
            <div className="flex items-center space-x-2">
              <p className="text-sm text-muted-foreground">
                Mostrando {paginatedVehicles.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} a{" "}
                {Math.min(currentPage * itemsPerPage, filteredVehicles.length)} de {filteredVehicles.length} resultados
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Filas por página</p>
                <Select value={`${itemsPerPage}`} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={itemsPerPage} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 15, 20, 30, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                >
                  <span className="sr-only">Ir a la primera página</span>
                  {"<<"}
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <span className="sr-only">Ir a la página anterior</span>
                  {"<"}
                </Button>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                  Página {currentPage} de {totalPages}
                </div>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <span className="sr-only">Ir a la página siguiente</span>
                  {">"}
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <span className="sr-only">Ir a la última página</span>
                  {">>"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
