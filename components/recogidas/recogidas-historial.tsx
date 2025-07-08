"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, RefreshCw, Loader2, Truck, Calendar, User, Package } from "lucide-react"
import { toast } from "sonner"
import { formatDateForDisplay } from "@/lib/date-utils"
import type { Recogida } from "@/types/recogidas"

export function RecogidasHistorial() {
  const [recogidas, setRecogidas] = useState<Recogida[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadRecogidas = async (page = 1, search = "") => {
    try {
      const limit = 20
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

      const { recogidas: newRecogidas } = await response.json()
      
      if (page === 1) {
        setRecogidas(newRecogidas)
      } else {
        setRecogidas(prev => [...prev, ...newRecogidas])
      }
      
      setHasMore(newRecogidas.length === limit)
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
  }, [])

  const handleSearch = () => {
    setCurrentPage(1)
    loadRecogidas(1, searchQuery)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    setCurrentPage(1)
    loadRecogidas(1, searchQuery)
  }

  const loadMore = () => {
    if (hasMore && !loading) {
      loadRecogidas(currentPage + 1, searchQuery)
    }
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Historial de Recogidas</CardTitle>
        <CardDescription>Registro de todas las solicitudes de recogida</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Búsqueda */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por matrícula, cliente o usuario..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-8"
              />
            </div>
            <Button onClick={handleSearch} disabled={refreshing}>
              Buscar
            </Button>
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Tabla */}
          <div className="rounded-lg border shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-24">Fecha</TableHead>
                  <TableHead className="w-20">Matrícula</TableHead>
                  <TableHead className="w-32">Materiales</TableHead>
                  <TableHead className="w-24">Cliente</TableHead>
                  <TableHead className="w-24">Usuario</TableHead>
                  <TableHead className="w-20">Estado</TableHead>
                  <TableHead className="w-24">Seguimiento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recogidas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No se encontraron recogidas
                    </TableCell>
                  </TableRow>
                ) : (
                  recogidas.map((recogida) => (
                    <TableRow key={recogida.id} className="hover:bg-muted/30">
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{formatDate(recogida.fecha_solicitud)}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-2 font-medium">
                        {recogida.matricula}
                      </TableCell>
                      
                      <TableCell className="py-2">
                        <div className="flex flex-wrap gap-1">
                          {recogida.materiales.slice(0, 2).map((material, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {material}
                            </Badge>
                          ))}
                          {recogida.materiales.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{recogida.materiales.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-2">
                        <div className="truncate max-w-[120px]">
                          {recogida.nombre_cliente || "No especificado"}
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[100px]">
                            {recogida.usuario_solicitante}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-2">
                        <Badge className={`text-xs ${getEstadoColor(recogida.estado)}`}>
                          {recogida.estado.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="py-2">
                        {recogida.seguimiento ? (
                          <Badge variant="secondary" className="text-xs">
                            {recogida.seguimiento}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Pendiente</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Cargar más */}
          {hasMore && (
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={loadMore} 
                disabled={loading}
                className="w-full max-w-[200px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2" />
                    Cargar más
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Contador */}
          <div className="text-center text-sm text-muted-foreground">
            {recogidas.length > 0 && (
              <span>Mostrando {recogidas.length} recogidas</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 