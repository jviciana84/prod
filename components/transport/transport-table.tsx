"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
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
  SquarePen,
  Trash2,
  CheckCircle,
  ArrowUpDown,
  X,
  ChevronsUpDown,
  Check,
  Loader2,
} from "lucide-react"
import { format, parseISO, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useRef } from "react"
import { Command, CommandList, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { canUserEditClient } from "@/lib/auth/permissions-client"
import { ReusablePagination } from "@/components/ui/reusable-pagination"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { PrintExportButton } from "./print-export-button"

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
  const [activeFilter, setActiveFilter] = useState("pending") // pending, received, all
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [editingCell, setEditingCell] = useState<{id: number, field: string} | null>(null)
  const [cellValue, setCellValue] = useState("")
  const inputRef = useRef<HTMLInputElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [expenseTypes, setExpenseTypes] = useState<any[]>([])
  const [originPopoverOpen, setOriginPopoverOpen] = useState(false)
  const [expensePopoverOpen, setExpensePopoverOpen] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Estados para el filtro de fechas temporal
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false)

  const supabase = createClientComponentClient()
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

  // Paginación - Calculado antes de los useEffect que lo usan
  const totalPages = Math.ceil(filteredTransports.length / rowsPerPage)
  const paginatedData = useMemo(() => {
    return filteredTransports.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
  }, [filteredTransports, currentPage, rowsPerPage])



  // Actualizar los transportes cuando cambian los initialTransports
  useEffect(() => {
    setTransports(initialTransports)
    applyFilters(initialTransports, searchTerm, activeFilter)
  }, [initialTransports, dateRange, locations])

  // Focus en el buscador cuando se carga la página
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  // Aplicar filtros (búsqueda y estado)
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

    // Aplicar filtro de fechas temporal
    result = applyDateRangeFilter(result)

    setFilteredTransports(result)
  }

  // Función para aplicar filtro de fechas temporal
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

  // Manejar selección de fila
  const handleRowClick = (transportId: number, event: React.MouseEvent) => {
    // No deseleccionar si se hace clic en elementos interactivos
    const target = event.target as Element
    if (target.closest('button') || target.closest('input') || target.closest('[role="combobox"]') || target.closest('span[onClick]')) {
      return
    }
    
    setSelectedRowId(selectedRowId === transportId ? null : transportId)
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
    setCurrentPage(1) // Resetear a la primera página
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
        // Enriquecer con datos relacionados
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
        
        // Llamar a onRefresh si está disponible
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
      const receptionDate = newStatus ? new Date().toISOString() : null

      const { error } = await supabase
        .from("nuevas_entradas")
        .update({ is_received: newStatus, reception_date: receptionDate })
        .eq("id", id)

      if (error) throw error

      // Actualizar localmente
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
      const { error } = await supabase.from("nuevas_entradas").delete().eq("id", id)

      if (error) throw error

      // Actualizar localmente
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

  // Editar transporte
  const handleEdit = (id: number) => {
    // Redirigir a la página de edición
    window.location.href = `/dashboard/nuevas-entradas/edit/${id}`
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

  // Función para obtener el color de la prioridad basado en días de espera
  function getPriorityColor(days: number | null): string {
    if (days === null) return "bg-gray-300 dark:bg-gray-600"
    if (days > 30) return "bg-red-600 dark:bg-red-500" // Máxima prioridad
    if (days > 15) return "bg-red-500 dark:bg-red-400" // Alta prioridad
    if (days > 7) return "bg-orange-500 dark:bg-orange-400" // Media prioridad
    if (days > 3) return "bg-amber-500 dark:bg-amber-400" // Baja prioridad
    return "bg-yellow-400 dark:bg-yellow-300" // Mínima prioridad
  }

  // Determinar prioridad basada en días de espera
  const getPriorityClass = (days: number | null) => {
    if (days === null) return ""
    if (days > 30) return "animate-[priorityPulseHigh_1.5s_ease-in-out_infinite]"
    if (days > 15) return "animate-[priorityPulseHigh_1.5s_ease-in-out_infinite]"
    if (days > 7) return "animate-[priorityPulseMedium_2.5s_ease-in-out_infinite]"
    return "animate-[priorityPulseLow_4s_ease-in-out_infinite]"
  }

  // Paginación ya calculada arriba

  // Guardar celda secundaria en Supabase
  const saveCell = async (id: number, field: string, value: any) => {
    try {
      console.log(`Guardando ${field}:`, value, "para ID:", id)
      const { error } = await supabase.from("nuevas_entradas").update({ [field]: value }).eq("id", id)
      if (error) throw error
      
      console.log(`Guardado exitoso para ${field}:`, value)
      
      // Actualizar localmente
      const updated = transports.map((item) => {
        if (item && item.id === id) {
          const updatedItem = { ...item, [field]: value }
          
          // Si estamos actualizando origin_location_id, también actualizar la relación
          if (field === "origin_location_id") {
            updatedItem.origin_location = locations.find(loc => loc.id === value) || null
          }
          
          // Si estamos actualizando expense_type_id, también actualizar la relación
          if (field === "expense_type_id") {
            updatedItem.expense_type = expenseTypes.find(et => et.id === value) || null
          }
          
          return updatedItem
        }
        return item
      })
      
      setTransports(updated)
      applyFilters(updated, searchTerm, activeFilter)
      setEditingCell(null)
    } catch (error) {
      console.error("Error guardando:", error)
      toast({ title: "Error", description: "No se pudo guardar el cambio", variant: "destructive" })
    }
  }

  useEffect(() => {
    // Cargar tipos de gastos
    const fetchExpenseTypes = async () => {
      const { data } = await supabase.from("expense_types").select("*").order("name")
      if (data) setExpenseTypes(data)
    }
    fetchExpenseTypes()
  }, [supabase])

  // Manejar clics fuera de la tabla para deseleccionar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.transport-table-container')) {
        setSelectedRowId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="space-y-4 transport-table-container">
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
      
      /* Estilos para filas seleccionadas */
      tr[data-selected="true"] {
        position: relative;
      }
      
      tr[data-selected="true"]::after {
        content: '';
        position: absolute;
        right: 8px;
        top: 8px;
        width: 8px;
        height: 8px;
        background-color: hsl(var(--primary));
        border-radius: 50%;
        z-index: 10;
      }
      
      /* Borde lateral en la primera celda */
      tr[data-selected="true"] td:first-child {
        border-left: 4px solid hsl(var(--primary));
        padding-left: calc(1rem - 4px);
      }
    `}</style>

             <div className="flex flex-wrap items-center justify-between gap-2 bg-card rounded-lg p-2 shadow-sm mb-4">
         <div className="flex items-center gap-2 flex-1">
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
         </div>

         <div className="flex items-center gap-2">
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

           <Button
             variant="outline"
             size="icon"
             onClick={() => {}}
             className="h-9 w-9"
             title="Ordenar"
           >
             <ArrowUpDown className="h-4 w-4" />
           </Button>

           {/* Botón de filtro de fechas temporal */}
           <Popover open={isDateFilterOpen} onOpenChange={setIsDateFilterOpen}>
             <PopoverTrigger asChild>
               <Button
                 variant="outline"
                 size="icon"
                 className={cn(
                   "h-9 w-9",
                   (dateRange.from || dateRange.to) && "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                 )}
                 title="Filtrar por rango de fechas"
               >
                 <CalendarIcon className="h-4 w-4" />
               </Button>
             </PopoverTrigger>
             <PopoverContent className="w-auto p-0" align="end">
               <CalendarComponent
                 initialFocus
                 mode="range"
                 defaultMonth={dateRange.from}
                 selected={dateRange}
                 onSelect={(range) => {
                   setDateRange(range || { from: undefined, to: undefined })
                   setIsDateFilterOpen(false)
                 }}
                 numberOfMonths={2}
                 locale={es}
               />
               {(dateRange.from || dateRange.to) && (
                 <div className="p-3 border-t">
                   <div className="flex items-center justify-between">
                     <div className="text-sm text-muted-foreground">
                       {dateRange.from && (
                         <span>Desde: {format(dateRange.from, "dd/MM/yyyy", { locale: es })}</span>
                       )}
                       {dateRange.to && (
                         <span className="ml-2">
                           Hasta: {format(dateRange.to, "dd/MM/yyyy", { locale: es })}
                         </span>
                       )}
                     </div>
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={clearDateRangeFilter}
                       className="h-6 text-xs"
                     >
                       Limpiar
                     </Button>
                   </div>
                 </div>
               )}
             </PopoverContent>
           </Popover>

           <PrintExportButton
             transports={transports}
             searchQuery={searchTerm}
             statusFilter={activeFilter}
             locationFilter="all"
             locations={locations}
             currentDisplayData={paginatedData}
           />

           <Tabs value={activeFilter} onValueChange={handleFilterChange} className="w-auto">
             <TabsList className="grid grid-cols-3 w-[300px]">
               <TabsTrigger value="pending" className="flex items-center gap-1">
                 <Clock className="h-4 w-4" />
                 <span>Pendientes</span>
               </TabsTrigger>
               <TabsTrigger value="received" className="flex items-center gap-1">
                 <CheckCircle className="h-4 w-4" />
                 <span>Recibidos</span>
               </TabsTrigger>
               <TabsTrigger value="all" className="flex items-center gap-1">
                 <Filter className="h-4 w-4" />
                 <span>Todos</span>
               </TabsTrigger>
             </TabsList>
           </Tabs>
         </div>
       </div>



      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-sm font-medium py-3 text-foreground">MATRÍCULA</TableHead>
                <TableHead className="text-sm font-medium py-3 text-foreground">MODELO</TableHead>
                <TableHead className="text-sm font-medium py-3 text-foreground">PRECIO DE COMPRA</TableHead>
                <TableHead className="text-sm font-medium py-3 text-foreground">SEDE ORIGEN</TableHead>
                <TableHead className="text-sm font-medium py-3 text-foreground">CARGO GASTOS</TableHead>
                <TableHead className="text-sm font-medium py-3 text-foreground">DÍA COMPRA</TableHead>
                <TableHead className="text-sm font-medium py-3 text-foreground">DÍAS ESPERA</TableHead>
                <TableHead className="text-sm font-medium py-3 text-foreground">RECEPCIÓN</TableHead>
                <TableHead className="text-sm font-medium text-right py-3 text-foreground">ACCIONES</TableHead>
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
                  const priorityColor = getPriorityColor(waitingDays)
                  const priorityClass = getPriorityClass(waitingDays)

                  return (
                    <TableRow
                      key={transport?.id || index}
                      className={cn(
                        "transition-all duration-300 ease-in-out cursor-pointer border-b relative",
                        index % 2 === 0 ? "bg-background" : "bg-muted/10",
                        selectedRowId === transport.id 
                          ? "border-2 border-primary shadow-md ring-2 ring-primary/20" 
                          : "hover:bg-muted/30",
                      )}
                      data-selected={selectedRowId === transport.id}
                      onClick={(e) => handleRowClick(transport.id, e)}
                    >

                      <TableCell className="py-3">
                        <div className="flex items-center">
                          {transport && !transport.is_received && (
                            <div className="relative flex items-center justify-center mr-2">
                              <div
                                className={cn("rounded-full relative z-10", priorityClass, priorityColor)}
                                style={{
                                  width: waitingDays && waitingDays > 0 ? "10px" : "8px",
                                  height: waitingDays && waitingDays > 0 ? "10px" : "8px",
                                }}
                                title={
                                  waitingDays > 15
                                    ? "Prioridad alta"
                                    : waitingDays > 7
                                      ? "Prioridad media"
                                      : "Prioridad normal"
                                }
                              />
                              {waitingDays > 15 && (
                                <div
                                  className={cn(
                                    "absolute top-0 left-0 rounded-full animate-ping opacity-75",
                                    priorityColor,
                                  )}
                                  style={{
                                    width: waitingDays && waitingDays > 0 ? "10px" : "8px",
                                    height: waitingDays && waitingDays > 0 ? "10px" : "8px",
                                  }}
                                />
                              )}
                            </div>
                          )}
                          <span className="font-medium text-foreground">{transport.license_plate}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-foreground">{transport.model || "-"}</TableCell>
                      <TableCell className="py-3 text-foreground">
                        {canEdit && editingCell && editingCell.id === transport.id && editingCell.field === "purchase_price" ? (
                          <input
                            ref={inputRef}
                            type="text"
                            className="border-2 border-primary/30 rounded px-2 py-1 text-sm w-full bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={cellValue}
                            onChange={e => {
                              // Solo permitir números, puntos y comas
                              const value = e.target.value.replace(/[^\d.,]/g, '')
                              setCellValue(value)
                            }}
                            onBlur={(e) => {
                              // Usar un pequeño delay para permitir que se active el nuevo campo
                              setTimeout(() => {
                                if (!editingCell || editingCell.id !== transport.id || editingCell.field !== "purchase_price") {
                                  saveCell(transport.id, "purchase_price", cellValue ? Number(cellValue.replace(',', '.')) : null)
                                }
                              }, 100)
                            }}
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                saveCell(transport.id, "purchase_price", cellValue ? Number(cellValue.replace(',', '.')) : null)
                              }
                            }}
                            placeholder="0.00"
                            autoFocus
                          />
                        ) : (
                          <span
                            className={canEdit ? `block cursor-pointer rounded px-1 ${selectedRowId === transport.id ? "" : "hover:bg-muted/50"}` : "block px-1"}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (canEdit) {
                                // Si ya estamos editando este campo, no hacer nada
                                if (editingCell && editingCell.id === transport.id && editingCell.field === "purchase_price") {
                                  return
                                }
                                setSelectedRowId(transport.id)
                                setEditingCell({id: transport.id, field: "purchase_price"})
                                setCellValue(transport.purchase_price ? transport.purchase_price.toString() : "")
                              }
                            }}
                          >
                            {transport.purchase_price ? `${transport.purchase_price.toLocaleString("es-ES")} €` : <span className="text-muted-foreground">-</span>}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-foreground">
                        {canEdit && editingCell && editingCell.id === transport.id && editingCell.field === "origin_location_id" ? (
                          <Popover open={originPopoverOpen} onOpenChange={setOriginPopoverOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between border-2 border-primary/30 bg-background text-foreground hover:bg-primary/10 hover:border-primary"
                                onClick={() => setOriginPopoverOpen(true)}
                              >
                                {locations.find((loc) => loc.id === Number(cellValue))?.name || "Seleccionar sede"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[220px] p-0">
                              <Command>
                                <CommandInput placeholder="Buscar sede..." />
                                <CommandList>
                                  <CommandGroup>
                                    {locations.map((loc) => (
                                      <CommandItem
                                        key={loc.id}
                                        value={loc.id.toString()}
                                        onSelect={() => {
                                          setCellValue(loc.id.toString())
                                          setOriginPopoverOpen(false)
                                          saveCell(transport.id, "origin_location_id", loc.id)
                                        }}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", cellValue == loc.id ? "opacity-100" : "opacity-0")} />
                                        {loc.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span
                            className={canEdit ? `block cursor-pointer rounded px-1 ${selectedRowId === transport.id ? "" : "hover:bg-muted/50"}` : "block px-1"}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (canEdit) {
                                // Si ya estamos editando este campo, no hacer nada
                                if (editingCell && editingCell.id === transport.id && editingCell.field === "origin_location_id") {
                                  return
                                }
                                setSelectedRowId(transport.id)
                                setEditingCell({id: transport.id, field: "origin_location_id"})
                                setCellValue(transport.origin_location_id ? transport.origin_location_id.toString() : "")
                                setOriginPopoverOpen(true)
                              }
                            }}
                          >
                            {transport.origin_location?.name || <span className="text-muted-foreground">-</span>}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-foreground">
                        {canEdit && editingCell && editingCell.id === transport.id && editingCell.field === "expense_type_id" ? (
                          <Popover open={expensePopoverOpen} onOpenChange={setExpensePopoverOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between border-2 border-primary/30 bg-background text-foreground hover:bg-primary/10 hover:border-primary"
                                onClick={() => setExpensePopoverOpen(true)}
                              >
                                {expenseTypes.find((et) => et.id === Number(cellValue))?.name || "Seleccionar gasto"}
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
                                        value={et.id.toString()}
                                        onSelect={() => {
                                          setCellValue(et.id.toString())
                                          setExpensePopoverOpen(false)
                                          saveCell(transport.id, "expense_type_id", et.id)
                                        }}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", cellValue == et.id ? "opacity-100" : "opacity-0")} />
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
                            className={canEdit ? `block cursor-pointer rounded px-1 ${selectedRowId === transport.id ? "" : "hover:bg-muted/50"}` : "block px-1"}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (canEdit) {
                                // Si ya estamos editando este campo, no hacer nada
                                if (editingCell && editingCell.id === transport.id && editingCell.field === "expense_type_id") {
                                  return
                                }
                                setSelectedRowId(transport.id)
                                setEditingCell({id: transport.id, field: "expense_type_id"})
                                setCellValue(transport.expense_type_id ? transport.expense_type_id.toString() : "")
                                setExpensePopoverOpen(true)
                              }
                            }}
                          >
                            {transport.expense_type?.name || <span className="text-muted-foreground">-</span>}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        {canEdit && editingCell && editingCell.id === transport.id && editingCell.field === "purchase_date" ? (
                          <input
                            ref={inputRef}
                            type="date"
                            className="border-2 border-primary/30 rounded px-2 py-1 text-sm w-full bg-background text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={cellValue}
                            onChange={e => setCellValue(e.target.value)}
                            onBlur={(e) => {
                              // Usar un pequeño delay para permitir que se active el nuevo campo
                              setTimeout(() => {
                                if (!editingCell || editingCell.id !== transport.id || editingCell.field !== "purchase_date") {
                                  saveCell(transport.id, "purchase_date", cellValue)
                                }
                              }, 100)
                            }}
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                saveCell(transport.id, "purchase_date", cellValue)
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span 
                              className={canEdit ? `cursor-pointer rounded px-1 ${selectedRowId === transport.id ? "" : "hover:bg-muted/50"}` : "px-1"}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (canEdit) {
                                  // Si ya estamos editando este campo, no hacer nada
                                  if (editingCell && editingCell.id === transport.id && editingCell.field === "purchase_date") {
                                    return
                                  }
                                  setSelectedRowId(transport.id)
                                  setEditingCell({id: transport.id, field: "purchase_date"})
                                  setCellValue(transport.purchase_date ? transport.purchase_date.split('T')[0] : "")
                                }
                              }}
                            >
                              {formatDate(transport.purchase_date)}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        {waitingDays !== null && (
                          <Badge variant="outline" className={waitingBadgeClass}>
                            {waitingDays}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
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
                      <TableCell className="py-3 text-right">
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

      <div className="mt-2 rounded-lg border bg-card shadow-sm">
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
