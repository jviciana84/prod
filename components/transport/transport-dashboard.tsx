"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Table, FileSpreadsheet } from "lucide-react"
import TransportTable from "./transport-table"
import TransportQuickForm from "./transport-quick-form"

interface TransportDashboardProps {
  initialTransports: any[]
  locations: any[]
  userRoles?: string[]
}

export default function TransportDashboard({ initialTransports, locations, userRoles = [] }: TransportDashboardProps) {
  const [transports, setTransports] = useState<any[]>(initialTransports || [])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingTransport, setIsAddingTransport] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Determinar si el usuario es administrador basado en sus roles
  useEffect(() => {
    const hasAdminRole = userRoles.some(
      (role) => role === "admin" || role === "administrador" || role.includes("admin"),
    )
    setIsAdmin(hasAdminRole)
  }, [userRoles])

  // Cargar datos completos de transporte
  const fetchTransports = async () => {
    setIsLoading(true)
    try {
      // Primero obtenemos los transportes sin relaciones
      const { data: transportData, error } = await supabase
        .from("nuevas_entradas")
        .select("*")
        .order("purchase_date", { ascending: false })

      if (error) {
        console.error("Error al cargar datos de nuevas entradas:", error)
        return
      }

      // Luego obtenemos las ubicaciones
      const { data: locationData } = await supabase.from("locations").select("*")

      // Creamos un mapa de ubicaciones para búsqueda rápida
      const locationMap = locationData
        ? locationData.reduce((map, loc) => {
            map[loc.id] = loc
            return map
          }, {})
        : {}

      // Obtenemos los tipos de gastos
      const { data: expenseTypeData } = await supabase.from("expense_types").select("*")

      // Creamos un mapa de tipos de gastos para búsqueda rápida
      const expenseTypeMap = expenseTypeData
        ? expenseTypeData.reduce((map, type) => {
            map[type.id] = type
            return map
          }, {})
        : {}

      // Combinamos los datos manualmente
      const enrichedData = transportData.map((transport) => ({
        ...transport,
        origin_location: locationMap[transport.origin_location_id] || null,
        expense_type: expenseTypeMap[transport.expense_type_id] || null,
      }))

      setTransports(enrichedData || [])
    } catch (err) {
      console.error("Error al cargar datos de nuevas entradas:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchTransports()
  }, [])

  // Exportar a Excel (simulado)
  const handleExportToExcel = () => {
    toast({
      title: "Exportando datos",
      description: "Preparando archivo Excel con los datos de transporte",
    })

    try {
      // Preparar los datos para la exportación
      const dataToExport = transports.map((transport) => {
        // Formatear fechas para mejor legibilidad
        const purchaseDate = transport.purchase_date
          ? new Date(transport.purchase_date).toLocaleDateString("es-ES")
          : ""
        const receptionDate = transport.reception_date
          ? new Date(transport.reception_date).toLocaleDateString("es-ES")
          : ""

        return {
          ID: transport.id,
          Marca: transport.brand || "",
          Modelo: transport.model || "",
          Matrícula: transport.license_plate || "",
          "Sede Origen": transport.origin_location?.name || "",
          "Fecha Compra": purchaseDate,
          "Fecha Recepción": receptionDate,
          "Cargo Gastos": transport.expense_type?.name || "",
          Recibido: transport.is_received ? "Sí" : "No",
          Notas: transport.notes || "",
        }
      })

      // Crear CSV
      let csvContent = "data:text/csv;charset=utf-8,"

      // Añadir encabezados
      const headers = Object.keys(dataToExport[0])
      csvContent += headers.join(";") + "\n"

      // Añadir filas
      dataToExport.forEach((row) => {
        const values = headers.map((header) => {
          const value = row[header] || ""
          // Escapar comillas y añadir comillas alrededor de campos con comas o saltos de línea
          return `"${String(value).replace(/"/g, '""')}"`
        })
        csvContent += values.join(";") + "\n"
      })

      // Crear enlace de descarga
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `transportes_${new Date().toISOString().split("T")[0]}.csv`)
      document.body.appendChild(link)

      // Descargar archivo
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Exportación completada",
        description: "Los datos se han exportado correctamente",
      })
    } catch (error) {
      console.error("Error al exportar datos:", error)
      toast({
        title: "Error en la exportación",
        description: "No se pudieron exportar los datos. Inténtelo de nuevo.",
        variant: "destructive",
      })
    }
  }

  // Manejar el evento de transporte añadido
  const handleTransportAdded = (newTransport: any) => {
    setTransports((prev) => [newTransport, ...prev])
  }

  return (
    <div className="space-y-6">
      {/* Card de Registro Rápido */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="h-5 w-5 text-blue-600" />
                Registro de Nuevas Entradas
              </CardTitle>
              <CardDescription>Registra nuevas entradas de vehículos al sistema</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <TransportQuickForm
            locations={locations}
            onTransportAdded={handleTransportAdded}
            isSubmitting={isAddingTransport}
            setIsSubmitting={setIsAddingTransport}
          />
        </CardContent>
      </Card>

      {/* Card de Lista de Vehículos */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Table className="h-5 w-5 text-blue-600" />
                Vehículos Registrados
              </CardTitle>
              <CardDescription>Seguimiento y gestión de vehículos registrados</CardDescription>
            </div>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={handleExportToExcel} className="flex items-center gap-1">
                <FileSpreadsheet className="h-4 w-4" />
                <span>Exportar</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <TransportTable
            initialTransports={transports}
            locations={locations}
            userRoles={userRoles}
            isAdmin={isAdmin}
          />
        </CardContent>
      </Card>
    </div>
  )
}
