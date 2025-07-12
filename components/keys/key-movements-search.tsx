"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { Search, Key, FileText, ArrowRight, Calendar, CheckCircle, Clock, X, CreditCard } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Función para calcular si han pasado 24 horas laborables
const isAutoAccepted = (createdAt: string, confirmationDeadline: string | null): boolean => {
  if (!confirmationDeadline) return false
  const now = new Date()
  const deadline = new Date(confirmationDeadline)
  return now > deadline
}

// Función para obtener el estado del movimiento
const getMovementStatus = (movement: any) => {
  if (movement.rejected) return "rejected"
  if (movement.confirmed) return "confirmed"
  if (movement.confirmation_deadline && isAutoAccepted(movement.created_at, movement.confirmation_deadline)) {
    return "auto_accepted"
  }
  return "pending"
}

interface Movement {
  id: string
  license_plate: string
  key_type?: string
  document_type?: string
  from_user_name: string
  to_user_name: string
  from_user_avatar?: string
  to_user_avatar?: string
  reason?: string
  confirmed: boolean
  rejected?: boolean
  confirmation_deadline?: string
  created_at: string
}

export function KeyMovementsSearch() {
  const supabase = createClientComponentClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchMovements = async (licensePlate: string) => {
    if (!licensePlate.trim()) {
      setMovements([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Buscar en sales_vehicles
      const { data: vehiclesSales, error: vehiclesError } = await supabase
        .from("sales_vehicles")
        .select("id, license_plate")
        .ilike("license_plate", `%${licensePlate}%`)
      if (vehiclesError) throw vehiclesError

      // Buscar en nuevas_entradas
      const { data: vehiclesStock, error: stockError } = await supabase
        .from("nuevas_entradas")
        .select("id, license_plate")
        .ilike("license_plate", `%${licensePlate}%`)
      if (stockError) throw stockError

      // Buscar en external_material_vehicles
      const { data: vehiclesExternal, error: extError } = await supabase
        .from("external_material_vehicles")
        .select("id, license_plate")
        .ilike("license_plate", `%${licensePlate}%`)
      if (extError) throw extError

      // Unir todos los IDs
      const allVehicles = [...(vehiclesSales || []), ...(vehiclesStock || []), ...(vehiclesExternal || [])]
      if (allVehicles.length === 0) {
        setMovements([])
        setLoading(false)
        return
      }
      const vehicleIds = allVehicles.map((v) => v.id)
      const vehicleMap: Record<string, string> = {}
      allVehicles.forEach((v) => {
        vehicleMap[v.id] = v.license_plate
      })

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
          to_user_id,
          rejected,
          confirmation_deadline
        `)
        .in("vehicle_id", vehicleIds)
        .order("created_at", { ascending: false })

      if (keyError) throw keyError

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
          to_user_id,
          rejected,
          confirmation_deadline
        `)
        .in("vehicle_id", vehicleIds)
        .order("created_at", { ascending: false })

      if (docError) throw docError

      const userIds = new Set<string>()
      keyMovements?.forEach((movement) => {
        if (movement.from_user_id) userIds.add(movement.from_user_id)
        if (movement.to_user_id) userIds.add(movement.to_user_id)
      })
      docMovements?.forEach((movement) => {
        if (movement.from_user_id) userIds.add(movement.from_user_id)
        if (movement.to_user_id) userIds.add(movement.to_user_id)
      })

      let userMap: Record<string, any> = {}
      if (userIds.size > 0) {
        const { data: userData, error: userError } = await supabase
          .from("profiles")
          .select("id, full_name, alias, avatar_url")
          .in("id", Array.from(userIds))

        if (userError) throw userError

        userMap = {}
        userData?.forEach((user) => {
          userMap[user.id] = user
        })
      }

      const allMovements: Movement[] = [
        ...(keyMovements || []).map((m: any) => ({
          id: m.id,
          license_plate: vehicleMap[m.vehicle_id] || "Desconocida",
          key_type: m.key_type,
          from_user_name: m.from_user_id
            ? userMap[m.from_user_id]?.full_name || "Usuario desconocido"
            : "Concesionario",
          to_user_name: m.to_user_id ? userMap[m.to_user_id]?.full_name || "Usuario desconocido" : "Concesionario",
          from_user_avatar: m.from_user_id ? userMap[m.from_user_id]?.avatar_url : null,
          to_user_avatar: m.to_user_id ? userMap[m.to_user_id]?.avatar_url : null,
          reason: m.reason,
          confirmed: m.confirmed,
          created_at: m.created_at,
          rejected: m.rejected,
          confirmation_deadline: m.confirmation_deadline,
        })),
        ...(docMovements || []).map((m: any) => ({
          id: m.id,
          license_plate: vehicleMap[m.vehicle_id] || "Desconocida",
          document_type: m.document_type,
          from_user_name: m.from_user_id
            ? userMap[m.from_user_id]?.full_name || "Usuario desconocido"
            : "Concesionario",
          to_user_name: m.to_user_id ? userMap[m.to_user_id]?.full_name || "Usuario desconocido" : "Concesionario",
          from_user_avatar: m.from_user_id ? userMap[m.from_user_id]?.avatar_url : null,
          to_user_avatar: m.to_user_id ? userMap[m.to_user_id]?.avatar_url : null,
          reason: m.reason,
          confirmed: m.confirmed,
          created_at: m.created_at,
          rejected: m.rejected,
          confirmation_deadline: m.confirmation_deadline,
        })),
      ]

      allMovements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setMovements(allMovements)
    } catch (err: any) {
      console.error("Error searching movements:", err)
      setError(err.message || "Error al buscar movimientos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchMovements(searchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

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

  const getItemBadgeColor = (movement: Movement) => {
    if (movement.key_type) {
      const keyColors: Record<string, string> = {
        first_key: "bg-blue-50 text-blue-700 border-blue-200",
        second_key: "bg-orange-50 text-orange-700 border-orange-200",
        card_key: "bg-purple-50 text-purple-700 border-purple-200",
      }
      return keyColors[movement.key_type] || "bg-gray-50 text-gray-700 border-gray-200"
    }

    if (movement.document_type) {
      const docColors: Record<string, string> = {
        technical_sheet: "bg-emerald-50 text-emerald-700 border-emerald-200",
        circulation_permit: "bg-teal-50 text-teal-700 border-teal-200",
      }
      return docColors[movement.document_type] || "bg-gray-50 text-gray-700 border-gray-200"
    }

    return "bg-gray-50 text-gray-700 border-gray-200"
  }

  const getItemIcon = (movement: Movement) => {
    if (movement.key_type) {
      if (movement.key_type === "first_key") {
        return <Key className="h-4 w-4 text-blue-600" />
      }
      if (movement.key_type === "second_key") {
        return <Key className="h-4 w-4 text-orange-600" />
      }
      if (movement.key_type === "card_key") {
        return <CreditCard className="h-4 w-4 text-purple-600" />
      }
    }
    if (movement.document_type) {
      return <FileText className="h-4 w-4 text-green-600" />
    }
    return null
  }

  const getStatusBadge = (movement: Movement) => {
    const status = getMovementStatus(movement)

    switch (status) {
      case "confirmed":
        return (
          <Badge variant="default" className="text-xs gap-1 bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3" />
            Aceptada
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive" className="text-xs gap-1 bg-red-100 text-red-700 border-red-200">
            <X className="h-3 w-3" />
            Rechazada
          </Badge>
        )
      case "auto_accepted":
        return (
          <Badge variant="secondary" className="text-xs gap-1 bg-blue-100 text-blue-700 border-blue-200">
            <CheckCircle className="h-3 w-3" />
            Auto-aceptada
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs gap-1 bg-yellow-100 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Introduce la matrícula..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6">
          <BMWMSpinner size="sm" />
          <span className="ml-2 text-sm text-muted-foreground">Buscando...</span>
        </div>
      )}

      {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

      {!loading && !error && movements.length === 0 && searchTerm && (
        <div className="text-center py-6 text-muted-foreground">
          <Search className="h-6 w-6 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No se encontraron movimientos para "{searchTerm}"</p>
        </div>
      )}

      {!loading && !error && movements.length === 0 && !searchTerm && (
        <div className="text-center py-6 text-muted-foreground">
          <Search className="h-6 w-6 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Introduce una matrícula para buscar movimientos</p>
        </div>
      )}

      {movements.length > 0 && (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {movements.map((movement) => (
            <Card key={movement.id} className="p-3 hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      {getItemIcon(movement)}
                      <span className="font-semibold">{movement.license_plate}</span>
                    </div>
                    <Badge className={`text-xs border ${getItemBadgeColor(movement)}`}>
                      {getItemTypeLabel(movement)}
                    </Badge>
                  </div>
                  {getStatusBadge(movement)}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    {/* From User */}
                    <div className="flex items-center gap-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={movement.from_user_avatar || "/placeholder.svg?height=24&width=24"} />
                        <AvatarFallback className="text-xs">{movement.from_user_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium truncate max-w-24">{movement.from_user_name}</span>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="h-3 w-3 text-primary flex-shrink-0" />

                    {/* To User */}
                    <div className="flex items-center gap-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={movement.to_user_avatar || "/placeholder.svg?height=24&width=24"} />
                        <AvatarFallback className="text-xs">{movement.to_user_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium truncate max-w-24">{movement.to_user_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(movement.created_at), "dd/MM HH:mm", { locale: es })}</span>
                  </div>
                </div>

                {movement.reason && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium">Motivo:</span> {movement.reason}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
