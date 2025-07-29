"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { getSupabaseClient } from "@/lib/supabase/singleton"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Edit,
  Save,
  X,
  Calendar,
  Wrench,
  Clock,
  CheckCircle,
  Timer,
  AlertTriangle,
  Car,
  Tag,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BMWMSpinner } from "../ui/bmw-m-spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { type StockItem, STATUS_OPTIONS, WORK_CENTER_OPTIONS } from "@/lib/types/stock"
import { formatDateForDisplay } from "@/lib/date-utils"
import { addDays, format } from "date-fns"
import ReusablePagination from "@/components/ui/reusable-pagination"

// Definición de prioridades
enum Priority {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
  NORMAL = "normal",
}

// Interfaz extendida para incluir prioridad calculada
interface StockItemWithPriority extends StockItem {
  calculatedPriority: Priority
}

interface StockTableProps {
  initialStock?: StockItem[]
  onRefresh?: () => void
}

// Estilos para las animaciones de prioridad
const priorityStyles = {
  container: "relative flex items-center justify-center",
  high: {
    dot: "w-3 h-3 rounded-full bg-red-500 animate-[priorityPulseHigh_1.5s_ease-in-out_infinite] relative z-10",
    wave: "absolute top-0 left-0 w-3 h-3 rounded-full bg-red-600 animate-[ping_1.5s_ease-in-out_infinite] opacity-75",
  },
  medium: {
    dot: "w-3 h-3 rounded-full bg-amber-500 animate-[priorityPulseMedium_2.5s_ease-in-out_infinite] relative z-10",
    wave: "absolute top-0 left-0 w-3 h-3 rounded-full bg-amber-600 animate-[ping_2.5s_ease-in-out_infinite] opacity-75",
  },
  low: {
    dot: "w-3 h-3 rounded-full bg-blue-500 animate-[priorityPulseLow_4s_ease-in-out_infinite] relative z-10",
    wave: "absolute top-0 left-0 w-3 h-3 rounded-full bg-blue-600 animate-[ping_4s_ease-in-out_infinite] opacity-75",
  },
}

// Función para formatear tiempo en segundos a formato legible
const formatTimeElapsed = (seconds: number | null | undefined): string => {
  if (!seconds) return "-"

  const days = Math.floor(seconds / (24 * 3600))
  const hours = Math.floor((seconds % (24 * 3600)) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

export default function StockTable({ initialStock = [], onRefresh }: StockTableProps) {
  const [stock, setStock] = useState<StockItem[]>(initialStock)
  const [filteredStock, setFilteredStock] = useState<StockItem[]>(initialStock)
  const [displayedStock, setDisplayedStock] = useState<StockItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [sortField, setSortField] = useState<"reception_date" | "inspection_date">("reception_date")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<StockItem>>({})
  const [photoStatus, setPhotoStatus] = useState<Record<string, boolean>>({})
  const [editingOR, setEditingOR] = useState<string | null>(null)
  const [orValues, setOrValues] = useState<Record<string, string>>({})
  const [paintStatus, setPaintStatus] = useState<Record<string, string>>({})
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [dateFilter, setDateFilter] = useState<{ startDate: Date | null; endDate: Date | null }>({ startDate: null, endDate: null })

  const supabase = getSupabaseClient()
  const { toast } = useToast()
  const externalProviderInputRef = useRef<HTMLInputElement>(null)
  const orInputRef = useRef<HTMLInputElement>(null)

  // Filtros rápidos para fechas
  const quickFilters = [
    { label: "Últimos 7 días", days: 7 },
    { label: "Últimos 30 días", days: 30 },
    { label: "Últimos 90 días", days: 90 },
    { label: "Último año", days: 365 },
  ]

  // Añade este useEffect después de la declaración de las variables de estado
  useEffect(() => {
    // Cargar datos al montar el componente
    fetchStock()
  }, []) // Array de dependencias vacío para que solo se ejecute al montar

  // Cargar el estado de fotografiado y pintura para cada vehículo
  useEffect(() => {
    const fetchPhotoAndPaintStatus = async () => {
      if (stock.length === 0) return

      const licensePlates = stock.map((item) => item.license_plate)

      try {
        const { data, error } = await supabase
          .from("fotos")
          .select("license_plate, photos_completed, estado_pintura")
          .in("license_plate", licensePlates)

        if (error) {
          console.error("Error al obtener estado de fotos:", error)
          return
        }

        const photoStatusMap: Record<string, boolean> = {}
        const paintStatusMap: Record<string, string> = {}

        data.forEach((item) => {
          photoStatusMap[item.license_plate] = item.photos_completed || false
          paintStatusMap[item.license_plate] = item.estado_pintura || ""
        })

        setPhotoStatus(photoStatusMap)
        setPaintStatus(paintStatusMap)
      } catch (err) {
        console.error("Error al procesar estado de fotos:", err)
      }
    }

    fetchPhotoAndPaintStatus()
  }, [stock, supabase])

  // Inicializar valores OR
  useEffect(() => {
    const initialORValues: Record<string, string> = {}
    stock.forEach((item) => {
      initialORValues[item.id] = item.work_order || "ORT"
    })
    setOrValues(initialORValues)
  }, [stock])

  // useEffect de filtrado y paginación (ejemplo, debes ubicar el correcto)
  useEffect(() => {
    let filtered = stock

    // Primero aplicar filtro por estado (pestaña)
    if (activeTab === "pending") {
      filtered = filtered.filter((item) => item.paint_status === "pendiente" || item.body_status === "pendiente")
    } else if (activeTab === "in_process") {
      filtered = filtered.filter((item) => item.paint_status === "en_proceso" || item.body_status === "en_proceso")
    } else if (activeTab === "completed") {
      // Un vehículo se considera completado cuando SOLO la carrocería está lista (apta o no apta)
      // El estado mecánico NO es relevante para considerarlo completado
      filtered = filtered.filter(
        (item) =>
          (item.paint_status === "apto" || item.paint_status === "no_apto") &&
          (item.body_status === "apto" || item.body_status === "no_apto"),
        // Ya no verificamos el estado mecánico
      )
    } else if (activeTab === "vendido") {
      // Filtrar vehículos vendidos (por ahora vacío, se implementará cuando se defina la lógica)
      filtered = filtered.filter((item) => false) // Temporalmente vacío
    } else if (activeTab === "profesionales") {
      // Filtrar vehículos marcados como venta profesional (por ahora vacío, se implementará cuando se defina la lógica)
      filtered = filtered.filter((item) => false) // Temporalmente vacío
    } else if (activeTab === "premature_sales") {
      // Obtener vehículos con ventas prematuras
      const fetchPrematureSales = async () => {
        try {
          const { data: prematureSales, error } = await supabase
            .from("sales_vehicles")
            .select("license_plate, sold_before_body_ready, sold_before_photos_ready")
            .or("sold_before_body_ready.eq.true,sold_before_photos_ready.eq.true")

          if (!error && prematureSales) {
            const prematureLicensePlates = prematureSales.map((v) => v.license_plate)
            const prematureVehicles = filtered.filter((vehicle) =>
              prematureLicensePlates.includes(vehicle.license_plate),
            )

            setFilteredStock(prematureVehicles)
            setTotalPages(Math.max(1, Math.ceil(prematureVehicles.length / itemsPerPage)))
            setCurrentPage(1)
          }
        } catch (err) {
          console.error("Error al obtener ventas prematuras:", err)
        }
      }

      fetchPrematureSales()
      return
    }

    // Luego aplicar filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.license_plate?.toLowerCase().includes(term) ||
          item.model?.toLowerCase().includes(term) ||
          item.work_center?.toLowerCase().includes(term) ||
          item.external_provider?.toLowerCase().includes(term) ||
          (orValues[item.id] && orValues[item.id].toLowerCase().includes(term)) ||
          (item.expense_charge && item.expense_charge.toLowerCase().includes(term)),
      )
    }

    // Aplicar filtro de fechas
    if (dateFilter.startDate || dateFilter.endDate) {
      filtered = filtered.filter((item) => {
        if (!item.reception_date) return false
        const receptionDate = new Date(item.reception_date)
        
        if (dateFilter.startDate && receptionDate < dateFilter.startDate) return false
        if (dateFilter.endDate && receptionDate > dateFilter.endDate) return false
        
        return true
      })
    }

    setFilteredStock(filtered)
    setTotalPages(Math.max(1, Math.ceil(filtered.length / itemsPerPage)))
    setCurrentPage(1) // Resetear a la primera página cuando cambian los filtros
  }, [
    stock,
    searchTerm,
    activeTab,
    itemsPerPage,
    orValues,
    dateFilter?.startDate ? new Date(dateFilter.startDate).getTime() : null,
    dateFilter?.endDate ? new Date(dateFilter.endDate).getTime() : null
  ])

  // Función para calcular la prioridad de un vehículo
  const calculatePriority = useCallback(
    (item: StockItem, isPhotographed: boolean, paintStatusValue: string): Priority => {
      // Prioridad alta: estado de pintura no apto en la tabla fotos
      if (paintStatusValue === "no_apto") {
        return Priority.HIGH
      }

      // Prioridad media: sin fotografiar
      if (!isPhotographed) {
        return Priority.MEDIUM
      }

      // Prioridad baja: vehículos antiguos (más de 7 días)
      if (item.reception_date) {
        const receptionDate = new Date(item.reception_date)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - receptionDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays > 7) {
          return Priority.LOW
        }
      }

      // Sin prioridad especial
      return Priority.NORMAL
    },
    [],
  )

  // Actualizar los elementos mostrados cuando cambia la página o los filtros
  useEffect(() => {
    // Añadir prioridad calculada a cada elemento
    const itemsWithPriority = filteredStock.map((item) => {
      const isPhotographed = photoStatus[item.license_plate] || false
      const paintStatusValue = paintStatus[item.license_plate] || ""
      return {
        ...item,
        calculatedPriority: calculatePriority(item, isPhotographed, paintStatusValue),
      } as StockItemWithPriority
    })

    // Ordenar primero por prioridad y luego por fecha
    const sorted = [...itemsWithPriority].sort((a, b) => {
      // Primero ordenar por prioridad
      const priorityOrder = {
        [Priority.HIGH]: 0,
        [Priority.MEDIUM]: 1,
        [Priority.LOW]: 2,
        [Priority.NORMAL]: 3,
      }

      const priorityDiff = priorityOrder[a.calculatedPriority] - priorityOrder[b.calculatedPriority]

      if (priorityDiff !== 0) {
        return priorityDiff
      }

      // Si la prioridad es la misma, ordenar por fecha
      let dateA, dateB

      if (sortField === "inspection_date" && a.inspection_date && b.inspection_date) {
        dateA = new Date(a.inspection_date).getTime()
        dateB = new Date(b.inspection_date).getTime()
      } else {
        // Si no hay fecha de inspección o el campo es reception_date, usar fecha de recepción
        dateA = a.reception_date ? new Date(a.reception_date).getTime() : 0
        dateB = b.reception_date ? new Date(b.reception_date).getTime() : 0
      }

      return sortDirection === "asc" ? dateA - dateB : dateB - dateA
    })

    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setDisplayedStock(sorted.slice(startIndex, endIndex))
  }, [filteredStock, currentPage, itemsPerPage, sortDirection, sortField, photoStatus, paintStatus, calculatePriority])

  // Cargar datos completos de stock
  const fetchStock = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("stock")
        .select(`
        *,
        expense_type:expense_type_id(name)
      `)
        .order("reception_date", { ascending: false })

      if (error) {
        console.error("Error al cargar datos de stock:", error)
        return
      }

      // Extraer el nombre del tipo de gasto de la relación
      const stockWithExpenseTypeName = (data || []).map((item) => ({
        ...item,
        expense_type_name: item.expense_type?.name,
        // Asegurarse de que expense_charge esté definido
        expense_charge: item.expense_charge || item.expense_type?.name || "-",
        // Eliminar el objeto expense_type para evitar problemas de serialización
        expense_type: undefined,
      }))
      setStock(stockWithExpenseTypeName)
    } catch (err) {
      console.error("Error al cargar datos de stock:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para actualizar manualmente los datos
  const handleManualRefresh = () => {
    fetchStock()
    toast({
      title: "Actualizando datos",
      description: "Obteniendo los últimos registros de stock",
    })
    
    // Llamar a la función onRefresh si está disponible
    if (onRefresh) {
      onRefresh()
    }
  }

  // Iniciar edición en línea
  const handleEditClick = (item: StockItem) => {
    setEditingId(item.id)
    setEditFormData({
      paint_status: item.paint_status,
      body_status: item.body_status,
      mechanical_status: item.mechanical_status,
      work_center: item.work_center,
      external_provider: item.external_provider,
    })
  }

  // Cancelar edición
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditFormData({})
  }

  // Manejar cambios en el formulario de edición
  const handleEditFormChange = (field: string, value: any) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Si el centro de trabajo cambia a "Externo", enfocar el campo de proveedor externo
    if (field === "work_center" && value === "Externo" && externalProviderInputRef.current) {
      setTimeout(() => {
        externalProviderInputRef.current?.focus()
      }, 100)
    }
  }

  // Guardar cambios de edición
  const handleSaveEdit = async () => {
    if (!editingId) return

    try {
      setPendingUpdates((prev) => new Set(prev).add(editingId))

      // Preparar datos para actualizar
      const updateData: any = {}

      if (editFormData.paint_status) {
        updateData.paint_status = editFormData.paint_status
      }

      if (editFormData.body_status) {
        updateData.body_status = editFormData.body_status

        // Si se cambia a "apto", actualizar la fecha
        if (editFormData.body_status === "apto") {
          const now = new Date().toISOString()
          updateData.body_status_date = now

          // También actualizar la tabla fotos
          await updateFotosTable(stock.find((item) => item.id === editingId)?.license_plate || "", "apto", now)
        }
      }

      if (editFormData.mechanical_status) {
        updateData.mechanical_status = editFormData.mechanical_status

        // Si se cambia a "apto", actualizar la fecha
        if (editFormData.mechanical_status === "apto") {
          updateData.mechanical_status_date = new Date().toISOString()
        }
      }

      if (editFormData.work_center) {
        updateData.work_center = editFormData.work_center

        // Solo incluir external_provider si work_center es "Externo"
        if (editFormData.work_center === "Externo") {
          updateData.external_provider = editFormData.external_provider || ""
        } else {
          updateData.external_provider = null
        }
      }

      // Si se cambia el estado a algo diferente de pendiente y no hay fecha de inspección, añadirla
      const currentItem = stock.find((item) => item.id === editingId)
      if (
        currentItem &&
        !currentItem.inspection_date &&
        ((editFormData.paint_status && editFormData.paint_status !== "pendiente") ||
          (editFormData.body_status && editFormData.body_status !== "pendiente") ||
          (editFormData.mechanical_status && editFormData.mechanical_status !== "pendiente"))
      ) {
        updateData.inspection_date = new Date().toISOString()
      }

      // Actualizar en la base de datos
      const { error } = await supabase.from("stock").update(updateData).eq("id", editingId)

      if (error) {
        console.error("Error de Supabase:", error)
        throw new Error(error.message)
      }

      // Actualizar la UI optimistamente
      setStock((prevStock) =>
        prevStock.map((item) => {
          if (item.id === editingId) {
            return {
              ...item,
              ...updateData,
              updated_at: new Date().toISOString(),
            }
          }
          return item
        }),
      )

      toast({
        title: "Cambios guardados",
        description: "Los datos del vehículo han sido actualizados correctamente",
      })

      // Limpiar estado de edición
      setEditingId(null)
      setEditFormData({})
    } catch (error: any) {
      console.error("Error al guardar cambios:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron guardar los cambios",
        variant: "destructive",
      })
    } finally {
      setTimeout(() => {
        setPendingUpdates((prev) => {
          const newSet = new Set(prev)
          newSet.delete(editingId)
          return newSet
        })
      }, 800)
    }
  }

  // Función para actualizar la tabla fotos
  const updateFotosTable = async (licensePlate: string, estado: string, date: string) => {
    if (!licensePlate) return

    try {
      const { error } = await supabase
        .from("fotos")
        .update({
          estado_pintura: estado,
          paint_status_date: date,
          paint_apto_date: estado === "apto" ? date : null,
        })
        .eq("license_plate", licensePlate)

      if (error) {
        console.error("Error al actualizar tabla fotos:", error)
        // No lanzamos el error para que no interrumpa el flujo principal
      }
    } catch (err) {
      console.error("Error al actualizar tabla fotos:", err)
    }
  }

  // Formatear fecha
  const formatDate = (dateString?: string) => {
    return formatDateForDisplay(dateString)
  }

  // Cambiar de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }



  // Función para cambiar el orden
  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
  }

  // Obtener color para el estado
  const getStatusColor = (status: string) => {
    const statusOption = STATUS_OPTIONS.find((option) => option.value === status)
    return statusOption?.color || ""
  }

  // Función para actualizar el estado de inspección
  const handleInspectionToggle = async (item: StockItem) => {
    try {
      setPendingUpdates((prev) => new Set(prev).add(item.id))

      const now = new Date().toISOString()
      const updateData = {
        inspection_date: item.inspection_date ? null : now,
      }

      // Actualizar en la base de datos
      const { error } = await supabase.from("stock").update(updateData).eq("id", item.id)

      if (error) {
        console.error("Error al actualizar estado de inspección:", error)
        throw new Error(error.message)
      }

      // Actualizar la UI optimistamente
      setStock((prevStock) =>
        prevStock.map((stockItem) => {
          if (stockItem.id === item.id) {
            return {
              ...stockItem,
              ...updateData,
              updated_at: now,
            }
          }
          return stockItem
        }),
      )

      toast({
        title: item.inspection_date ? "Inspección pendiente" : "Inspección completada",
        description: item.inspection_date
          ? `Se ha marcado el vehículo ${item.license_plate} como pendiente de inspección`
          : `Se ha registrado la inspección del vehículo ${item.license_plate}`,
      })
    } catch (error: any) {
      console.error("Error al actualizar estado de inspección:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado de inspección",
        variant: "destructive",
      })
    } finally {
      setTimeout(() => {
        setPendingUpdates((prev) => {
          const newSet = new Set(prev)
          newSet.delete(item.id)
          return newSet
        })
      }, 800)
    }
  }

  // Función para actualizar el estado de carrocería
  const handleBodyStatusToggle = async (item: StockItem) => {
    try {
      setPendingUpdates((prev) => new Set(prev).add(item.id))

      const now = new Date().toISOString()
      let newStatus: string

      // Determinar el siguiente estado en la secuencia
      if (item.body_status === "pendiente") {
        newStatus = "en_proceso"
      } else if (item.body_status === "en_proceso") {
        newStatus = "apto"
      } else {
        // Si ya está en apto, volver a pendiente
        newStatus = "pendiente"
      }

      const updateData = {
        body_status: newStatus,
      }

      // Si es la primera vez que se marca como no pendiente, actualizar la fecha de inspección
      if (!item.inspection_date && newStatus !== "pendiente") {
        updateData.inspection_date = now
      }

      // Actualizar en la base de datos
      const { error } = await supabase.from("stock").update(updateData).eq("id", item.id)

      if (error) {
        console.error("Error al actualizar estado de carrocería:", error)
        throw new Error(error.message)
      }

      // También actualizar la tabla fotos si es apto
      if (newStatus === "apto") {
        await updateFotosTable(item.license_plate, "apto", now)
      }

      // Actualizar la UI optimistamente
      setStock((prevStock) =>
        prevStock.map((stockItem) => {
          if (stockItem.id === item.id) {
            return {
              ...stockItem,
              ...updateData,
              updated_at: now,
            }
          }
          return stockItem
        }),
      )

      const statusMessages = {
        pendiente: "Carrocería pendiente",
        en_proceso: "Carrocería en proceso",
        apto: "Carrocería apta",
      }

      toast({
        title: statusMessages[newStatus],
        description: `Se ha actualizado el estado de carrocería del vehículo ${item.license_plate}`,
      })
    } catch (error: any) {
      console.error("Error al actualizar estado de carrocería:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado de carrocería",
        variant: "destructive",
      })
    } finally {
      setTimeout(() => {
        setPendingUpdates((prev) => {
          const newSet = new Set(prev)
          newSet.delete(item.id)
          return newSet
        })
      }, 800)
    }
  }

  // Función para actualizar el estado mecánico
  const handleMechanicalStatusToggle = async (item: StockItem) => {
    try {
      setPendingUpdates((prev) => new Set(prev).add(item.id))

      const now = new Date().toISOString()
      let newStatus: string

      // Determinar el siguiente estado en la secuencia
      if (item.mechanical_status === "pendiente") {
        newStatus = "en_proceso"
      } else if (item.mechanical_status === "en_proceso") {
        newStatus = "apto"
      } else {
        // Si ya está en apto, volver a pendiente
        newStatus = "pendiente"
      }

      const updateData: any = {
        mechanical_status: newStatus,
      }

      // Si se cambia a "apto", actualizar la fecha
      if (newStatus === "apto") {
        updateData.mechanical_status_date = now
      }

      // Si es la primera vez que se marca como no pendiente, actualizar la fecha de inspección
      if (!item.inspection_date && newStatus !== "pendiente") {
        updateData.inspection_date = now
      }

      // Actualizar en la base de datos
      const { error } = await supabase.from("stock").update(updateData).eq("id", item.id)

      if (error) {
        console.error("Error al actualizar estado mecánico:", error)
        throw new Error(error.message)
      }

      // Actualizar la UI optimistamente
      setStock((prevStock) =>
        prevStock.map((stockItem) => {
          if (stockItem.id === item.id) {
            return {
              ...stockItem,
              ...updateData,
              updated_at: now,
            }
          }
          return stockItem
        }),
      )

      const statusMessages = {
        pendiente: "Mecánica pendiente",
        en_proceso: "Mecánica en proceso",
        apto: "Mecánica apta",
      }

      toast({
        title: statusMessages[newStatus],
        description: `Se ha actualizado el estado mecánico del vehículo ${item.license_plate}`,
      })
    } catch (error: any) {
      console.error("Error al actualizar estado mecánico:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado mecánico",
        variant: "destructive",
      })
    } finally {
      setTimeout(() => {
        setPendingUpdates((prev) => {
          const newSet = new Set(prev)
          newSet.delete(item.id)
          return newSet
        })
      }, 800)
    }
  }

  // Manejar edición del campo OR
  const handleOREdit = (id: string) => {
    setEditingOR(id)
    // Usar un timeout más largo para asegurar que el input esté listo
    setTimeout(() => {
      if (orInputRef.current) {
        orInputRef.current.focus()

        // Posicionar el cursor al final del texto
        const value = orValues[id] || "ORT"
        const length = value.length
        orInputRef.current.setSelectionRange(length, length)
      }
    }, 100) // Aumentar el timeout a 100ms
  }

  // Guardar valor del campo OR
  const handleORSave = async (id: string) => {
    try {
      setPendingUpdates((prev) => new Set(prev).add(id))

      const orValue = orValues[id] || "ORT"

      // Actualizar en la base de datos
      const { error } = await supabase.from("stock").update({ work_order: orValue }).eq("id", id)

      if (error) {
        console.error("Error al guardar valor OR:", error)
        throw new Error(error.message)
      }

      // Actualizar la UI
      setStock((prevStock) =>
        prevStock.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              work_order: orValue,
              updated_at: new Date().toISOString(),
            }
          }
          return item
        }),
      )

      setEditingOR(null)
    } catch (error: any) {
      console.error("Error al guardar valor OR:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el valor OR",
        variant: "destructive",
      })
    } finally {
      setTimeout(() => {
        setPendingUpdates((prev) => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
      }, 800)
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

  // Modificar la función para actualizar el centro de trabajo
  const handleWorkCenterChange = async (item: StockItem, value: string) => {
    try {
      setPendingUpdates((prev) => new Set(prev).add(item.id))

      const updateData: any = {
        work_center: value,
      }

      // Si no es "Externo", guardar directamente y limpiar external_provider
      if (value !== "Externo") {
        updateData.external_provider = null

        // Actualizar en la base de datos
        const { error } = await supabase.from("stock").update(updateData).eq("id", item.id)

        if (error) {
          console.error("Error al actualizar centro de trabajo:", error)
          throw new Error(error.message)
        }

        // Actualizar la UI optimistamente
        setStock((prevStock) =>
          prevStock.map((stockItem) => {
            if (stockItem.id === item.id) {
              return {
                ...stockItem,
                ...updateData,
                updated_at: new Date().toISOString(),
              }
            }
            return stockItem
          }),
        )

        toast({
          title: "Centro de trabajo actualizado",
          description: `Se ha asignado el centro de trabajo ${value} al vehículo ${item.license_plate}`,
        })
      } else {
        // Si es "Externo", activar modo de edición
        handleEditClick(item)
        handleEditFormChange("work_center", value)

        // Enfocar el campo de proveedor externo
        setTimeout(() => {
          if (externalProviderInputRef.current) {
            externalProviderInputRef.current.focus()
          }
        }, 100)
      }
    } catch (error: any) {
      console.error("Error al actualizar centro de trabajo:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el centro de trabajo",
        variant: "destructive",
      })
    } finally {
      if (value !== "Externo") {
        setTimeout(() => {
          setPendingUpdates((prev) => {
            const newSet = new Set(prev)
            newSet.delete(item.id)
            return newSet
          })
        }, 800)
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Estilos para las animaciones personalizadas */}
      <style jsx global>{`
        @keyframes priorityPulseHigh {
          0%, 100% { transform: scale(0.7); opacity: 0.9; }
          50% { transform: scale(1); opacity: 1; }
        }
        @keyframes priorityPulseMedium {
          0%, 100% { transform: scale(0.7); opacity: 0.9; }
          50% { transform: scale(1); opacity: 1; }
        }
        @keyframes priorityPulseLow {
          0%, 100% { transform: scale(0.7); opacity: 0.9; }
          50% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Barra de búsqueda y filtros */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-card rounded-lg p-2 shadow-sm mb-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar..."
                className="pl-8 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
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
                onClick={toggleSortDirection}
                className="h-9 w-9"
                title="Ordenar"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <TabsList className="h-9 bg-muted/50">
            <TabsTrigger value="all" className="px-3 py-1 h-7 data-[state=active]:bg-background">
              <Filter className="h-3.5 w-3.5 mr-1" />
              <span>Todos</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="px-3 py-1 h-7 data-[state=active]:bg-background">
              <Clock className="h-3.5 w-3.5 mr-1" />
              <span>Pendientes</span>
            </TabsTrigger>
            <TabsTrigger value="in_process" className="px-3 py-1 h-7 data-[state=active]:bg-background">
              <Wrench className="h-3.5 w-3.5 mr-1" />
              <span>En proceso</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="px-3 py-1 h-7 data-[state=active]:bg-background">
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              <span>Completados</span>
            </TabsTrigger>
            <TabsTrigger value="vendido" className="px-3 py-1 h-7 data-[state=active]:bg-background">
              <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Vendido</span>
            </TabsTrigger>
            <TabsTrigger value="profesionales" className="px-3 py-1 h-7 data-[state=active]:bg-background">
              <Tag className="h-3.5 w-3.5 mr-1" />
              <span>Profesionales</span>
            </TabsTrigger>
            <TabsTrigger value="premature_sales" className="px-3 py-1 h-7 data-[state=active]:bg-background">
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              <span>Ventas Prematuras</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Contenido de las pestañas */}
        <TabsContent value="all" className="mt-0">
          <div className="rounded-lg border shadow-sm overflow-hidden mb-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent border-b border-border">
                  <TableHead className="text-xs py-2">MATRÍCULA</TableHead>
                  <TableHead className="text-xs py-2">MODELO</TableHead>
                  <TableHead className="text-xs py-2">TIPO</TableHead>
                  <TableHead className="text-xs py-2">VENTA</TableHead>
                  <TableHead className="text-xs py-2">DÍAS</TableHead>
                  <TableHead className="text-xs py-2">OR</TableHead>
                  <TableHead className="text-xs py-2">CARGO GASTOS</TableHead>
                  <TableHead className="text-xs py-2">ESTADO CARROCERIA</TableHead>
                  <TableHead className="text-xs py-2">ESTADO MECÁNICA</TableHead>
                  <TableHead className="text-xs py-2">PERITADO</TableHead>
                  <TableHead className="text-xs py-2">CENTRO TRABAJO</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={16} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <BMWMSpinner size={20} />
                        <span className="ml-2">Cargando datos...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : displayedStock.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={16} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Car className="h-10 w-10 mb-2" />
                        <p>No se encontraron vehículos en stock</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedStock.map((item, index) => {
                    const isUpdating = pendingUpdates.has(item.id)
                    const isEditing = editingId === item.id
                    const isEditingOR = editingOR === item.id
                    const isPhotographed = photoStatus[item.license_plate] || false
                    const paintStatusValue = paintStatus[item.license_plate] || ""

                    return (
                      <TableRow
                        key={item.id}
                        className={cn("h-8 hover:bg-muted/30", index % 2 === 0 ? "bg-black/5 dark:bg-black/20" : "", isEditing && "bg-blue-50 dark:bg-blue-900/20")}
                      >
                        <TableCell className="py-0.5 font-medium">
                          <div className="flex items-center gap-2">
                            {(item as StockItemWithPriority).calculatedPriority === Priority.HIGH && (
                              <div className={priorityStyles.container}>
                                <div className={priorityStyles.high.dot} title="Prioridad alta" />
                                <div className={priorityStyles.high.wave} />
                              </div>
                            )}
                            {(item as StockItemWithPriority).calculatedPriority === Priority.MEDIUM && (
                              <div className={priorityStyles.container}>
                                <div className={priorityStyles.medium.dot} title="Prioridad media" />
                                <div className={priorityStyles.medium.wave} />
                              </div>
                            )}
                            {(item as StockItemWithPriority).calculatedPriority === Priority.LOW && (
                              <div className={priorityStyles.container}>
                                <div className={priorityStyles.low.dot} title="Prioridad baja" />
                                <div className={priorityStyles.low.wave} />
                              </div>
                            )}
                            {item.license_plate}
                          </div>
                        </TableCell>
                        <TableCell className="py-0.5">{item.model}</TableCell>
                        <TableCell className="py-0.5">{item.vehicle_type || "-"}</TableCell>
                        <TableCell className="py-0.5">
                          <div className="flex items-center gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>Fecha de venta</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <span>{formatDate(item.reception_date)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-0.5">
                          {item.reception_date
                            ? Math.ceil(
                                (new Date().getTime() - new Date(item.reception_date).getTime()) / (1000 * 60 * 60 * 24),
                              )
                            : "-"}
                        </TableCell>
                        <TableCell className="py-0.5 w-32">
                          {isEditingOR ? (
                            <div className="flex items-center">
                              <Input
                                ref={orInputRef}
                                value={orValues[item.id] || "ORT"}
                                onChange={(e) => handleORChange(item.id, e.target.value)}
                                onBlur={() => handleORSave(item.id)}
                                onKeyDown={(e) => handleORKeyDown(e, item.id)}
                                className="h-8 text-sm font-mono"
                                style={{ minWidth: "14ch", width: "14ch" }}
                                autoFocus
                              />
                            </div>
                          ) : (
                            <div
                              className="h-8 flex items-center px-2 border border-gray-300 rounded-md cursor-pointer font-mono overflow-hidden"
                              style={{ minWidth: "14ch", width: "auto", maxWidth: "14ch" }}
                              onClick={() => handleOREdit(item.id)}
                            >
                              <span className="truncate w-full" title={orValues[item.id] || "ORT"}>
                                {orValues[item.id] || "ORT"}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-0.5">{item.expense_type_name || item.expense_charge || "-"}</TableCell>
                        <TableCell className="py-0.5">
                          {isEditing ? (
                            <Select
                              value={editFormData.body_status || item.body_status}
                              onValueChange={(value) => handleEditFormChange("body_status", value)}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Seleccionar estado" />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : item.body_status === "apto" ? (
                            <div className="flex flex-col">
                              <div className="flex items-center justify-center h-8 w-full border border-green-300 dark:border-green-700 rounded-md px-2 text-green-600">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {item.body_status_date ? formatDate(item.body_status_date) : "Apto"}
                              </div>
                            </div>
                          ) : item.body_status === "en_proceso" ? (
                            <div className="flex items-center">
                              <button
                                className="flex items-center justify-center h-8 w-full rounded-md px-2 bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-300 hover:text-blue-950 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-800 dark:hover:text-blue-100 transition-colors"
                                onClick={() => handleBodyStatusToggle(item)}
                                disabled={isUpdating || isEditing}
                              >
                                <Wrench className="h-4 w-4 mr-1" />
                                <span className="whitespace-nowrap">En proceso</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              className="flex items-center justify-center h-8 w-full rounded-md px-2 bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-300 hover:text-amber-950 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-800 dark:hover:text-amber-100 transition-colors"
                              onClick={() => handleBodyStatusToggle(item)}
                              disabled={isUpdating || isEditing}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Pendiente
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-0.5">
                          {isEditing ? (
                            <Select
                              value={editFormData.mechanical_status || item.mechanical_status}
                              onValueChange={(value) => handleEditFormChange("mechanical_status", value)}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Seleccionar estado" />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : item.mechanical_status === "apto" ? (
                            <div className="flex flex-col">
                              <div className="flex items-center justify-center h-8 w-full border border-green-300 dark:border-green-700 rounded-md px-2 text-green-600">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {item.mechanical_status_date ? formatDate(item.mechanical_status_date) : "Apto"}
                              </div>
                            </div>
                          ) : item.mechanical_status === "en_proceso" ? (
                            <div className="flex items-center">
                              <button
                                className="flex items-center justify-center h-8 w-full rounded-md px-2 bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-300 hover:text-blue-950 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-800 dark:hover:text-blue-100 transition-colors"
                                onClick={() => handleMechanicalStatusToggle(item)}
                                disabled={isUpdating || isEditing}
                              >
                                <Wrench className="h-4 w-4 mr-1" />
                                <span className="whitespace-nowrap">En proceso</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              className="flex items-center justify-center h-8 w-full rounded-md px-2 bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-300 hover:text-amber-950 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-800 dark:hover:text-amber-100 transition-colors"
                              onClick={() => handleMechanicalStatusToggle(item)}
                              disabled={isUpdating || isEditing}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Pendiente
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-0.5">
                          {item.inspection_date ? (
                            <div className="flex items-center justify-center h-8 w-full border border-green-300 dark:border-green-700 rounded-md px-2 text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {formatDate(item.inspection_date)}
                            </div>
                          ) : (
                            <button
                              className="flex items-center justify-center h-8 w-full rounded-md px-2 bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-300 hover:text-amber-950 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-800 dark:hover:text-amber-100 transition-colors"
                              onClick={() => handleInspectionToggle(item)}
                              disabled={isUpdating || isEditing}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Pendiente
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-0.5">
                          {isEditing ? (
                            <div className="space-y-2">
                              <Select
                                value={editFormData.work_center || item.work_center || ""}
                                onValueChange={(value) => handleEditFormChange("work_center", value)}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Seleccionar centro" />
                                </SelectTrigger>
                                <SelectContent>
                                  {WORK_CENTER_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {(editFormData.work_center === "Externo" ||
                                (item.work_center === "Externo" && editFormData.work_center === undefined)) && (
                                <Input
                                  ref={externalProviderInputRef}
                                  placeholder="Nombre del proveedor"
                                  value={editFormData.external_provider || item.external_provider || ""}
                                  onChange={(e) => handleEditFormChange("external_provider", e.target.value)}
                                  className="h-8 text-sm"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault()
                                      handleSaveEdit()
                                    }
                                  }}
                                  onBlur={handleSaveEdit}
                                />
                              )}
                            </div>
                          ) : (
                            <Select
                              value={item.work_center || "Terrassa"}
                              onValueChange={(value) => handleWorkCenterChange(item, value)}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Seleccionar centro">
                                  <div className="flex items-center gap-1">
                                    <span>
                                      {item.work_center || "Terrassa"}
                                      {item.work_center === "Externo" && item.external_provider && (
                                        <span className="text-xs text-muted-foreground ml-1">
                                          ({item.external_provider})
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {WORK_CENTER_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {/* Paginación fuera del div de la tabla */}
          {filteredStock.length > 0 && (
            <div className="mt-4 rounded-lg border bg-card shadow-sm px-0 py-0">
              <ReusablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredStock.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={(value) => {
                  setItemsPerPage(value)
                  setCurrentPage(1)
                }}
                itemsPerPageOptions={[5, 10, 20, 50]}
                showItemsPerPage={true}
                showFirstLastButtons={true}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de filtro de fechas */}
      <Dialog open={showDateFilter} onOpenChange={setShowDateFilter}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filtro de Fechas</DialogTitle>
            <DialogDescription>Selecciona un rango de fechas para filtrar por fecha de recepción</DialogDescription>
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
    </div>
  )
}
