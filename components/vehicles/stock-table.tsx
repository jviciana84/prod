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
  AlertCircle,
  XCircle,
  Car,
  Tag,
  Truck,
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
import { DateFilter } from "@/components/ui/date-filter"

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

// Componente para mostrar cuando no hay datos
const NoDataMessage = ({ message = "No hay datos disponibles" }: { message?: string }) => (
  <TableRow>
    <TableCell colSpan={16} className="text-center py-8">
      <div className="flex flex-col items-center justify-center text-muted-foreground">
        <Car className="h-10 w-10 mb-2" />
        <p>{message}</p>
      </div>
    </TableCell>
  </TableRow>
)

export default function StockTable({ initialStock = [], onRefresh }: StockTableProps) {
  console.log("🚀 StockTable - Componente iniciando con initialStock:", initialStock.length)
  
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
  const [dateFilter, setDateFilter] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [expenseTypes, setExpenseTypes] = useState<Array<{ value: string; label: string }>>([])

  const supabase = getSupabaseClient()
  console.log("🔌 Supabase client inicializado:", !!supabase)
  const { toast } = useToast()
  const externalProviderInputRef = useRef<HTMLInputElement>(null)
  const orInputRef = useRef<HTMLInputElement>(null)

  // Añade este useEffect después de la declaración de las variables de estado
  useEffect(() => {
    console.log("🔄 useEffect inicial - Componente montado, iniciando carga de datos...")
    // Cargar datos al montar el componente
    fetchStock()
    fetchExpenseTypes()
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
    console.log("🔄 useEffect filtrado - activeTab:", activeTab, "stock.length:", stock.length)
    let filtered = stock

    // Primero aplicar filtro de búsqueda (ANTES de los filtros de pestaña)
    console.log("🔍 Aplicando filtro de búsqueda - searchTerm:", searchTerm, "filtered.length antes:", filtered.length)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      console.log("🔍 Término de búsqueda (lowercase):", term)
      
      const beforeFilter = filtered.length
      filtered = filtered.filter(
        (item) => {
          const matchesLicense = item.license_plate?.toLowerCase().includes(term) || false
          const matchesModel = item.model?.toLowerCase().includes(term) || false
          const matchesWorkCenter = item.work_center?.toLowerCase().includes(term) || false
          const matchesProvider = item.external_provider?.toLowerCase().includes(term) || false
          const matchesOR = (orValues[item.id] && orValues[item.id].toLowerCase().includes(term)) || false
          const matchesExpense = (item.expense_charge && item.expense_charge.toLowerCase().includes(term)) || false
          
          const matches = matchesLicense || matchesModel || matchesWorkCenter || matchesProvider || matchesOR || matchesExpense
          
          if (matches) {
            console.log("✅ Coincidencia encontrada:", item.license_plate, "matches:", { matchesLicense, matchesModel, matchesWorkCenter, matchesProvider, matchesOR, matchesExpense })
          }
          
          return matches
        }
      )
      console.log("🔍 Filtro de búsqueda aplicado - antes:", beforeFilter, "después:", filtered.length)
    }

    // Aplicar filtro de fechas
    if (dateFilter.from || dateFilter.to) {
      filtered = filtered.filter((item) => {
        if (!item.reception_date) return false
        const receptionDate = new Date(item.reception_date)
        
        if (dateFilter.from && receptionDate < dateFilter.from) return false
        if (dateFilter.to && receptionDate > dateFilter.to) return false
        
        return true
      })
    }

    // Luego aplicar filtro por estado (pestaña)
    if (activeTab === "pending") {
      // Pendientes = NO vendidos Y NO completados (NO tienen body_status Y mechanical_status ambos "apto")
      filtered = filtered.filter((item) => {
        // Primero: NO debe estar vendido
        if (item.is_sold === true) return false
        
        // Segundo: NO debe estar completado (NO debe tener body_status Y mechanical_status ambos "apto")
        const isBodyCompleted = item.body_status === "apto"
        const isMechanicalCompleted = item.mechanical_status === "apto"
        const isCompleted = isBodyCompleted && isMechanicalCompleted
        
        // Si está completado, NO va en pendientes
        if (isCompleted) return false
        
        // Si no está completado, va en pendientes
        return true
      })
      console.log("🔍 Pestaña 'pending' - Vehículos pendientes encontrados:", filtered.length)
      console.log("📊 Paginador - totalItems:", filtered.length, "totalPages:", Math.max(1, Math.ceil(filtered.length / itemsPerPage)))
    } else if (activeTab === "in_process") {
      // En proceso = NO vendidos Y que tengan al menos uno en 'en_proceso'
      filtered = filtered.filter((item) => {
        // Primero: NO debe estar vendido
        if (item.is_sold === true) return false
        
        // Segundo: Debe tener al menos uno de los estados como 'en_proceso'
        const hasInProcessPaint = item.paint_status === "en_proceso"
        const hasInProcessBody = item.body_status === "en_proceso"
        const hasInProcessMechanical = item.mechanical_status === "en_proceso"
        
        return hasInProcessPaint || hasInProcessBody || hasInProcessMechanical
      })
      console.log("🔍 Pestaña 'in_process' - Vehículos en proceso encontrados:", filtered.length)
    } else if (activeTab === "completed") {
      // Completados = body_status Y mechanical_status ambos "apto" (independientemente de paint_status y vendido)
      filtered = filtered.filter((item) => {
        const isBodyCompleted = item.body_status === "apto"
        const isMechanicalCompleted = item.mechanical_status === "apto"
        
        return isBodyCompleted && isMechanicalCompleted
      })
      console.log("🔍 Pestaña 'completed' - Vehículos completados encontrados:", filtered.length)
    } else if (activeTab === "disponible") {
      // Filtrar vehículos disponibles (que NO estén vendidos)
      filtered = filtered.filter((item) => 
        !item.is_sold
      )
      
      console.log("🔍 Vehículos disponibles encontrados:", filtered.length)
      console.log("🔍 Ejemplos de vehículos disponibles:", filtered.slice(0, 3).map(v => ({ license_plate: v.license_plate, is_sold: v.is_sold })))
    } else if (activeTab === "vendido") {
      // Filtrar vehículos vendidos usando is_sold
      filtered = filtered.filter((item) => 
        item.is_sold === true
      )
      
      console.log("🔍 Vehículos vendidos encontrados:", filtered.length)
      console.log("🔍 Ejemplos de vehículos vendidos:", filtered.slice(0, 3).map(v => ({ license_plate: v.license_plate, is_sold: v.is_sold })))
    } else if (activeTab === "profesionales") {
      // Obtener vehículos No Retail directamente de vehicle_sale_status
      const fetchNoRetailVehicles = async () => {
        console.log("🔍 Buscando vehículos profesionales en vehicle_sale_status...")
        try {
          // Primero intentamos obtener la estructura de la tabla
          const { data: structureData, error: structureError } = await supabase
            .from('vehicle_sale_status')
            .select('*')
            .limit(1)

          if (structureError) {
            console.log("❌ Error al obtener estructura:", structureError.message)
            setFilteredStock([])
            setTotalPages(1)
            setCurrentPage(1)
            return
          }

          // Si hay datos, intentamos diferentes enfoques
          if (structureData && structureData.length > 0) {
            const sampleRecord = structureData[0]
            console.log("📊 Estructura de muestra:", Object.keys(sampleRecord))
            
            // Intentamos diferentes columnas posibles
            let query = supabase.from('vehicle_sale_status').select('*')
            
            // Si existe una columna que indique tipo de venta, la usamos
            if ('sale_status' in sampleRecord) {
              query = query.eq('sale_status', 'professional')
            } else if ('sale_type' in sampleRecord) {
              query = query.eq('sale_type', 'professional')
            } else if ('tipo_venta' in sampleRecord) {
              query = query.eq('tipo_venta', 'profesional')
            } else if ('categoria' in sampleRecord) {
              query = query.eq('categoria', 'profesional')
            } else {
              // Si no hay columnas específicas, tomamos todos los registros
              console.log("⚠️ No se encontró columna específica para filtrar profesionales")
            }

            const { data: noRetailVehicles, error } = await query
            console.log("📊 Resultado profesionales:", noRetailVehicles?.length || 0, "error:", error?.message)

            if (error) {
              console.log("❌ Error en consulta profesionales:", error.message)
              setFilteredStock([])
              setTotalPages(1)
              setCurrentPage(1)
              return
            }

            if (noRetailVehicles && noRetailVehicles.length > 0) {
              const mappedVehicles = noRetailVehicles.map((vehicle: any) => ({
                id: vehicle.id || `no-retail-${vehicle.license_plate}`,
                license_plate: vehicle.license_plate || vehicle.matricula,
                model: vehicle.model || vehicle.modelo,
                vehicle_type: vehicle.vehicle_type || "Coche",
                reception_date: vehicle.created_at || vehicle.fecha_creacion,
                paint_status: vehicle.paint_status || "pendiente",
                body_status: vehicle.body_status || "pendiente",
                mechanical_status: vehicle.mechanical_status || "pendiente",
                work_center: vehicle.work_center || "Terrassa",
                work_order: vehicle.work_order || "",
                expense_charge: vehicle.expense_charge || null,
                expense_type_id: vehicle.expense_type_id || null,
                external_provider: vehicle.external_provider || null,
                inspection_date: vehicle.inspection_date || null,
                body_status_date: vehicle.body_status_date || null,
                mechanical_status_date: vehicle.mechanical_status_date || null,
                body_pending_date: vehicle.body_pending_date || null,
                body_in_process_date: vehicle.body_in_process_date || null,
                mechanical_pending_date: vehicle.mechanical_pending_date || null,
                mechanical_in_process_date: vehicle.mechanical_in_process_date || null,
                body_total_time: vehicle.body_total_time || null,
                mechanical_total_time: vehicle.mechanical_total_time || null,
                body_pending_time: vehicle.body_pending_time || null,
                body_in_process_time: vehicle.body_in_process_time || null,
                mechanical_pending_time: vehicle.mechanical_pending_time || null,
                mechanical_in_process_time: vehicle.mechanical_in_process_time || null,
                vehicle_type: vehicle.vehicle_type || "Coche",
                location_id: vehicle.location_id || null,
                nuevas_entradas_id: vehicle.nuevas_entradas_id || null,
                dealership_code: vehicle.dealership_code || null,
                is_sold: vehicle.is_sold || false,
                created_at: vehicle.created_at || new Date().toISOString(),
                updated_at: vehicle.updated_at || new Date().toISOString(),
              }))

              setFilteredStock(mappedVehicles)
              console.log("✅ Vehículos profesionales cargados:", mappedVehicles.length)
            } else {
              console.log("ℹ️ No hay vehículos profesionales en la base de datos")
              setFilteredStock([])
            }
          } else {
            console.log("ℹ️ No hay datos en vehicle_sale_status")
            setFilteredStock([])
          }
        } catch (error) {
          console.log("❌ Error general en fetchNoRetailVehicles:", error)
          setFilteredStock([])
        }
      }

      fetchNoRetailVehicles()
      return
    } else if (activeTab === "premature_sales") {
      // Obtener vehículos con ventas prematuras
      const fetchPrematureSales = async () => {
        try {
          console.log("🔍 Buscando ventas prematuras en sales_vehicles...")
          const { data: prematureSales, error } = await supabase
            .from("sales_vehicles")
            .select("license_plate, sold_before_body_ready, sold_before_photos_ready")
            .or("sold_before_body_ready.eq.true,sold_before_photos_ready.eq.true")

          console.log("📊 Resultado ventas prematuras:", prematureSales?.length || 0, "error:", error?.message)
          console.log("📋 Detalles de ventas prematuras:", prematureSales)

          if (!error && prematureSales) {
            const prematureLicensePlates = prematureSales.map((v) => v.license_plate)
            console.log("🔍 Matrículas de ventas prematuras:", prematureLicensePlates)
            console.log("🔍 Total de vehículos en filtered antes del filtro:", filtered.length)
            
            const prematureVehicles = filtered.filter((vehicle) =>
              prematureLicensePlates.includes(vehicle.license_plate),
            )

            console.log("✅ Vehículos con ventas prematuras encontrados:", prematureVehicles.length)
            console.log("📋 Vehículos encontrados:", prematureVehicles.map(v => v.license_plate))
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
    } else if (activeTab === "entregados") {
      // Obtener vehículos entregados directamente de entregas
      const fetchDeliveredVehicles = async () => {
        try {
          console.log("🔍 Buscando vehículos entregados en entregas...")
          const { data: deliveredVehicles, error } = await supabase
            .from("entregas")
            .select("id, matricula, modelo, marca, fecha_entrega, asesor")

          console.log("📊 Resultado entregados:", deliveredVehicles?.length || 0, "error:", error?.message)

          if (!error && deliveredVehicles) {
            // Convertir a formato StockItem para mantener compatibilidad
            const deliveredVehiclesList = deliveredVehicles.map((e) => ({
              id: e.id,
              license_plate: e.matricula,
              model: e.modelo,
              vehicle_type: "Coche", // Valor por defecto
              brand: e.marca,
              reception_date: e.fecha_entrega,
              work_center: e.asesor,
              external_provider: "",
              or: "",
              expense_charge: "",
              body_status: "",
              mechanical_status: "",
              inspection_date: null,
              paint_status: "",
              is_sold: true,
              delivery_date: e.fecha_entrega
            } as StockItem))

            console.log("✅ Vehículos entregados procesados:", deliveredVehiclesList.length)
            setFilteredStock(deliveredVehiclesList)
            setTotalPages(Math.max(1, Math.ceil(deliveredVehiclesList.length / itemsPerPage)))
            setCurrentPage(1)
          }
        } catch (err) {
          console.error("Error al obtener vehículos entregados:", err)
        }
      }

      fetchDeliveredVehicles()
      return
    }

    // Para las pestañas que no tienen return statements, aplicar el filtrado normal
    setFilteredStock(filtered)
    setTotalPages(Math.max(1, Math.ceil(filtered.length / itemsPerPage)))
    setCurrentPage(1) // Resetear a la primera página cuando cambian los filtros
    
    console.log("✅ useEffect filtrado completado - filteredStock.length:", filtered.length, "totalPages:", Math.max(1, Math.ceil(filtered.length / itemsPerPage)))
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
    
    console.log("📋 useEffect displayedStock - filteredStock.length:", filteredStock.length, "displayedStock.length:", sorted.slice(startIndex, endIndex).length, "currentPage:", currentPage)
  }, [filteredStock, currentPage, itemsPerPage, sortDirection, sortField, photoStatus, paintStatus, calculatePriority])

  // Cargar tipos de gastos
  const fetchExpenseTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("expense_types")
        .select("id, name")
        .order("name")

      if (error) {
        console.error("Error al obtener tipos de gastos:", error)
        return
      }

      const types = (data || []).map((type) => ({
        value: type.id.toString(),
        label: type.name,
      }))

      setExpenseTypes(types)
    } catch (error) {
      console.error("Error inesperado al cargar tipos de gastos:", error)
    }
  }

  // Cargar datos completos de stock
  const fetchStock = async () => {
    console.log("🔄 Iniciando fetchStock...")
    setIsLoading(true)
    
    try {
      console.log("📡 Consultando tabla stock...")
      
      // Test 1: Consulta simple sin ordenamiento
      console.log("🔍 Test 1: Consulta simple...")
      const { data: simpleData, error: simpleError } = await supabase
        .from('stock')
        .select('id, license_plate')
        .limit(1)
      
      console.log("📊 Test 1 resultado:", simpleData?.length || 0, "error:", simpleError)
      
      if (simpleError) {
        console.error("❌ Error en test simple:", simpleError)
        toast({
          title: "Error al cargar datos",
          description: simpleError.message,
          variant: "destructive"
        })
        return
      }
      
      // Test 2: Consulta completa (excluyendo vehículos entregados)
      console.log("🔍 Test 2: Consulta completa...")
      const { data, error } = await supabase
        .from('stock')
        .select('*')
        .order('created_at', { ascending: false })
      
      console.log("📊 Test 2 resultado:", data?.length || 0, "error:", error)
      
      if (error) {
        console.error("❌ Error en fetchStock:", error)
        toast({
          title: "Error al cargar datos",
          description: error.message,
          variant: "destructive"
        })
        return
      }
      
      console.log("✅ Datos cargados exitosamente:", data?.length || 0, "registros")
      console.log("🔍 Primeros 3 registros:", data?.slice(0, 3))
      setStock(data || [])
      
    } catch (err) {
      console.error("💥 Excepción en fetchStock:", err)
      toast({
        title: "Error inesperado",
        description: "Error al cargar los datos del stock",
        variant: "destructive"
      })
    } finally {
      console.log("🏁 fetchStock completado")
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

  // Función para actualizar cargo de gastos
  const handleExpenseChargeChange = async (item: StockItem, value: string) => {
    try {
      setPendingUpdates((prev) => new Set(prev).add(item.id))

      const { error } = await supabase
        .from("stock")
        .update({ expense_charge: value })
        .eq("id", item.id)

      if (error) {
        console.error("Error al actualizar cargo de gastos:", error)
        toast({
          title: "Error",
          description: "No se pudo actualizar el cargo de gastos",
          variant: "destructive",
        })
        return
      }

      // Actualizar el estado local
      setStock((prev) =>
        prev.map((stockItem) =>
          stockItem.id === item.id ? { ...stockItem, expense_charge: value } : stockItem
        )
      )

      toast({
        title: "Cargo de gastos actualizado",
        description: `Cargo actualizado a: ${value}`,
      })
    } catch (error) {
      console.error("Error inesperado:", error)
      toast({
        title: "Error",
        description: "Error inesperado al actualizar el cargo de gastos",
        variant: "destructive",
      })
    } finally {
      setPendingUpdates((prev) => {
        const newSet = new Set(prev)
        newSet.delete(item.id)
        return newSet
      })
    }
  }

  // Modificar la función para actualizar el centro de trabajo
  const handleWorkCenterChange = async (item: StockItem, value: string) => {
    try {
      setPendingUpdates((prev) => new Set(prev).add(item.id))

      const updateData: any = {
        work_center: value,
        updated_at: new Date().toISOString(),
      }

      // Si no es "Externo", guardar directamente y limpiar external_provider
      if (value !== "Externo") {
        updateData.external_provider = null

        console.log("🔄 Intentando actualizar centro de trabajo:", {
          id: item.id,
          license_plate: item.license_plate,
          old_work_center: item.work_center,
          new_work_center: value
        })

        // Verificar si el work_center actual es válido
        const validWorkCenters = ['Terrassa', 'Sabadell', 'Vilanova', 'Sant Fruitos', 'Externo']
        const currentWorkCenter = item.work_center || ''
        
        if (currentWorkCenter && !validWorkCenters.includes(currentWorkCenter)) {
          console.warn("⚠️ Work center actual no es válido:", currentWorkCenter)
        }

        // Actualizar en la base de datos
        const { data, error } = await supabase
          .from("stock")
          .update(updateData)
          .eq("id", item.id)
          .select()

        if (error) {
          console.error("❌ Error al actualizar centro de trabajo:", error)
          throw new Error(`Error de base de datos: ${error.message}`)
        }

        if (!data || data.length === 0) {
          console.error("❌ No se actualizó ningún registro")
          console.log("🔍 Intentando con upsert...")
          
          // Intentar con upsert como fallback - usar solo columnas esenciales
          const upsertPayload = {
            id: item.id,
            license_plate: item.license_plate,
            model: item.model,
            vehicle_type: item.vehicle_type || 'Coche',
            reception_date: item.reception_date,
            work_center: value,
            external_provider: item.external_provider,
            expense_charge: item.expense_charge,
            body_status: item.body_status || 'pendiente',
            mechanical_status: item.mechanical_status || 'pendiente',
            inspection_date: item.inspection_date,
            paint_status: item.paint_status || 'pendiente',
            updated_at: new Date().toISOString(),
          }

          const { data: upsertResult, error: upsertError } = await supabase
            .from("stock")
            .upsert(upsertPayload)
            .select()

          if (upsertError) {
            console.error("❌ Error en upsert:", upsertError)
            throw new Error(`Error en upsert: ${upsertError.message}`)
          }

          if (!upsertResult || upsertResult.length === 0) {
            throw new Error("No se pudo actualizar el registro ni con upsert")
          }

          console.log("✅ Centro de trabajo actualizado con upsert:", upsertResult[0])
          
          // Actualizar el estado local para reflejar el cambio inmediatamente
          setStock(prevStock => 
            prevStock.map(stockItem => 
              stockItem.id === item.id 
                ? { ...stockItem, work_center: value }
                : stockItem
            )
          )
        } else {
          console.log("✅ Centro de trabajo actualizado exitosamente:", data[0])
          
          // Actualizar el estado local para reflejar el cambio inmediatamente
          setStock(prevStock => 
            prevStock.map(stockItem => 
              stockItem.id === item.id 
                ? { ...stockItem, work_center: value }
                : stockItem
            )
          )
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

        // Actualizar también filteredStock si es necesario
        setFilteredStock((prevFiltered) =>
          prevFiltered.map((stockItem) => {
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
      console.error("❌ Error al actualizar centro de trabajo:", error)
      toast({
        title: "Error al actualizar",
        description: error.message || "No se pudo actualizar el centro de trabajo. Verifica los permisos.",
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
          0%, 100% { 
            transform: scale(0.7); 
            opacity: 0.9; 
          }
          50% { 
            transform: scale(1); 
            opacity: 1; 
          }
        }
        @keyframes priorityPulseMedium {
          0%, 100% { 
            transform: scale(0.7); 
            opacity: 0.9; 
          }
          50% { 
            transform: scale(1); 
            opacity: 1; 
          }
        }
        @keyframes priorityPulseLow {
          0%, 100% { 
            transform: scale(0.7); 
            opacity: 0.9; 
          }
          50% { 
            transform: scale(1); 
            opacity: 1; 
          }
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
                onChange={(e) => {
                  console.log("🔍 Input onChange - valor anterior:", searchTerm, "nuevo valor:", e.target.value)
                  setSearchTerm(e.target.value)
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <DateFilter
                onDateFilterChange={(from, to) => setDateFilter({ from, to })}
                dateFilter={dateFilter}
                title="Filtrar por fecha de recepción"
                description="Selecciona un rango de fechas para filtrar por fecha de recepción"
              />
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
            <TabsTrigger value="disponible" className="px-3 py-1 h-7 data-[state=active]:bg-background">
              <Car className="h-3.5 w-3.5 mr-1" />
              <span>Disponible</span>
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
              <span>No Retail</span>
            </TabsTrigger>
            <TabsTrigger value="premature_sales" className="px-3 py-1 h-7 data-[state=active]:bg-background">
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              <span>Ventas Prematuras</span>
            </TabsTrigger>
            <TabsTrigger value="entregados" className="px-3 py-1 h-7 data-[state=active]:bg-background">
              <Truck className="h-3.5 w-3.5 mr-1" />
              <span>Entregados</span>
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
                  <NoDataMessage />
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
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
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

        {/* Pestaña Pendientes */}
        <TabsContent value="pending" className="mt-0">
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
                  <NoDataMessage message="No hay vehículos pendientes" />
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
          {displayedStock.length > 0 && (
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

        {/* Pestaña En Proceso */}
        <TabsContent value="in_process" className="mt-0">
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
                  <NoDataMessage message="No hay vehículos en proceso" />
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
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-mono">{orValues[item.id] || "ORT"}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOREdit(item.id)}
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
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
          {displayedStock.length > 0 && (
            <div className="mt-4">
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

        {/* Pestaña Completados */}
        <TabsContent value="completed" className="mt-0">
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
                  <NoDataMessage />
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
                              <div className="flex items-center justify-center h-8 w-full border border-yellow-300 dark:border-yellow-700 rounded-md px-2 text-yellow-600">
                                <Clock className="h-4 w-4 mr-1" />
                                En proceso
                              </div>
                            </div>
                          ) : item.body_status === "no_apto" ? (
                            <div className="flex items-center">
                              <div className="flex items-center justify-center h-8 w-full border border-red-300 dark:border-red-700 rounded-md px-2 text-red-600">
                                <XCircle className="h-4 w-4 mr-1" />
                                No apto
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <div className="flex items-center justify-center h-8 w-full border border-gray-300 dark:border-gray-600 rounded-md px-2 text-gray-600 dark:text-gray-400">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Pendiente
                              </div>
                            </div>
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
                              <div className="flex items-center justify-center h-8 w-full border border-yellow-300 dark:border-yellow-700 rounded-md px-2 text-yellow-600">
                                <Clock className="h-4 w-4 mr-1" />
                                En proceso
                              </div>
                            </div>
                          ) : item.mechanical_status === "no_apto" ? (
                            <div className="flex items-center">
                              <div className="flex items-center justify-center h-8 w-full border border-red-300 dark:border-red-700 rounded-md px-2 text-red-600">
                                <XCircle className="h-4 w-4 mr-1" />
                                No apto
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <div className="flex items-center justify-center h-8 w-full border border-gray-300 dark:border-gray-600 rounded-md px-2 text-gray-600 dark:text-gray-400">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Pendiente
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-0.5">
                          {item.inspection_date ? (
                            <div className="flex items-center justify-center h-8 w-full border border-blue-300 dark:border-blue-700 rounded-md px-2 text-blue-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Peritado
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleInspectionToggle(item)}
                                disabled={isUpdating}
                                className="h-8 text-xs"
                              >
                                {isUpdating ? (
                                  <BMWMSpinner size={12} />
                                ) : (
                                  <>
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Peritar
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-0.5">
                          {isEditing ? (
                            <Select
                              value={editFormData.work_center || item.work_center}
                              onValueChange={(value) => handleEditFormChange("work_center", value)}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Seleccionar centro" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Terrassa">Terrassa</SelectItem>
                                <SelectItem value="Sabadell">Sabadell</SelectItem>
                                <SelectItem value="Barcelona">Barcelona</SelectItem>
                                <SelectItem value="Girona">Girona</SelectItem>
                                <SelectItem value="Lleida">Lleida</SelectItem>
                                <SelectItem value="Tarragona">Tarragona</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-sm">{item.work_center || "-"}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
            {displayedStock.length > 0 && (
              <div className="mt-4">
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
          </div>
        </TabsContent>

        {/* Pestaña Vendido */}
        <TabsContent value="vendido" className="mt-0">
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
                  <NoDataMessage />
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
        </TabsContent>

        {/* Pestaña Disponible */}
        <TabsContent value="disponible" className="mt-0">
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
                  <NoDataMessage />
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

        {/* Pestaña No Retail (Profesionales) */}
        <TabsContent value="profesionales" className="mt-0">
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
                <TableRow>
                  <TableCell colSpan={16} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Tag className="h-12 w-12 mb-4 text-muted-foreground/50" />
                      <h3 className="text-lg font-semibold mb-2">En Desarrollo</h3>
                      <p className="text-sm text-center max-w-md">
                        Esta sección estará disponible en futuras actualizaciones. 
                        Aquí se mostrarán las ventas profesionales y no retail.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Pestaña Ventas Prematuras */}
        <TabsContent value="premature_sales" className="mt-0">
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
                  <NoDataMessage message="No hay ventas prematuras disponibles" />
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
                          <div className="flex items-center gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>Días desde recepción</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <span>
                              {item.reception_date
                                ? Math.floor((new Date().getTime() - new Date(item.reception_date).getTime()) / (1000 * 60 * 60 * 24))
                                : "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-0.5">
                          {isEditingOR ? (
                            <Input
                              value={orValues[item.id] || ""}
                              onChange={(e) => handleORChange(item.id, e.target.value)}
                              onKeyDown={(e) => handleORKeyDown(e, item.id)}
                              onBlur={() => handleORSave(item.id)}
                              className="h-6 text-xs"
                              autoFocus
                            />
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="text-xs">{orValues[item.id] || "-"}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOREdit(item.id)}
                                className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-0.5">
                          {isEditing ? (
                            <Select
                              value={editForm.expense_charge || ""}
                              onValueChange={(value) => handleEditFormChange("expense_charge", value)}
                            >
                              <SelectTrigger className="h-6 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Sin cargo</SelectItem>
                                {expenseTypes.map((type) => (
                                  <SelectItem key={type.id} value={type.name}>
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-xs">{item.expense_charge || "-"}</span>
                          )}
                        </TableCell>
                        <TableCell className="py-0.5">
                          {isEditing ? (
                            <Select
                              value={editForm.body_status || ""}
                              onValueChange={(value) => handleEditFormChange("body_status", value)}
                            >
                              <SelectTrigger className="h-6 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map((status) => (
                                  <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex items-center gap-1">
                              <div
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  getStatusColor(item.body_status || "")
                                )}
                              />
                              <span className="text-xs">{item.body_status || "-"}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-0.5">
                          {isEditing ? (
                            <Select
                              value={editForm.mechanical_status || ""}
                              onValueChange={(value) => handleEditFormChange("mechanical_status", value)}
                            >
                              <SelectTrigger className="h-6 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map((status) => (
                                  <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex items-center gap-1">
                              <div
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  getStatusColor(item.mechanical_status || "")
                                )}
                              />
                              <span className="text-xs">{item.mechanical_status || "-"}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-0.5">
                          <div className="flex items-center gap-1">
                            {item.inspection_date ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-xs text-green-600">Peritado</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 text-red-500" />
                                <span className="text-xs text-red-600">No peritado</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-0.5">
                          {isEditing ? (
                            <Select
                              value={editForm.work_center || ""}
                              onValueChange={(value) => handleEditFormChange("work_center", value)}
                            >
                              <SelectTrigger className="h-6 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {WORK_CENTER_OPTIONS.map((center) => (
                                  <SelectItem key={center.value} value={center.value}>
                                    {center.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-xs">{item.work_center || "-"}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Paginación para Ventas Prematuras */}
          {!isLoading && displayedStock.length > 0 && (
            <div className="mt-4">
              <ReusablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={filteredStock.length}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          )}
        </TabsContent>

        {/* Pestaña Entregados */}
        <TabsContent value="entregados" className="mt-0">
          <div className="rounded-lg border shadow-sm overflow-hidden mb-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent border-b border-border">
                  <TableHead className="text-xs py-2">MATRÍCULA</TableHead>
                  <TableHead className="text-xs py-2">MODELO</TableHead>
                  <TableHead className="text-xs py-2">MARCA</TableHead>
                  <TableHead className="text-xs py-2">FECHA ENTREGA</TableHead>
                  <TableHead className="text-xs py-2">ASESOR</TableHead>
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
                  <NoDataMessage message="No hay vehículos entregados" />
                ) : (
                  displayedStock.map((item, index) => (
                    <TableRow
                      key={item.id}
                      className={cn("h-8 hover:bg-muted/30", index % 2 === 0 ? "bg-black/5 dark:bg-black/20" : "")}
                    >
                      <TableCell className="py-0.5 font-medium">{item.license_plate}</TableCell>
                      <TableCell className="py-0.5">{item.model}</TableCell>
                      <TableCell className="py-0.5">{item.brand || "-"}</TableCell>
                      <TableCell className="py-0.5">{formatDate(item.reception_date)}</TableCell>
                      <TableCell className="py-0.5">{item.work_center || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Paginación para Entregados */}
          {!isLoading && displayedStock.length > 0 && (
            <div className="mt-4">
              <ReusablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={filteredStock.length}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>


    </div>
  )
}
