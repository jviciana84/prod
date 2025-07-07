"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Search,
  RefreshCw,
  Loader2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Euro,
  Car,
  User,
  Eye,
  EyeOff,
  Tag,
  Receipt,
  FileSpreadsheet,
  CalendarDays,
  Filter,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { updateIncentiveDetails, getUniqueYearsAndMonths, getUniqueAdvisors } from "@/server-actions/incentivos-actions"
import { calculateIncentiveAmount, getCurrentIncentivosConfig } from "@/lib/incentivos-calculator"
import type { Incentivo } from "@/types/incentivos"
import { Checkbox } from "@/components/ui/checkbox"
import { WarrantyDetailModal } from "@/components/modals/warranty-detail-modal"

type IncentivosTab = "todos" | "pendientes" | "tramitados" | "financiados" | "contado"

interface IncentivosTableProps {
  incentivos: Incentivo[]
  onRefreshRequest?: () => void
  isAdmin: boolean
  userAdvisorName: string | null
  loading: boolean
}

export function IncentivosTable({
  incentivos,
  onRefreshRequest,
  isAdmin,
  userAdvisorName,
  loading,
}: IncentivosTableProps) {
  const [filteredIncentivos, setFilteredIncentivos] = useState<Incentivo[]>([])
  const [paginatedIncentivos, setPaginatedIncentivos] = useState<Incentivo[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<IncentivosTab>("todos")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSimplifiedView, setIsSimplifiedView] = useState(false)
  const [currentConfig, setCurrentConfig] = useState<any>(null)
  const [exporting, setExporting] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Filtros adicionales
  const [selectedAdvisor, setSelectedAdvisor] = useState<string>("all")
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth() + 1 + "")
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear() + "")
  const [availableAdvisors, setAvailableAdvisors] = useState<string[]>([])
  const [availableYears, setAvailableYears] = useState<string[]>([])

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  const [counts, setCounts] = useState({
    todos: 0,
    pendientes: 0,
    tramitados: 0,
    financiados: 0,
    contado: 0,
  })

  const [otherObservationsDialog, setOtherObservationsDialog] = useState({
    open: false,
    incentivo: null as Incentivo | null,
    observations: "",
  })

  const [warrantyDetailModal, setWarrantyDetailModal] = useState({
    open: false,
    incentivo: null as Incentivo | null,
  })

  // Cargar configuración y datos de filtros al montar el componente
  useEffect(() => {
    getCurrentIncentivosConfig().then(setCurrentConfig)
    loadFilterData()
  }, [])

  const loadFilterData = async () => {
    const advisors = await getUniqueAdvisors()
    setAvailableAdvisors(advisors)

    const { years } = await getUniqueYearsAndMonths()
    setAvailableYears(years)
  }

  useEffect(() => {
    applyFilters()
  }, [incentivos, searchQuery, activeTab, selectedAdvisor, selectedMonth, selectedYear])

  useEffect(() => {
    updatePagination()
  }, [filteredIncentivos, currentPage, itemsPerPage])

  const actualizarContadores = (data: Incentivo[]) => {
    const allCount = data.length
    const pendientesCount = data.filter((v) => v.tramitado === false).length
    const tramitadosCount = data.filter((v) => v.tramitado === true).length
    const financiadosCount = data.filter((v) => v.financiado === true).length
    const contadoCount = data.filter((v) => v.financiado === false).length

    setCounts({
      todos: allCount,
      pendientes: pendientesCount,
      tramitados: tramitadosCount,
      financiados: financiadosCount,
      contado: contadoCount,
    })
  }

  const applyFilters = () => {
    let filtered = [...incentivos]

    // Filtro por asesor
    if (selectedAdvisor !== "all") {
      filtered = filtered.filter((incentivo) => incentivo.asesor === selectedAdvisor)
    }

    // Filtro por mes y año
    if (selectedMonth !== "all" && selectedYear !== "all") {
      filtered = filtered.filter((incentivo) => {
        if (!incentivo.fecha_entrega) return false
        const date = new Date(incentivo.fecha_entrega)
        return (
          date.getMonth() + 1 === Number.parseInt(selectedMonth) && date.getFullYear() === Number.parseInt(selectedYear)
        )
      })
    } else if (selectedYear !== "all") {
      filtered = filtered.filter((incentivo) => {
        if (!incentivo.fecha_entrega) return false
        const date = new Date(incentivo.fecha_entrega)
        return date.getFullYear() === Number.parseInt(selectedYear)
      })
    }

    // Filtros de pestañas
    if (activeTab === "pendientes") {
      filtered = filtered.filter((incentivo) => incentivo.tramitado === false)
    } else if (activeTab === "tramitados") {
      filtered = filtered.filter((incentivo) => incentivo.tramitado === true)
    } else if (activeTab === "financiados") {
      filtered = filtered.filter((incentivo) => incentivo.financiado === true)
    } else if (activeTab === "contado") {
      filtered = filtered.filter((incentivo) => incentivo.financiado === false)
    }

    // Filtro de búsqueda
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (incentivo) =>
          incentivo.matricula?.toLowerCase().includes(query) ||
          incentivo.modelo?.toLowerCase().includes(query) ||
          incentivo.asesor?.toLowerCase().includes(query) ||
          incentivo.forma_pago?.toLowerCase().includes(query) ||
          incentivo.otros_observaciones?.toLowerCase().includes(query) ||
          incentivo.or?.toLowerCase().includes(query),
      )
    }

    setFilteredIncentivos(filtered)
    actualizarContadores(filtered)
    setCurrentPage(1)
  }

  const updatePagination = () => {
    const totalItems = filteredIncentivos.length
    const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage)
    setTotalPages(calculatedTotalPages || 1)

    const safePage = Math.min(currentPage, calculatedTotalPages || 1)
    if (safePage !== currentPage) {
      setCurrentPage(safePage)
    }

    const startIndex = (safePage - 1) * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
    const currentItems = filteredIncentivos.slice(startIndex, endIndex)
    setPaginatedIncentivos(currentItems)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    // Recargar configuración
    const newConfig = await getCurrentIncentivosConfig()
    setCurrentConfig(newConfig)

    if (onRefreshRequest) {
      await onRefreshRequest()
    }
    setRefreshing(false)
  }

  const calculateImporte = (incentivo: Incentivo) => {
    if (currentConfig) {
      return calculateIncentiveAmount(incentivo, currentConfig)
    }
    // Fallback al cálculo anterior si no hay configuración cargada
    const margen = (incentivo.precio_venta || 0) - (incentivo.precio_compra || 0)
    const importeMinimo = incentivo.importe_minimo || 150

    let importe = 0

    if (margen >= 1500) {
      const porcentajeMargen = incentivo.porcentaje_margen_config_usado || 10
      importe = importeMinimo + (margen - 1500) * (porcentajeMargen / 100)
    } else {
      importe = importeMinimo
    }

    if (incentivo.antiguedad) {
      importe += 50
    }

    if (incentivo.financiado) {
      importe += 50
    }

    importe -= incentivo.gastos_estructura || 0
    importe -= incentivo.garantia || 0
    importe -= incentivo.gastos_360 || 0

    importe += incentivo.otros || 0

    return Math.max(0, importe)
  }

  const handleExportToExcel = async () => {
    if (exporting) return

    try {
      setExporting(true)
      console.log("🔄 Iniciando exportación a Excel...")
      toast.info("Generando informe Excel...")

      // Filtrar solo los incentivos tramitados
      const tramitadosData = filteredIncentivos.filter((incentivo) => incentivo.tramitado === true)

      if (tramitadosData.length === 0) {
        toast.error("No hay incentivos tramitados para exportar")
        return
      }

      console.log(`📊 Exportando ${tramitadosData.length} incentivos tramitados`)

      // Agrupar por asesor
      const groupedByAdvisor = tramitadosData.reduce(
        (acc, incentivo) => {
          const advisor = incentivo.asesor || "Sin Asesor"
          if (!acc[advisor]) {
            acc[advisor] = []
          }
          acc[advisor].push(incentivo)
          return acc
        },
        {} as Record<string, Incentivo[]>,
      )

      console.log("📊 Datos agrupados:", Object.keys(groupedByAdvisor))

      // Crear el contenido del Excel
      const response = await fetch("/api/incentivos/export-excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupedData: groupedByAdvisor,
          filters: {
            advisor: selectedAdvisor,
            month: selectedMonth,
            year: selectedYear,
          },
          userFullName: userAdvisorName || "Usuario",
          currentConfig,
        }),
      })

      console.log("📊 Respuesta del servidor:", response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }))
        console.error("❌ Error response:", errorData)
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const blob = await response.blob()
      console.log("📊 Blob generado, tamaño:", blob.size)

      if (blob.size === 0) {
        throw new Error("El archivo generado está vacío")
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `Informe_Incentivos_${selectedYear}_${selectedMonth}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      console.log("✅ Excel descargado correctamente")
      toast.success("Informe Excel generado correctamente")
    } catch (error) {
      console.error("❌ Error exporting to Excel:", error)
      toast.error(`Error al generar el informe Excel: ${error.message}`)
    } finally {
      setExporting(false)
    }
  }

  const handleLocalFieldChange = (id: number, field: keyof Incentivo, value: string | number | boolean | null) => {
    setFilteredIncentivos((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]:
                typeof value === "string" &&
                (field === "garantia" || field === "gastos_360" || field === "otros" || field === "precio_compra")
                  ? value === ""
                    ? null
                    : Number.parseFloat(value)
                  : value,
            }
          : item,
      ),
    )
  }

  const handleUpdateIncentivoField = async (
    id: number,
    field: keyof Incentivo,
    value: string | number | boolean | null,
  ) => {
    try {
      let parsedValue: number | boolean | null = null
      if (typeof value === "string") {
        if (value === "") {
          parsedValue = null
        } else if (field === "garantia" || field === "gastos_360" || field === "otros" || field === "precio_compra") {
          parsedValue = Number.parseFloat(value)
        } else if (field === "tramitado" || field === "antiguedad" || field === "financiado") {
          parsedValue = value === "true" || value === true
        } else {
          parsedValue = value
        }
      } else {
        parsedValue = value
      }

      const result = await updateIncentiveDetails(id, field as string, parsedValue)

      if (result.success) {
        toast.success("Valor actualizado correctamente")
        // Recargar configuración por si cambió
        const newConfig = await getCurrentIncentivosConfig()
        setCurrentConfig(newConfig)

        if (onRefreshRequest) {
          onRefreshRequest()
        }
      } else {
        toast.error(result.message || "Error al actualizar el valor")
        if (onRefreshRequest) {
          onRefreshRequest()
        }
      }
    } catch (error) {
      console.error(`Error updating ${String(field)}:`, error)
      toast.error("Error al actualizar el valor")
      if (onRefreshRequest) {
        onRefreshRequest()
      }
    }
  }

  const handleObservationsSave = async () => {
    if (!otherObservationsDialog.incentivo) return

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("incentivos")
        .update({ otros_observaciones: otherObservationsDialog.observations })
        .eq("id", otherObservationsDialog.incentivo.id)

      if (error) throw error

      setFilteredIncentivos((prev) =>
        prev.map((item) =>
          item.id === otherObservationsDialog.incentivo?.id
            ? { ...item, otros_observaciones: otherObservationsDialog.observations }
            : item,
        ),
      )

      setOtherObservationsDialog({
        open: false,
        incentivo: null,
        observations: "",
      })

      toast.success("Observaciones guardadas correctamente")
      if (onRefreshRequest) {
        onRefreshRequest()
      }
    } catch (error) {
      console.error("Error updating observations:", error)
      toast.error("Error al guardar las observaciones")
    }
  }

  const handleObservationsClick = (incentivo: Incentivo) => {
    setOtherObservationsDialog({
      open: true,
      incentivo,
      observations: incentivo.otros_observaciones || "",
    })
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return format(date, "dd/MM/yyyy", { locale: es })
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "-"
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount)
  }

  const formatGarantia = (garantia: number | null) => {
    if (garantia === null || garantia === undefined) return "-"
    if (garantia === 0) return "Fabricante"
    return formatCurrency(garantia)
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number.parseInt(value, 10))
    setCurrentPage(1)
  }

  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
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

  const getFormaPagoBadgeClass = (formaPago: string | null) => {
    switch (formaPago?.toLowerCase()) {
      case "contado":
        return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300"
      case "financiado":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-300"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/20 dark:text-gray-300"
    }
  }

  const months = [
    { value: "1", label: "Enero" },
    { value: "2", label: "Febrero" },
    { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Mayo" },
    { value: "6", label: "Junio" },
    { value: "7", label: "Julio" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ]

  return (
    <TooltipProvider>
      <div className="space-y-4 p-4">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as IncentivosTab)} className="w-full">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-card rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar incentivos..."
                  className="pl-8 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" title="Filtros">
                    <Filter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Asesor</span>
                      </div>
                      <Select value={selectedAdvisor} onValueChange={setSelectedAdvisor}>
                        <SelectTrigger className="h-8 w-full">
                          <SelectValue placeholder="Todos los asesores" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los asesores</SelectItem>
                          {availableAdvisors.map((advisor) => (
                            <SelectItem key={advisor} value={advisor}>
                              {advisor}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        <span>Mes</span>
                      </div>
                      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="h-8 w-full">
                          <SelectValue placeholder="Mes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {months.map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Año</span>
                      </div>
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="h-8 w-full">
                          <SelectValue placeholder="Año" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {availableYears.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="h-9 w-9"
                title="Actualizar"
              >
                {refreshing || loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
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

              <Button
                variant="outline"
                size="icon"
                onClick={handleExportToExcel}
                disabled={exporting}
                className="h-9 w-9"
                title="Exportar a Excel"
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              </Button>
            </div>

            <TabsList className="h-9 bg-muted/50">
              <TabsTrigger value="todos" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                <span>Todos</span>
                <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                  {counts.todos}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pendientes" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                <span>Pendientes</span>
                <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                  {counts.pendientes}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="tramitados" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                <span>Tramitados</span>
                <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                  {counts.tramitados}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="financiados" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                <span>Financiados</span>
                <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                  {counts.financiados}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="contado" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                <span>Contado</span>
                <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                  {counts.contado}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-4">
            <div className="rounded-lg border shadow-sm overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-b border-border">
                    <TableHead className="w-12 truncate py-3 px-3 uppercase text-center">
                      <Receipt className="h-4 w-4 mx-auto" />
                    </TableHead>
                    <TableHead className="w-20 truncate py-3 px-3 uppercase">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        FECHA
                      </div>
                    </TableHead>
                    <TableHead className="w-20 truncate py-3 px-3 uppercase">MATRÍCULA</TableHead>
                    <TableHead className="w-20 truncate py-3 px-3 uppercase">
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 mr-2" />
                        OR
                      </div>
                    </TableHead>
                    <TableHead className="w-24 truncate py-3 px-3 uppercase">MODELO</TableHead>
                    <TableHead className="w-20 truncate py-3 px-3 uppercase">ASESOR</TableHead>
                    <TableHead className="w-20 truncate py-3 px-3 uppercase">FORMA PAGO</TableHead>
                    <TableHead className="w-20 truncate py-3 px-3 uppercase">PRECIO VENTA</TableHead>
                    <TableHead className="w-20 truncate py-3 px-3 uppercase">PRECIO COMPRA</TableHead>
                    <TableHead className="w-16 truncate py-3 px-3 uppercase">DÍAS STOCK</TableHead>
                    {!isSimplifiedView && (
                      <>
                        <TableHead className="w-20 truncate py-3 px-3 uppercase">GASTOS ESTRUCTURA</TableHead>
                        <TableHead className="w-16 truncate py-3 px-3 uppercase">GARANTÍA</TableHead>
                        <TableHead className="w-16 truncate py-3 px-3 uppercase">GASTOS 360</TableHead>
                        <TableHead className="w-16 truncate py-3 px-3 uppercase">ANTIGÜEDAD</TableHead>
                        <TableHead className="w-16 truncate py-3 px-3 uppercase">FINANCIADO</TableHead>
                      </>
                    )}
                    <TableHead className="w-16 truncate py-3 px-3 uppercase">OTROS</TableHead>
                    <TableHead className="w-20 truncate py-3 px-3 uppercase">OBSERVACIONES</TableHead>
                    <TableHead className="w-16 truncate py-3 px-3 uppercase">MARGEN</TableHead>
                    <TableHead className="w-20 truncate py-3 px-3 uppercase">IMPORTE</TableHead>
                    <TableHead className="w-16 truncate py-3 px-3 uppercase">TRAMITADO</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={isSimplifiedView ? 14 : 19} className="text-center py-8">
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          <span>Cargando incentivos...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedIncentivos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isSimplifiedView ? 14 : 19} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Euro className="h-10 w-10 mb-2" />
                          <p>No se encontraron incentivos</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedIncentivos.map((incentivo, index) => {
                      const importe = calculateImporte(incentivo)
                      const margen = (incentivo.precio_venta || 0) - (incentivo.precio_compra || 0)

                      return (
                        <TableRow
                          key={incentivo.id}
                          className={cn("h-12 hover:bg-muted/30", index % 2 === 0 ? "bg-black/5 dark:bg-black/20" : "")}
                        >
                          <TableCell className="py-3 px-3 text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 p-1"
                                  onClick={() => setWarrantyDetailModal({ open: true, incentivo: incentivo })}
                                >
                                  <Receipt className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Ver detalle del cálculo</TooltipContent>
                            </Tooltip>
                          </TableCell>

                          <TableCell className="py-3 px-3">
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              {formatDate(incentivo.fecha_entrega)}
                            </div>
                          </TableCell>

                          <TableCell className="font-medium py-3 px-3">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center">
                                  <Car className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                  <span className="truncate block">{incentivo.matricula}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>{incentivo.matricula}</TooltipContent>
                            </Tooltip>
                          </TableCell>

                          <TableCell className="py-3 px-3">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center">
                                  <Tag className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                  <span className="truncate block">{incentivo.or}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>{incentivo.or}</TooltipContent>
                            </Tooltip>
                          </TableCell>

                          <TableCell className="py-3 px-3">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="truncate max-w-[90px]">{incentivo.modelo}</div>
                              </TooltipTrigger>
                              <TooltipContent>{incentivo.modelo}</TooltipContent>
                            </Tooltip>
                          </TableCell>

                          <TableCell className="py-3 px-3">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center">
                                  <User className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                  <div className="truncate max-w-[80px]">{incentivo.asesor}</div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>{incentivo.asesor}</TooltipContent>
                            </Tooltip>
                          </TableCell>

                          <TableCell className="py-3 px-3">
                            <Badge variant="outline" className={getFormaPagoBadgeClass(incentivo.forma_pago)}>
                              {incentivo.forma_pago}
                            </Badge>
                          </TableCell>

                          <TableCell className="py-3 px-3 font-medium">
                            {formatCurrency(incentivo.precio_venta)}
                          </TableCell>

                          <TableCell className="py-3 px-3">
                            {isAdmin ? (
                              <Input
                                type="number"
                                value={incentivo.precio_compra === null ? "" : incentivo.precio_compra}
                                onChange={(e) => handleLocalFieldChange(incentivo.id, "precio_compra", e.target.value)}
                                onBlur={(e) =>
                                  handleUpdateIncentivoField(
                                    incentivo.id,
                                    "precio_compra",
                                    e.target.value === "" ? null : Number.parseFloat(e.target.value),
                                  )
                                }
                                className="w-24 h-7 text-xs"
                                placeholder="0.00"
                              />
                            ) : (
                              <span className="font-medium">{formatCurrency(incentivo.precio_compra)}</span>
                            )}
                          </TableCell>

                          <TableCell
                            className={cn(
                              "py-3 px-3 font-medium",
                              incentivo.dias_stock && incentivo.dias_stock > 150 ? "text-red-500" : "",
                            )}
                          >
                            {incentivo.dias_stock || 0}
                          </TableCell>

                          {!isSimplifiedView && (
                            <>
                              <TableCell className="py-3 px-3">{formatCurrency(incentivo.gastos_estructura)}</TableCell>

                              <TableCell className="py-3 px-3">
                                {incentivo.garantia === 0 ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300"
                                  >
                                    Fabricante
                                  </Badge>
                                ) : (
                                  <Input
                                    type="number"
                                    value={incentivo.garantia === null ? "" : incentivo.garantia}
                                    onChange={(e) => handleLocalFieldChange(incentivo.id, "garantia", e.target.value)}
                                    onBlur={(e) => handleUpdateIncentivoField(incentivo.id, "garantia", e.target.value)}
                                    className="w-20 h-7 text-xs"
                                    placeholder="0.00"
                                  />
                                )}
                              </TableCell>

                              <TableCell className="py-3 px-3">
                                <Input
                                  type="number"
                                  value={incentivo.gastos_360 === null ? "" : incentivo.gastos_360}
                                  onChange={(e) => handleLocalFieldChange(incentivo.id, "gastos_360", e.target.value)}
                                  onBlur={(e) => handleUpdateIncentivoField(incentivo.id, "gastos_360", e.target.value)}
                                  className="w-20 h-7 text-xs"
                                  placeholder="0.00"
                                />
                              </TableCell>

                              <TableCell className="py-3 px-3">
                                {isAdmin ? (
                                  <Checkbox
                                    checked={incentivo.antiguedad || false}
                                    onCheckedChange={(checked) =>
                                      handleUpdateIncentivoField(incentivo.id, "antiguedad", checked === true)
                                    }
                                  />
                                ) : (
                                  <Checkbox checked={incentivo.antiguedad || false} disabled />
                                )}
                              </TableCell>

                              <TableCell className="py-3 px-3">
                                {isAdmin ? (
                                  <Checkbox
                                    checked={incentivo.financiado || false}
                                    onCheckedChange={(checked) =>
                                      handleUpdateIncentivoField(incentivo.id, "financiado", checked === true)
                                    }
                                  />
                                ) : (
                                  <Checkbox checked={incentivo.financiado || false} disabled />
                                )}
                              </TableCell>
                            </>
                          )}

                          <TableCell className="py-3 px-3">
                            <Input
                              type="number"
                              value={incentivo.otros === null ? "" : incentivo.otros}
                              onChange={(e) => handleLocalFieldChange(incentivo.id, "otros", e.target.value)}
                              onBlur={(e) => handleUpdateIncentivoField(incentivo.id, "otros", e.target.value)}
                              className="w-20 h-7 text-xs"
                              placeholder="0.00"
                            />
                          </TableCell>

                          <TableCell className="py-3 px-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleObservationsClick(incentivo)}
                              className="h-7 px-2 text-xs"
                            >
                              {incentivo.otros_observaciones ? "Ver" : "Añadir"}
                            </Button>
                          </TableCell>

                          <TableCell className="py-3 px-3 font-medium">{formatCurrency(margen)}</TableCell>

                          <TableCell className="py-3 px-3 font-bold text-green-600">
                            {formatCurrency(importe)}
                          </TableCell>

                          <TableCell className="py-3 px-3">
                            <Checkbox
                              checked={incentivo.tramitado || false}
                              onCheckedChange={(checked) =>
                                handleUpdateIncentivoField(incentivo.id, "tramitado", checked === true)
                              }
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>
              Mostrando {filteredIncentivos.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
              {Math.min(currentPage * itemsPerPage, filteredIncentivos.length)} de {filteredIncentivos.length} registros
            </span>
            <div className="flex items-center space-x-1">
              <span>|</span>
              <span>Filas por página:</span>
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-[70px] h-8 border-none">
                  <SelectValue placeholder={itemsPerPage} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {getPageNumbers().map((pageNumber) => (
              <Button
                key={pageNumber}
                variant={pageNumber === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(pageNumber)}
                className={cn("h-8 w-8 px-0", pageNumber === currentPage ? "bg-primary text-primary-foreground" : "")}
              >
                {pageNumber}
              </Button>
            ))}

            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={otherObservationsDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setOtherObservationsDialog({
              open: false,
              incentivo: null,
              observations: "",
            })
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Observaciones - {otherObservationsDialog.incentivo?.matricula}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={otherObservationsDialog.observations}
              onChange={(e) =>
                setOtherObservationsDialog((prev) => ({
                  ...prev,
                  observations: e.target.value,
                }))
              }
              placeholder="Añadir observaciones..."
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOtherObservationsDialog({ open: false, incentivo: null, observations: "" })}
            >
              Cancelar
            </Button>
            <Button onClick={handleObservationsSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <WarrantyDetailModal
        open={warrantyDetailModal.open}
        onOpenChange={(open) => {
          if (!open) {
            setWarrantyDetailModal({
              open: false,
              incentivo: null,
            })
          }
        }}
        incentivo={warrantyDetailModal.incentivo}
      />
    </TooltipProvider>
  )
}
