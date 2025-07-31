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
  Printer,
  FileSpreadsheet,
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
  estado_pintura: "pendiente" | "apto" | "no_apto" | "vendido"
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

  const pendingCount = vehicles.filter((v) => !v.photos_completed && v.estado_pintura !== "vendido").length
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

  // Estado para vehículos vendidos
  const [soldVehicles, setSoldVehicles] = useState<string[]>([])

  // Cargar vehículos vendidos cuando cambie la pestaña
  useEffect(() => {
    if (activePhotoTab === "sold_without_photos") {
      const fetchSoldVehicles = async () => {
        try {
          console.log("🔍 Buscando vehículos vendidos sin fotos...")
          const { data: soldVehiclesData, error } = await supabase
            .from("sales_vehicles")
            .select("license_plate, model, sale_date, advisor, advisor_name")

          if (error) {
            console.error("❌ Error al obtener vehículos vendidos:", error)
            return
          }

          console.log("📊 Vehículos vendidos encontrados:", soldVehiclesData?.length || 0)

          if (soldVehiclesData && soldVehiclesData.length > 0) {
            const soldLicensePlates = soldVehiclesData.map(v => v.license_plate)
            setSoldVehicles(soldLicensePlates)
            console.log("✅ Matrículas de vehículos vendidos cargadas:", soldLicensePlates.length)
          }
        } catch (error) {
          console.error("❌ Error en fetchSoldVehicles:", error)
        }
      }

      fetchSoldVehicles()
    } else {
      setSoldVehicles([])
    }
  }, [activePhotoTab])

  // Calcular datos filtrados y paginados
  useEffect(() => {
    let filtered = vehicles

    // Filtro por activePhotoTab (pestañas principales)
    if (activePhotoTab === "sold_without_photos") {
      // Filtrar vehículos que están en fotos pero marcados como vendidos
      filtered = vehicles.filter(vehicle => 
        soldVehicles.includes(vehicle.license_plate) && 
        vehicle.estado_pintura === 'vendido'
      )
      console.log("✅ Vehículos vendidos sin fotos filtrados:", filtered.length)
    } else {
      // Filtros normales para otras pestañas
      if (activePhotoTab === "pending") {
        // Excluir vehículos vendidos de la pestaña pendientes
        filtered = vehicles.filter((vehicle) => 
          !vehicle.photos_completed && vehicle.estado_pintura !== "vendido"
        )
      } else if (activePhotoTab === "completed") {
        filtered = vehicles.filter((vehicle) => vehicle.photos_completed)
      } else if (activePhotoTab === "errors") {
        filtered = vehicles.filter((vehicle) => vehicle.error_count > 0)
      } else if (activePhotoTab === "paint_apto") {
        filtered = vehicles.filter((vehicle) => vehicle.estado_pintura === "apto")
      } else if (activePhotoTab === "paint_no_apto") {
        filtered = vehicles.filter((vehicle) => vehicle.estado_pintura === "no_apto")
      } else if (activePhotoTab === "paint_pendiente") {
        filtered = vehicles.filter((vehicle) => vehicle.estado_pintura === "pendiente")
      }
    }

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
        filtered = filtered.filter((vehicle) => !vehicle.photos_completed && vehicle.estado_pintura !== "vendido")
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
    dateFilter.to?.getTime(),   // Usar getTime() para valores primitivos
    activePhotoTab, // ✅ Añadir activePhotoTab como dependencia
    soldVehicles // ✅ Añadir soldVehicles como dependencia
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

  // Función para generar CSV
  const generateCSV = (data: PhotoVehicle[]) => {
    // Determinar si mostrar la columna de fecha de fotografía
    const showPhotoDate = data.some(vehicle => vehicle.photos_completed)
    
    const columns = [
      { key: 'license_plate', label: 'Matrícula' },
      { key: 'model', label: 'Modelo' },
      { key: 'disponible', label: 'Fecha Disponible' },
      { key: 'estado_pintura', label: 'Estado Pintura' },
      { key: 'assigned_to', label: 'Asignado' },
      { key: 'photos_completed', label: 'Fotografiado' },
      ...(showPhotoDate ? [{ key: 'photos_completed_date', label: 'Fecha Fotografía' }] : []),
      { key: 'error_count', label: 'Incidencias' },
      { key: 'days_pending', label: 'Días Pendiente' }
    ]

    const header = columns.map(col => col.label).join(',')

    const rows = data.map(vehicle => {
      const getAssignedPhotographerName = (vehicle: PhotoVehicle) => {
        if (!vehicle.assigned_to) return "Sin asignar"
        const photographer = photographers.find(p => p.user_id === vehicle.assigned_to)
        return photographer?.display_name || vehicle.assigned_to
      }

      const calculatePendingDays = (vehicle: PhotoVehicle) => {
        if (vehicle.photos_completed) return 0
        if (vehicle.estado_pintura === "apto" && vehicle.paint_apto_date) {
          return differenceInDays(new Date(), new Date(vehicle.paint_apto_date))
        }
        return differenceInDays(new Date(), new Date(vehicle.disponible))
      }

      return columns.map(col => {
        let value: any = vehicle[col.key as keyof PhotoVehicle]
        
        if (col.key === 'assigned_to') {
          value = getAssignedPhotographerName(vehicle)
        } else if (col.key === 'photos_completed') {
          value = value ? 'Sí' : 'No'
        } else if (col.key === 'photos_completed_date' && value) {
          value = formatDate(value)
        } else if (col.key === 'disponible' && value) {
          value = formatDate(value)
        } else if (col.key === 'error_count') {
          value = value > 0 ? `${value} incidencia${value > 1 ? 's' : ''}` : 'Sin incidencias'
        } else if (col.key === 'days_pending') {
          value = calculatePendingDays(vehicle)
        }
        
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          value = `"${value.replace(/"/g, '""')}"`
        }
        
        return value || ''
      }).join(',')
    })

    return `${header}\n${rows.join('\n')}`
  }

  // Función para generar PDF
  const generatePDF = async (data: PhotoVehicle[]) => {
    try {
      // Determinar si mostrar la columna de fecha de fotografía
      const showPhotoDate = data.some(vehicle => vehicle.photos_completed)
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Reporte de Vehículos - Gestión de Fotos</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .filters { margin-bottom: 20px; font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th, td { border: 1px solid #ddd; padding: 4px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .status-completed { background-color: #d4edda; }
            .status-pending { background-color: #fff3cd; }
            .row-even { background-color: #e8e8e8; }
            .row-odd { background-color: #ffffff; }
            .badge { padding: 2px 6px; border-radius: 3px; font-size: 9px; }
            .badge-green { background-color: #d4edda; color: #155724; }
            .badge-amber { background-color: #fff3cd; color: #856404; }
            .badge-red { background-color: #f8d7da; color: #721c24; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Reporte de Vehículos - Gestión de Fotos</h1>
            <p>Total: ${data.length} vehículos</p>
            <p>Fecha de generación: ${new Date().toLocaleDateString('es-ES')}</p>
          </div>
          
          <div class="filters">
            <strong>Filtros aplicados:</strong><br>
            ${searchTerm ? `Búsqueda: "${searchTerm}"<br>` : ''}
            Estado: ${statusFilter === 'all' ? 'Todos' : statusFilter === 'completed' ? 'Fotografiados' : 'Pendientes'}<br>
            Fotógrafo: ${photographerFilter === 'all' ? 'Todos' : photographerFilter === 'null' ? 'Sin asignar' : photographers.find(p => p.user_id === photographerFilter)?.display_name || photographerFilter}<br>
            Pintura: ${paintStatusFilter === 'all' ? 'Todos' : paintStatusFilter}
          </div>

          <table>
            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Modelo</th>
                <th>Fecha Disponible</th>
                <th>Estado Pintura</th>
                <th>Asignado</th>
                <th>Fotografiado</th>
                ${showPhotoDate ? '<th>Fecha Fotografía</th>' : ''}
                <th>Incidencias</th>
                <th>Días Pendiente</th>
              </tr>
            </thead>
            <tbody>
              ${data.map((vehicle, index) => {
                const getAssignedPhotographerName = (vehicle: PhotoVehicle) => {
                  if (!vehicle.assigned_to) return "Sin asignar"
                  const photographer = photographers.find(p => p.user_id === vehicle.assigned_to)
                  return photographer?.display_name || vehicle.assigned_to
                }

                const calculatePendingDays = (vehicle: PhotoVehicle) => {
                  if (vehicle.photos_completed) return 0
                  if (vehicle.estado_pintura === "apto" && vehicle.paint_apto_date) {
                    return differenceInDays(new Date(), new Date(vehicle.paint_apto_date))
                  }
                  return differenceInDays(new Date(), new Date(vehicle.disponible))
                }

                const pendingDays = calculatePendingDays(vehicle)
                let badgeClass = ''
                if (pendingDays <= 3) {
                  badgeClass = 'badge-green'
                } else if (pendingDays <= 7) {
                  badgeClass = 'badge-amber'
                } else {
                  badgeClass = 'badge-red'
                }

                return `
                <tr class="${index % 2 === 0 ? 'row-even' : 'row-odd'}">
                  <td>${vehicle.license_plate || ''}</td>
                  <td>${vehicle.model || ''}</td>
                  <td>${formatDate(vehicle.disponible)}</td>
                  <td>${vehicle.estado_pintura || 'pendiente'}</td>
                  <td>${getAssignedPhotographerName(vehicle)}</td>
                  <td class="${vehicle.photos_completed ? 'status-completed' : 'status-pending'}">${vehicle.photos_completed ? 'Sí' : 'No'}</td>
                  ${showPhotoDate ? `<td>${vehicle.photos_completed_date ? formatDate(vehicle.photos_completed_date) : ''}</td>` : ''}
                  <td>${vehicle.error_count > 0 ? `<span class="badge badge-red">${vehicle.error_count} incidencia${vehicle.error_count > 1 ? 's' : ''}</span>` : 'Sin incidencias'}</td>
                  <td><span class="badge ${badgeClass}">${pendingDays}</span></td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `

      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)

      const printWindow = window.open(url, '_blank')
      if (printWindow) {
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
        }, 500)
      }

      setTimeout(() => URL.revokeObjectURL(url), 1000)

    } catch (error) {
      console.error('Error generando PDF:', error)
      toast({
        title: "Error",
        description: "Error al generar el PDF",
        variant: "destructive",
      })
    }
  }

  // Función para manejar exportación
  const handleExport = async (type: 'pdf' | 'excel') => {
    if (paginatedVehicles.length === 0) {
      toast({
        title: "Error",
        description: "No hay datos para exportar",
        variant: "destructive",
      })
      return
    }

    try {
      if (type === 'excel') {
        const csv = generateCSV(paginatedVehicles)
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `fotos_vehiculos_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast({
          title: "Éxito",
          description: "Archivo Excel descargado correctamente",
        })
      } else {
        await generatePDF(paginatedVehicles)
        toast({
          title: "Éxito",
          description: "PDF generado correctamente",
        })
      }
    } catch (error) {
      console.error('Error en la exportación:', error)
      toast({
        title: "Error",
        description: "Error al exportar los datos",
        variant: "destructive",
      })
    }
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

  // Función para limpiar cookies corruptas de Supabase
  const clearCorruptedSession = () => {
    try {
      // Limpiar localStorage
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.includes('supabase')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))

      // Limpiar sessionStorage
      const sessionKeysToRemove = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && key.includes('supabase')) {
          sessionKeysToRemove.push(key)
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key))

      console.log("🧹 Cookies corruptas limpiadas")
    } catch (error) {
      console.error("Error limpiando cookies:", error)
    }
  }

  const handleMarkAsError = async (id: string) => {
    try {
      console.log("🔍 [handleMarkAsError] Iniciando proceso para ID:", id)
      
      // 1. Obtener el vehículo
      const { data: vehicle, error: fetchError } = await supabase.from("fotos").select("*").eq("id", id).single()

      if (fetchError) {
        console.error("❌ [handleMarkAsError] Error al obtener vehículo:", fetchError)
        throw fetchError
      }

      console.log("✅ [handleMarkAsError] Vehículo obtenido:", vehicle?.license_plate)

      // 2. Preparar actualización (sin depender de auth.getUser())
      const updates = {
        photos_completed: false,
        photos_completed_date: null,
        error_count: (vehicle.error_count || 0) + 1,
        // No usar last_error_by por ahora para evitar problemas de autenticación
        original_assigned_to: vehicle.original_assigned_to || vehicle.assigned_to,
      }

      console.log("🔧 [handleMarkAsError] Actualización a aplicar:", updates)

      // 3. Ejecutar actualización
      const { data: updateResult, error: updateError } = await supabase
        .from("fotos")
        .update(updates)
        .eq("id", id)
        .select()

      if (updateError) {
        console.error("❌ [handleMarkAsError] Error al actualizar:", updateError)
        throw updateError
      }

      console.log("✅ [handleMarkAsError] Actualización exitosa:", updateResult)

      // 4. Actualizar estado local
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === id
            ? {
                ...v,
                photos_completed: false,
                photos_completed_date: null,
                error_count: (v.error_count || 0) + 1,
                // No actualizar last_error_by en el estado local por ahora
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
      console.error("❌ [handleMarkAsError] Error completo:", error)
      
      let errorMessage = "No se pudo marcar el vehículo como erróneo. Por favor, inténtalo de nuevo."
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as any).message
      }
      
      toast({
        title: "Error",
        description: errorMessage,
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

  const handleSyncPhotosWithSales = async () => {
    if (isLoading) {
      toast({
        title: "Error",
        description: "Ya se está sincronizando. Por favor, espera.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      console.log("🔄 Iniciando sincronización de fotos con ventas...")
      
      // Llamar a la API de sincronización
      const response = await fetch('/api/sync-photos-with-sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        console.log("✅ Sincronización completada:", result)
        toast({
          title: "Sincronización completada",
          description: result.message || `Se han procesado ${result.processed_count} vehículos y eliminado ${result.removed_count} registros de fotos.`,
        })
        
        // Recargar los datos después de la sincronización
        await fetchData()
      } else {
        throw new Error(result.error || 'Error desconocido en la sincronización')
      }
    } catch (error: any) {
      console.error("❌ Error al sincronizar fotos con ventas:", error)
      toast({
        title: "Error de sincronización",
        description: error.message || "No se pudieron sincronizar las fotos con las ventas. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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
          {/* Filtros mejorados y organizados */}
          <div className="space-y-4">
            {/* Primera fila: Pestañas principales y búsqueda */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Pestañas principales */}
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={activePhotoTab === "all" ? "default" : "outline"} 
                  onClick={() => setActivePhotoTab("all")} 
                  size="sm"
                  className="h-9 px-4"
                >
                  Todos
                </Button>
                <Button 
                  variant={activePhotoTab === "pending" ? "default" : "outline"} 
                  onClick={() => setActivePhotoTab("pending")} 
                  size="sm"
                  className="h-9 px-4"
                >
                  Pendientes
                </Button>
                <Button 
                  variant={activePhotoTab === "completed" ? "default" : "outline"} 
                  onClick={() => setActivePhotoTab("completed")} 
                  size="sm"
                  className="h-9 px-4"
                >
                  Completados
                </Button>
                <Button 
                  variant={activePhotoTab === "errors" ? "default" : "outline"} 
                  onClick={() => setActivePhotoTab("errors")} 
                  size="sm"
                  className="h-9 px-4"
                >
                  Errores
                </Button>
                <Button 
                  variant={activePhotoTab === "sold_without_photos" ? "default" : "outline"} 
                  onClick={() => setActivePhotoTab("sold_without_photos")} 
                  size="sm"
                  className="h-9 px-4"
                >
                  Vendidos sin fotos
                </Button>
              </div>

              {/* Búsqueda y acciones */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar matrícula o modelo..."
                    className="pl-10 h-9 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={fetchData} 
                  disabled={isLoading} 
                  className="h-9 w-9"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Segunda fila: Filtros específicos */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              {/* Filtros de estado */}
              <div className="flex flex-wrap gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 h-9">
                    <SelectValue placeholder="Estado de fotografía" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="completed">Fotografiados</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={photographerFilter} onValueChange={setPhotographerFilter}>
                  <SelectTrigger className="w-48 h-9">
                    <SelectValue placeholder="Fotógrafo asignado" />
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
                  <SelectTrigger className="w-48 h-9">
                    <SelectValue placeholder="Estado de pintura" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="apto">Apto</SelectItem>
                    <SelectItem value="no_apto">No apto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDateFilter(true)}
                  className={cn(
                    "h-9 px-3",
                    (dateFilter.from || dateFilter.to) && "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300"
                  )}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Fecha
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('pdf')}
                  className="h-9 px-3"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('excel')}
                  className="h-9 px-3"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncPhotosWithSales}
                  disabled={isLoading}
                  className="h-9 px-3"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Sincronizar
                </Button>
              </div>
            </div>

            {/* Indicador de filtros activos */}
            {(searchTerm || statusFilter !== "all" || photographerFilter !== "all" || paintStatusFilter !== "all" || dateFilter.from || dateFilter.to) && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium text-muted-foreground">Filtros activos:</span>
                <div className="flex flex-wrap gap-2">
                  {searchTerm && (
                    <Badge variant="secondary" className="text-xs">
                      Búsqueda: "{searchTerm}"
                    </Badge>
                  )}
                  {statusFilter !== "all" && (
                    <Badge variant="secondary" className="text-xs">
                      Estado: {statusFilter === "completed" ? "Fotografiados" : "Pendientes"}
                    </Badge>
                  )}
                  {photographerFilter !== "all" && (
                    <Badge variant="secondary" className="text-xs">
                      Fotógrafo: {photographerFilter === "null" ? "Sin asignar" : photographers.find(p => p.user_id === photographerFilter)?.display_name || photographerFilter}
                    </Badge>
                  )}
                  {paintStatusFilter !== "all" && (
                    <Badge variant="secondary" className="text-xs">
                      Pintura: {paintStatusFilter}
                    </Badge>
                  )}
                  {(dateFilter.from || dateFilter.to) && (
                    <Badge variant="secondary" className="text-xs">
                      Fecha: {dateFilter.from?.toLocaleDateString()} - {dateFilter.to?.toLocaleDateString() || "Hoy"}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("all")
                      setPhotographerFilter("all")
                      setpaintStatusFilter("all")
                      setDateFilter({ from: undefined, to: undefined })
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    Limpiar todos
                  </Button>
                </div>
              </div>
            )}
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

      {/* Modal de filtro de fechas mejorado */}
      <Dialog open={showDateFilter} onOpenChange={setShowDateFilter}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Filtrar por fecha de disponibilidad
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Filtros rápidos */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Filtros rápidos</Label>
              <div className="grid grid-cols-2 gap-3">
                {quickFilters.map((filter) => (
                  <Button
                    key={filter.days}
                    variant="outline"
                    size="sm"
                    onClick={() => applyQuickFilter(filter.days)}
                    className="justify-start h-10"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Separador */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">O selecciona un rango personalizado</span>
              </div>
            </div>

            {/* Fechas personalizadas */}
            <div className="grid grid-cols-2 gap-4">
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
                  className="h-10"
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
                  className="h-10"
                />
              </div>
            </div>

            {/* Indicador de filtro activo */}
            {(dateFilter.from || dateFilter.to) && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-700 dark:text-blue-300">
                    Filtro activo: {dateFilter.from?.toLocaleDateString()} - {dateFilter.to?.toLocaleDateString() || "Hoy"}
                  </span>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={clearDateFilter}
                className="h-10 px-4"
              >
                Limpiar filtro
              </Button>
              <Button 
                onClick={() => setShowDateFilter(false)}
                className="h-10 px-6"
              >
                Aplicar filtro
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
