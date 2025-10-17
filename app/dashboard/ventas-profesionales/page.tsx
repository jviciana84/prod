"use client"

import { useState, useCallback, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, RefreshCw, Calendar, Tag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProfessionalSale {
  id: string
  license_plate: string
  model: string
  vehicle_type: string
  source: 'stock' | 'nuevas_entradas'
  sale_date: string
  created_at: string
  notes?: string
}

export default function VentasProfesionalesPage() {
  const [sales, setSales] = useState<ProfessionalSale[]>([])
  const [filteredSales, setFilteredSales] = useState<ProfessionalSale[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Cargar datos
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Por ahora, simulamos datos ya que no tenemos la tabla de ventas profesionales
      // En el futuro, esto vendría de una tabla específica
      const mockData: ProfessionalSale[] = [
        {
          id: "1",
          license_plate: "1234ABC",
          model: "BMW Serie 1",
          vehicle_type: "Coche",
          source: "stock",
          sale_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          notes: "Venta profesional - Cliente corporativo"
        },
        {
          id: "2", 
          license_plate: "5678DEF",
          model: "BMW Serie 3",
          vehicle_type: "Coche",
          source: "nuevas_entradas",
          sale_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          notes: "Venta profesional - Flota empresa"
        }
      ]

      setSales(mockData)
      setFilteredSales(mockData)
      setTotalPages(Math.ceil(mockData.length / itemsPerPage))
    } catch (error) {
      console.error('Error cargando ventas profesionales:', error)
      toast({
        title: "Error",
        description: "Error al cargar las ventas profesionales",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [itemsPerPage, toast])

  // Cargar datos iniciales
  useEffect(() => {
    loadData()
  }, [loadData])

  // Filtrar por término de búsqueda
  useEffect(() => {
    const filtered = sales.filter(sale =>
      sale.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.model.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredSales(filtered)
    setTotalPages(Math.ceil(filtered.length / itemsPerPage))
    setCurrentPage(1)
  }, [searchTerm, sales, itemsPerPage])

  // Obtener datos paginados
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <Breadcrumbs className="mt-4"
          segments={[
            {
              title: "Dashboard",
              href: "/dashboard",
            },
            {
              title: "Ventas Profesionales",
              href: "/dashboard/ventas-profesionales",
            },
          ]}
        />
        <div className="flex items-center gap-3">
          <Tag className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ventas Profesionales</h1>
            <p className="text-muted-foreground">Gestión de vehículos vendidos fuera del flujo regular</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center text-lg">
                <Tag className="mr-2 h-4 w-4 text-purple-500" />
                Ventas Profesionales
              </CardTitle>
              <CardDescription>
                Vehículos marcados como venta profesional que no se computan como ventas regulares
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {/* Controles de búsqueda y filtros */}
          <div className="mb-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por matrícula o modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Mostrar:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Tabla */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Cargando ventas profesionales...</span>
            </div>
          ) : paginatedSales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron ventas profesionales</p>
              <p className="text-sm">Los vehículos marcados como venta profesional aparecerán aquí</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Fecha Venta</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono font-medium">
                        {sale.license_plate}
                      </TableCell>
                      <TableCell>{sale.model}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {sale.vehicle_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={sale.source === 'stock' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {sale.source === 'stock' ? 'Stock' : 'Nuevas Entradas'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(sale.sale_date)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {sale.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredSales.length)} de {filteredSales.length} resultados
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 