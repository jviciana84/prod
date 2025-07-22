"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Search, 
  RefreshCw, 
  Loader2, 
  History, 
  Calendar, 
  User, 
  Package, 
  Truck, 
  Hand,
  FileCheck,
  FileText,
  Leaf,
  Key,
  CreditCard
} from "lucide-react"
import { toast } from "sonner"
import { formatDateForDisplay } from "@/lib/date-utils"
import type { Recogida } from "@/types/recogidas"

// Función cn para combinar clases
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function RecogidasHistorial() {
  const [recogidas, setRecogidas] = useState<Recogida[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecogidas, setTotalRecogidas] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)

  const loadRecogidas = async (page = 1, search = "") => {
    try {
      const limit = itemsPerPage
      const offset = (page - 1) * limit
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(search && { search })
      })

      const response = await fetch(`/api/recogidas?${params}`)
      if (!response.ok) {
        throw new Error("Error cargando recogidas")
      }

      const { recogidas: newRecogidas, total } = await response.json()
      
      setRecogidas(newRecogidas)
      setTotalRecogidas(total || 0)
      setTotalPages(Math.ceil((total || 0) / itemsPerPage))
      setCurrentPage(page)
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error cargando historial de recogidas")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadRecogidas()
  }, [itemsPerPage])

  const handleSearch = () => {
    setCurrentPage(1)
    loadRecogidas(1, searchQuery)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    setCurrentPage(1)
    loadRecogidas(1, searchQuery)
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "solicitada":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
      case "en_transito":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
      case "entregada":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      case "cancelada":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
    }
  }

  const formatDate = (dateString: string) => {
    return formatDateForDisplay(dateString)
  }

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

  const handleRowClick = (recogidaId: string, event: React.MouseEvent) => {
    // No deseleccionar si se hace clic en elementos interactivos
    const target = event.target as Element
    if (target.closest('button') || 
        target.closest('input') || 
        target.closest('[role="combobox"]') || 
        target.closest('span[onClick]') ||
        target.closest('a') ||
        target.closest('[data-interactive]')) {
      return
    }
    
    setSelectedRowId(selectedRowId === recogidaId ? null : recogidaId)
  }

  const getMaterialIcon = (material: string) => {
    const materialConfig = [
      { name: "Permiso circulación", icon: FileCheck, color: "text-blue-500" },
      { name: "Ficha técnica", icon: FileText, color: "text-green-500" },
      { name: "Pegatina Medioambiental", icon: Leaf, color: "text-emerald-500" },
      { name: "COC", icon: FileText, color: "text-blue-600" },
      { name: "2ª Llave", icon: Key, color: "text-orange-500" },
      { name: "CardKey", icon: CreditCard, color: "text-indigo-500" }
    ].find(m => m.name === material)
    
    return materialConfig || { icon: Package, color: "text-gray-500" }
  }

  const getTipoEntregaIcon = (tipo: string) => {
    if (tipo === "entrega_en_mano") {
      return { icon: Hand, color: "text-green-500", tooltip: "Entrega en Mano" }
    } else {
      return { icon: Truck, color: "text-blue-500", tooltip: "Mensajería" }
    }
  }

  if (loading && recogidas.length === 0) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Cargando historial...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Card principal con título y buscador */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <History className="h-5 w-5 text-blue-500" />
            Historial de Recogidas
          </CardTitle>
          <CardDescription>
            Registro de todas las solicitudes de recogida y entregas en mano
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Subcard del buscador - estilo gestión de ventas */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-card rounded-lg p-2 shadow-sm">
            <div className="flex items-center gap-2 flex-1">
              <Card className="p-3">
                <div className="flex items-center gap-2 relative">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar por matrícula, cliente, usuario..."
                    className="w-80"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleSearch}
                className="h-9 w-9"
                title="Filtrar"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {totalRecogidas} recogidas
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="py-3">FECHA</TableHead>
                <TableHead className="py-3">MATRÍCULA</TableHead>
                <TableHead className="py-3">MATERIALES</TableHead>
                <TableHead className="py-3">CLIENTE</TableHead>
                <TableHead className="py-3">USUARIO</TableHead>
                <TableHead className="py-3">TIPO</TableHead>
                <TableHead className="py-3">ESTADO</TableHead>
                <TableHead className="py-3">SEGUIMIENTO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recogidas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No se encontraron recogidas
                  </TableCell>
                </TableRow>
              ) : (
                recogidas.map((recogida, index) => {
                  const tipoEntrega = getTipoEntregaIcon(recogida.tipo_entrega || "mensajeria")
                  
                  return (
                    <TableRow 
                      key={recogida.id} 
                      className={cn(
                        "transition-all duration-300 ease-in-out cursor-pointer border-b relative",
                        index % 2 === 0 ? "bg-background" : "bg-muted/10",
                        selectedRowId === recogida.id 
                          ? "border-2 border-primary shadow-md bg-primary/5" 
                          : "hover:bg-muted/30",
                      )}
                      data-selected={selectedRowId === recogida.id}
                      onClick={(e) => handleRowClick(recogida.id, e)}
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(recogida.fecha_solicitud)}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-3 font-medium">
                        {recogida.matricula}
                      </TableCell>
                      
                      <TableCell className="py-3">
                        <div className="flex flex-wrap gap-1">
                          <TooltipProvider>
                            {recogida.materiales.slice(0, 3).map((material, index) => {
                              const materialConfig = getMaterialIcon(material)
                              return (
                                <Tooltip key={index}>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center p-1 bg-white rounded border" title={material}>
                                      <materialConfig.icon className={`h-3 w-3 ${materialConfig.color}`} />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{material}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )
                            })}
                            {recogida.materiales.length > 3 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center p-1 bg-white rounded border">
                                    <Package className="h-3 w-3 text-gray-500" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>+{recogida.materiales.length - 3} más</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </TooltipProvider>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-3">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="truncate max-w-[120px] text-sm cursor-help">
                                {recogida.nombre_cliente || "No especificado"}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Cliente: {recogida.nombre_cliente || "No especificado"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[100px]">
                            {recogida.usuario_solicitante}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-3">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-center">
                                <tipoEntrega.icon className={`h-4 w-4 ${tipoEntrega.color}`} />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{tipoEntrega.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      
                      <TableCell className="py-3">
                        <Badge className={`text-xs ${getEstadoColor(recogida.estado)}`}>
                          {recogida.estado.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2 relative">
                          {recogida.seguimiento ? (
                            <Badge variant="secondary" className="text-xs">
                              {recogida.seguimiento}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Pendiente</span>
                          )}
                          
                          {/* Indicador de selección - punto en la esquina superior derecha */}
                          {selectedRowId === recogida.id && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '0px',
                                right: '0px',
                                width: '8px',
                                height: '8px',
                                backgroundColor: 'hsl(var(--primary))',
                                borderRadius: '50%',
                                zIndex: 10,
                              }}
                            />
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
      </div>

      {/* Subcard paginador - siempre mostrar cuando hay datos */}
      {totalRecogidas > 0 && (
        <div className="mt-2 rounded-lg border bg-card shadow-sm px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {recogidas.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            -{Math.min(currentPage * itemsPerPage, recogidas.length)} de <span className="font-bold">{totalRecogidas}</span> resultados
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
            {/* Flechas y números de página - solo mostrar si hay más de 1 página */}
            {totalPages > 1 && (
              <>
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-8 w-8">{'<<'}</Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="h-8 w-8">{'<'}</Button>
                {getPageNumbers().map((n) => (
                  <Button key={n} variant={n === currentPage ? "default" : "outline"} size="icon" onClick={() => setCurrentPage(n)} className="h-8 w-8 font-bold">{n}</Button>
                ))}
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="h-8 w-8">{'>'}</Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="h-8 w-8">{'>>'}</Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 