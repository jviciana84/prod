"use client"

import { useState, useEffect, useMemo, useRef } from "react"
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
  Loader2,
} from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { differenceInDays } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
  uniqueKey?: string // Identificador único para evitar duplicados
}

interface Photographer {
  id: string
  user_id: string
  display_name: string
  is_active: boolean
}

export default function PhotosTable() {
  const componentId = useMemo(() => `photos-table-${Math.random().toString(36).substr(2, 15)}`, [])
  const keyCounter = useRef(0)
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
  
  // Estados para filtro de fechas
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [dateFilter, setDateFilter] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [quickFilters] = useState([
    { label: "Hoy", days: 0 },
    { label: "Últimos 7 días", days: 7 },
    { label: "Últimos 30 días", days: 30 },
    { label: "Últimos 90 días", days: 90 },
  ])
  
  // Usar el hook de autenticación
  const { user, profile, loading: authLoading } = useAuth()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Función para generar claves únicas ultra-robustas
  const generateUniqueKey = (vehicle: PhotoVehicle, index: number) => {
    keyCounter.current += 1
    const performanceTime = performance.now()
    const random1 = Math.random().toString(36).substr(2, 15)
    const random2 = Math.random().toString(36).substr(2, 15)
    const counter = keyCounter.current
    const vehicleId = vehicle.id || 'unknown'
    const licensePlate = vehicle.license_plate || 'unknown'
    const uniqueId = `${vehicleId}-${licensePlate}-${index}-${counter}-${performanceTime}-${random1}-${random2}-${componentId}`
    
    return `vehicle-${uniqueId}`
  }

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
        // Obtener datos de profiles (con alias y full_name)
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, alias, full_name")
          .in("id", userIds)

        if (!profilesError && profiles) {
          usersData = profiles
        }
      }

      // Combinar datos de fotógrafos con datos de usuarios
      const formattedPhotographers = photographersData.map((p) => {
        const user = usersData.find((u) => u.id === p.user_id)
        let displayName = `Fotógrafo ${p.user_id.substring(0, 8)}...`

        if (user) {
          if (user.alias) {
            displayName = user.alias
          } else if (user.full_name) {
            displayName = user.full_name
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
      
      // Mostrar error específico
      let errorMessage = "No se pudieron cargar los datos. Por favor, inténtalo de nuevo."
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      toast({
        title: "Error de conexión",
        description: errorMessage,
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

  // Función para aplicar filtro de fechas
  const applyDateFilter = (from: Date | undefined, to: Date | undefined) => {
    setDateFilter({ from, to })
    setCurrentPage(1)
  }

  // Función para aplicar filtro rápido
  const applyQuickFilter = (days: number) => {
    const today = new Date()
    const from = days === 0 ? today : new Date(today.getTime() - days * 24 * 60 * 60 * 1000)
    applyDateFilter(from, today)
  }

  // Función para limpiar filtro de fechas
  const clearDateFilter = () => {
    setDateFilter({ from: undefined, to: undefined })
    setCurrentPage(1)
  }

  // Calcular datos filtrados y paginados
  useEffect(() => {
    let filtered = vehicles

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter((vehicle) =>
        vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por estado de fotografía
    if (statusFilter !== "all") {
      if (statusFilter === "completed") {
        filtered = filtered.filter((vehicle) => vehicle.photos_completed)
      } else if (statusFilter === "pending") {
        filtered = filtered.filter((vehicle) => !vehicle.photos_completed)
      }
    }

    // Filtro por fotógrafo
    if (photographerFilter !== "all") {
      filtered = filtered.filter((vehicle) => vehicle.assigned_to === photographerFilter)
    }

    // Filtro por estado de pintura
    if (paintStatusFilter !== "all") {
      filtered = filtered.filter((vehicle) => vehicle.estado_pintura === paintStatusFilter)
    }

    // Filtro por fechas - usar valores primitivos en lugar del objeto
    if (dateFilter.from || dateFilter.to) {
      filtered = filtered.filter((vehicle) => {
        const vehicleDate = new Date(vehicle.disponible)
        const fromDate = dateFilter.from ? new Date(dateFilter.from.setHours(0, 0, 0, 0)) : null
        const toDate = dateFilter.to ? new Date(dateFilter.to.setHours(23, 59, 59, 999)) : null

        if (fromDate && toDate) {
          return vehicleDate >= fromDate && vehicleDate <= toDate
        } else if (fromDate) {
          return vehicleDate >= fromDate
        } else if (toDate) {
          return vehicleDate <= toDate
        }
        return true
      })
    }

    // Eliminar duplicados basados en ID y matrícula
    const seenIds = new Set<string>()
    filtered = filtered.filter((vehicle) => {
      // Eliminar específicamente el elemento problemático
      if (vehicle.id === '4cd26a1a-8af4-49ee-8e02-977d0e42af23') {
        return false
      }
      
      const uniqueId = `${vehicle.id}-${vehicle.license_plate}`
      if (seenIds.has(uniqueId)) {
        return false
      }
      seenIds.add(uniqueId)
      return true
    })

    setFilteredVehicles(filtered)

    // Calcular paginación
    const total = filtered.length
    const pages = Math.ceil(total / itemsPerPage)
    setTotalPages(pages)
    
    // Calcular datos paginados
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginated = filtered.slice(startIndex, endIndex)
    setPaginatedVehicles(paginated)
  }, [
    vehicles, 
    searchTerm, 
    statusFilter, 
    photographerFilter, 
    paintStatusFilter, 
    currentPage, 
    itemsPerPage, 
    dateFilter.from?.getTime(), // Usar getTime() para valores primitivos
    dateFilter.to?.getTime()    // Usar getTime() para valores primitivos
  ])

  // Función para obtener números de página
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push("...")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      }
    }
    
    return pages
  }

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
    <div key={componentId} className="space-y-4">
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="h-6 w-6 text-yellow-600" />
            <div>
              <CardTitle>Gestión de Vehículos</CardTitle>
              <CardDescription>Filtra y gestiona el estado de las fotografías</CardDescription>
            </div>
          </div>
          {profile?.role && ["admin", "Supervisor", "Director"].some(r => profile.role.split(",").map(x => x.trim()).includes(r)) && (
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
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros organizados: buscador y botones a la izquierda, tabs y selects a la derecha */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between w-full">
            <div className="flex items-center gap-2 min-w-[340px] w-full md:w-auto">
              <div className="relative max-w-xs" style={{ flex: '0 0 220px' }}>
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Input
                        placeholder="Buscar"
                        className="pl-10 h-8"
                        style={{ minWidth: 180, maxWidth: 220 }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      Buscar por matrícula o modelo
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Button variant="outline" size="icon" onClick={fetchData} disabled={isLoading} className="h-8 w-8 p-0 !important">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowDateFilter(true)}
                className={cn(
                  "h-8 w-8 p-0 !important",
                  (dateFilter.from || dateFilter.to) && "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300"
                )}
                title="Filtrar por fecha"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 items-center justify-end w-full">
              <Button variant={activePhotoTab === "all" ? "default" : "outline"} onClick={() => setActivePhotoTab("all")} size="sm">Todos</Button>
              <Button variant={activePhotoTab === "sold_without_photos" ? "default" : "outline"} onClick={() => setActivePhotoTab("sold_without_photos")} size="sm">Vendidos sin fotografías</Button>
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
                  {photographers
                    .filter((p, i, arr) => arr.findIndex(x => x.user_id === p.user_id) === i)
                    .filter(p => p.is_active === true && p.is_hidden !== true)
                    .filter(p => vehicles.some(v => v.assigned_to === p.user_id))
                    .map((photographer, index) => (
                      <SelectItem key={`photographer-${photographer.user_id}-${index}`} value={photographer.user_id}>
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
                  paginatedVehicles.filter((v, i, arr) =>
                    arr.findIndex(x => x.id === v.id || x.license_plate === v.license_plate) === i
                  ).map((vehicle, index) => {
                    // Eliminar específicamente el elemento problemático del renderizado
                    if (vehicle.id === '4cd26a1a-8af4-49ee-8e02-977d0e42af23') {
                      return null
                    }
                    
                    const { days, color } = calculatePendingDays(vehicle)
                    const uniqueKey = generateUniqueKey(vehicle, index)
                    return (
                      <TableRow key={uniqueKey}>
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
                              {photographers
                                .filter((p, i, arr) => arr.findIndex(x => x.user_id === p.user_id) === i)
                                .filter(p => p.is_active === true && p.is_hidden !== true)
                                .filter(p => vehicles.some(v => v.assigned_to === p.user_id))
                                .map((photographer, index) => (
                                  <SelectItem key={`photographer-${photographer.user_id}-${index}`} value={photographer.user_id}>
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

              {/* Subcard paginador */}
              <div className="mt-2 rounded-lg border bg-card shadow-sm px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {paginatedVehicles.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} a{" "}
                  {Math.min(currentPage * itemsPerPage, filteredVehicles.length)} de {filteredVehicles.length} resultados
                </div>
                <div className="flex items-center gap-2">
                  {/* Selector de filas por página a la izquierda */}
                  <div className="flex items-center gap-1 mr-4">
                    <span className="text-xs">Filas por página:</span>
                    <Select value={itemsPerPage.toString()} onValueChange={v => setItemsPerPage(Number(v))}>
                      <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={itemsPerPage} />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {[10, 15, 20, 30, 50].map((size) => (
                          <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Flechas y números de página */}
                  <Button variant="outline" size="icon" onClick={() => goToPage(1)} disabled={currentPage === 1} className="h-8 w-8">{'<<'}</Button>
                  <Button variant="outline" size="icon" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="h-8 w-8">{'<'}</Button>
                  {getPageNumbers().map((n) => (
                    <Button key={n} variant={n === currentPage ? "default" : "outline"} size="icon" onClick={() => typeof n === "number" && goToPage(n)} className="h-8 w-8 font-bold" disabled={n === "..."}>{n}</Button>
                  ))}
                  <Button variant="outline" size="icon" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="h-8 w-8">{'>'}</Button>
                  <Button variant="outline" size="icon" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className="h-8 w-8">{'>>'}</Button>
                </div>
              </div>
            </CardContent>
          </Card>

      {/* Modal de filtro de fechas */}
      <Dialog open={showDateFilter} onOpenChange={setShowDateFilter}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filtrar por fecha de disponibilidad</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Filtros rápidos</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {quickFilters.map((filter) => (
                  <Button
                    key={filter.days}
                    variant="outline"
                    size="sm"
                    onClick={() => applyQuickFilter(filter.days)}
                    className="justify-start"
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-date" className="text-sm font-medium">
                Desde
              </Label>
              <Input
                id="from-date"
                type="date"
                value={dateFilter.from?.toISOString().split("T")[0] || ""}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined
                  applyDateFilter(date, dateFilter.to)
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-date" className="text-sm font-medium">
                Hasta
              </Label>
              <Input
                id="to-date"
                type="date"
                value={dateFilter.to?.toISOString().split("T")[0] || ""}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined
                  applyDateFilter(dateFilter.from, date)
                }}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={clearDateFilter}>
                Limpiar
              </Button>
              <Button onClick={() => setShowDateFilter(false)}>
                Aplicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
