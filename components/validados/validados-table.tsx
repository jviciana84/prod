"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Filter,
  Plus,
  Minus,
  CreditCard,
  Mail,
  MapPin,
  Globe,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { ReusablePagination } from "@/components/ui/reusable-pagination"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClientComponentClient } from "@/lib/supabase/client"
import { formatDateForDisplay } from "@/lib/date-utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DateFilter } from "@/components/ui/date-filter"

// Tipo para los pedidos validados - ACTUALIZADO con todos los campos
type PedidoValidado = {
  id: string
  vehicle_id: string
  fecha: string
  matricula: string
  vendedor: string
  tipo: "Coche" | "Moto"
  formaPago: "Contado" | "Financiado" | "Externa"
  tipoDocumento: "DNI" | "NIE" | "CIF"
  documento: string
  observaciones: string
  precio: number
  // Nuevos campos añadidos
  bastidor: string
  banco: string
  clienteDni: string
  precioCompra: number
  marca: string
  color: string
  kilometraje: number
  fechaMatriculacion: string
  portalOrigen: string
  clienteNombre: string
  clienteTelefono: string
  clienteEmail: string
  clienteDireccion: string
  estadoCyp: string
  fechaCyp: string
  estadoFoto360: string
  fechaFoto360: string
  centroEntrega: string
  proveedorExterno: string
  tasado: boolean
  fechaTasacion: string
  esReventa: boolean
  esDuplicado: boolean
  // Campos para ventas caídas
  is_failed_sale?: boolean
  failed_reason?: string
  failed_date?: string
}

// Tipo de pestaña
type PedidoTab = "todos" | "coches" | "motos" | "contado" | "financiado" | "ventas_caidas"

// Tipo para los filtros de fecha
type DateFilterItem = {
  year: number
  expanded: boolean
  selected: boolean
  months: {
    month: number
    selected: boolean
  }[]
}

// Nombres de los meses en español
const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
]

interface ValidadosTableProps {
  onRefreshRequest?: () => void
}

// Función para extraer marca del modelo
const extractBrandFromModel = (modelo: string | null): string => {
  if (!modelo) return ""
  const modeloUpper = modelo.toUpperCase()
  if (modeloUpper.includes("BMW")) return "BMW"
  if (modeloUpper.includes("MINI")) return "MINI"
  return ""
}

// Cambiado a export function para que coincida con la importación esperada
export function ValidadosTable({ onRefreshRequest }: ValidadosTableProps) {
  const [pedidos, setPedidos] = useState<PedidoValidado[]>([])
  const [filteredPedidos, setFilteredPedidos] = useState<PedidoValidado[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dateFilterOpen, setDateFilterOpen] = useState(false)
  const [dateFilters, setDateFilters] = useState<DateFilterItem[]>([])
  const [activeFilters, setActiveFilters] = useState<{
    years: number[]
    months: { year: number; month: number }[]
  }>({ years: [], months: [] })

  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState<PedidoTab>("todos")

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [paginatedPedidos, setPaginatedPedidos] = useState<PedidoValidado[]>([])
  const [totalPages, setTotalPages] = useState(1)

  // Contadores para las pestañas
  const [counts, setCounts] = useState({
    todos: 0,
    coches: 0,
    motos: 0,
    contado: 0,
    financiado: 0,
    ventas_caidas: 0,
  })

  // Estado para la vista simplificada - CAMBIAR A TRUE POR DEFECTO
  const [isSimplifiedView, setIsSimplifiedView] = useState(true)

  // Estados para el filtro de fechas temporal
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })


  // Cliente Supabase solo para mutaciones (updates/deletes)
  // Las consultas iniciales ahora usan API Routes
  // NOTA: Crear cliente fresco en cada mutación para evitar zombie client

  // Inicializar filtros de fecha
  useEffect(() => {
    // Obtener años únicos de los pedidos
    const years = Array.from(new Set(pedidos.map((pedido) => new Date(pedido.fecha).getFullYear()))).sort(
      (a, b) => b - a,
    ) // Ordenar de más reciente a más antiguo

    // Crear estructura de filtros
    const filters: DateFilterItem[] = years.map((year) => ({
      year,
      expanded: false,
      selected: false,
      months: Array.from({ length: 12 }, (_, i) => ({
        month: i,
        selected: false,
      })),
    }))

    setDateFilters(filters)
  }, [pedidos])

  // Cargar datos al montar el componente
  useEffect(() => {
    loadPedidos()
  }, [])

  // NUEVA FUNCIÓN: Actualizar datos faltantes
  const updateMissingData = async () => {
    console.log("🔄 Iniciando actualización de datos faltantes...")
    setRefreshing(true)

    try {
      // Obtener pedidos que necesitan actualización
      const { data: salesData, error: salesError } = await supabase
        .from("sales_vehicles")
        .select("*")
        .or("client_email.is.null,model.is.null,color.is.null,mileage.is.null,brand.is.null")

      if (salesError) {
        console.error("❌ Error obteniendo ventas:", salesError)
        toast.error("Error obteniendo datos de ventas")
        return
      }

      if (!salesData || salesData.length === 0) {
        toast.info("No hay datos faltantes para actualizar")
        return
      }

      console.log(`📊 Encontradas ${salesData.length} ventas con datos faltantes`)

      let updatedCount = 0

      for (const sale of salesData) {
        // Preparar datos para actualizar
        const updateData: any = {}

        // Extraer marca del modelo si no existe
        if (!sale.brand && sale.model) {
          const extractedBrand = extractBrandFromModel(sale.model)
          if (extractedBrand) {
            updateData.brand = extractedBrand
          }
        }

        if (sale.pdf_extraction_id) {
          // Obtener datos del PDF
          const { data: pdfData, error: pdfError } = await supabase
            .from("pdf_extracted_data")
            .select("*")
            .eq("id", sale.pdf_extraction_id)
            .single()

          if (pdfError || !pdfData) {
            console.log(`⚠️ No se encontraron datos PDF para venta ${sale.id}`)
            continue
          }

          if (!sale.client_email && pdfData.email) {
            updateData.client_email = pdfData.email
          }

          if (!sale.model && pdfData.modelo) {
            // Limpiar modelo (quitar marca)
            let cleanModel = pdfData.modelo.trim()
            if (cleanModel.toUpperCase().startsWith("BMW ")) {
              cleanModel = cleanModel.substring(4).trim()
            } else if (cleanModel.toUpperCase().startsWith("MINI ")) {
              cleanModel = cleanModel.substring(5).trim()
            }
            updateData.model = cleanModel
          }

          if (!sale.color && pdfData.color) {
            updateData.color = pdfData.color
          }

          if (!sale.mileage && pdfData.kilometros) {
            updateData.mileage = pdfData.kilometros
          }

          if (!sale.registration_date && pdfData.primera_fecha_matriculacion) {
            updateData.registration_date = pdfData.primera_fecha_matriculacion
          }

          // Extraer marca del modelo del PDF si no se había extraído antes
          if (!updateData.brand && pdfData.modelo) {
            const extractedBrand = extractBrandFromModel(pdfData.modelo)
            if (extractedBrand) {
              updateData.brand = extractedBrand
            }
          }
        }

        // Solo actualizar si hay datos nuevos
        if (Object.keys(updateData).length > 0) {
          updateData.updated_at = new Date().toISOString()

          const { error: updateError } = await supabase.from("sales_vehicles").update(updateData).eq("id", sale.id)

          if (updateError) {
            console.error(`❌ Error actualizando venta ${sale.id}:`, updateError)
          } else {
            updatedCount++
            console.log(`✅ Actualizada venta ${sale.id} con:`, Object.keys(updateData))
          }
        }
      }

      toast.success(`✅ Actualizados ${updatedCount} registros con datos faltantes`)

      // Recargar datos
      await loadPedidos()
    } catch (error) {
      console.error("❌ Error en actualización:", error)
      toast.error("Error actualizando datos faltantes")
    } finally {
      setRefreshing(false)
    }
  }

  // Función para cargar los pedidos desde API Route
  const loadPedidos = async () => {
    setLoading(true)
    try {
      console.log("Cargando pedidos validados desde API...")

      // Usar API Route en lugar de cliente Supabase directo
      const response = await fetch("/api/validados/list")
      
      if (!response.ok) {
        const error = await response.json()
        console.error("Error en API:", error)
        toast.error("Error al cargar los datos. Por favor, contacta soporte.")
        setPedidos([])
        actualizarContadores([])
        return
      }

      const { data } = await response.json()

      if (data && data.length > 0) {
        console.log(`Se encontraron ${data.length} pedidos validados desde API`)

        // Transformar los datos al formato esperado por el componente
        const formattedData: PedidoValidado[] = data.map((item) => ({
          id: item.id,
          vehicle_id: item.vehicle_id,
          fecha: item.validation_date || item.created_at,
          matricula: item.license_plate || "",
          vendedor: item.advisor_name || item.advisor || "",
          tipo: item.vehicle_type || "Coche",
          formaPago: item.payment_method || "Contado",
          tipoDocumento: item.document_type || "DNI",
          documento: item.client_dni || "",
          observaciones: item.observations || "",
          precio: item.price || 0,
          // Nuevos campos mapeados
          bastidor: item.vin || "",
          banco: item.bank || "",
          clienteDni: item.client_dni || "",
          precioCompra: item.purchase_price || 0,
          marca: item.brand || "",
          color: item.color || "",
          kilometraje: item.mileage || 0,
          fechaMatriculacion: item.registration_date || "",
          portalOrigen: item.origin_portal || "",
          clienteNombre: item.client_name || "",
          clienteTelefono: item.client_phone || "",
          clienteEmail: item.client_email || "",
          clienteDireccion: item.client_address || "",
          estadoCyp: item.cyp_status || "",
          fechaCyp: item.cyp_date || "",
          estadoFoto360: item.photo_360_status || "",
          fechaFoto360: item.photo_360_date || "",
          centroEntrega: item.delivery_center || "",
          proveedorExterno: item.external_provider || "",
          tasado: item.appraised || false,
          fechaTasacion: item.appraisal_date || "",
          esReventa: item.is_resale || false,
          esDuplicado: item.is_duplicate || false,
          // Campos para ventas caídas
          is_failed_sale: item.is_failed_sale || false,
          failed_reason: item.failed_reason || "",
          failed_date: item.failed_date || "",
        }))

        setPedidos(formattedData)

        // Calcular contadores para las pestañas
        actualizarContadores(formattedData)
      } else {
        console.log("No se encontraron pedidos validados en Supabase, usando datos de ejemplo")
        usarDatosEjemplo()
      }
    } catch (err) {
      console.error("Error en la consulta:", err)
      toast.error("Error al cargar los datos")
      usarDatosEjemplo()
    } finally {
      setLoading(false)
    }
  }

  // Función para usar datos de ejemplo
  const usarDatosEjemplo = () => {
    console.log("Usando datos de ejemplo")

    // Datos de ejemplo para la tabla
    const pedidosEjemplo: PedidoValidado[] = [
      {
        id: "1",
        vehicle_id: "vehicle-1",
        fecha: "2023-05-15T10:30:00",
        matricula: "1234ABC",
        vendedor: "Juan Pérez",
        tipo: "Coche",
        formaPago: "Financiado",
        tipoDocumento: "DNI",
        documento: "12345678Z",
        observaciones: "Cliente VIP",
        precio: 15000,
        bastidor: "WVWZZZ1JZ3W386752",
        banco: "Banco Santander",
        clienteDni: "12345678Z",
        precioCompra: 12000,
        marca: "Volkswagen",
        color: "Blanco",
        kilometraje: 50000,
        fechaMatriculacion: "2020-03-15",
        portalOrigen: "Coches.net",
        clienteNombre: "María García",
        clienteTelefono: "666123456",
        clienteEmail: "maria@email.com",
        clienteDireccion: "Calle Mayor 123, Madrid",
        estadoCyp: "completado",
        fechaCyp: "2023-05-16T09:00:00",
        estadoFoto360: "pendiente",
        fechaFoto360: "",
        centroEntrega: "Terrassa",
        proveedorExterno: "",
        tasado: true,
        fechaTasacion: "2023-05-14T14:30:00",
        esReventa: false,
        esDuplicado: false,
      },
      // Puedes añadir más datos de ejemplo aquí
    ]

    setPedidos(pedidosEjemplo)
    actualizarContadores(pedidosEjemplo)

    // Mostrar notificación para informar al usuario
    toast.info("Mostrando datos de ejemplo. Conecte a Supabase para ver datos reales.")
  }

  // Función para actualizar contadores
  const actualizarContadores = (data: PedidoValidado[]) => {
    const allCount = data.length
    const cochesCount = data.filter((v) => v.tipo === "Coche").length
    const motosCount = data.filter((v) => v.tipo === "Moto").length
    const contadoCount = data.filter((v) => v.formaPago === "Contado").length
    const financiadoCount = data.filter((v) => v.formaPago === "Financiado").length
    const ventasCaidasCount = data.filter((v) => v.is_failed_sale === true).length

    setCounts({
      todos: allCount,
      coches: cochesCount,
      motos: motosCount,
      contado: contadoCount,
      financiado: financiadoCount,
      ventas_caidas: ventasCaidasCount,
    })
  }

  // Función para actualizar manualmente
  const handleRefresh = async () => {
    setRefreshing(true)
    await updateMissingData() // NUEVA: Actualizar datos faltantes
    setRefreshing(false)

    // Notificar que se ha realizado una actualización
    if (onRefreshRequest) {
      onRefreshRequest()
    }
  }

  // Función para expandir/contraer un año
  const toggleYearExpand = (yearIndex: number) => {
    setDateFilters((prev) => {
      const newFilters = [...prev]
      newFilters[yearIndex].expanded = !newFilters[yearIndex].expanded
      return newFilters
    })
  }

  // Función para seleccionar/deseleccionar un año
  const toggleYearSelect = (yearIndex: number) => {
    setDateFilters((prev) => {
      const newFilters = [...prev]
      const newSelected = !newFilters[yearIndex].selected

      // Actualizar el año
      newFilters[yearIndex].selected = newSelected

      // Actualizar todos los meses del año
      newFilters[yearIndex].months.forEach((month) => {
        month.selected = newSelected
      })

      return newFilters
    })

    // Actualizar filtros activos
    updateActiveFilters()
  }

  // Función para seleccionar/deseleccionar un mes
  const toggleMonthSelect = (yearIndex: number, monthIndex: number) => {
    setDateFilters((prev) => {
      const newFilters = [...prev]
      newFilters[yearIndex].months[monthIndex].selected = !newFilters[yearIndex].months[monthIndex].selected

      // Verificar si todos los meses están seleccionados para actualizar el estado del año
      const allMonthsSelected = newFilters[yearIndex].months.every((month) => month.selected)
      const noMonthsSelected = newFilters[yearIndex].months.every((month) => !month.selected)

      if (allMonthsSelected) {
        newFilters[yearIndex].selected = true
      } else if (noMonthsSelected) {
        newFilters[yearIndex].selected = false
      }

      return newFilters
    })

    // Actualizar filtros activos
    updateActiveFilters()
  }

  // Función para actualizar los filtros activos
  const updateActiveFilters = () => {
    setTimeout(() => {
      setDateFilters((currentFilters) => {
        const years: number[] = []
        const months: { year: number; month: number }[] = []

        currentFilters.forEach((yearFilter) => {
          if (yearFilter.selected) {
            years.push(yearFilter.year)
          } else {
            // Si el año no está seleccionado completamente, verificar meses individuales
            yearFilter.months.forEach((monthFilter) => {
              if (monthFilter.selected) {
                months.push({ year: yearFilter.year, month: monthFilter.month })
              }
            })
          }
        })

        setActiveFilters({ years, months })
        return currentFilters
      })
    }, 0)
  }

  // Función para aplicar filtro de fechas temporal
  const applyDateRangeFilter = (data: PedidoValidado[]) => {
    if (!dateRange.from && !dateRange.to) {
      return data
    }

    return data.filter((pedido) => {
      const pedidoDate = new Date(pedido.fecha)
      
      if (dateRange.from && pedidoDate < dateRange.from) {
        return false
      }
      
      if (dateRange.to && pedidoDate > dateRange.to) {
        return false
      }
      
      return true
    })
  }

  // Función para limpiar filtro de fechas
  const clearDateRangeFilter = () => {
    setDateRange({ from: undefined, to: undefined })
  }

  // Filtrar pedidos según la búsqueda, la pestaña activa y los filtros de fecha
  useEffect(() => {
    let filtered = [...pedidos]

    // Aplicar filtro por tipo según la pestaña
    if (activeTab === "coches") {
      filtered = filtered.filter((pedido) => pedido.tipo === "Coche")
    } else if (activeTab === "motos") {
      filtered = filtered.filter((pedido) => pedido.tipo === "Moto")
    } else if (activeTab === "contado") {
      filtered = filtered.filter((pedido) => pedido.formaPago === "Contado")
    } else if (activeTab === "financiado") {
      filtered = filtered.filter((pedido) => pedido.formaPago === "Financiado")
    } else if (activeTab === "ventas_caidas") {
      filtered = filtered.filter((pedido) => pedido.is_failed_sale === true)
    }

    // Aplicar filtro de búsqueda
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (pedido) =>
          pedido.matricula?.toLowerCase().includes(query) ||
          pedido.vendedor?.toLowerCase().includes(query) ||
          pedido.documento?.toLowerCase().includes(query) ||
          pedido.observaciones?.toLowerCase().includes(query) ||
          pedido.clienteNombre?.toLowerCase().includes(query) ||
          pedido.clienteEmail?.toLowerCase().includes(query) ||
          pedido.bastidor?.toLowerCase().includes(query),
      )
    }

    // Aplicar filtros de fecha
    if (activeFilters.years.length > 0 || activeFilters.months.length > 0) {
      filtered = filtered.filter((pedido) => {
        const pedidoDate = new Date(pedido.fecha)
        const pedidoYear = pedidoDate.getFullYear()
        const pedidoMonth = pedidoDate.getMonth()

        // Verificar si el año está completamente seleccionado
        if (activeFilters.years.includes(pedidoYear)) {
          return true
        }

        // Verificar si el mes específico está seleccionado
        return activeFilters.months.some((m) => m.year === pedidoYear && m.month === pedidoMonth)
      })
    }

    // Aplicar filtro de fechas temporal
    filtered = applyDateRangeFilter(filtered)

    setFilteredPedidos(filtered)

    // Resetear a la primera página cuando cambia el filtro
    setCurrentPage(1)
  }, [searchQuery, pedidos, activeTab, activeFilters, dateRange])

  // Actualizar la paginación cuando cambian los pedidos filtrados o la página actual
  useEffect(() => {
    const totalItems = filteredPedidos.length
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
    const currentItems = filteredPedidos.slice(startIndex, endIndex)
    setPaginatedPedidos(currentItems)
  }, [filteredPedidos, currentPage, itemsPerPage])

  // Función para cambiar de página
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const formatDate = (dateString: string | undefined) => {
    return formatDateForDisplay(dateString)
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number.parseInt(value, 10))
    setCurrentPage(1) // Resetear a la primera página al cambiar el número de filas por página
  }

  // Generar array de números de página para el paginador
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5 // Número máximo de páginas a mostrar en el paginador

    if (totalPages <= maxPagesToShow) {
      // Si hay menos páginas que el máximo a mostrar, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Si hay más páginas que el máximo a mostrar, mostrar un subconjunto
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
      let endPage = startPage + maxPagesToShow - 1

      if (endPage > totalPages) {
        endPage = totalPages
        startPage = Math.max(1, endPage - maxPagesToShow + 1)
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }
    }

    return pageNumbers
  }

  // Función para obtener el color del badge según el tipo de documento
  const getDocumentTypeBadgeClass = (tipoDocumento: string) => {
    switch (tipoDocumento) {
      case "DNI":
        return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300"
      case "NIE":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-300"
      case "CIF":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-300"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/20 dark:text-gray-300"
    }
  }

  // Función para obtener el color del badge según la forma de pago - MEJORADO
  const getPaymentMethodBadgeClass = (formaPago: string) => {
    switch (formaPago) {
      case "Contado":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-300"
      case "Financiado":
        return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 font-semibold"
      case "Externa":
        return "bg-pink-100 text-pink-800 hover:bg-pink-200 dark:bg-pink-900/20 dark:text-pink-300"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/20 dark:text-gray-300"
    }
  }

  // Verificar si hay filtros de fecha activos
  const hasActiveDateFilters = () => {
    return activeFilters.years.length > 0 || activeFilters.months.length > 0 || (dateRange.from || dateRange.to)
  }

  // Limpiar todos los filtros de fecha
  const clearAllDateFilters = () => {
    setDateFilters((prev) => {
      return prev.map((yearFilter) => ({
        ...yearFilter,
        selected: false,
        months: yearFilter.months.map((month) => ({
          ...month,
          selected: false,
        })),
      }))
    })
    setActiveFilters({ years: [], months: [] })
    clearDateRangeFilter()
  }

  // Componente para celda con tooltip
  const CellWithTooltip = ({
    children,
    value,
    className = "",
  }: { children: React.ReactNode; value: string; className?: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn("truncate", className)}>{children}</div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs break-words">{value || "Sin datos"}</p>
      </TooltipContent>
    </Tooltip>
  )

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PedidoTab)} className="w-full">
          {/* Barra superior con buscador y pestañas en la misma línea */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-card rounded-lg p-2 shadow-sm mb-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar..."
                  className="pl-8 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-9 w-9"
                title="Actualizar y completar datos faltantes"
              >
                {refreshing ? <BMWMSpinner size={16} /> : <RefreshCw className="h-4 w-4" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsSimplifiedView(!isSimplifiedView)}
                className="h-9 w-9"
                title={isSimplifiedView ? "Mostrar todas las columnas" : "Vista simplificada"}
              >
                {isSimplifiedView ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>

              {/* Botón de filtro de fechas temporal */}
              <DateFilter
                onDateFilterChange={(from, to) => setDateRange({ from, to })}
                dateFilter={dateRange}
                title="Filtrar por fecha de pedido"
                description="Selecciona un rango de fechas para filtrar por fecha de pedido"
              />
            </div>

            <TabsList className="h-9 bg-muted/50">
              <TabsTrigger value="todos" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                <span>Todos</span>
                <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                  {counts.todos}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="coches" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                <span>Coches</span>
                <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                  {counts.coches}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="motos" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                <span>Motos</span>
                <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                  {counts.motos}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="contado" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                <span>Contado</span>
                <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                  {counts.contado}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="financiado" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                <span>Financiado</span>
                <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                  {counts.financiado}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="ventas_caidas" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                <span>Ventas Caídas</span>
                <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                  {counts.ventas_caidas}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="todos" className="mt-0">
            <div className="rounded-lg border shadow-sm overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-b border-border">
                    <TableHead className="w-20 py-2">
                      <div className="flex items-center">
                        <DropdownMenu open={dateFilterOpen} onOpenChange={setDateFilterOpen}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 mr-2">
                              <Filter className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-[220px]">
                            <div className="p-2">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-sm">Filtrar por fecha</h4>
                                {hasActiveDateFilters() && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={clearAllDateFilters}
                                  >
                                    Limpiar
                                  </Button>
                                )}
                              </div>
                              <ScrollArea className="h-[300px] pr-4">
                                {dateFilters.map((yearFilter, yearIndex) => (
                                  <div key={yearFilter.year} className="mb-1">
                                    <div className="flex items-center">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => toggleYearExpand(yearIndex)}
                                      >
                                        {yearFilter.expanded ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                                      </Button>
                                      <Checkbox
                                        id={`year-${yearFilter.year}`}
                                        checked={yearFilter.selected}
                                        onCheckedChange={() => toggleYearSelect(yearIndex)}
                                        className="mr-2 h-4 w-4"
                                      />
                                      <label htmlFor={`year-${yearFilter.year}`} className="text-sm cursor-pointer">
                                        {yearFilter.year}
                                      </label>
                                    </div>
                                    {yearFilter.expanded && (
                                      <div className="ml-6 mt-1 space-y-1">
                                        {yearFilter.months.map((monthFilter, monthIndex) => (
                                          <div key={monthIndex} className="flex items-center">
                                            <Checkbox
                                              id={`month-${yearFilter.year}-${monthIndex}`}
                                              checked={monthFilter.selected}
                                              onCheckedChange={() => toggleMonthSelect(yearIndex, monthIndex)}
                                              className="mr-2 h-4 w-4"
                                            />
                                            <label htmlFor={`month-${yearFilter.year}-${monthIndex}`} className="text-sm cursor-pointer">
                                              {MONTH_NAMES[monthIndex]}
                                            </label>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </ScrollArea>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        FECHA
                        {hasActiveDateFilters() && (
                          <Badge variant="secondary" className="ml-2 h-4 px-1">
                            Filtrado
                          </Badge>
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-20 py-2">MATRÍCULA</TableHead>
                    <TableHead className="w-24 py-2">VENDEDOR</TableHead>
                    <TableHead className="w-16 py-2">TIPO</TableHead>
                    <TableHead className="w-20 py-2">FORMA DE PAGO</TableHead>
                    <TableHead className="w-20 py-2">DOCUMENTO</TableHead>
                    <TableHead className="w-20 py-2">PRECIO</TableHead>
                    {!isSimplifiedView && (
                      <>
                        <TableHead className="w-20 py-2">PRECIO COMPRA</TableHead>
                        <TableHead className="w-20 py-2">BASTIDOR</TableHead>
                        <TableHead className="w-16 py-2">MARCA</TableHead>
                        <TableHead className="w-16 py-2">COLOR</TableHead>
                        <TableHead className="w-16 py-2">KM</TableHead>
                        <TableHead className="w-20 py-2">CLIENTE</TableHead>
                        <TableHead className="w-20 py-2">TELÉFONO</TableHead>
                        <TableHead className="w-20 py-2">EMAIL</TableHead>
                        <TableHead className="w-24 py-2">DIRECCIÓN</TableHead>
                        <TableHead className="w-20 py-2">BANCO</TableHead>
                        <TableHead className="w-20 py-2">PORTAL ORIGEN</TableHead>
                        <TableHead className="w-20 py-2">FECHA MATRIC.</TableHead>
                        <TableHead className="w-20 py-2">CENTRO ENTREGA</TableHead>
                        <TableHead className="w-20 py-2">CYP</TableHead>
                        <TableHead className="w-20 py-2">FOTO 360</TableHead>
                        <TableHead className="w-16 py-2">TASADO</TableHead>
                        <TableHead className="w-16 py-2">REVENTA</TableHead>
                      </>
                    )}
                    <TableHead className="w-40 py-2">OBSERVACIONES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={isSimplifiedView ? 8 : 25} className="text-center py-8">
                        <div className="flex justify-center items-center">
                          <BMWMSpinner size={24} className="mr-2" />
                          <span>Cargando pedidos validados...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedPedidos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isSimplifiedView ? 8 : 25} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <CalendarIcon className="h-10 w-10 mb-2" />
                          <p>No se encontraron pedidos validados</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPedidos.map((pedido, index) => (
                      <TableRow
                        key={pedido.id}
                        className={cn("h-8 hover:bg-muted/30", index % 2 === 0 ? "bg-black/5 dark:bg-black/20" : "")}
                      >
                        {/* FECHA */}
                        <TableCell className="py-1">
                          <CellWithTooltip value={formatDate(pedido.fecha)}>
                            <div className="flex items-center">
                              <CalendarIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              <span className="truncate">{formatDate(pedido.fecha)}</span>
                            </div>
                          </CellWithTooltip>
                        </TableCell>

                        {/* MATRÍCULA */}
                        <TableCell className="font-medium py-1">
                          <CellWithTooltip value={pedido.matricula}>
                            <span className="truncate block">{pedido.matricula}</span>
                          </CellWithTooltip>
                        </TableCell>

                        {/* VENDEDOR */}
                        <TableCell className="py-1">
                          <CellWithTooltip value={pedido.vendedor}>
                            <div className="truncate max-w-[90px]">{pedido.vendedor}</div>
                          </CellWithTooltip>
                        </TableCell>

                        {/* TIPO */}
                        <TableCell className="py-1">
                          <Badge
                            variant="outline"
                            className={
                              pedido.tipo === "Coche"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-300"
                                : "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-300"
                            }
                          >
                            {pedido.tipo}
                          </Badge>
                        </TableCell>

                        {/* FORMA DE PAGO */}
                        <TableCell className="py-1">
                          <Badge variant="outline" className={getPaymentMethodBadgeClass(pedido.formaPago)}>
                            {pedido.formaPago}
                          </Badge>
                        </TableCell>

                        {/* TIPO DE DOCUMENTO */}
                        <TableCell className="py-1">
                          <div className="flex items-center">
                            <CreditCard className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            <Badge variant="outline" className={getDocumentTypeBadgeClass(pedido.tipoDocumento)}>
                              {pedido.tipoDocumento}
                            </Badge>
                          </div>
                        </TableCell>

                        {/* PRECIO */}
                        <TableCell className="py-1 font-medium">
                          <CellWithTooltip
                            value={new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(
                              pedido.precio,
                            )}
                          >
                            <span className="truncate">
                              {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(
                                pedido.precio,
                              )}
                            </span>
                          </CellWithTooltip>
                        </TableCell>

                        {!isSimplifiedView && (
                          <>
                            {/* PRECIO COMPRA */}
                            <TableCell className="py-1 font-medium">
                              <CellWithTooltip
                                value={
                                  pedido.precioCompra > 0
                                    ? new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(
                                        pedido.precioCompra,
                                      )
                                    : "-"
                                }
                              >
                                <span className="truncate uppercase font-mono text-xs">
                                  {pedido.precioCompra > 0
                                    ? new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(
                                        pedido.precioCompra,
                                      )
                                    : "-"}
                                </span>
                              </CellWithTooltip>
                            </TableCell>

                            {/* BASTIDOR */}
                            <TableCell className="py-1">
                              <CellWithTooltip value={pedido.bastidor || "Sin bastidor"}>
                                <div className="truncate max-w-[100px] uppercase font-mono text-xs">
                                  {pedido.bastidor || "-"}
                                </div>
                              </CellWithTooltip>
                            </TableCell>

                            {/* MARCA */}
                            <TableCell className="py-1">
                              <CellWithTooltip value={pedido.marca || "Sin marca"}>
                                <Badge
                                  variant="outline"
                                  className="bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-900/20 dark:text-slate-300 truncate uppercase font-mono text-xs"
                                >
                                  {pedido.marca || "-"}
                                </Badge>
                              </CellWithTooltip>
                            </TableCell>

                            {/* COLOR */}
                            <TableCell className="py-1">
                              <CellWithTooltip value={pedido.color || "Sin color"}>
                                <div className="truncate max-w-[60px] uppercase font-mono text-xs">{pedido.color || "-"}</div>
                              </CellWithTooltip>
                            </TableCell>

                            {/* KILOMETRAJE */}
                            <TableCell className="py-1">
                              <CellWithTooltip
                                value={
                                  pedido.kilometraje > 0
                                    ? new Intl.NumberFormat("es-ES").format(pedido.kilometraje) + " km"
                                    : "Sin datos"
                                }
                              >
                                <span className="truncate uppercase font-mono text-xs">
                                  {pedido.kilometraje > 0
                                    ? new Intl.NumberFormat("es-ES").format(pedido.kilometraje) + " KM"
                                    : "-"}
                                </span>
                              </CellWithTooltip>
                            </TableCell>

                            {/* CLIENTE */}
                            <TableCell className="py-1">
                              <CellWithTooltip value={pedido.clienteNombre || "Sin nombre"}>
                                <div className="truncate max-w-[100px] uppercase font-mono text-xs">{pedido.clienteNombre || "-"}</div>
                              </CellWithTooltip>
                            </TableCell>

                            {/* TELÉFONO */}
                            <TableCell className="py-1">
                              <CellWithTooltip value={pedido.clienteTelefono || "Sin teléfono"}>
                                <div className="truncate max-w-[80px] uppercase font-mono text-xs">{pedido.clienteTelefono || "-"}</div>
                              </CellWithTooltip>
                            </TableCell>

                            {/* EMAIL */}
                            <TableCell className="py-1">
                              <CellWithTooltip value={pedido.clienteEmail || "Sin email"}>
                                <div className="flex items-center">
                                  <Mail className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                  <div className="truncate max-w-[120px] uppercase font-mono text-xs">{pedido.clienteEmail || "-"}</div>
                                </div>
                              </CellWithTooltip>
                            </TableCell>

                            {/* DIRECCIÓN */}
                            <TableCell className="py-1">
                              <CellWithTooltip value={pedido.clienteDireccion || "Sin dirección"}>
                                <div className="flex items-center">
                                  <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                  <div className="truncate max-w-[150px] uppercase font-mono text-xs">{pedido.clienteDireccion || "-"}</div>
                                </div>
                              </CellWithTooltip>
                            </TableCell>

                            {/* BANCO */}
                            <TableCell className="py-1">
                              <CellWithTooltip value={pedido.banco || "Sin banco"}>
                                <div className="truncate max-w-[80px] uppercase font-mono text-xs">{pedido.banco || "-"}</div>
                              </CellWithTooltip>
                            </TableCell>

                            {/* PORTAL ORIGEN */}
                            <TableCell className="py-1">
                              <CellWithTooltip value={pedido.portalOrigen || "Sin portal"}>
                                <div className="flex items-center">
                                  <Globe className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                  <div className="truncate max-w-[100px] uppercase font-mono text-xs">{pedido.portalOrigen || "-"}</div>
                                </div>
                              </CellWithTooltip>
                            </TableCell>

                            {/* FECHA MATRICULACIÓN */}
                            <TableCell className="py-1">
                              <CellWithTooltip
                                value={pedido.fechaMatriculacion ? formatDate(pedido.fechaMatriculacion) : "Sin fecha"}
                              >
                                <span className="truncate uppercase font-mono text-xs">
                                  {pedido.fechaMatriculacion ? formatDate(pedido.fechaMatriculacion) : "-"}
                                </span>
                              </CellWithTooltip>
                            </TableCell>

                            {/* CENTRO ENTREGA */}
                            <TableCell className="py-1">
                              <CellWithTooltip value={pedido.centroEntrega || "Sin centro"}>
                                <div className="truncate max-w-[100px] uppercase font-mono text-xs">{pedido.centroEntrega || "-"}</div>
                              </CellWithTooltip>
                            </TableCell>

                            {/* CYP */}
                            <TableCell className="py-1">
                              <Badge
                                variant="outline"
                                className={
                                  pedido.estadoCyp === "completado"
                                    ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 uppercase font-mono text-xs"
                                    : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 uppercase font-mono text-xs"
                                }
                              >
                                {pedido.estadoCyp || "PENDIENTE"}
                              </Badge>
                            </TableCell>

                            {/* FOTO 360 */}
                            <TableCell className="py-1">
                              <Badge
                                variant="outline"
                                className={
                                  pedido.estadoFoto360 === "completado"
                                    ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 uppercase font-mono text-xs"
                                    : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 uppercase font-mono text-xs"
                                }
                              >
                                {pedido.estadoFoto360 || "PENDIENTE"}
                              </Badge>
                            </TableCell>

                            {/* TASADO */}
                            <TableCell className="py-1">
                              <Badge
                                variant="outline"
                                className={
                                  pedido.tasado
                                    ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 uppercase font-mono text-xs"
                                    : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/20 dark:text-gray-300 uppercase font-mono text-xs"
                                }
                              >
                                {pedido.tasado ? "SÍ" : "NO"}
                              </Badge>
                            </TableCell>

                            {/* REVENTA */}
                            <TableCell className="py-1">
                              <Badge
                                variant="outline"
                                className={
                                  pedido.esReventa
                                    ? "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-300 uppercase font-mono text-xs"
                                    : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/20 dark:text-gray-300 uppercase font-mono text-xs"
                                }
                              >
                                {pedido.esReventa ? "SÍ" : "NO"}
                              </Badge>
                            </TableCell>
                          </>
                        )}

                        {/* OBSERVACIONES */}
                        <TableCell className="py-1">
                          <CellWithTooltip value={pedido.observaciones || "Sin observaciones"}>
                            <div className="truncate max-w-[150px]">{pedido.observaciones || "-"}</div>
                          </CellWithTooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Las otras pestañas tendrían el mismo contenido pero filtrado */}
          {["coches", "motos", "contado", "financiado", "ventas_caidas"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-0">
              <div className="rounded-lg border shadow-sm overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent border-b border-border">
                      <TableHead className="w-20 py-2">
                        <div className="flex items-center">
                          <DropdownMenu open={dateFilterOpen} onOpenChange={setDateFilterOpen}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0 mr-2">
                                <Filter className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[220px]">
                              <div className="p-2">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-sm">Filtrar por fecha</h4>
                                  {hasActiveDateFilters() && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-xs"
                                      onClick={clearAllDateFilters}
                                    >
                                      Limpiar
                                    </Button>
                                  )}
                                </div>
                                <ScrollArea className="h-[300px] pr-4">
                                  {dateFilters.map((yearFilter, yearIndex) => (
                                    <div key={yearFilter.year} className="mb-1">
                                      <div className="flex items-center">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() => toggleYearExpand(yearIndex)}
                                        >
                                          {yearFilter.expanded ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                                        </Button>
                                        <Checkbox
                                          id={`year-${yearFilter.year}`}
                                          checked={yearFilter.selected}
                                          onCheckedChange={() => toggleYearSelect(yearIndex)}
                                          className="mr-2 h-4 w-4"
                                        />
                                        <label htmlFor={`year-${yearFilter.year}`} className="text-sm cursor-pointer">
                                          {yearFilter.year}
                                        </label>
                                      </div>
                                      {yearFilter.expanded && (
                                        <div className="ml-6 mt-1 space-y-1">
                                          {yearFilter.months.map((monthFilter, monthIndex) => (
                                            <div key={monthIndex} className="flex items-center">
                                              <Checkbox
                                                id={`month-${yearFilter.year}-${monthIndex}`}
                                                checked={monthFilter.selected}
                                                onCheckedChange={() => toggleMonthSelect(yearIndex, monthIndex)}
                                                className="mr-2 h-4 w-4"
                                              />
                                              <label
                                                htmlFor={`month-${yearFilter.year}-${monthIndex}`}
                                                className="text-sm cursor-pointer"
                                              >
                                                {MONTH_NAMES[monthIndex]}
                                              </label>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </ScrollArea>
                              </div>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          FECHA
                          {hasActiveDateFilters() && (
                            <Badge variant="secondary" className="ml-2 h-4 px-1">
                              Filtrado
                            </Badge>
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-20 py-2">MATRÍCULA</TableHead>
                      <TableHead className="w-24 py-2">VENDEDOR</TableHead>
                      <TableHead className="w-16 py-2">TIPO</TableHead>
                      <TableHead className="w-20 py-2">FORMA DE PAGO</TableHead>
                      <TableHead className="w-20 py-2">DOCUMENTO</TableHead>
                      <TableHead className="w-20 py-2">PRECIO</TableHead>
                      {!isSimplifiedView && (
                        <>
                          <TableHead className="w-20 py-2">PRECIO COMPRA</TableHead>
                          <TableHead className="w-20 py-2">BASTIDOR</TableHead>
                          <TableHead className="w-16 py-2">MARCA</TableHead>
                          <TableHead className="w-16 py-2">COLOR</TableHead>
                          <TableHead className="w-16 py-2">KM</TableHead>
                          <TableHead className="w-20 py-2">CLIENTE</TableHead>
                          <TableHead className="w-20 py-2">TELÉFONO</TableHead>
                          <TableHead className="w-20 py-2">EMAIL</TableHead>
                          <TableHead className="w-24 py-2">DIRECCIÓN</TableHead>
                          <TableHead className="w-20 py-2">BANCO</TableHead>
                          <TableHead className="w-20 py-2">PORTAL ORIGEN</TableHead>
                          <TableHead className="w-20 py-2">FECHA MATRIC.</TableHead>
                          <TableHead className="w-20 py-2">CENTRO ENTREGA</TableHead>
                          <TableHead className="w-20 py-2">CYP</TableHead>
                          <TableHead className="w-20 py-2">FOTO 360</TableHead>
                          <TableHead className="w-16 py-2">TASADO</TableHead>
                          <TableHead className="w-16 py-2">REVENTA</TableHead>
                        </>
                      )}
                      <TableHead className="w-40 py-2">OBSERVACIONES</TableHead>
                      {activeTab === "ventas_caidas" && (
                        <TableHead className="w-40 py-2">RAZÓN CAÍDA</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={isSimplifiedView ? 8 : (activeTab === "ventas_caidas" ? 26 : 25)} className="text-center py-8">
                          <div className="flex justify-center items-center">
                            <BMWMSpinner size={24} className="mr-2" />
                            <span>Cargando pedidos validados...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : paginatedPedidos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isSimplifiedView ? 8 : (activeTab === "ventas_caidas" ? 26 : 25)} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <CalendarIcon className="h-10 w-10 mb-2" />
                            <p>No se encontraron pedidos validados</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedPedidos.map((pedido, index) => (
                        <TableRow
                          key={pedido.id}
                          className={cn("h-8 hover:bg-muted/30", index % 2 === 0 ? "bg-black/5 dark:bg-black/20" : "")}
                        >
                          {/* Misma estructura de celdas que en la pestaña "todos" */}
                          <TableCell className="py-1">
                            <CellWithTooltip value={formatDate(pedido.fecha)}>
                              <div className="flex items-center">
                                <CalendarIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                <span className="truncate">{formatDate(pedido.fecha)}</span>
                              </div>
                            </CellWithTooltip>
                          </TableCell>

                          <TableCell className="font-medium py-1">
                            <CellWithTooltip value={pedido.matricula}>
                              <span className="truncate block">{pedido.matricula}</span>
                            </CellWithTooltip>
                          </TableCell>

                          <TableCell className="py-1">
                            <CellWithTooltip value={pedido.vendedor}>
                              <div className="truncate max-w-[90px]">{pedido.vendedor}</div>
                            </CellWithTooltip>
                          </TableCell>

                          <TableCell className="py-1">
                            <Badge
                              variant="outline"
                              className={
                                pedido.tipo === "Coche"
                                  ? "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-300"
                                  : "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-300"
                              }
                            >
                              {pedido.tipo}
                            </Badge>
                          </TableCell>

                          <TableCell className="py-1">
                            <Badge variant="outline" className={getPaymentMethodBadgeClass(pedido.formaPago)}>
                              {pedido.formaPago}
                            </Badge>
                          </TableCell>

                          <TableCell className="py-1">
                            <div className="flex items-center">
                              <CreditCard className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              <Badge variant="outline" className={getDocumentTypeBadgeClass(pedido.tipoDocumento)}>
                                {pedido.tipoDocumento}
                              </Badge>
                            </div>
                          </TableCell>

                          <TableCell className="py-1 font-medium">
                            <CellWithTooltip
                              value={new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(
                                pedido.precio,
                              )}
                            >
                              <span className="truncate">
                                {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(
                                  pedido.precio,
                                )}
                              </span>
                            </CellWithTooltip>
                          </TableCell>

                          {!isSimplifiedView && (
                            <>
                              {/* Repetición de columnas adicionales */}
                              {/* PRECIO COMPRA */}
                              <TableCell className="py-1 font-medium">
                                <CellWithTooltip
                                  value={
                                    pedido.precioCompra > 0
                                      ? new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(
                                          pedido.precioCompra,
                                        )
                                      : "-"
                                  }
                                >
                                  <span className="truncate uppercase font-mono text-xs">
                                    {pedido.precioCompra > 0
                                      ? new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(
                                          pedido.precioCompra,
                                        )
                                      : "-"}
                                  </span>
                                </CellWithTooltip>
                              </TableCell>

                              {/* BASTIDOR */}
                              <TableCell className="py-1">
                                <CellWithTooltip value={pedido.bastidor || "Sin bastidor"}>
                                  <div className="truncate max-w-[100px] uppercase font-mono text-xs">
                                    {pedido.bastidor || "-"}
                                  </div>
                                </CellWithTooltip>
                              </TableCell>

                              {/* MARCA */}
                              <TableCell className="py-1">
                                <CellWithTooltip value={pedido.marca || "Sin marca"}>
                                  <Badge
                                    variant="outline"
                                    className="bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-900/20 dark:text-slate-300 truncate uppercase font-mono text-xs"
                                  >
                                    {pedido.marca || "-"}
                                  </Badge>
                                </CellWithTooltip>
                              </TableCell>

                              {/* COLOR */}
                              <TableCell className="py-1">
                                <CellWithTooltip value={pedido.color || "Sin color"}>
                                  <div className="truncate max-w-[60px] uppercase font-mono text-xs">{pedido.color || "-"}</div>
                                </CellWithTooltip>
                              </TableCell>

                              {/* KILOMETRAJE */}
                              <TableCell className="py-1">
                                <CellWithTooltip
                                  value={
                                    pedido.kilometraje > 0
                                      ? new Intl.NumberFormat("es-ES").format(pedido.kilometraje) + " km"
                                      : "Sin datos"
                                  }
                                >
                                  <span className="truncate uppercase font-mono text-xs">
                                    {pedido.kilometraje > 0
                                      ? new Intl.NumberFormat("es-ES").format(pedido.kilometraje) + " KM"
                                      : "-"}
                                  </span>
                                </CellWithTooltip>
                              </TableCell>

                              {/* CLIENTE */}
                              <TableCell className="py-1">
                                <CellWithTooltip value={pedido.clienteNombre || "Sin nombre"}>
                                  <div className="truncate max-w-[100px] uppercase font-mono text-xs">{pedido.clienteNombre || "-"}</div>
                                </CellWithTooltip>
                              </TableCell>

                              {/* TELÉFONO */}
                              <TableCell className="py-1">
                                <CellWithTooltip value={pedido.clienteTelefono || "Sin teléfono"}>
                                  <div className="truncate max-w-[80px] uppercase font-mono text-xs">{pedido.clienteTelefono || "-"}</div>
                                </CellWithTooltip>
                              </TableCell>

                              {/* EMAIL */}
                              <TableCell className="py-1">
                                <CellWithTooltip value={pedido.clienteEmail || "Sin email"}>
                                  <div className="flex items-center">
                                    <Mail className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                    <div className="truncate max-w-[120px] uppercase font-mono text-xs">{pedido.clienteEmail || "-"}</div>
                                  </div>
                                </CellWithTooltip>
                              </TableCell>

                              {/* DIRECCIÓN */}
                              <TableCell className="py-1">
                                <CellWithTooltip value={pedido.clienteDireccion || "Sin dirección"}>
                                  <div className="flex items-center">
                                    <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                    <div className="truncate max-w-[150px] uppercase font-mono text-xs">{pedido.clienteDireccion || "-"}</div>
                                  </div>
                                </CellWithTooltip>
                              </TableCell>

                              {/* BANCO */}
                              <TableCell className="py-1">
                                <CellWithTooltip value={pedido.banco || "Sin banco"}>
                                  <div className="truncate max-w-[80px] uppercase font-mono text-xs">{pedido.banco || "-"}</div>
                                </CellWithTooltip>
                              </TableCell>

                              {/* PORTAL ORIGEN */}
                              <TableCell className="py-1">
                                <CellWithTooltip value={pedido.portalOrigen || "Sin portal"}>
                                  <div className="flex items-center">
                                    <Globe className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                    <div className="truncate max-w-[100px] uppercase font-mono text-xs">{pedido.portalOrigen || "-"}</div>
                                  </div>
                                </CellWithTooltip>
                              </TableCell>

                              {/* FECHA MATRICULACIÓN */}
                              <TableCell className="py-1">
                                <CellWithTooltip
                                  value={pedido.fechaMatriculacion ? formatDate(pedido.fechaMatriculacion) : "Sin fecha"}
                                >
                                  <span className="truncate uppercase font-mono text-xs">
                                    {pedido.fechaMatriculacion ? formatDate(pedido.fechaMatriculacion) : "-"}
                                  </span>
                                </CellWithTooltip>
                              </TableCell>

                              {/* CENTRO ENTREGA */}
                              <TableCell className="py-1">
                                <CellWithTooltip value={pedido.centroEntrega || "Sin centro"}>
                                  <div className="truncate max-w-[100px] uppercase font-mono text-xs">{pedido.centroEntrega || "-"}</div>
                                </CellWithTooltip>
                              </TableCell>

                              {/* CYP */}
                              <TableCell className="py-1">
                                <Badge
                                  variant="outline"
                                  className={
                                    pedido.estadoCyp === "completado"
                                      ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 uppercase font-mono text-xs"
                                      : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 uppercase font-mono text-xs"
                                  }
                                >
                                  {pedido.estadoCyp || "PENDIENTE"}
                                </Badge>
                              </TableCell>

                              {/* FOTO 360 */}
                              <TableCell className="py-1">
                                <Badge
                                  variant="outline"
                                  className={
                                    pedido.estadoFoto360 === "completado"
                                      ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 uppercase font-mono text-xs"
                                      : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 uppercase font-mono text-xs"
                                  }
                                >
                                  {pedido.estadoFoto360 || "PENDIENTE"}
                                </Badge>
                              </TableCell>

                              {/* TASADO */}
                              <TableCell className="py-1">
                                <Badge
                                  variant="outline"
                                  className={
                                    pedido.tasado
                                      ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 uppercase font-mono text-xs"
                                      : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/20 dark:text-gray-300 uppercase font-mono text-xs"
                                  }
                                >
                                  {pedido.tasado ? "SÍ" : "NO"}
                                </Badge>
                              </TableCell>

                              {/* REVENTA */}
                              <TableCell className="py-1">
                                <Badge
                                  variant="outline"
                                  className={
                                    pedido.esReventa
                                      ? "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-300 uppercase font-mono text-xs"
                                      : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/20 dark:text-gray-300 uppercase font-mono text-xs"
                                  }
                                >
                                  {pedido.esReventa ? "SÍ" : "NO"}
                                </Badge>
                              </TableCell>
                            </>
                          )}

                          {/* OBSERVACIONES */}
                          <TableCell className="py-1">
                            <CellWithTooltip value={pedido.observaciones || "Sin observaciones"}>
                              <div className="truncate max-w-[150px]">{pedido.observaciones || "-"}</div>
                            </CellWithTooltip>
                          </TableCell>

                          {/* RAZÓN DE VENTA CAÍDA - Solo mostrar en la pestaña de ventas caídas */}
                          {activeTab === "ventas_caidas" && (
                            <TableCell className="py-1">
                              <CellWithTooltip value={pedido.failed_reason || "Sin razón especificada"}>
                                <div className="truncate max-w-[150px] text-red-600 dark:text-red-400">
                                  {pedido.failed_reason || "-"}
                                </div>
                              </CellWithTooltip>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Paginación */}
        <div className="mt-2 rounded-lg border bg-card shadow-sm">
          <ReusablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredPedidos.length}
            itemsPerPage={itemsPerPage}
            onPageChange={goToPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value)
              setCurrentPage(1)
            }}
            itemsPerPageOptions={[5, 10, 15, 20, 50]}
            showItemsPerPage={true}
            showFirstLastButtons={true}
          />
        </div>
      </div>
    </TooltipProvider>
  )
}
