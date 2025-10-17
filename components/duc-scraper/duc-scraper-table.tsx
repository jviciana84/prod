"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, RefreshCw, Download, Filter } from "lucide-react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface DucScraperRecord {
  id: string
  "ID Anuncio"?: string
  "Anuncio"?: string
  "BPS / NEXT"?: string
  "Cambio"?: string
  "Certificado"?: string
  "Chasis"?: string
  "Color Carrocería"?: string
  "Color tapizado"?: string
  "Combustible"?: string
  "Concesionario"?: string
  "Código INT"?: string
  "Código fabricante"?: string
  "Equipamiento de serie"?: string
  "Estado"?: string
  "Carrocería"?: string
  "Vehículo importado"?: string
  "Versión"?: string
  "Extras"?: string
  "BuNo"?: string
  "kW (140 CV) S tronic"?: string
  "Precio"?: string
  "Matrícula"?: string
  "Modelo"?: string
  "Marca"?: string
  "Año"?: string
  "Kilometraje"?: string
  file_name?: string
  import_date?: string
  created_at?: string
  updated_at?: string
}

interface DucScraperTableProps {
  initialData: DucScraperRecord[]
  userRoles: string[]
}

export default function DucScraperTable({ initialData, userRoles }: DucScraperTableProps) {
  const [data, setData] = useState<DucScraperRecord[]>(initialData)
  const [filteredData, setFilteredData] = useState<DucScraperRecord[]>(initialData)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)
  
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Filtrar datos basado en búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredData(data)
      return
    }

    const filtered = data.filter(record => {
      const searchLower = searchTerm.toLowerCase()
      
      // Buscar en campos principales
      const searchableFields = [
        record["Matrícula"],
        record["Modelo"],
        record["Marca"],
        record["Chasis"],
        record["Concesionario"],
        record["Estado"],
        record["Precio"]
      ].filter(Boolean).map(field => field?.toLowerCase())

      return searchableFields.some(field => field?.includes(searchLower))
    })

    setFilteredData(filtered)
    setCurrentPage(1)
  }, [searchTerm, data])

  // Calcular datos paginados
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = filteredData.slice(startIndex, endIndex)

  // Recargar datos
  const refreshData = async () => {
    setIsLoading(true)
    try {
      const { data: newData, error } = await supabase
        .from("duc_scraper")
        .select("*")
        .order("import_date", { ascending: false })
        .limit(1000)

      if (error) throw error

      setData(newData || [])
      toast({
        title: "Datos actualizados",
        description: `Se cargaron ${newData?.length || 0} registros`,
      })
    } catch (error) {
      console.error("Error al recargar datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Exportar datos filtrados
  const exportData = () => {
    const csvContent = [
      // Headers
      Object.keys(filteredData[0] || {}).join(","),
      // Data
      ...filteredData.map(record => 
        Object.values(record).map(value => 
          typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        ).join(",")
      )
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `duc_scraper_export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Exportación completada",
      description: `Se exportaron ${filteredData.length} registros`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Datos DUC Scraper</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="ml-2">Actualizar</span>
            </Button>
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download className="h-4 w-4" />
              <span className="ml-2">Exportar</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por matrícula, modelo, marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matrícula</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Concesionario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Importado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {record["Matrícula"] || "N/A"}
                  </TableCell>
                  <TableCell>{record["Modelo"] || "N/A"}</TableCell>
                  <TableCell>{record["Marca"] || "N/A"}</TableCell>
                  <TableCell>{record["Concesionario"] || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant={record["Estado"] === "Disponible" ? "default" : "secondary"}>
                      {record["Estado"] || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>{record["Precio"] || "N/A"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {record.import_date 
                      ? new Date(record.import_date).toLocaleDateString('es-ES')
                      : "N/A"
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1}-{Math.min(endIndex, filteredData.length)} de {filteredData.length} registros
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="flex items-center px-3 text-sm">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 