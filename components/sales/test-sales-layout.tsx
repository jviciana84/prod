"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, RefreshCw, Calendar, Eye, EyeOff, Car, Bike, FileCheck, Check } from "lucide-react"

export default function TestSalesLayout() {
  const [activeTab, setActiveTab] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalRows, setTotalRows] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")

  const counts = {
    all: 150,
    car: 100,
    motorcycle: 30,
    not_validated: 20,
    finished: 50,
  }

  return (
    <div className="space-y-4">
      {/* NUEVA ESTRUCTURA: Card principal solo con título, subtítulo, pestañas y botones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Gestión de Ventas</CardTitle>
          <CardDescription>Seguimiento y control de ventas de vehículos</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Barra superior con buscador y pestañas en la misma línea */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-card rounded-lg p-2 shadow-sm mb-4">
              <div className="flex items-center gap-2 flex-1">
                <Card className="p-3">
                  <div className="flex items-center gap-2 relative">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar por matrícula, modelo, asesor, cliente..."
                      className="w-80"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </Card>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  title="Actualizar"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  title="Filtrar por fecha"
                >
                  <Calendar className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  title="Mostrar/ocultar columnas"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
              <TabsList className="h-9 bg-muted/50">
                <TabsTrigger value="car" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                  <Car className="h-3.5 w-3.5 mr-1" />
                  <span>Coches</span>
                  <Badge variant="outline" className="ml-1 text-xs px-1 py-0">{counts.car}</Badge>
                </TabsTrigger>
                <TabsTrigger value="motorcycle" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                  <Bike className="h-3.5 w-3.5 mr-1" />
                  <span>Motos</span>
                  <Badge variant="outline" className="ml-1 text-xs px-1 py-0">{counts.motorcycle}</Badge>
                </TabsTrigger>
                <TabsTrigger value="not_validated" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                  <FileCheck className="h-3.5 w-3.5 mr-1" />
                  <span>No validados</span>
                  <Badge variant="outline" className="ml-1 text-xs px-1 py-0">{counts.not_validated}</Badge>
                </TabsTrigger>
                <TabsTrigger value="finished" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                  <Check className="h-3.5 w-3.5 mr-1" />
                  <span>Finalizados</span>
                  <Badge variant="outline" className="ml-1 text-xs px-1 py-0">{counts.finished}</Badge>
                </TabsTrigger>
                <TabsTrigger value="all" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                  <span>Todos</span>
                  <Badge variant="outline" className="ml-1 text-xs px-1 py-0">{counts.all}</Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* NUEVA ESTRUCTURA: TabsContent dentro del Tabs pero con tabla fuera del card */}
            {["all", "car", "motorcycle", "not_validated", "finished"].map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-0">
                {/* Contenido vacío - la tabla va fuera */}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* NUEVA ESTRUCTURA: Tabla y paginador FUERA del card */}
      <div className="space-y-4">
        {/* Contenido de las pestañas */}
        {["all", "car", "motorcycle", "not_validated", "finished"].map((tab) => (
          <div key={tab} className={activeTab === tab ? "block" : "hidden"}>
            <div className="rounded-lg border shadow-sm overflow-hidden">
              <div className="relative w-full overflow-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent border-b border-border">
                      <TableHead className="w-6 truncate py-2"></TableHead>
                      <TableHead className="w-20 truncate py-2">MATRÍCULA</TableHead>
                      <TableHead className="w-24 truncate py-2">MODELO</TableHead>
                      <TableHead className="w-20 truncate py-2">CLIENTE</TableHead>
                      <TableHead className="w-16 truncate py-2">MARCA</TableHead>
                      <TableHead className="w-16 truncate py-2">TIPO</TableHead>
                      <TableHead className="w-20 truncate py-2">CONCESIONARIO</TableHead>
                      <TableHead className="w-20 truncate py-2">PRECIO</TableHead>
                      <TableHead className="w-20 truncate py-2">VENTA</TableHead>
                      <TableHead className="w-20 truncate py-2">ASESOR</TableHead>
                      <TableHead className="w-12 truncate py-2">DÍAS</TableHead>
                      <TableHead className="w-14 truncate py-2">OR</TableHead>
                      <TableHead className="w-16 truncate py-2">GASTOS</TableHead>
                      <TableHead className="w-16 truncate py-2">PAGO</TableHead>
                      <TableHead className="w-16 truncate py-2">BANCO</TableHead>
                      <TableHead className="w-20 truncate py-2">ESTADO</TableHead>
                      <TableHead className="w-16 truncate py-2">TIPO DOC.</TableHead>
                      <TableHead className="w-16 truncate py-2">Nº DOC</TableHead>
                      <TableHead className="w-20 truncate py-2">CyP</TableHead>
                      <TableHead className="w-20 truncate py-2">360º</TableHead>
                      <TableHead className="w-20 truncate py-2">VALIDADO</TableHead>
                      <TableHead className="w-20 truncate py-2"></TableHead>
                      <TableHead className="w-24 truncate py-2">PRE-ENTREGA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={20} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Car className="h-10 w-10 mb-2" />
                          <p>Datos de ejemplo - Tabla funcionando</p>
                          <p className="text-sm">Esta es la nueva estructura con tabla fuera del card</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
            
            {/* Subcard paginador */}
            <div className="mt-2 rounded-lg border bg-card shadow-sm px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {totalRows === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                -{Math.min(currentPage * itemsPerPage, totalRows)} de <span className="font-bold">{totalRows}</span> resultados
              </div>
              <div className="flex items-center gap-2">
                {/* Selector de filas por página */}
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
                {/* Flechas y números de página */}
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-8 w-8">{'<<'}</Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="h-8 w-8">{'<'}</Button>
                <Button variant="default" size="icon" className="h-8 w-8 font-bold">1</Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(currentPage + 1)} className="h-8 w-8">{'>'}</Button>
                <Button variant="outline" size="icon" className="h-8 w-8">{'>>'}</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 