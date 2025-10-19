"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
// Supabase client no necesario - mutations usan API Routes
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Calendar as CalendarIcon,
  Clock,
  Filter,
  RefreshCw,
  Search,
  Trash2,
  CheckCircle,
  ArrowUpDown,
  X,
  Loader2,
  Check,
} from "lucide-react"
import { format, parseISO, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useRef } from "react"
import { canUserEditClient } from "@/lib/auth/permissions-client"
import { ReusablePagination } from "@/components/ui/reusable-pagination"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Card } from "@/components/ui/card"
import { PrintExportButton } from "./print-export-button"
import { DateFilter } from "@/components/ui/date-filter"

interface TransportTableProps {
  initialTransports: any[]
  locations: any[]
  userRoles?: string[]
  isAdmin?: boolean
  onRefresh?: () => void
  isLoading?: boolean
}

export default function TransportTable({
  initialTransports,
  locations,
  userRoles = [],
  isAdmin = false,
  onRefresh,
  isLoading = false,
}: TransportTableProps) {
  const [transports, setTransports] = useState<any[]>(initialTransports)
  const [filteredTransports, setFilteredTransports] = useState<any[]>(initialTransports)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState("pending")
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [canEdit, setCanEdit] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Estados para el filtro de fechas
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })

  // Estados para el ordenamiento
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const [sortField, setSortField] = useState("purchase_date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // NOTA: Crear cliente fresco en cada mutación para evitar zombie client
  const { toast } = useToast()

  // Verificar permisos de edición
  useEffect(() => {
    const checkEditPermissions = async () => {
      try {
        const hasEditPermission = await canUserEditClient()
        setCanEdit(hasEditPermission)
      } catch (error) {
        console.error("Error verificando permisos de edición:", error)
        setCanEdit(false)
      }
    }
    
    checkEditPermissions()
  }, [])

  // Paginación
  const totalPages = Math.ceil(filteredTransports.length / rowsPerPage)
  const paginatedData = useMemo(() => {
    return filteredTransports.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
  }, [filteredTransports, currentPage, rowsPerPage])

  // Actualizar los transportes cuando cambian los initialTransports
  useEffect(() => {
    setTransports(initialTransports)
    applyFilters(initialTransports, searchTerm, activeFilter)
  }, [initialTransports, dateRange, locations, sortField, sortDirection])

  // Focus en el buscador cuando se carga la página
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  // Aplicar filtros
  const applyFilters = (data: any[], search: string, filter: string) => {
    let result = [...data]

    // Aplicar filtro de búsqueda
    if (search.trim()) {
      const lowerSearch = search.toLowerCase()
      result = result.filter((transport) => {
        return (
          (transport.license_plate && transport.license_plate.toLowerCase().includes(lowerSearch)) ||
          (transport.model && transport.model.toLowerCase().includes(lowerSearch)) ||
          (transport.origin_location?.name && transport.origin_location.name.toLowerCase().includes(lowerSearch)) ||
          (transport.expense_type?.name && transport.expense_type.name.toLowerCase().includes(lowerSearch))
        )
      })
    }

    // Aplicar filtro de estado
    if (filter === "pending") {
      result = result.filter((t) => t && !t.is_received)
    } else if (filter === "received") {
      result = result.filter((t) => t && t.is_received)
    }

    // Aplicar filtro de fechas
    result = applyDateRangeFilter(result)

    // Aplicar ordenamiento
    result = sortData(result)

    setFilteredTransports(result)
  }

  // Función para aplicar filtro de fechas
  const applyDateRangeFilter = (data: any[]) => {
    if (!dateRange.from && !dateRange.to) {
      return data
    }

    return data.filter((transport) => {
      const transportDate = new Date(transport.purchase_date)
      
      if (dateRange.from && transportDate < dateRange.from) {
        return false
      }
      
      if (dateRange.to && transportDate > dateRange.to) {
        return false
      }
      
      return true
    })
  }

  // Función para limpiar filtro de fechas
  const clearDateRangeFilter = () => {
    setDateRange({ from: undefined, to: undefined })
  }

  // Función para ordenar datos
  const sortData = (data: any[]) => {
    return [...data].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case "purchase_date":
          aValue = a.purchase_date ? new Date(a.purchase_date).getTime() : 0
          bValue = b.purchase_date ? new Date(b.purchase_date).getTime() : 0
          break
        case "reception_date":
          aValue = a.reception_date ? new Date(a.reception_date).getTime() : 0
          bValue = b.reception_date ? new Date(b.reception_date).getTime() : 0
          break
        case "purchase_price":
          aValue = a.purchase_price ? parseFloat(a.purchase_price.toString()) : 0
          bValue = b.purchase_price ? parseFloat(b.purchase_price.toString()) : 0
          break
        case "license_plate":
          aValue = (a.license_plate || "").toLowerCase()
          bValue = (b.license_plate || "").toLowerCase()
          break
        case "model":
          aValue = (a.model || "").toLowerCase()
          bValue = (b.model || "").toLowerCase()
          break
        default:
          aValue = (a[sortField] || "").toString().toLowerCase()
          bValue = (b[sortField] || "").toString().toLowerCase()
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })
  }

  // Función para manejar el ordenamiento
  const handleSort = (field: string, direction: "asc" | "desc") => {
    setSortField(field)
    setSortDirection(direction)
    setSortMenuOpen(false)
  }

  // Manejar cambio en la búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    applyFilters(transports, value, activeFilter)
  }

  // Manejar cambio en el filtro
  const handleFilterChange = (value: string) => {
    setActiveFilter(value)
    applyFilters(transports, searchTerm, value)
    setCurrentPage(1)
  }

  // Limpiar búsqueda
  const clearSearch = () => {
    setSearchTerm("")
    applyFilters(transports, "", activeFilter)
  }

  // Refrescar datos
  const refreshData = async () => {
    try {
      const { data, error } = await supabase
        .from("nuevas_entradas")
        .select("*")
        .order("purchase_date", { ascending: false })

      if (error) throw error

      if (data) {
        const { data: locationData } = await supabase.from("locations").select("*")
        const { data: expenseTypeData } = await supabase.from("expense_types").select("*")

        const locationMap = locationData
          ? locationData.reduce((map, loc) => {
              map[loc.id] = loc
              return map
            }, {})
          : {}

        const expenseTypeMap = expenseTypeData
          ? expenseTypeData.reduce((map, type) => {
              map[type.id] = type
              return map
            }, {})
          : {}

        const enrichedData = data.map((transport) => ({
          ...transport,
          origin_location: locationMap[transport.origin_location_id] || null,
          expense_type: expenseTypeMap[transport.expense_type_id] || null,
        }))

        setTransports(enrichedData)
        applyFilters(enrichedData, searchTerm, activeFilter)
        
        if (onRefresh) {
          onRefresh()
        }
      }
    } catch (error) {
      console.error("Error al refrescar datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos actualizados",
        variant: "destructive",
      })
    }
  }

  // Cambiar estado de recepción
  const toggleReception = async (id: number, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus

      const response = await fetch("/api/transport/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isReceived: newStatus }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || "Error al actualizar")
      }

      const receptionDate = newStatus ? new Date().toISOString() : null

      const updatedTransports = transports.map((item) =>
        item && item.id === id ? { ...item, is_received: newStatus, reception_date: receptionDate } : item,
      )

      setTransports(updatedTransports)
      applyFilters(updatedTransports, searchTerm, activeFilter)

      toast({
        title: newStatus ? "Vehículo recibido" : "Recepción cancelada",
        description: newStatus
          ? "Se ha marcado el vehículo como recibido"
          : "Se ha cancelado la recepción del vehículo",
      })
    } catch (error) {
      console.error("Error al cambiar estado de recepción:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de recepción",
        variant: "destructive",
      })
    }
  }

  // Eliminar transporte
  const deleteTransport = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar este registro?")) return

    setIsDeleting(true)
    try {
      const response = await fetch("/api/transport/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || "Error al eliminar")
      }

      const updatedTransports = transports.filter((item) => item && item.id !== id)
      setTransports(updatedTransports)
      applyFilters(updatedTransports, searchTerm, activeFilter)

      toast({
        title: "Registro eliminado",
        description: "El registro se ha eliminado correctamente",
      })
    } catch (error) {
      console.error("Error al eliminar:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el registro",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Formatear fecha
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: es })
    } catch (error) {
      return dateString
    }
  }

  // Calcular días de espera
  const getWaitingDays = (purchaseDate: string, receptionDate: string | null) => {
    if (!purchaseDate) return null

    const startDate = parseISO(purchaseDate)
    const endDate = receptionDate ? parseISO(receptionDate) : new Date()

    return differenceInDays(endDate, startDate)
  }

  // Determinar clase CSS para días de espera
  const getWaitingBadgeClass = (days: number | null) => {
    if (days === null) return ""
    if (days > 30) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    if (days > 15) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    if (days > 7) return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between bg-card rounded-lg p-2 shadow-sm mb-2">
        {/* Izquierda: Buscador y botones alineados */}
        <div className="flex items-center gap-2">
          {/* Buscador */}
           <Card className="p-3">
             <div className="flex items-center gap-2 relative">
               <Search className="h-4 w-4 text-muted-foreground" />
               <Input
                 ref={searchInputRef}
                 type="search"
                 placeholder="Buscar por matrícula, modelo, sede o cargo..."
                 className="w-80"
                 value={searchTerm}
                 onChange={handleSearchChange}
               />
               {searchTerm && (
                 <button
                   onClick={clearSearch}
                   className="text-muted-foreground hover:text-foreground"
                 >
                   <X className="h-4 w-4" />
                 </button>
               )}
             </div>
           </Card>

          {/* Botones con la misma altura */}
           <Button
             variant="outline"
             size="icon"
             onClick={refreshData}
             disabled={isLoading}
             className="h-9 w-9"
             title="Actualizar datos"
           >
             {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
           </Button>

          {/* Popover de ordenamiento */}
          <Popover open={sortMenuOpen} onOpenChange={setSortMenuOpen}>
            <PopoverTrigger asChild>
           <Button
             variant="outline"
             size="icon"
             className="h-9 w-9"
             title="Ordenar"
           >
             <ArrowUpDown className="h-4 w-4" />
           </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start" side="bottom">
              <div className="space-y-2">
                <div className="text-sm font-medium">Ordenar por:</div>
                
                {/* Matrícula */}
                <div className="flex items-center justify-between">
                  <span className="text-sm">Matrícula</span>
                  <div className="flex gap-1">
                    <Button
                      variant={sortField === "license_plate" && sortDirection === "asc" ? "default" : "ghost"}
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        if (sortField === "license_plate" && sortDirection === "asc") {
                          handleSort("license_plate", "desc")
                        } else {
                          handleSort("license_plate", "asc")
                        }
                      }}
                    >
                      ↑
                    </Button>
                    <Button
                      variant={sortField === "license_plate" && sortDirection === "desc" ? "default" : "ghost"}
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        if (sortField === "license_plate" && sortDirection === "desc") {
                          handleSort("license_plate", "asc")
                        } else {
                          handleSort("license_plate", "desc")
                        }
                      }}
                    >
                      ↓
                    </Button>
                  </div>
                </div>

                {/* Modelo */}
                <div className="flex items-center justify-between">
                  <span className="text-sm">Modelo</span>
                  <div className="flex gap-1">
                    <Button
                      variant={sortField === "model" && sortDirection === "asc" ? "default" : "ghost"}
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        if (sortField === "model" && sortDirection === "asc") {
                          handleSort("model", "desc")
                        } else {
                          handleSort("model", "asc")
                        }
                      }}
                    >
                      ↑
                    </Button>
                    <Button
                      variant={sortField === "model" && sortDirection === "desc" ? "default" : "ghost"}
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        if (sortField === "model" && sortDirection === "desc") {
                          handleSort("model", "asc")
                        } else {
                          handleSort("model", "desc")
                        }
                      }}
                    >
                      ↓
                    </Button>
                  </div>
                </div>

                {/* Precio */}
                <div className="flex items-center justify-between">
                  <span className="text-sm">Precio</span>
                  <div className="flex gap-1">
                    <Button
                      variant={sortField === "purchase_price" && sortDirection === "asc" ? "default" : "ghost"}
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        if (sortField === "purchase_price" && sortDirection === "asc") {
                          handleSort("purchase_price", "desc")
                        } else {
                          handleSort("purchase_price", "asc")
                        }
                      }}
                    >
                      ↑
                    </Button>
                    <Button
                      variant={sortField === "purchase_price" && sortDirection === "desc" ? "default" : "ghost"}
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        if (sortField === "purchase_price" && sortDirection === "desc") {
                          handleSort("purchase_price", "asc")
                        } else {
                          handleSort("purchase_price", "desc")
                        }
                      }}
                    >
                      ↓
                    </Button>
                  </div>
                </div>

                {/* Fecha de compra */}
                <div className="flex items-center justify-between">
                  <span className="text-sm">Fecha de compra</span>
                  <div className="flex gap-1">
                    <Button
                      variant={sortField === "purchase_date" && sortDirection === "asc" ? "default" : "ghost"}
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        if (sortField === "purchase_date" && sortDirection === "asc") {
                          handleSort("purchase_date", "desc")
                        } else {
                          handleSort("purchase_date", "asc")
                        }
                      }}
                    >
                      ↑
                    </Button>
                    <Button
                      variant={sortField === "purchase_date" && sortDirection === "desc" ? "default" : "ghost"}
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        if (sortField === "purchase_date" && sortDirection === "desc") {
                          handleSort("purchase_date", "asc")
                        } else {
                          handleSort("purchase_date", "desc")
                        }
                      }}
                    >
                      ↓
                    </Button>
                  </div>
                </div>

                {/* Fecha de recepción */}
                <div className="flex items-center justify-between">
                  <span className="text-sm">Fecha de recepción</span>
                  <div className="flex gap-1">
                    <Button
                      variant={sortField === "reception_date" && sortDirection === "asc" ? "default" : "ghost"}
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        if (sortField === "reception_date" && sortDirection === "asc") {
                          handleSort("reception_date", "desc")
                        } else {
                          handleSort("reception_date", "asc")
                        }
                      }}
                    >
                      ↑
                    </Button>
                    <Button
                      variant={sortField === "reception_date" && sortDirection === "desc" ? "default" : "ghost"}
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        if (sortField === "reception_date" && sortDirection === "desc") {
                          handleSort("reception_date", "asc")
                        } else {
                          handleSort("reception_date", "desc")
                        }
                      }}
                    >
                      ↓
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Botón de filtro de fechas */}
          <DateFilter
            onDateFilterChange={(from, to) => setDateRange({ from, to })}
            dateFilter={dateRange}
            title="Filtrar por fecha de compra"
            description="Selecciona un rango de fechas para filtrar por fecha de compra"
          />

           <PrintExportButton
             transports={transports}
             searchQuery={searchTerm}
             statusFilter={activeFilter}
             locationFilter="all"
             locations={locations}
             currentDisplayData={paginatedData}
           />
        </div>

                 {/* Derecha: Pestañas en la misma línea */}
           <Tabs value={activeFilter} onValueChange={handleFilterChange} className="w-auto">
           <TabsList className="grid grid-cols-3 w-[400px]">
               <TabsTrigger value="pending" className="flex items-center gap-1">
                 <span>Pendientes</span>
               <Badge variant="outline" className="ml-1 text-xs border-muted-foreground/20">
                 {transports.filter(t => t && !t.is_received).length}
               </Badge>
               </TabsTrigger>
               <TabsTrigger value="received" className="flex items-center gap-1">
                 <span>Recibidos</span>
               <Badge variant="outline" className="ml-1 text-xs border-muted-foreground/20">
                 {transports.filter(t => t && t.is_received).length}
               </Badge>
               </TabsTrigger>
               <TabsTrigger value="all" className="flex items-center gap-1">
                 <span>Todos</span>
               <Badge variant="outline" className="ml-1 text-xs border-muted-foreground/20">
                 {transports.length}
               </Badge>
               </TabsTrigger>
             </TabsList>
           </Tabs>
       </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-sm font-medium py-2 text-foreground">MATRÍCULA</TableHead>
                <TableHead className="text-sm font-medium py-2 text-foreground">MODELO</TableHead>
                <TableHead className="text-sm font-medium py-2 text-foreground">PRECIO DE COMPRA</TableHead>
                <TableHead className="text-sm font-medium py-2 text-foreground">SEDE ORIGEN</TableHead>
                <TableHead className="text-sm font-medium py-2 text-foreground">CARGO GASTOS</TableHead>
                <TableHead className="text-sm font-medium py-2 text-foreground">DÍA COMPRA</TableHead>
                <TableHead className="text-sm font-medium py-2 text-foreground">DÍAS ESPERA</TableHead>
                <TableHead className="text-sm font-medium py-2 text-foreground">RECEPCIÓN</TableHead>
                <TableHead className="text-sm font-medium text-right py-2 text-foreground">ACCIONES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    No se encontraron resultados.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((transport, index) => {
                  const waitingDays = getWaitingDays(transport.purchase_date, transport.reception_date)
                  const waitingBadgeClass = getWaitingBadgeClass(waitingDays)

                  return (
                    <TableRow
                      key={transport?.id || index}
                      className={cn(
                        "transition-all duration-300 ease-in-out cursor-pointer border-b relative",
                        index % 2 === 0 ? "bg-background" : "bg-muted/10",
                        "hover:bg-muted/30",
                      )}
                    >
                      <TableCell className="py-2">
                          <span className="font-medium text-foreground">{transport.license_plate}</span>
                      </TableCell>
                      <TableCell className="py-2 text-foreground">{transport.model || "-"}</TableCell>
                      <TableCell className="py-2 text-foreground">
                            {transport.purchase_price ? `${transport.purchase_price.toLocaleString("es-ES")} €` : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="py-2 text-foreground">
                            {transport.origin_location?.name || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="py-2 text-foreground">
                            {transport.expense_type?.name || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="py-2">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(transport.purchase_date)}</span>
                          </div>
                      </TableCell>
                      <TableCell className="py-2">
                        {waitingDays !== null && (
                          <Badge variant="outline" className={waitingBadgeClass}>
                            {waitingDays}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => transport && toggleReception(transport.id, transport.is_received)}
                          disabled={isLoading}
                                                      className={`h-8 text-xs transition-all duration-300 ${
                              transport && transport.is_received
                                ? "border-green-200 text-green-700 hover:text-white hover:border-green-500 hover:bg-green-500 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-700 dark:hover:text-white"
                                : "border-amber-200 text-amber-700 hover:text-white hover:border-amber-500 hover:bg-amber-500 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-700 dark:hover:text-white"
                            }`}
                        >
                          {transport && transport.is_received ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Recibido
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Pendiente
                            </>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
                            onClick={() => transport && deleteTransport(transport.id)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="mt-1 rounded-lg border bg-card shadow-sm">
        <ReusablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredTransports.length}
          itemsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(value) => {
            setRowsPerPage(value)
            setCurrentPage(1)
          }}
          itemsPerPageOptions={[5, 10, 25, 50]}
          showItemsPerPage={true}
          showFirstLastButtons={true}
        />
      </div>
    </div>
  )
}
