"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  RefreshCw,
  Loader2,
  Car,
  Bike,
  Check,
  CameraIcon as Camera360,
  Wrench,
  FileCheck,
  Calendar,
  Save,
  Clock,
  Eye,
  EyeOff,
  FileEdit,
  Building,
  CreditCard,
  Banknote,
  Trash2,
  AlertTriangle,
  ChevronsUpDown,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { differenceInDays, addDays, format } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { canUserEditClient, canUserEditPaymentMethods } from "@/lib/auth/permissions-client"

// Importar la función de servidor para sincronizar vehículos validados
import { syncValidatedVehicle } from "@/server-actions/validation-actions"

// Importar el componente PdfDataDialog
import { PdfDataDialog } from "./pdf-data-dialog"
import { PrintExportButton } from "./print-export-button"


// Importar las nuevas utilidades al inicio:
import { formatDateForDisplay } from "@/lib/date-utils"
import "@/styles/sales-table.css"

// Tipos para los estados de pago
const PAYMENT_STATUSES = [
  { value: "pendiente", label: "Pendiente", color: "bg-yellow-500" },
  { value: "en_estudio", label: "En estudio", color: "bg-blue-500" },
  { value: "aprobada", label: "Aprobada", color: "bg-purple-500" },
  { value: "pagado", label: "Pagado", color: "bg-green-500" },
]

// Tipos para los centros de pre-entrega
const DELIVERY_CENTERS = [
  { value: "Terrassa", label: "Terrassa" },
  { value: "Sabadell", label: "Sabadell" },
  { value: "Vilanova", label: "Vilanova" },
  { value: "Sant Fruitos", label: "Sant Fruitos" },
  { value: "Externo", label: "Externo" },
]

// Estados para CyP y 360º
const PROCESS_STATUSES = [
  {
    value: "pendiente",
    label: "Pendiente",
    color:
      "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-300 hover:text-amber-950 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-800 dark:hover:text-amber-100",
  },
  {
    value: "en_proceso",
    label: "En proceso",
    color:
      "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-300 hover:text-blue-950 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-800 dark:hover:text-blue-100",
  },
  { value: "completado", label: "Completado", color: "border-green-300 dark:border-green-700 text-green-600" },
]

// Función para obtener el color de la prioridad
function getPriorityColor(priorityValue: number): string {
  if (priorityValue >= 1200) return "bg-red-600 dark:bg-red-500" // Validados con alta prioridad
  if (priorityValue >= 1100) return "bg-red-500 dark:bg-red-400" // Validados con prioridad alta
  if (priorityValue >= 1000) return "bg-orange-500 dark:bg-orange-400" // Validados base
  if (priorityValue >= 200) return "bg-amber-500 dark:bg-amber-400" // No validados muy antiguos
  if (priorityValue >= 100) return "bg-yellow-500 dark:bg-yellow-400" // No validados antiguos
  if (priorityValue >= 50) return "bg-yellow-400 dark:bg-yellow-300" // No validados medianos
  return "bg-gray-300 dark:bg-gray-600" // No validados recientes
}

// Función para calcular el tamaño del ping según la prioridad
function getPrioritySize(priorityValue: number): string {
  if (priorityValue >= 1000) return "h-4 w-4" // Validados (más grande)
  if (priorityValue >= 200) return "h-3.5 w-3.5" // No validados muy antiguos
  if (priorityValue >= 100) return "h-3 w-3" // No validados antiguos
  if (priorityValue >= 50) return "h-2.5 w-2.5" // No validados medianos
  return "h-2 w-2" // No validados recientes (más pequeño)
}

// Tipo para los vehículos vendidos
export type SoldVehicle = {
  id: string
  license_plate: string
  model: string
  vehicle_type?: string
  sale_date: string
  advisor: string // Ahora contiene el alias
  advisor_name?: string // Nombre completo del asesor
  advisor_id?: string // ID del asesor
  or_value?: string
  expense_charge?: string
  payment_method: string
  payment_status: string
  document_type?: string // Tipo de documento (DNI, NIE, CIF)
  cyp_status?: string
  cyp_date?: string
  photo_360_status?: string
  photo_360_date?: string
  validated?: boolean
  validation_date?: string
  appraised?: boolean
  appraisal_date?: string
  delivery_center?: string
  external_provider?: string
  price?: number
  created_at: string
  updated_at: string
  priority?: number // Cambiado de string a number
  order?: number // Nueva propiedad para el orden
  // Nuevos campos para datos del PDF
  pdf_extraction_id?: string
  client_name?: string
  client_email?: string
  client_phone?: string
  client_address?: string
  client_city?: string
  client_province?: string
  client_postal_code?: string
  document_id?: string
  vin?: string
  order_number?: string
  order_date?: string
  bank?: string // Nueva columna
  discount?: string
  portal_origin?: string
  is_resale?: boolean
  brand?: string // Nueva columna
  dealership_code?: string // Nueva columna
  client_dni?: string // Nueva columna
  pdf_extracted_data?: any // Add this to the type
}

// Tipo para las pestañas de tipo de vehículo
type VehicleTab = "car" | "motorcycle" | "not_validated" | "all" | "finished"

type SalesTableProps = {
  onRefreshRequest?: () => void
  onRefresh?: () => void // Definir como opcional
}

export default function SalesTable({ onRefreshRequest }: SalesTableProps) {
  const [vehicles, setVehicles] = useState<SoldVehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<SoldVehicle[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [externalProvider, setExternalProvider] = useState<string>("")
  const [showExternalInput, setShowExternalInput] = useState<string | null>(null)
  const externalInputRef = useRef<HTMLInputElement>(null)
  const [editingOR, setEditingOR] = useState<string | null>(null)
  // Añadir después de const [editingOR, setEditingOR] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null)
  const [editingValue, setEditingValue] = useState<string>("")
  const editCellInputRef = useRef<HTMLInputElement>(null)
  
  // Estados para el selector de tipos de gastos
  const [expenseTypes, setExpenseTypes] = useState<any[]>([])
  const [expensePopoverOpen, setExpensePopoverOpen] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [canEditPaymentMethods, setCanEditPaymentMethods] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteVehicleId, setDeleteVehicleId] = useState<string | null>(null)
  const [deleteObservations, setDeleteObservations] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  

  const [isAdmin, setIsAdmin] = useState(false)
  const [orValues, setOrValues] = useState<Record<string, string>>({})
  const orInputRef = useRef<HTMLInputElement>(null)
  const [hiddenColumns, setHiddenColumns] = useState({
    price: true,
    saleDate: true,
    paymentMethod: true,
    documentType: true,
    brand: true, // Nueva columna oculta por defecto
    dealershipCode: true, // Nueva columna oculta por defecto
    bank: true, // Nueva columna oculta por defecto
    clientDni: true, // Nueva columna oculta por defecto
  })

  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState<VehicleTab>("car")

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // Contadores para las pestañas
  const [counts, setCounts] = useState({
    all: 0,
    car: 0,
    motorcycle: 0,
    not_validated: 0,
    finished: 0,
    failed: 0,
  })

  const supabase = createClientComponentClient()

  // Verificar si el usuario es administrador
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) return

        const { data: userRoles } = await supabase.from("user_roles").select("role_id").eq("user_id", session.user.id)

        // Role ID 1 es administrador
        const admin = userRoles?.some((role) => role.role_id === 1)
        setIsAdmin(admin || false)
      } catch (error) {
        console.error("Error verificando rol de administrador:", error)
      }
    }

    checkAdminStatus()
  }, [])

  // Estado para el criterio de ordenación
  const [sortOrder, setSortOrder] = useState<"priority" | "validation_date">("validation_date")

  // Función para calcular la prioridad automáticamente basada en puntos
  const calculatePriority = useMemo(() => (vehicle: SoldVehicle): number => {
    let totalPoints = 0

    // Si no está validado, prioridad mínima (solo puntos por fecha de venta)
    if (!vehicle.validated) {
      // Puntos por fecha de venta (más antiguo = más puntos)
      if (vehicle.sale_date) {
        const saleDate = new Date(vehicle.sale_date)
        const now = new Date()
        const daysSinceSale = Math.floor((now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24))
        totalPoints += Math.min(daysSinceSale * 2, 100) // Máximo 100 puntos por antigüedad
      }
      return totalPoints
    }

    // Vehículos validados: puntos base + antigüedad + estado de pago
    totalPoints += 1000 // Base para validados (siempre más que no validados)

    // Puntos por fecha de validación (más antiguo = más puntos)
    if (vehicle.validation_date) {
      const validationDate = new Date(vehicle.validation_date)
      const now = new Date()
      const daysSinceValidation = Math.floor((now.getTime() - validationDate.getTime()) / (1000 * 60 * 60 * 24))
      totalPoints += Math.min(daysSinceValidation * 5, 200) // Máximo 200 puntos por antigüedad de validación
    }

    // Puntos por fecha de venta (más antiguo = más puntos)
    if (vehicle.sale_date) {
      const saleDate = new Date(vehicle.sale_date)
      const now = new Date()
      const daysSinceSale = Math.floor((now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24))
      totalPoints += Math.min(daysSinceSale * 3, 150) // Máximo 150 puntos por antigüedad de venta
    }

    // Puntos por estado de pago
    if (vehicle.payment_status === "pagado") {
      if (vehicle.payment_method?.toLowerCase().includes("financ")) {
        totalPoints += 100 // Financiado pagado
      } else {
        totalPoints += 80 // Contado pagado
      }
    } else if (vehicle.payment_status === "aprobada") {
      totalPoints += 60 // Aprobado
    } else if (vehicle.payment_status === "en_estudio") {
      totalPoints += 40 // En estudio
    } else if (vehicle.payment_method?.toLowerCase().includes("financ")) {
      totalPoints += 30 // Financiado
    } else {
      totalPoints += 20 // Contado
    }

    return totalPoints
  }, [])

  // Función para ordenar los vehículos
  const sortVehicles = useMemo(() => (vehiclesToSort: SoldVehicle[]): SoldVehicle[] => {
    return [...vehiclesToSort].sort((a, b) => {
      // Si ambos vehículos están en proceso, ordenar por prioridad
      const aInProcess = a.cyp_status === "en_proceso" || a.photo_360_status === "en_proceso"
      const bInProcess = b.cyp_status === "en_proceso" || b.photo_360_status === "en_proceso"

      if (aInProcess && bInProcess) {
        // Si ambos están en proceso, ordenar por prioridad (puntos)
        return (b.priority || 0) - (a.priority || 0)
      } else if (aInProcess) {
        // Si solo A está en proceso, darle prioridad
        return -1
      } else if (bInProcess) {
        // Si solo B está en proceso, darle prioridad
        return 1
      }

      // Ordenar por prioridad (puntos) - mayor prioridad primero
      if ((a.priority || 0) !== (b.priority || 0)) {
        return (b.priority || 0) - (a.priority || 0)
      }

      // Si las prioridades son iguales, ordenar por validación (validados primero)
      if (a.validated !== b.validated) {
        return a.validated ? -1 : 1
      }

      // Si ambos están validados y tienen la misma prioridad, ordenar por fecha de validación
      if (a.validated && b.validated) {
        const dateA = a.validation_date ? new Date(a.validation_date).getTime() : Number.POSITIVE_INFINITY
        const dateB = b.validation_date ? new Date(b.validation_date).getTime() : Number.POSITIVE_INFINITY
        return dateA - dateB // Orden ascendente por fecha de validación (más antigua primero)
      }

      // Si llegamos aquí, ambos no están validados, ordenar por fecha de venta
      const saleDateA = a.sale_date ? new Date(a.sale_date).getTime() : 0
      const saleDateB = b.sale_date ? new Date(b.sale_date).getTime() : 0
      return saleDateA - saleDateB // Orden ascendente por fecha de venta (más antigua primero)
    })
  }, [])

  // Cargar los vehículos vendidos
  const loadSoldVehicles = async () => {
    setLoading(true)
    try {
      // Obtenemos los vehículos vendidos
      const { data: salesData, error: salesError } = await supabase.from("sales_vehicles").select("*")

      if (salesError) {
        console.error("Error al cargar vehículos vendidos:", salesError)
        toast.error("Error al cargar los datos")
        setLoading(false)
        return
      }

      if (!salesData || salesData.length === 0) {
        setVehicles([])
        setFilteredVehicles([])
        setCounts({ all: 0, car: 0, motorcycle: 0, not_validated: 0, finished: 0, failed: 0 })
        setLoading(false)
        return
      }

      // Calcular prioridades para cada vehículo
      const vehiclesWithPriority = salesData.map((vehicle) => ({
        ...vehicle,
        priority: calculatePriority(vehicle),
      }))

      // Ordenar los vehículos respetando los que están en proceso
      const sortedVehicles = sortVehicles(vehiclesWithPriority)

      setVehicles(sortedVehicles)

      // Calcular contadores para las pestañas
      const allCount = sortedVehicles.length
      const pendingVehicles = sortedVehicles.filter(
        (v) => !(v.cyp_status === "completado" && v.photo_360_status === "completado"),
      )
      const carCount = pendingVehicles.filter((v) => v.vehicle_type !== "Moto").length
      const motorcycleCount = pendingVehicles.filter((v) => v.vehicle_type === "Moto").length
      const notValidatedCount = sortedVehicles.filter((v) => !v.validated).length
      const finishedCount = sortedVehicles.filter(
        (v) => v.cyp_status === "completado" && v.photo_360_status === "completado",
      ).length

      setCounts({
        all: allCount,
        car: carCount,
        motorcycle: motorcycleCount,
        not_validated: notValidatedCount,
        finished: finishedCount,
        failed: 0, // Se calculará desde pedidos_validados
      })

      // Inicializar valores OR
      const initialORValues: Record<string, string> = {}
      sortedVehicles.forEach((item) => {
        initialORValues[item.id] = item.or_value || "ORT"
      })
      setOrValues(initialORValues)
    } catch (err) {
      console.error("Error en la consulta:", err)
      toast.error("Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  // Verificar permisos de edición
  useEffect(() => {
    const checkEditPermissions = async () => {
      try {
        const hasEditPermission = await canUserEditClient()
        const hasPaymentMethodPermission = await canUserEditPaymentMethods()
        setCanEdit(hasEditPermission)
        setCanEditPaymentMethods(hasPaymentMethodPermission)
      } catch (error) {
        console.error("❌ [SalesTable] Error verificando permisos de edición:", error)
        setCanEdit(false)
        setCanEditPaymentMethods(false)
      }
    }
    
    checkEditPermissions()
  }, [])

  // Cargar datos al montar el componente
  useEffect(() => {
    loadSoldVehicles()
    
    // Cargar tipos de gastos
    const fetchExpenseTypes = async () => {
      console.log("Cargando tipos de gastos...")
      try {
        const { data, error } = await supabase
          .from("expense_types")
          .select("id, name, description")
          .eq("is_active", true)
          .order("name")
        
        if (error) {
          console.error("Error cargando tipos de gastos:", error)
          toast.error("Error cargando tipos de gastos")
        } else {
          setExpenseTypes(data || [])
        }
      } catch (err) {
        console.error("Error en fetchExpenseTypes:", err)
      }
    }
    fetchExpenseTypes()
  }, []) // Removed dependencies to prevent constant re-execution

  // Focus en el buscador cuando se carga la página
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  // Función para actualizar manualmente
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadSoldVehicles()
    setRefreshing(false)

    // Notificar que se ha realizado una actualización
    if (onRefreshRequest) {
      onRefreshRequest()
    }
    
    // Llamar a la función onRefresh si está disponible
    if (typeof onRefresh === 'function') {
      onRefresh()
    }
  }



  // Filtrar vehículos según la búsqueda y la pestaña activa
  useEffect(() => {
    let filtered = [...vehicles]

    // Aplicar filtro por tipo de vehículo según la pestaña
    if (activeTab === "car") {
      filtered = filtered.filter(
        (vehicle) =>
          vehicle.vehicle_type !== "Moto" &&
          !(vehicle.cyp_status === "completado" && vehicle.photo_360_status === "completado"),
      )
    } else if (activeTab === "motorcycle") {
      filtered = filtered.filter(
        (vehicle) =>
          vehicle.vehicle_type === "Moto" &&
          !(vehicle.cyp_status === "completado" && vehicle.photo_360_status === "completado"),
      )
    } else if (activeTab === "not_validated") {
      filtered = filtered.filter((vehicle) => !vehicle.validated)
    } else if (activeTab === "finished") {
      filtered = filtered.filter(
        (vehicle) => vehicle.cyp_status === "completado" && vehicle.photo_360_status === "completado",
      )
    } else if (activeTab === "failed") {
      // Para ventas caídas, no mostrar nada en esta tabla ya que se eliminan
      filtered = []
    }

    // Aplicar filtro de búsqueda
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (vehicle) =>
          vehicle.license_plate?.toLowerCase().includes(query) ||
          vehicle.model?.toLowerCase().includes(query) ||
          vehicle.advisor?.toLowerCase().includes(query) ||
          vehicle.advisor_name?.toLowerCase().includes(query) ||
          vehicle.delivery_center?.toLowerCase().includes(query) ||
          vehicle.document_type?.toLowerCase().includes(query) || // Buscar también por tipo de documento
          vehicle.brand?.toLowerCase().includes(query) || // Buscar por marca
          vehicle.dealership_code?.toLowerCase().includes(query) || // Buscar por concesionario
          vehicle.bank?.toLowerCase().includes(query) || // Buscar por banco
          vehicle.client_dni?.toLowerCase().includes(query) || // Buscar por Nº DOC
          (orValues[vehicle.id] && orValues[vehicle.id].toLowerCase().includes(query)),
      )
    }

    // Ordenar los vehículos filtrados
    const sortedFiltered = sortVehicles(filtered)
    setFilteredVehicles(sortedFiltered)

    // Resetear a la primera página cuando cambia el filtro
    setCurrentPage(1)
  }, [searchQuery, vehicles, orValues, activeTab]) // Removed sortVehicles dependency

  // Calcular los vehículos a mostrar según la página y el filtro de fechas
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [dateFilter, setDateFilter] = useState<{ startDate: Date | null; endDate: Date | null }>({ startDate: null, endDate: null })
  
  // Memoizar el filtrado por fecha
  const filteredByDate = useMemo(() => {
    return filteredVehicles.filter((vehicle) => {
      if (!dateFilter.startDate && !dateFilter.endDate) return true
      const saleDate = vehicle.sale_date ? new Date(vehicle.sale_date) : null
      if (!saleDate) return false
      if (dateFilter.startDate && saleDate < dateFilter.startDate) return false
      if (dateFilter.endDate && saleDate > dateFilter.endDate) return false
      return true
    })
  }, [filteredVehicles, dateFilter.startDate, dateFilter.endDate])
  
  const totalRows = filteredByDate.length
  const totalPages = Math.max(1, Math.ceil(totalRows / itemsPerPage))
  
  // Memoizar la paginación
  const paginatedRows = useMemo(() => {
    return filteredByDate.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  }, [filteredByDate, currentPage, itemsPerPage])
  
  // Memoizar el conteo de columnas visibles
  const visibleColumnCount = useMemo(() => {
    return (
      1 + // Priority
      1 + // License Plate
      1 + // Model
      (!Object.values(hiddenColumns).some(hidden => hidden) ? 1 : 0) + // Client (solo cuando las columnas están visibles)
      (hiddenColumns.brand ? 0 : 1) + // Brand
      1 + // Type
      (hiddenColumns.dealershipCode ? 0 : 1) + // Dealership
      (hiddenColumns.price ? 0 : 1) + // Price
      (hiddenColumns.saleDate ? 0 : 1) + // Sale Date
      1 + // Advisor
      1 + // Days
      1 + // OR
      1 + // Expense Charge
      (hiddenColumns.paymentMethod ? 0 : 1) + // Payment Method
      (hiddenColumns.bank ? 0 : 1) + // Bank
      1 + // Payment Status
      (hiddenColumns.documentType ? 0 : 1) + // Document Type
      (hiddenColumns.clientDni ? 0 : 1) + // Client DNI
      1 + // CyP
      1 + // 360º
      1 + // Validated
      1 + // Peritado/PDF/Acciones
      1 // Pre-entrega
    )
  }, [hiddenColumns])

  // Función para obtener los números de página a mostrar
  const getPageNumbers = () => {
    const maxPagesToShow = 5
    let start = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
    let end = start + maxPagesToShow - 1
    if (end > totalPages) {
      end = totalPages
      start = Math.max(1, end - maxPagesToShow + 1)
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  // Resetear página si cambia el filtro o el tamaño
  useEffect(() => { 
    setCurrentPage(1) 
  }, [itemsPerPage, filteredByDate.length]) // Use length instead of full array

  // Función para cambiar de página
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // Función para actualizar el estado de pago
  async function updatePaymentStatus(id: string, status: string) {
    setSelectedRowId(id)
    setUpdatingId(id)
    try {
      // Encontrar el vehículo actual
      const currentVehicle = vehicles.find((v) => v.id === id)
      if (!currentVehicle) {
        throw new Error("Vehículo no encontrado")
      }

      // Actualizar el estado de pago en la base de datos (sin incluir priority)
      const { error } = await supabase
        .from("sales_vehicles")
        .update({
          payment_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) {
        console.error("Error al actualizar estado de pago:", error)
        toast.error("Error al actualizar el estado de pago")
      } else {
        // Actualizar el estado local, incluyendo la prioridad calculada
        const updatedVehicle = { ...currentVehicle, payment_status: status }
        const newPriority = calculatePriority(updatedVehicle)

        setVehicles(
          vehicles.map((v) =>
            v.id === id
              ? { ...v, payment_status: status, priority: newPriority, updated_at: new Date().toISOString() }
              : v,
          ),
        )
        const updatedFilteredVehicles = filteredVehicles.map((v) =>
          v.id === id
            ? { ...v, payment_status: status, priority: newPriority, updated_at: new Date().toISOString() }
            : v,
        )
        // Reordenar después de actualizar la prioridad
        setFilteredVehicles(sortVehicles(updatedFilteredVehicles))
        toast.success("Estado de pago actualizado")
      }
    } catch (err) {
      console.error("Error en la actualización:", err)
      toast.error("Error al actualizar el estado de pago")
    } finally {
      setUpdatingId(null)
    }
  }

  // Función para actualizar el estado de CyP
  async function updateCypStatus(id: string, currentStatus?: string) {
    setSelectedRowId(id)
    setUpdatingId(id)
    let newStatus: string

    // Determinar el siguiente estado en la secuencia
    if (currentStatus === "pendiente") {
      newStatus = "en_proceso"
    } else if (currentStatus === "en_proceso") {
      newStatus = "completado"
    } else if (currentStatus === "completado") {
      newStatus = "pendiente" // Valor por defecto
    } else {
      newStatus = "pendiente" // Valor por defecto
    }

    const now = new Date().toISOString()

    try {
      // Encontrar el vehículo actual
      const currentVehicle = vehicles.find((v) => v.id === id)
      if (!currentVehicle) {
        throw new Error("Vehículo no encontrado")
      }

      // Actualizar el estado de CyP en la base de datos (sin incluir priority)
      const updateData: any = {
        cyp_status: newStatus,
        cyp_date: newStatus === "completado" ? now : null,
        updated_at: now,
      }

      const { error } = await supabase.from("sales_vehicles").update(updateData).eq("id", id)

      if (error) {
        console.error("Error al actualizar estado CyP:", error)
        toast.error("Error al actualizar el estado CyP")
      } else {
        // Actualizar el estado local, incluyendo la prioridad calculada
        const updatedVehicle = {
          ...currentVehicle,
          cyp_status: newStatus,
          cyp_date: newStatus === "completado" ? now : null,
        }

        // Recalcular la prioridad solo si el estado cambia de "en_proceso" a otro estado
        let newPriority = currentVehicle.priority
        if (currentStatus === "en_proceso" && newStatus !== "en_proceso") {
          newPriority = calculatePriority(updatedVehicle)
        }

        setVehicles(
          vehicles.map((v) => {
            if (v.id === id) {
              const updated = {
                ...v,
                cyp_status: newStatus,
                cyp_date: newStatus === "completado" ? now : null,
                updated_at: now,
              }

              if (newPriority !== v.priority) {
                updated.priority = newPriority
              }

              return updated
            }
            return v
          }),
        )

        const updatedFilteredVehicles = filteredVehicles.map((v) => {
          if (v.id === id) {
            const updated = {
              ...v,
              cyp_status: newStatus,
              cyp_date: newStatus === "completado" ? now : null,
              updated_at: now,
            }

            if (newPriority !== v.priority) {
              updated.priority = newPriority
            }

            return updated
          }
          return v
        })
        // Reordenar después de actualizar el estado
        setFilteredVehicles(sortVehicles(updatedFilteredVehicles))

        const statusMessages = {
          pendiente: "CyP pendiente",
          en_proceso: "CyP en proceso",
          completado: "CyP completado",
        }

        toast.success(statusMessages[newStatus] || "Estado CyP actualizado")
      }
    } catch (err) {
      console.error("Error en la actualización:", err)
      toast.error("Error al actualizar el estado CyP")
    } finally {
      setUpdatingId(null)
    }
  }

  // Función para actualizar el estado de 360º
  async function update360Status(id: string, currentStatus?: string) {
    setSelectedRowId(id)
    setUpdatingId(id)
    let newStatus: string

    // Determinar el siguiente estado en la secuencia
    if (currentStatus === "pendiente") {
      newStatus = "en_proceso"
    } else if (currentStatus === "en_proceso") {
      newStatus = "completado"
    } else if (currentStatus === "completado") {
      newStatus = "pendiente" // Valor por defecto
    } else {
      newStatus = "pendiente" // Valor por defecto
    }

    const now = new Date().toISOString()

    try {
      // Encontrar el vehículo actual
      const currentVehicle = vehicles.find((v) => v.id === id)
      if (!currentVehicle) {
        throw new Error("Vehículo no encontrado")
      }

      // Actualizar el estado de 360º en la base de datos (sin incluir priority)
      const updateData: any = {
        photo_360_status: newStatus,
        photo_360_date: newStatus === "completado" ? now : null,
        updated_at: now,
      }

      const { error } = await supabase.from("sales_vehicles").update(updateData).eq("id", id)

      if (error) {
        console.error("Error al actualizar estado 360º:", error)
        toast.error("Error al actualizar el estado 360º")
      } else {
        // Actualizar el estado local, incluyendo la prioridad calculada
        const updatedVehicle = {
          ...currentVehicle,
          photo_360_status: newStatus,
          photo_360_date: newStatus === "completado" ? now : null,
        }

        // Recalcular la prioridad solo si el estado cambia de "en_proceso" a otro estado
        let newPriority = currentVehicle.priority
        if (currentStatus === "en_proceso" && newStatus !== "en_proceso") {
          newPriority = calculatePriority(updatedVehicle)
        }

        setVehicles(
          vehicles.map((v) => {
            if (v.id === id) {
              const updated = {
                ...v,
                photo_360_status: newStatus,
                photo_360_date: newStatus === "completado" ? now : null,
                updated_at: now,
              }

              if (newPriority !== v.priority) {
                updated.priority = newPriority
              }

              return updated
            }
            return v
          }),
        )

        const updatedFilteredVehicles = filteredVehicles.map((v) => {
          if (v.id === id) {
            const updated = {
              ...v,
              photo_360_status: newStatus,
              photo_360_date: newStatus === "completado" ? now : null,
              updated_at: now,
            }

            if (newPriority !== v.priority) {
              updated.priority = newPriority
            }

            return updated
          }
          return v
        })
        // Reordenar después de actualizar el estado
        setFilteredVehicles(sortVehicles(updatedFilteredVehicles))

        const statusMessages = {
          pendiente: "Fotografías 360º pendientes",
                  en_proceso: "Fotografías 360º en proceso",
        completado: "Fotografías 360º completadas",
        }

        toast.success(statusMessages[newStatus] || "Estado 360º actualizado")
      }
    } catch (err) {
      console.error("Error en la actualización:", err)
      toast.error("Error al actualizar el estado 360º")
    } finally {
      setUpdatingId(null)
    }
  }

  // Función para validar un vehículo
  async function toggleValidation(id: string, currentValidated?: boolean) {
    setSelectedRowId(id)
    setUpdatingId(id)
    const now = new Date().toISOString()

    try {
      // Encontrar el vehículo actual
      const currentVehicle = vehicles.find((v) => v.id === id)
      if (!currentVehicle) {
        throw new Error("Vehículo no encontrado")
      }

      // Actualizar el estado de validación en la base de datos (sin incluir priority)
      const { error } = await supabase
        .from("sales_vehicles")
        .update({
          validated: !currentValidated,
          validation_date: !currentValidated ? now : null,
          updated_at: now,
        })
        .eq("id", id)

      if (error) {
        console.error("Error al actualizar validación:", error)
        toast.error("Error al actualizar la validación")
      } else {
        // Sincronizar con la tabla pedidos_validados
        const syncResult = await syncValidatedVehicle(id, !currentValidated, !currentValidated ? now : null)

        if (!syncResult.success) {
          console.error("Error al sincronizar con pedidos_validados:", syncResult.message)
          toast.error("Error al sincronizar con pedidos validados")
        }

        // Actualizar el estado local, incluyendo la prioridad calculada
        const updatedVehicle = {
          ...currentVehicle,
          validated: !currentValidated,
          validation_date: !currentValidated ? now : null,
        }

        const newPriority = calculatePriority(updatedVehicle)

        setVehicles(
          vehicles.map((v) =>
            v.id === id
              ? {
                  ...v,
                  validated: !currentValidated,
                  validation_date: !currentValidated ? now : null,
                  priority: newPriority,
                  updated_at: now,
                }
              : v,
          ),
        )
        const updatedFilteredVehicles = filteredVehicles.map((v) =>
          v.id === id
            ? {
                ...v,
                validated: !currentValidated,
                validation_date: !currentValidated ? now : null,
                priority: newPriority,
                updated_at: now,
              }
            : v,
        )
        // Reordenar después de actualizar la validación
        setFilteredVehicles(sortVehicles(updatedFilteredVehicles))
        toast.success(`Vehículo ${!currentValidated ? "validado" : "pendiente de validación"}`)
      }
    } catch (err) {
      console.error("Error en la actualización:", err)
      toast.error("Error al actualizar la validación")
    } finally {
      setUpdatingId(null)
    }
  }

  // Función para actualizar el centro de pre-entrega
  async function updateDeliveryCenter(id: string, center: string) {
    setSelectedRowId(id)
    setUpdatingId(id)

    try {
      const updateData: any = {
        delivery_center: center,
        updated_at: new Date().toISOString(),
      }

      // Si no es "Externo", limpiamos el proveedor externo
      if (center !== "Externo") {
        updateData.external_provider = null
      }

      const { error } = await supabase.from("sales_vehicles").update(updateData).eq("id", id)

      if (error) {
        console.error("Error al actualizar centro de pre-entrega:", error)
        toast.error("Error al actualizar el centro de pre-entrega")
      } else {
        // Actualizar el estado local
        const updatedVehicles = vehicles.map((v) => {
          if (v.id === id) {
            const updated = {
              ...v,
              delivery_center: center,
              updated_at: new Date().toISOString(),
            }
            if (center !== "Externo") {
              updated.external_provider = null
            }
            return updated
          }
          return v
        })

        setVehicles(updatedVehicles)
        setFilteredVehicles(
          filteredVehicles.map((v) => {
            if (v.id === id) {
              const updated = {
                ...v,
                delivery_center: center,
                updated_at: new Date().toISOString(),
              }
              if (center !== "Externo") {
                updated.external_provider = null
              }
              return updated
            }
            return v
          }),
        )

        // Si es "Externo", mostrar el input para el proveedor
        if (center === "Externo") {
          setShowExternalInput(id)
          setExternalProvider("")
          setTimeout(() => {
            externalInputRef.current?.focus()
          }, 100)
        } else {
          setShowExternalInput(null)
        }

        toast.success("Centro de pre-entrega actualizado")
      }
    } catch (err) {
      console.error("Error en la actualización:", err)
      toast.error("Error al actualizar el centro de pre-entrega")
    } finally {
      setUpdatingId(null)
    }
  }

  // Función para guardar el proveedor externo
  async function saveExternalProvider(id: string) {
    if (!externalProvider.trim()) {
      toast.error("Debe ingresar un nombre de proveedor")
      return
    }

    setSelectedRowId(id)
    setUpdatingId(id)

    try {
      const { error } = await supabase
        .from("sales_vehicles")
        .update({
          external_provider: externalProvider,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) {
        console.error("Error al guardar proveedor externo:", error)
        throw new Error(error.message)
      }

      // Actualizar la UI
      setVehicles((prevVehicles) =>
        prevVehicles.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              external_provider: externalProvider,
              updated_at: new Date().toISOString(),
            }
          }
          return item
        }),
      )

      setFilteredVehicles((prevVehicles) =>
        prevVehicles.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              external_provider: externalProvider,
              updated_at: new Date().toISOString(),
            }
          }
          return item
        }),
      )

      setShowExternalInput(null)
      toast.success("Proveedor externo guardado")
    } catch (error: any) {
      console.error("Error al guardar proveedor externo:", error)
      toast.error(error.message || "No se pudo guardar el proveedor externo")
    } finally {
      setUpdatingId(null)
    }
  }

  // Manejar edición del campo OR
  const handleOREdit = (id: string) => {
    setSelectedRowId(id)
    setEditingOR(id)
    // Usar un timeout para asegurar que el input esté listo
    setTimeout(() => {
      if (orInputRef.current) {
        orInputRef.current.focus()

        // Posicionar el cursor al final del texto
        const value = orValues[id] || "ORT"
        const length = value.length
        orInputRef.current.setSelectionRange(length, length)
      }
    }, 100)
  }

  // Guardar valor del campo OR
  const handleORSave = async (id: string) => {
    try {
      setSelectedRowId(id)
      setUpdatingId(id)

      const orValue = orValues[id] || "ORT"

      // Actualizar en la base de datos
      const { error } = await supabase.from("sales_vehicles").update({ or_value: orValue }).eq("id", id)

      if (error) {
        console.error("Error al guardar valor OR:", error)
        throw new Error(error.message)
      }

      // Actualizar la UI
      setVehicles((prevVehicles) =>
        prevVehicles.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              or_value: orValue,
              updated_at: new Date().toISOString(),
            }
          }
          return item
        }),
      )

      setFilteredVehicles((prevVehicles) =>
        prevVehicles.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              or_value: orValue,
              updated_at: new Date().toISOString(),
            }
          }
          return item
        }),
      )

      setEditingOR(null)
      toast.success("Valor OR actualizado")
    } catch (error: any) {
      console.error("Error al guardar valor OR:", error)
      toast.error(error.message || "No se pudo guardar el valor OR")
    } finally {
      setUpdatingId(null)
    }
  }

  // Manejar cambio en el input OR
  const handleORChange = (id: string, value: string) => {
    setOrValues((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  // Manejar tecla Enter en el input OR
  const handleORKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleORSave(id)
    } else if (e.key === "Escape") {
      setEditingOR(null)
    }
  }

  // Iniciar edición de una celda
  const handleRowClick = useCallback((vehicleId: string, event: React.MouseEvent) => {
    // Evitar selección cuando se hace clic en elementos interactivos
    const target = event.target as HTMLElement
    if (
      target.tagName === "BUTTON" ||
      target.tagName === "INPUT" ||
      target.getAttribute("role") === "combobox" ||
      target.closest("button") ||
      target.closest("input") ||
      target.closest("[role='combobox']") ||
      target.closest("span[onClick]")
    ) {
      return
    }

    setSelectedRowId(vehicleId)
  }, [])

  const handleCellEdit = useCallback((id: string, field: string, currentValue: any) => {
    // Verificación específica para payment_method - solo Directores y Supervisores
    if (field === "payment_method") {
      if (!canEditPaymentMethods) {
        toast.error("Solo Directores y Supervisores pueden editar métodos de pago")
        return
      }
    }

    setSelectedRowId(id)
    setEditingCell({ id, field })
    setEditingValue(currentValue !== null && currentValue !== undefined ? String(currentValue) : "")

    // Enfocar el input después de renderizarlo
    setTimeout(() => {
      if (editCellInputRef.current) {
        editCellInputRef.current.focus()
        editCellInputRef.current.select()
      }
    }, 100)
  }, [canEditPaymentMethods])

  // Guardar el valor editado
  const handleCellSave = useCallback(async (id: string, field: string) => {
    setUpdatingId(id)

    try {
      let valueToSave: any = editingValue

      // Convertir el valor según el tipo de campo
      if (field === "price" || field === "mileage") {
        valueToSave = Number.parseFloat(editingValue) || null
      } else if (field === "validated") {
        valueToSave = editingValue === "true"
      } else if (
        field === "sale_date" ||
        field === "validation_date" ||
        field === "cyp_date" ||
        field === "photo_360_date"
      ) {
        // Validar formato de fecha
        if (editingValue && !isNaN(Date.parse(editingValue))) {
          // CORREGIDO: Usar mediodía para evitar problemas de zona horaria
          const date = new Date(editingValue)
          date.setHours(12, 0, 0, 0) // Establecer a mediodía
          valueToSave = date.toISOString()
        } else {
          valueToSave = null
        }
      }

      // Actualizar en la base de datos
      const { error } = await supabase
        .from("sales_vehicles")
        .update({ [field]: valueToSave, updated_at: new Date().toISOString() })
        .eq("id", id)

      // Si es expense_charge, sincronizar con otras tablas
      if (field === "expense_charge" && !error) {
        const vehicle = vehicles.find(v => v.id === id)
        if (vehicle) {
          // Actualizar en nuevas_entradas si existe
          const { error: nuevasEntradasError } = await supabase
            .from("nuevas_entradas")
            .update({ expense_charge: valueToSave })
            .eq("license_plate", vehicle.license_plate)

          if (nuevasEntradasError && nuevasEntradasError.code !== "PGRST116") {
            console.error("Error actualizando nuevas_entradas:", nuevasEntradasError)
          }

          // Actualizar en stock si existe
          const { error: stockError } = await supabase
            .from("stock")
            .update({ expense_charge: valueToSave })
            .eq("license_plate", vehicle.license_plate)

          if (stockError && stockError.code !== "PGRST116") {
            console.error("Error actualizando stock:", stockError)
          }
        }
      }

      if (error) {
        console.error(`Error al actualizar ${field}:`, error)
        throw new Error(error.message)
      }

      // Actualizar el estado local
      setVehicles((prevVehicles) =>
        prevVehicles.map((v) =>
          v.id === id ? { ...v, [field]: valueToSave, updated_at: new Date().toISOString() } : v,
        ),
      )

      // Si el campo afecta a la prioridad, recalcular
      if (["payment_status", "payment_method", "validated"].includes(field)) {
        const updatedVehicle = vehicles.find((v) => v.id === id)
        if (updatedVehicle) {
          const updatedVehicleWithNewField = { ...updatedVehicle, [field]: valueToSave }
          const newPriority = calculatePriority(updatedVehicleWithNewField)

          // Actualizar prioridad en la UI
          setVehicles((prevVehicles) =>
            prevVehicles.map((v) =>
              v.id === id
                ? { ...v, [field]: valueToSave, priority: newPriority, updated_at: new Date().toISOString() }
                : v,
            ),
          )

          // Reordenar después de actualizar
          setFilteredVehicles(
            sortVehicles(
              filteredVehicles.map((v) =>
                v.id === id
                  ? { ...v, [field]: valueToSave, priority: newPriority, updated_at: new Date().toISOString() }
                  : v,
              ),
            ),
          )
        }
      } else {
        // Actualizar filteredVehicles sin recalcular prioridad
        setFilteredVehicles((prevVehicles) =>
          prevVehicles.map((v) =>
            v.id === id ? { ...v, [field]: valueToSave, updated_at: new Date().toISOString() } : v,
          ),
        )
      }

      toast.success(`Campo ${field} actualizado`)
    } catch (error: any) {
      console.error(`Error al guardar ${field}:`, error)
      toast.error(error.message || `No se pudo guardar el campo ${field}`)
    } finally {
      setEditingCell(null)
      setUpdatingId(null)
    }
  }, [editingValue, vehicles, filteredVehicles, calculatePriority, sortVehicles])

  // Manejar teclas en el input de edición
  const handleCellKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, id: string, field: string) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleCellSave(id, field)
    } else if (e.key === "Escape") {
      setEditingCell(null)
    }
  }, [handleCellSave])

  // Renderizar celda editable
  const renderEditableCell = useMemo(() => (
    vehicle: SoldVehicle,
    field: string,
    currentValue: any,
    displayValue: React.ReactNode,
  ) => {
    const isEditing = editingCell?.id === vehicle.id && editingCell?.field === field

    if (isEditing) {
      return (
        <div className="w-full">
          <Input
            ref={editCellInputRef}
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={() => handleCellSave(vehicle.id, field)}
            onKeyDown={(e) => handleCellKeyDown(e, vehicle.id, field)}
            className="h-6 text-sm bg-background w-full"
            autoFocus
          />
        </div>
      )
    }

    return (
      <div
        className={cn(
          "px-2 py-1 rounded hover:bg-muted/50 cursor-pointer w-full",
          "border border-dashed border-transparent hover:border-muted-foreground/30"
        )}
        onClick={() => handleCellEdit(vehicle.id, field, currentValue)}
        title="Haz clic para editar"
      >
        {displayValue}
      </div>
    )
  }, [editingCell, editingValue, handleCellEdit, handleCellSave, handleCellKeyDown])

  const toggleHiddenColumns = () => {
    setHiddenColumns((prev) => ({
      price: !prev.price,
      saleDate: !prev.saleDate,
      paymentMethod: !prev.paymentMethod,
      documentType: !prev.documentType,
      brand: !prev.brand,
      dealershipCode: !prev.dealershipCode,
      bank: !prev.bank,
      clientDni: !prev.clientDni,
    }))
  }

  // Reemplazar la función formatDate existente:
  const formatDate = (dateString: string | undefined) => {
    return formatDateForDisplay(dateString)
  }

  const calculateDaysSinceSale = (saleDate: string) => {
    const saleDateObj = new Date(saleDate)
    const today = new Date()
    const diff = differenceInDays(today, saleDateObj)
    return diff
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number.parseInt(value, 10))
    setCurrentPage(1) // Resetear a la primera página al cambiar el número de filas por página
  }

  // Función para abrir el modal de eliminación
  const handleDeleteClick = (vehicleId: string) => {
    setDeleteVehicleId(vehicleId)
    setDeleteObservations("")
    setShowDeleteDialog(true)
  }



  // Función para confirmar la eliminación
  const handleExpenseUpdated = () => {
    // Recargar los datos para reflejar los cambios
    loadSoldVehicles()
  }

  const handleConfirmDelete = async () => {
    if (!deleteVehicleId) return

    setIsDeleting(true)
    try {
      // 1. Marcar como venta caída en pedidos_validados
      const { error: pedidosError } = await supabase
        .from("pedidos_validados")
        .update({
          is_failed_sale: true,
          failed_reason: deleteObservations || null,
          failed_date: new Date().toISOString()
        })
        .eq("vehicle_id", deleteVehicleId)

      if (pedidosError) {
        console.error("Error al marcar como venta caída:", pedidosError)
        toast.error("Error al marcar como venta caída")
        return
      }

      // 2. Eliminar de sales_vehicles
      const { error: salesError } = await supabase
        .from("sales_vehicles")
        .delete()
        .eq("id", deleteVehicleId)

      if (salesError) {
        console.error("Error al eliminar de sales_vehicles:", salesError)
        toast.error("Error al eliminar la venta")
        return
      }

      // 3. Eliminar de entregas si existe
      const { error: entregasError } = await supabase
        .from("entregas")
        .delete()
        .eq("matricula", vehicles.find(v => v.id === deleteVehicleId)?.license_plate)

      if (entregasError) {
        console.error("Error al eliminar de entregas:", entregasError)
        // No mostrar error si no existe en entregas
      }

      // 4. Actualizar la UI
      setVehicles(prev => prev.filter(v => v.id !== deleteVehicleId))
      setFilteredVehicles(prev => prev.filter(v => v.id !== deleteVehicleId))
      setFilteredByDate(prev => prev.filter(v => v.id !== deleteVehicleId))

      toast.success("Venta eliminada correctamente")
      setShowDeleteDialog(false)
      setDeleteVehicleId(null)
      setDeleteObservations("")

      // Recargar datos si hay callback
      if (onRefreshRequest) {
        onRefreshRequest()
      }
    } catch (error) {
      console.error("Error inesperado:", error)
      toast.error("Error inesperado al eliminar la venta")
    } finally {
      setIsDeleting(false)
    }
  }



  // Calcular el número de columnas visibles dinámicamente - REMOVIDO (ahora memoizado arriba)

  // Justo antes del return (
  const quickFilters = [
    { label: "Últimos 7 días", days: 7 },
    { label: "Últimos 30 días", days: 30 },
    { label: "Últimos 90 días", days: 90 },
    { label: "Último año", days: 365 },
  ]
  // ...

  return (
    <TooltipProvider>
      <div className="space-y-4">
                {/* Temporarily disabled admin check
          {isAdmin && (
            <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-sm p-2 mb-2 rounded-md flex items-center">
              <span className="mr-1">🔧</span>
              <span>Modo administrador: Haz clic en cualquier celda para editarla directamente</span>
            </div>
          )}
          */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as VehicleTab)} className="w-full">
          {/* Barra superior con buscador y pestañas en la misma línea */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-card rounded-lg p-2 shadow-sm mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Card className="p-3">
                <div className="flex items-center gap-2 relative">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Buscar por matrícula, modelo, asesor, cliente..."
                    className="w-80"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </Card>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-9 w-9"
                title="Actualizar"
              >
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>


              <Button
                variant={dateFilter.startDate || dateFilter.endDate ? "outline" : "outline"}
                size="icon"
                onClick={() => setShowDateFilter(true)}
                className={dateFilter.startDate || dateFilter.endDate
                  ? "h-9 w-9 border border-blue-500 text-blue-300 bg-transparent shadow-[0_0_0_2px_rgba(59,130,246,0.2)]"
                  : "h-9 w-9"}
                title="Filtrar por fecha"
              >
                <Calendar className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleHiddenColumns}
                className="h-9 w-9"
                title="Mostrar/ocultar columnas"
              >
                {Object.values(hiddenColumns).every((value) => !value) ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <PrintExportButton
                vehicles={filteredByDate}
                activeTab={activeTab}
                searchQuery={searchQuery}
                dateFilter={dateFilter}
                hiddenColumns={hiddenColumns}
              />
            </div>
            <TabsList className="h-9 bg-muted/50">
              <TabsTrigger value="car" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                <Car className="h-3.5 w-3.5 mr-1" />
                <span>Coches</span>
                <Badge variant="outline" className="ml-1 text-xs px-1 py-0">{counts.car}</Badge>
              </TabsTrigger>
              <TabsTrigger value="motorcycle" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                <Bike className="h-3.5 w-3.5 mr-1" />
                <span>Motos</span>
                <Badge variant="outline" className="ml-1 text-xs px-1 py-0">{counts.motorcycle}</Badge>
              </TabsTrigger>
              <TabsTrigger value="not_validated" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                <FileCheck className="h-3.5 w-3.5 mr-1" />
                <span>No validados</span>
                <Badge variant="outline" className="ml-1 text-xs px-1 py-0">{counts.not_validated || 0}</Badge>
              </TabsTrigger>
              <TabsTrigger value="finished" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                <Check className="h-3.5 w-3.5 mr-1" />
                <span>Finalizados</span>
                <Badge variant="outline" className="ml-1 text-xs px-1 py-0">{counts.finished || 0}</Badge>
              </TabsTrigger>
              <TabsTrigger value="all" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                <span>Todos</span>
                <Badge variant="outline" className="ml-1 text-xs px-1 py-0">{counts.all}</Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Contenido de las pestañas - Usando el mismo contenido para todas */}
          {["all", "car", "motorcycle", "not_validated", "finished"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-0">
              <div className="rounded-lg border shadow-sm overflow-hidden">
                <div className="relative w-full overflow-auto">
                  <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent border-b border-border">
                      <TableHead className="w-6 truncate py-2"></TableHead>
                      <TableHead className="w-20 truncate py-2">MATRÍCULA</TableHead>
                      <TableHead className="w-24 truncate py-2">MODELO</TableHead>
                      {!Object.values(hiddenColumns).some(hidden => hidden) && (
                        <TableHead className="w-20 truncate py-2">CLIENTE</TableHead>
                      )}
                      {!hiddenColumns.brand && <TableHead className="w-16 truncate py-2">MARCA</TableHead>}
                      <TableHead className="w-16 truncate py-2">TIPO</TableHead>
                      {!hiddenColumns.dealershipCode && (
                        <TableHead className="w-20 truncate py-2">CONCESIONARIO</TableHead>
                      )}
                      {!hiddenColumns.price && <TableHead className="w-20 truncate py-2">PRECIO</TableHead>}
                      {!hiddenColumns.saleDate && <TableHead className="w-20 truncate py-2">VENTA</TableHead>}
                      <TableHead className="w-20 truncate py-2">ASESOR</TableHead>
                      <TableHead className="w-12 truncate py-2">DÍAS</TableHead>
                      <TableHead className="w-14 truncate py-2">OR</TableHead>
                      <TableHead className="w-16 truncate py-2">GASTOS</TableHead>
                      {!hiddenColumns.paymentMethod && <TableHead className="w-16 truncate py-2">PAGO</TableHead>}
                      {!hiddenColumns.bank && <TableHead className="w-16 truncate py-2">BANCO</TableHead>}
                      <TableHead className="w-20 truncate py-2">ESTADO</TableHead>
                      {!hiddenColumns.documentType && <TableHead className="w-16 truncate py-2">TIPO DOC.</TableHead>}
                      {!hiddenColumns.clientDni && <TableHead className="w-16 truncate py-2">Nº DOC</TableHead>}
                      <TableHead className="w-20 truncate py-2">CyP</TableHead>
                      <TableHead className="w-20 truncate py-2">360º</TableHead>
                      <TableHead className="w-20 truncate py-2">VALIDADO</TableHead>
                                              <TableHead className="w-20 truncate py-2"></TableHead>
                      <TableHead className="w-24 truncate py-2">PRE-ENTREGA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={visibleColumnCount} className="text-center py-8">
                          <div className="flex justify-center items-center">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <span>Cargando vehículos vendidos...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : paginatedRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={visibleColumnCount} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Car className="h-10 w-10 mb-2" />
                            <p>No se encontraron vehículos vendidos</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRows.map((vehicle, index) => (
                        <TableRow
                          key={vehicle.id}
                          className={cn(
                            "transition-all duration-300 ease-in-out cursor-pointer border-b relative",
                            index % 2 === 0 ? "bg-background" : "bg-muted/10",
                            selectedRowId === vehicle.id 
                              ? "border-2 border-primary shadow-md bg-primary/5" 
                              : "hover:bg-muted/30"
                          )}
                          data-selected={selectedRowId === vehicle.id}
                          onClick={(e) => handleRowClick(vehicle.id, e)}
                        >
                          {/* PRIORIDAD */}
                          <TableCell className="py-1 px-1 w-6">
                            <div className="flex items-center justify-center">
                              {updatingId === vehicle.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <div className="relative flex items-center justify-center">
                                  <div
                                    className={cn(
                                      "rounded-full relative z-10",
                                      vehicle.priority >= 1100
                                        ? "animate-[priorityPulseHigh_2s_ease-in-out_infinite]"
                                        : vehicle.priority >= 1000
                                          ? "animate-[priorityPulseMedium_3s_ease-in-out_infinite]"
                                          : vehicle.priority >= 200
                                            ? "animate-[priorityPulseLow_5s_ease-in-out_infinite]"
                                            : "",
                                      getPriorityColor(vehicle.priority || 0),
                                    )}
                                    style={{
                                      width: getPrioritySize(vehicle.priority || 0).includes('h-4') ? "16px" : 
                                             getPrioritySize(vehicle.priority || 0).includes('h-3.5') ? "14px" :
                                             getPrioritySize(vehicle.priority || 0).includes('h-3') ? "12px" : "8px",
                                      height: getPrioritySize(vehicle.priority || 0).includes('h-4') ? "16px" : 
                                              getPrioritySize(vehicle.priority || 0).includes('h-3.5') ? "14px" :
                                              getPrioritySize(vehicle.priority || 0).includes('h-3') ? "12px" : "8px",
                                    }}
                                    title={`Prioridad: ${vehicle.priority || 0} puntos`}
                                  />
                                  {vehicle.priority > 0 && (
                                    <div
                                      className={cn(
                                        "absolute top-0 left-0 rounded-full animate-ping opacity-50",
                                        getPriorityColor(vehicle.priority || 0),
                                      )}
                                      style={{
                                        width: getPrioritySize(vehicle.priority || 0).includes('h-4') ? "16px" : 
                                               getPrioritySize(vehicle.priority || 0).includes('h-3.5') ? "14px" :
                                               getPrioritySize(vehicle.priority || 0).includes('h-3') ? "12px" : "8px",
                                        height: getPrioritySize(vehicle.priority || 0).includes('h-4') ? "16px" : 
                                                getPrioritySize(vehicle.priority || 0).includes('h-3.5') ? "14px" :
                                                getPrioritySize(vehicle.priority || 0).includes('h-3') ? "12px" : "8px",
                                        animationDuration: vehicle.priority >= 1100 ? "2s" : vehicle.priority >= 1000 ? "3s" : "4s",
                                      }}
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>

                          {/* MATRÍCULA */}
                          <TableCell className="font-medium py-1 w-20">
                            {renderEditableCell(
                              vehicle,
                              "license_plate",
                              vehicle.license_plate,
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="truncate block">{vehicle.license_plate}</span>
                                </TooltipTrigger>
                                <TooltipContent>{vehicle.license_plate}</TooltipContent>
                              </Tooltip>,
                            )}
                          </TableCell>

                          {/* MODELO */}
                          <TableCell className="py-1 w-24">
                            {renderEditableCell(
                              vehicle,
                              "model",
                              vehicle.model,
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="truncate max-w-[90px]">{vehicle.model}</div>
                                </TooltipTrigger>
                                <TooltipContent>{vehicle.model}</TooltipContent>
                              </Tooltip>,
                            )}
                          </TableCell>

                          {/* CLIENTE - Solo visible cuando las columnas están visibles */}
                          {!Object.values(hiddenColumns).some(hidden => hidden) && (
                            <TableCell className="py-1 w-20">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="truncate max-w-[80px] text-sm">
                                    {vehicle.client_name || "-"}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {vehicle.client_name || "No disponible"}
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                          )}

                          {/* MARCA (brand) - Nueva columna */}
                          {!hiddenColumns.brand && (
                            <TableCell className="py-1 w-16">
                              {renderEditableCell(
                                vehicle,
                                "brand",
                                vehicle.brand,
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="truncate max-w-[60px]">{vehicle.brand || "-"}</div>
                                  </TooltipTrigger>
                                  <TooltipContent>{vehicle.brand || "No disponible"}</TooltipContent>
                                </Tooltip>,
                              )}
                            </TableCell>
                          )}

                          {/* TIPO */}
                          <TableCell className="py-1 w-16">
                            {vehicle.vehicle_type === "Moto" ? (
                              <div className="flex items-center">
                                <Bike className="h-4 w-4 mr-1 text-orange-500" />
                                <span>Moto</span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <Car className="h-4 w-4 mr-1 text-blue-500" />
                                <span>Coche</span>
                              </div>
                            )}
                          </TableCell>

                          {/* CONCESIONARIO (dealership_code) - Nueva columna */}
                          {!hiddenColumns.dealershipCode && (
                            <TableCell className="py-1 w-20">
                              {renderEditableCell(
                                vehicle,
                                "dealership_code",
                                vehicle.dealership_code,
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="truncate max-w-[80px]">{vehicle.dealership_code || "-"}</div>
                                  </TooltipTrigger>
                                  <TooltipContent>{vehicle.dealership_code || "No disponible"}</TooltipContent>
                                </Tooltip>,
                              )}
                            </TableCell>
                          )}

                          {/* PRECIO - Solo visible si hiddenColumns.price es false */}
                          {!hiddenColumns.price && (
                            <TableCell className="py-1 w-20">
                              {renderEditableCell(
                                vehicle,
                                "price",
                                vehicle.price,
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="truncate max-w-[80px]">
                                      {vehicle.price ? `${vehicle.price.toLocaleString("es-ES")} €` : "-"}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {vehicle.price ? `${vehicle.price.toLocaleString("es-ES")} €` : "No disponible"}
                                  </TooltipContent>
                                </Tooltip>,
                              )}
                            </TableCell>
                          )}

                          {/* VENTA - Solo visible si showHiddenColumns is true */}
                          {!hiddenColumns.saleDate && (
                            <TableCell className="py-1 w-20">
                              <div className="flex items-center">
                                <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                {formatDate(vehicle.sale_date)}
                              </div>
                            </TableCell>
                          )}

                          {/* ASESOR */}
                          <TableCell className="py-1 w-20">
                            {renderEditableCell(
                              vehicle,
                              "advisor",
                              vehicle.advisor,
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="truncate max-w-[80px]">{vehicle.advisor}</div>
                                </TooltipTrigger>
                                <TooltipContent>{vehicle.advisor}</TooltipContent>
                              </Tooltip>,
                            )}
                          </TableCell>

                          {/* DÍAS */}
                          <TableCell className="py-1">
                            <Badge variant="outline" className="px-1.5 py-0">
                              {calculateDaysSinceSale(vehicle.sale_date)}
                            </Badge>
                          </TableCell>

                          {/* OR - Campo editable */}
                          <TableCell className="py-1 w-14">
                            {editingOR === vehicle.id ? (
                              <div className="flex items-center">
                                <Input
                                  ref={orInputRef}
                                  value={orValues[vehicle.id] || "ORT"}
                                  onChange={(e) => handleORChange(vehicle.id, e.target.value)}
                                  onBlur={() => handleORSave(vehicle.id)}
                                  onKeyDown={(e) => handleORKeyDown(e, vehicle.id)}
                                  className="h-6 text-sm font-mono bg-background" // Added bg-background
                                  style={{ minWidth: "10ch", width: "10ch" }}
                                  maxLength={10}
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className="h-6 flex items-center px-2 border border-gray-300 rounded-md cursor-pointer font-mono overflow-hidden"
                                    style={{ minWidth: "10ch", width: "auto", maxWidth: "10ch" }}
                                    onClick={() => handleOREdit(vehicle.id)}
                                  >
                                    <span className="truncate w-full" title={orValues[vehicle.id] || "ORT"}>
                                      {orValues[vehicle.id] || "ORT"}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>{orValues[vehicle.id] || "ORT"}</TooltipContent>
                              </Tooltip>
                            )}
                          </TableCell>

                          {/* CARGO GASTOS */}
                          <TableCell className="py-1">
                            {canEdit && editingCell && editingCell.id === vehicle.id && editingCell.field === "expense_charge" ? (
                              <Popover open={expensePopoverOpen} onOpenChange={setExpensePopoverOpen}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between border-2 border-primary/30 bg-background text-foreground hover:bg-primary/10 hover:border-primary"
                                    onClick={() => setExpensePopoverOpen(true)}
                                  >
                                    {expenseTypes.find((et) => et.name === editingValue)?.name || "Seleccionar gasto"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[220px] p-0">
                                  <Command>
                                    <CommandInput placeholder="Buscar gasto..." />
                                    <CommandList>
                                      <CommandGroup>
                                        {expenseTypes.map((et) => (
                                          <CommandItem
                                            key={et.id}
                                            value={et.name}
                                                                                onSelect={() => {
                                      setEditingValue(et.name)
                                      setExpensePopoverOpen(false)
                                      handleCellSave(vehicle.id, "expense_charge")
                                    }}
                                          >
                                            <Check className={cn("mr-2 h-4 w-4", editingValue === et.name ? "opacity-100" : "opacity-0")} />
                                            {et.name}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            ) : (
                              <span
                                className={canEdit ? `block cursor-pointer rounded px-1 ${selectedRowId === vehicle.id ? "" : "hover:bg-muted/50"}` : "block px-1"}
                                                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (canEdit) {
                                      // Si ya estamos editando este campo, no hacer nada
                                      if (editingCell && editingCell.id === vehicle.id && editingCell.field === "expense_charge") {
                                        return
                                      }
                                      
                                      setSelectedRowId(vehicle.id)
                                      setEditingCell({id: vehicle.id, field: "expense_charge"})
                                      setEditingValue(vehicle.expense_charge || "")
                                      setExpensePopoverOpen(true)
                                    }
                                  }}
                              >
                                {vehicle.expense_charge || <span className="text-muted-foreground">-</span>}
                              </span>
                            )}
                          </TableCell>

                          {/* FORMA DE PAGO - Solo visible si showHiddenColumns is true */}
                          {!hiddenColumns.paymentMethod && (
                            <TableCell className="py-1">
                              {renderEditableCell(
                                vehicle,
                                "payment_method",
                                vehicle.payment_method,
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="truncate max-w-[60px]">{vehicle.payment_method}</div>
                                  </TooltipTrigger>
                                  <TooltipContent>{vehicle.payment_method}</TooltipContent>
                                </Tooltip>
                              )}
                            </TableCell>
                          )}

                          {/* BANCO (bank) - Nueva columna */}
                          {!hiddenColumns.bank && (
                            <TableCell className="py-1">
                              {renderEditableCell(
                                vehicle,
                                "bank",
                                vehicle.bank,
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center">
                                      <Banknote className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                      <span className="truncate max-w-[60px]">{vehicle.bank || "-"}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>{vehicle.bank || "No disponible"}</TooltipContent>
                                </Tooltip>,
                              )}
                            </TableCell>
                          )}

                          {/* ESTADO PAGO */}
                          <TableCell className="py-1">
                            <Select
                              value={vehicle.payment_status || "pendiente"}
                              onValueChange={(value) => updatePaymentStatus(vehicle.id, value)}
                              disabled={updatingId === vehicle.id}
                            >
                              <SelectTrigger className="w-[40px] h-6 truncate bg-background">
                                {" "}
                                {/* Added bg-background */}
                                <SelectValue>
                                  {updatingId === vehicle.id ? (
                                    <div className="flex items-center justify-center">
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center">
                                      <span
                                        className={cn(
                                          "h-3 w-3 rounded-full",
                                          PAYMENT_STATUSES.find((s) => s.value === vehicle.payment_status)?.color ||
                                            "bg-gray-500",
                                        )}
                                        title={
                                          PAYMENT_STATUSES.find((s) => s.value === vehicle.payment_status)?.label ||
                                          "Pendiente"
                                        }
                                      />
                                    </div>
                                  )}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {PAYMENT_STATUSES.map((status) => (
                                  <SelectItem key={status.value} value={status.value}>
                                    <div className="flex items-center">
                                      <span className={cn("h-2 w-2 rounded-full mr-2", status.color)} />
                                      {status.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* TIPO DOC. - Solo visible si hiddenColumns.documentType is false */}
                          {!hiddenColumns.documentType && (
                            <TableCell className="py-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center">
                                    <CreditCard className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                    <span className="truncate max-w-[40px]">{vehicle.document_type || "-"}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>{vehicle.document_type || "No especificado"}</TooltipContent>
                              </Tooltip>
                            </TableCell>
                          )}

                          {/* Nº DOC (client_dni) - Nueva columna */}
                          {!hiddenColumns.clientDni && (
                            <TableCell className="py-1">
                              {renderEditableCell(
                                vehicle,
                                "client_dni",
                                vehicle.client_dni,
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="truncate max-w-[80px]">{vehicle.client_dni || "-"}</div>
                                  </TooltipTrigger>
                                  <TooltipContent>{vehicle.client_dni || "No disponible"}</TooltipContent>
                                </Tooltip>,
                              )}
                            </TableCell>
                          )}

                          {/* CyP - Con 3 estados y fecha cuando está completado */}
                          <TableCell className="py-1">
                            {vehicle.cyp_status === "completado" ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center justify-center h-6 w-full border border-green-300 dark:border-green-700 rounded-md px-2 text-green-600">
                                    <Check className="h-3.5 w-3.5 mr-1 text-green-600" />
                                    <span className="truncate">{formatDate(vehicle.cyp_date)}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>{formatDate(vehicle.cyp_date)}</TooltipContent>
                              </Tooltip>
                            ) : vehicle.cyp_status === "en_proceso" ? (
                              <button
                                className="flex items-center justify-center h-6 w-full rounded-md px-2 bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-300 hover:text-blue-950 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-800 dark:hover:text-blue-100 transition-colors"
                                onClick={() => updateCypStatus(vehicle.id, vehicle.cyp_status)}
                                disabled={updatingId === vehicle.id}
                              >
                                <Wrench className="h-3 w-3 mr-1" />
                                <span className="truncate">En proceso</span>
                              </button>
                            ) : (
                              <button
                                className="flex items-center justify-center h-6 w-full rounded-md px-2 bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-300 hover:text-amber-950 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-800 dark:hover:text-blue-100 transition-colors"
                                onClick={() => updateCypStatus(vehicle.id, vehicle.cyp_status)}
                                disabled={updatingId === vehicle.id}
                              >
                                {updatingId === vehicle.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <>
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span className="truncate">Pendiente</span>
                                  </>
                                )}
                              </button>
                            )}
                          </TableCell>

                          {/* 360º - Con 3 estados y fecha cuando está completado */}
                          <TableCell className="py-1">
                            {vehicle.photo_360_status === "completado" ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center justify-center h-6 w-full border border-green-300 dark:border-green-700 rounded-md px-2 text-green-600">
                                    <Check className="h-3.5 w-3.5 mr-1 text-green-600" />
                                    <span className="truncate">{formatDate(vehicle.photo_360_date)}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>{formatDate(vehicle.photo_360_date)}</TooltipContent>
                              </Tooltip>
                            ) : vehicle.photo_360_status === "en_proceso" ? (
                              <button
                                className="flex items-center justify-center h-6 w-full rounded-md px-2 bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-300 hover:text-blue-950 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-800 dark:hover:text-blue-100 transition-colors"
                                onClick={() => update360Status(vehicle.id, vehicle.photo_360_status)}
                                disabled={updatingId === vehicle.id}
                              >
                                <Wrench className="h-3 w-3 mr-1" />
                                <span className="truncate">En proceso</span>
                              </button>
                            ) : (
                              <button
                                className="flex items-center justify-center h-6 w-full rounded-md px-2 bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-300 hover:text-amber-950 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-800 dark:hover:text-blue-100 transition-colors"
                                onClick={() => update360Status(vehicle.id, vehicle.photo_360_status)}
                                disabled={updatingId === vehicle.id}
                              >
                                {updatingId === vehicle.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <>
                                    <Camera360 className="h-3 w-3 mr-1" />
                                    <span className="truncate">Pendiente</span>
                                  </>
                                )}
                              </button>
                            )}
                          </TableCell>

                          {/* VALIDADO */}
                          <TableCell className="py-1">
                            <Button
                              variant={vehicle.validated ? "ghost" : "outline"}
                              size="icon"
                              className={cn(
                                "h-8 w-8",
                                vehicle.validated
                                  ? "bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30"
                                  : "bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/20 dark:hover:bg-amber-900/30",
                              )}
                              onClick={() => toggleValidation(vehicle.id, vehicle.validated)}
                              disabled={updatingId === vehicle.id}
                            >
                              {updatingId === vehicle.id ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : vehicle.validated ? (
                                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                              ) : (
                                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                              )}
                            </Button>
                          </TableCell>

                          {/* PERITADO, PDF y ACCIONES */}
                          <TableCell className="py-1 px-1 w-20">
                            <div className="flex items-center space-x-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-yellow-500 hover:bg-yellow-100 hover:text-yellow-600 dark:hover:bg-yellow-900/30"
                                  >
                                    <FileEdit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Peritación</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <PdfDataDialog vehicleId={vehicle.id} licensePlate={vehicle.license_plate} />
                                </TooltipTrigger>
                                <TooltipContent>Ver datos extraídos PDF</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteClick(vehicle.id)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Eliminar venta</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>

                          {/* CENTRO PRE-ENTREGA */}
                          <TableCell className="py-1">
                            {showExternalInput === vehicle.id ? (
                              <div className="flex items-center space-x-1">
                                <Input
                                  ref={externalInputRef}
                                  value={externalProvider}
                                  onChange={(e) => setExternalProvider(e.target.value)}
                                  placeholder="Nombre proveedor"
                                  className="h-6 text-xs bg-background" // Added bg-background
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault()
                                      saveExternalProvider(vehicle.id)
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => saveExternalProvider(vehicle.id)}
                                  disabled={updatingId === vehicle.id}
                                >
                                  {updatingId === vehicle.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Save className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <>
                                <Select
                                  value={vehicle.delivery_center || "Terrassa"}
                                  onValueChange={(value) => updateDeliveryCenter(vehicle.id, value)}
                                  disabled={updatingId === vehicle.id}
                                >
                                  <SelectTrigger className="w-[120px] h-6 bg-background">
                                    {" "}
                                    {/* Added bg-background */}
                                    <SelectValue>
                                      {updatingId === vehicle.id ? (
                                        <div className="flex items-center">
                                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                          <span>Actualizando...</span>
                                        </div>
                                      ) : vehicle.delivery_center ? (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="flex items-center">
                                              <Building className="h-3 w-3 mr-1" />
                                              <span className="truncate">
                                                {vehicle.delivery_center}
                                                {vehicle.delivery_center === "Externo" &&
                                                  vehicle.external_provider &&
                                                  ` (${vehicle.external_provider})`}
                                              </span>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            {vehicle.delivery_center}
                                            {vehicle.delivery_center === "Externo" &&
                                              vehicle.external_provider &&
                                              ` (${vehicle.external_provider})`}
                                          </TooltipContent>
                                        </Tooltip>
                                      ) : (
                                        <div className="flex items-center">
                                          <Building className="h-3 w-3 mr-1" />
                                          <span>Terrassa</span>
                                        </div>
                                      )}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {DELIVERY_CENTERS.map((center) => (
                                      <SelectItem key={center.value} value={center.value}>
                                        <div className="flex items-center">
                                          <Building className="h-3 w-3 mr-1" />
                                          <span>{center.label}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </>
                            )}
                          </TableCell>
                          

                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                </div>
              </div>
              {/* Subcard paginador */}
              <div className="mt-2 rounded-lg border bg-card shadow-sm px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {totalRows === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                  -{Math.min(currentPage * itemsPerPage, totalRows)} de <span className="font-bold">{totalRows}</span> resultados
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
                        {[10, 20, 30, 50].map((size) => (
                          <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Flechas y números de página */}
                  <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-8 w-8">{'<<'}</Button>
                  <Button variant="outline" size="icon" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="h-8 w-8">{'<'}</Button>
                  {getPageNumbers().map((n) => (
                    <Button key={n} variant={n === currentPage ? "default" : "outline"} size="icon" onClick={() => setCurrentPage(n)} className="h-8 w-8 font-bold">{n}</Button>
                  ))}
                  <Button variant="outline" size="icon" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="h-8 w-8">{'>'}</Button>
                  <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="h-8 w-8">{'>>'}</Button>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
        <Dialog open={showDateFilter} onOpenChange={setShowDateFilter}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Filtro de Fechas</DialogTitle>
              <DialogDescription>Selecciona un rango de fechas para filtrar las ventas</DialogDescription>
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
                      const start = addDays(end, -f.days + 1)
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
                    value={dateFilter.startDate ? format(dateFilter.startDate, "yyyy-MM-dd") : ""}
                    onChange={e => setDateFilter(df => ({ ...df, startDate: e.target.value ? new Date(e.target.value) : null }))}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs mb-1">Fecha fin</label>
                  <Input
                    type="date"
                    value={dateFilter.endDate ? format(dateFilter.endDate, "yyyy-MM-dd") : ""}
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

        {/* Modal de confirmación para eliminar venta */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Confirmar eliminación
              </DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que quieres eliminar esta venta? Esta acción no se puede deshacer.
                <br />
                <strong>Matrícula:</strong> {vehicles.find(v => v.id === deleteVehicleId)?.license_plate}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="observations">Observaciones (opcional)</Label>
                <Textarea
                  id="observations"
                  placeholder="Motivo de la eliminación (ej: cliente no financiable, venta cancelada...)"
                  value={deleteObservations}
                  onChange={(e) => setDeleteObservations(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false)
                  setDeleteVehicleId(null)
                  setDeleteObservations("")
                }}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar venta
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


      </div>
    </TooltipProvider>
  )
}
