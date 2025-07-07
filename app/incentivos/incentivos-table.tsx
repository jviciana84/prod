"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"

interface Incentivo {
  id: number
  fecha_entrega: string | null
  matricula: string | null
  modelo: string | null
  asesor: string | null
  forma_pago: string | null
  precio_venta: number | null
  precio_compra: number | null
  dias_stock: number | null
  gastos_estructura: number | null
  garantia: number | null
  gastos_360: number | null
  antiguedad: boolean | null
  financiado: boolean | null
  otros: number | null
  importe_minimo: number | null
  margen: number | null
  importe_total: number | null
  tramitado: boolean | null
  otros_observaciones: string | null
}

interface VehiculoData {
  purchase_price?: number
  purchase_date?: string
  sale_date?: string
  price?: number
}

export default function IncentivosTable() {
  const [incentivos, setIncentivos] = useState<Incentivo[]>([])
  const [filteredIncentivos, setFilteredIncentivos] = useState<Incentivo[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("todos")
  const [filters, setFilters] = useState({
    matricula: "",
    modelo: "",
    asesor: "",
    forma_pago: "",
  })
  const [observationsDialog, setObservationsDialog] = useState({
    open: false,
    incentivo: null as Incentivo | null,
    observations: "",
  })
  const otrosInputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    fetchIncentivos()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [incentivos, filters, activeTab])

  const fetchIncentivos = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Primero obtenemos los incentivos básicos
      const { data: incentivosData, error: incentivosError } = await supabase.from("incentivos").select("*")

      if (incentivosError) {
        console.error("Error fetching incentivos:", incentivosError)
        throw incentivosError
      }

      // Creamos un mapa para almacenar los datos de vehículos
      const vehiculosData: Record<string, VehiculoData> = {}

      // Obtenemos todos los datos de nuevas_entradas de una vez
      if (incentivosData && incentivosData.length > 0) {
        const matriculas = incentivosData.map((inc) => inc.matricula).filter(Boolean)

        // Consulta para nuevas_entradas
        const { data: nuevasEntradasData } = await supabase
          .from("nuevas_entradas")
          .select("license_plate, purchase_price, purchase_date")
          .in("license_plate", matriculas)

        // Consulta para sales_vehicles
        const { data: salesVehiclesData } = await supabase
          .from("sales_vehicles")
          .select("license_plate, price, sale_date")
          .in("license_plate", matriculas)

        // Organizamos los datos por matrícula
        if (nuevasEntradasData) {
          nuevasEntradasData.forEach((entry) => {
            if (entry.license_plate) {
              vehiculosData[entry.license_plate] = {
                ...vehiculosData[entry.license_plate],
                purchase_price: entry.purchase_price,
                purchase_date: entry.purchase_date,
              }
            }
          })
        }

        if (salesVehiclesData) {
          salesVehiclesData.forEach((entry) => {
            if (entry.license_plate) {
              vehiculosData[entry.license_plate] = {
                ...vehiculosData[entry.license_plate],
                price: entry.price,
                sale_date: entry.sale_date,
              }
            }
          })
        }
      }

      // Enriquecemos los incentivos con los datos obtenidos
      const enrichedIncentivos =
        incentivosData?.map((incentivo) => {
          if (!incentivo.matricula || !vehiculosData[incentivo.matricula]) {
            return incentivo
          }

          const vehiculoData = vehiculosData[incentivo.matricula]

          // Calculamos días de stock
          let diasStock = 0
          if (vehiculoData.purchase_date && vehiculoData.sale_date) {
            const purchaseDate = new Date(vehiculoData.purchase_date)
            const saleDate = new Date(vehiculoData.sale_date)
            diasStock = Math.floor((saleDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))
          }

          return {
            ...incentivo,
            precio_compra: vehiculoData.purchase_price || incentivo.precio_compra,
            precio_venta: vehiculoData.price || incentivo.precio_venta,
            dias_stock: diasStock || incentivo.dias_stock,
          }
        }) || []

      console.log("Data fetched successfully:", enrichedIncentivos.length, "records")
      setIncentivos(enrichedIncentivos)
      setFilteredIncentivos(enrichedIncentivos)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching incentivos:", error)
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...incentivos]

    if (filters.matricula) {
      filtered = filtered.filter((item) => item.matricula?.toLowerCase().includes(filters.matricula.toLowerCase()))
    }
    if (filters.modelo) {
      filtered = filtered.filter((item) => item.modelo?.toLowerCase().includes(filters.modelo.toLowerCase()))
    }
    if (filters.asesor) {
      filtered = filtered.filter((item) => item.asesor?.toLowerCase().includes(filters.asesor.toLowerCase()))
    }
    if (filters.forma_pago) {
      filtered = filtered.filter((item) => item.forma_pago?.toLowerCase().includes(filters.forma_pago.toLowerCase()))
    }

    if (activeTab === "tramitados") {
      filtered = filtered.filter((item) => item.tramitado === true)
    } else if (activeTab === "pendientes") {
      filtered = filtered.filter((item) => item.tramitado === false)
    }

    setFilteredIncentivos(filtered)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const calculateImporte = (incentivo: Incentivo) => {
    const margen = (incentivo.precio_venta || 0) - (incentivo.precio_compra || 0)
    const importeMinimo = 150

    let importe = 0

    if (margen >= 1500) {
      importe = importeMinimo + (margen - 1500) * 0.1
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

    return importe
  }

  const handleOtrosChange = async (id: number, value: string) => {
    try {
      const numValue = Number.parseFloat(value) || 0
      const supabase = createClient()

      const { error } = await supabase.from("incentivos").update({ otros: numValue }).eq("id", id)

      if (error) throw error

      setIncentivos((prev) => prev.map((item) => (item.id === id ? { ...item, otros: numValue } : item)))
    } catch (error) {
      console.error("Error updating otros:", error)
    }
  }

  const handleOtrosKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, incentivo: Incentivo) => {
    if (e.key === "Enter") {
      e.preventDefault()
      setObservationsDialog({
        open: true,
        incentivo,
        observations: incentivo.otros_observaciones || "",
      })
    }
  }

  const handleObservationsSave = async () => {
    if (!observationsDialog.incentivo) return

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("incentivos")
        .update({ otros_observaciones: observationsDialog.observations })
        .eq("id", observationsDialog.incentivo.id)

      if (error) throw error

      setIncentivos((prev) =>
        prev.map((item) =>
          item.id === observationsDialog.incentivo?.id
            ? { ...item, otros_observaciones: observationsDialog.observations }
            : item,
        ),
      )

      setObservationsDialog({
        open: false,
        incentivo: null,
        observations: "",
      })
    } catch (error) {
      console.error("Error updating observations:", error)
    }
  }

  const handleTramitadoChange = async (id: number, checked: boolean) => {
    try {
      const supabase = createClient()

      const { error } = await supabase.from("incentivos").update({ tramitado: checked }).eq("id", id)

      if (error) throw error

      setIncentivos((prev) => prev.map((item) => (item.id === id ? { ...item, tramitado: checked } : item)))
    } catch (error) {
      console.error("Error updating tramitado:", error)
    }
  }

  const handleObservationsClick = (incentivo: Incentivo) => {
    setObservationsDialog({
      open: true,
      incentivo,
      observations: incentivo.otros_observaciones || "",
    })
  }

  const pendientesCount = incentivos.filter((item) => item.tramitado === false).length
  const tramitadosCount = incentivos.filter((item) => item.tramitado === true).length

  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="todos" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="todos">TODOS ({incentivos.length})</TabsTrigger>
          <TabsTrigger value="pendientes">PENDIENTES ({pendientesCount})</TabsTrigger>
          <TabsTrigger value="tramitados">TRAMITADOS ({tramitadosCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="uppercase">FECHA</TableHead>
                  <TableHead className="uppercase">
                    MATRÍCULA
                    <Input
                      placeholder="Filtrar..."
                      value={filters.matricula}
                      onChange={(e) => handleFilterChange("matricula", e.target.value)}
                      className="mt-1 h-8"
                    />
                  </TableHead>
                  <TableHead className="uppercase">
                    MODELO
                    <Input
                      placeholder="Filtrar..."
                      value={filters.modelo}
                      onChange={(e) => handleFilterChange("modelo", e.target.value)}
                      className="mt-1 h-8"
                    />
                  </TableHead>
                  <TableHead className="uppercase">
                    ASESOR
                    <Input
                      placeholder="Filtrar..."
                      value={filters.asesor}
                      onChange={(e) => handleFilterChange("asesor", e.target.value)}
                      className="mt-1 h-8"
                    />
                  </TableHead>
                  <TableHead className="uppercase">
                    FORMA PAGO
                    <Input
                      placeholder="Filtrar..."
                      value={filters.forma_pago}
                      onChange={(e) => handleFilterChange("forma_pago", e.target.value)}
                      className="mt-1 h-8"
                    />
                  </TableHead>
                  <TableHead className="uppercase">PRECIO VENTA</TableHead>
                  <TableHead className="uppercase">PRECIO COMPRA</TableHead>
                  <TableHead className="uppercase">DÍAS STOCK</TableHead>
                  <TableHead className="uppercase">GASTOS ESTRUCTURA</TableHead>
                  <TableHead className="uppercase">GARANTÍA</TableHead>
                  <TableHead className="uppercase">GASTOS 360</TableHead>
                  <TableHead className="uppercase">ANTIGÜEDAD</TableHead>
                  <TableHead className="uppercase">FINANCIADO</TableHead>
                  <TableHead className="uppercase">OTROS</TableHead>
                  <TableHead className="uppercase">OBSERVACIONES</TableHead>
                  <TableHead className="uppercase">IMPORTE MÍNIMO</TableHead>
                  <TableHead className="uppercase">MARGEN</TableHead>
                  <TableHead className="uppercase">IMPORTE</TableHead>
                  <TableHead className="uppercase">TRAMITADO</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={18} className="text-center py-4">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : filteredIncentivos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={18} className="text-center py-4">
                      No hay incentivos que mostrar
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIncentivos.map((incentivo, index) => {
                    const importe = calculateImporte(incentivo)
                    const margen = (incentivo.precio_venta || 0) - (incentivo.precio_compra || 0)

                    return (
                      <TableRow key={incentivo.id}>
                        <TableCell>
                          {incentivo.fecha_entrega ? new Date(incentivo.fecha_entrega).toLocaleDateString() : ""}
                        </TableCell>
                        <TableCell>{incentivo.matricula}</TableCell>
                        <TableCell>{incentivo.modelo}</TableCell>
                        <TableCell>{incentivo.asesor}</TableCell>
                        <TableCell>{incentivo.forma_pago}</TableCell>
                        <TableCell>{formatCurrency(incentivo.precio_venta || 0)}</TableCell>
                        <TableCell>{formatCurrency(incentivo.precio_compra || 0)}</TableCell>
                        <TableCell className={incentivo.dias_stock && incentivo.dias_stock > 150 ? "text-red-500" : ""}>
                          {incentivo.dias_stock || 0}
                        </TableCell>
                        <TableCell>{formatCurrency(incentivo.gastos_estructura || 0)}</TableCell>
                        <TableCell>{formatCurrency(incentivo.garantia || 0)}</TableCell>
                        <TableCell>{formatCurrency(incentivo.gastos_360 || 0)}</TableCell>
                        <TableCell>
                          <Checkbox checked={incentivo.antiguedad || false} disabled />
                        </TableCell>
                        <TableCell>
                          <Checkbox checked={incentivo.financiado || false} disabled />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={incentivo.otros || 0}
                            onChange={(e) => handleOtrosChange(incentivo.id, e.target.value)}
                            onKeyDown={(e) => handleOtrosKeyDown(e, incentivo)}
                            ref={(el) => {
                              otrosInputRefs.current[index] = el
                            }}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => handleObservationsClick(incentivo)}>
                            {incentivo.otros_observaciones ? "Ver" : "Añadir"}
                          </Button>
                        </TableCell>
                        <TableCell>{formatCurrency(150)}</TableCell>
                        <TableCell>{formatCurrency(margen)}</TableCell>
                        <TableCell>{formatCurrency(importe)}</TableCell>
                        <TableCell>
                          <Checkbox
                            checked={incentivo.tramitado || false}
                            onCheckedChange={(checked) => handleTramitadoChange(incentivo.id, checked === true)}
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

        <TabsContent value="pendientes" className="space-y-4">
          <div className="rounded-md border">
            <Table>{/* Same table structure as above */}</Table>
          </div>
        </TabsContent>

        <TabsContent value="tramitados" className="space-y-4">
          <div className="rounded-md border">
            <Table>{/* Same table structure as above */}</Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog
        open={observationsDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setObservationsDialog({
              open: false,
              incentivo: null,
              observations: "",
            })
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Observaciones</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={observationsDialog.observations}
              onChange={(e) =>
                setObservationsDialog((prev) => ({
                  ...prev,
                  observations: e.target.value,
                }))
              }
              placeholder="Añadir observaciones..."
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleObservationsSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
