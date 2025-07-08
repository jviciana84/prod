"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { History, Key, FileText, ArrowRight, User, Calendar, Search, Filter, Download, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Movement {
  id: string
  license_plate: string
  key_type?: string
  document_type?: string
  from_user_name: string
  to_user_name: string
  reason?: string
  confirmed: boolean
  created_at: string
}

export default function KeyHistoryPage() {
  const supabase = createClientComponentClient()
  const [movements, setMovements] = useState<Movement[]>([])
  const [filteredMovements, setFilteredMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  // Función para cargar todos los movimientos
  const loadAllMovements = async () => {
    setLoading(true)
    setError(null)

    try {
      // Primero, cargar todos los vehículos para obtener las matrículas desde sales_vehicles
      const { data: vehicles, error: vehiclesError } = await supabase.from("sales_vehicles").select("id, license_plate")

      if (vehiclesError) throw vehiclesError

      // Crear un mapa de ID de vehículo a matrícula para uso posterior
      const vehicleMap: Record<string, string> = {}
      vehicles?.forEach((v) => {
        vehicleMap[v.id] = v.license_plate
      })

      // Cargar movimientos de llaves
      const { data: keyMovements, error: keyError } = await supabase
        .from("key_movements")
        .select(`
          id,
          vehicle_id,
          key_type,
          reason,
          confirmed,
          created_at,
          from_user_id,
          to_user_id
        `)
        .order("created_at", { ascending: false })

      if (keyError) throw keyError

      // Cargar movimientos de documentos
      const { data: docMovements, error: docError } = await supabase
        .from("document_movements")
        .select(`
          id,
          vehicle_id,
          document_type,
          reason,
          confirmed,
          created_at,
          from_user_id,
          to_user_id
        `)
        .order("created_at", { ascending: false })

      if (docError) throw docError

      // Obtener todos los IDs de usuario únicos
      const userIds = new Set<string>()
      keyMovements?.forEach((movement) => {
        if (movement.from_user_id) userIds.add(movement.from_user_id)
        if (movement.to_user_id) userIds.add(movement.to_user_id)
      })
      docMovements?.forEach((movement) => {
        if (movement.from_user_id) userIds.add(movement.from_user_id)
        if (movement.to_user_id) userIds.add(movement.to_user_id)
      })

      // Cargar información de usuarios en una sola consulta
      let userMap: Record<string, any> = {}
      if (userIds.size > 0) {
        const { data: userData, error: userError } = await supabase
          .from("profiles")
          .select("id, full_name, alias")
          .in("id", Array.from(userIds))

        if (userError) throw userError

        // Convertir a un objeto para fácil acceso
        userMap = {}
        userData?.forEach((user) => {
          userMap[user.id] = user
        })
      }

      // Combinar y formatear los resultados
      const allMovements: Movement[] = [
        ...(keyMovements || []).map((m: any) => ({
          id: m.id,
          license_plate: vehicleMap[m.vehicle_id] || "Desconocida",
          key_type: m.key_type,
          from_user_name: m.from_user_id
            ? userMap[m.from_user_id]?.full_name || "Usuario desconocido"
            : "Concesionario",
          to_user_name: m.to_user_id ? userMap[m.to_user_id]?.full_name || "Usuario desconocido" : "Concesionario",
          reason: m.reason,
          confirmed: m.confirmed,
          created_at: m.created_at,
        })),
        ...(docMovements || []).map((m: any) => ({
          id: m.id,
          license_plate: vehicleMap[m.vehicle_id] || "Desconocida",
          document_type: m.document_type,
          from_user_name: m.from_user_id
            ? userMap[m.from_user_id]?.full_name || "Usuario desconocido"
            : "Concesionario",
          to_user_name: m.to_user_id ? userMap[m.to_user_id]?.full_name || "Usuario desconocido" : "Concesionario",
          reason: m.reason,
          confirmed: m.confirmed,
          created_at: m.created_at,
        })),
      ]

      // Ordenar por fecha
      allMovements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setMovements(allMovements)
      setFilteredMovements(allMovements)
    } catch (err: any) {
      console.error("Error loading movements:", err)
      setError(err.message || "Error al cargar movimientos")
    } finally {
      setLoading(false)
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    loadAllMovements()
  }, [])

  // Aplicar filtros
  useEffect(() => {
    let filtered = movements

    // Filtro por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (movement) =>
          movement.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
          movement.from_user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          movement.to_user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (movement.reason && movement.reason.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Filtro por estado
    if (statusFilter !== "all") {
      filtered = filtered.filter((movement) => {
        if (statusFilter === "confirmed") return movement.confirmed
        if (statusFilter === "pending") return !movement.confirmed
        return true
      })
    }

    // Filtro por tipo
    if (typeFilter !== "all") {
      filtered = filtered.filter((movement) => {
        if (typeFilter === "keys") return !!movement.key_type
        if (typeFilter === "documents") return !!movement.document_type
        return true
      })
    }

    setFilteredMovements(filtered)
  }, [movements, searchTerm, statusFilter, typeFilter])

  // Función para obtener el tipo de elemento
  const getItemTypeLabel = (movement: Movement) => {
    if (movement.key_type) {
      const keyTypes: Record<string, string> = {
        first_key: "Primera llave",
        second_key: "Segunda llave",
        card_key: "Card Key",
      }
      return keyTypes[movement.key_type] || movement.key_type
    }

    if (movement.document_type) {
      const docTypes: Record<string, string> = {
        technical_sheet: "Ficha técnica",
        circulation_permit: "Permiso de circulación",
      }
      return docTypes[movement.document_type] || movement.document_type
    }

    return "Desconocido"
  }

  // Función para obtener el icono del elemento
  const getItemIcon = (movement: Movement) => {
    if (movement.key_type) {
      return <Key className="h-4 w-4" />
    }
    if (movement.document_type) {
      return <FileText className="h-4 w-4" />
    }
    return null
  }

  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Gestión de Llaves", href: "/dashboard/llaves" },
    { label: "Historial Completo" },
  ]

  if (loading) {
    return (
      <div className="p-4 md:p-5 space-y-4 pb-20">
        <div className="space-y-2">
          <Breadcrumbs className="mt-4" items={breadcrumbItems} />
          <div className="flex items-center gap-3">
            <History className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Historial Completo de Movimientos</h1>
              <p className="text-muted-foreground">Registro completo de todos los movimientos de llaves y documentos</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <BMWMSpinner size="lg" />
          <span className="ml-4 text-lg text-muted-foreground">Cargando historial...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-5 space-y-4 pb-20">
        <div className="space-y-2">
          <Breadcrumbs className="mt-4" items={breadcrumbItems} />
          <div className="flex items-center gap-3">
            <History className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Historial Completo de Movimientos</h1>
              <p className="text-muted-foreground">Registro completo de todos los movimientos de llaves y documentos</p>
            </div>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              <p className="text-lg font-medium">Error al cargar el historial</p>
              <p className="text-sm mt-2">{error}</p>
              <Button onClick={loadAllMovements} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <Breadcrumbs className="mt-4" items={breadcrumbItems} />
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <History className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Historial Completo de Movimientos</h1>
              <p className="text-muted-foreground">Registro completo de todos los movimientos de llaves y documentos</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadAllMovements}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por matrícula, usuario o motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="confirmed">Confirmados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="keys">Llaves</SelectItem>
                <SelectItem value="documents">Documentos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <CardTitle>
            Resultados ({filteredMovements.length} de {movements.length})
          </CardTitle>
          <CardDescription>
            {filteredMovements.length === 0 && movements.length > 0
              ? "No se encontraron movimientos con los filtros aplicados"
              : "Lista de todos los movimientos registrados"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMovements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">
                {movements.length === 0 ? "No hay movimientos registrados" : "No se encontraron resultados"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getItemIcon(movement)}
                      <span className="font-medium text-lg">{movement.license_plate}</span>
                    </div>
                    <Badge variant="outline">{getItemTypeLabel(movement)}</Badge>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{movement.from_user_name}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{movement.to_user_name}</span>
                      </div>
                    </div>

                    <Badge variant={movement.confirmed ? "default" : "secondary"}>
                      {movement.confirmed ? "Confirmado" : "Pendiente"}
                    </Badge>

                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
