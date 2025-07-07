"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Key, FileText, ArrowRight, CheckCircle, Clock, X, CreditCard } from "lucide-react"

interface RecentKeyMovementsProps {
  movements: any[]
  users: any[]
  vehicles: any[]
}

export function RecentKeyMovements({ movements, users, vehicles }: RecentKeyMovementsProps) {
  const getUserInfo = (userId: string) => {
    if (!userId) return { name: "Concesionario", avatar: null, initials: "CO" }
    const user = users.find((u) => u.id === userId)
    const fullName = user?.full_name || "Usuario desconocido"
    const initials = fullName
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)

    return {
      name: fullName,
      avatar: user?.avatar_url || null,
      initials: initials || "??",
    }
  }

  const getLicensePlate = (vehicleId: string) => {
    if (!vehicleId) return "N/A"
    const vehicle = vehicles.find((v) => v.id === vehicleId)
    return vehicle?.license_plate || vehicleId
  }

  // Elimina la función `getItemIcon` ya que `getItemIconUpdated` es más completa.
  // function getItemIcon(movement: any) { ... }

  const getItemLabel = (movement: any) => {
    if (movement.movement_type === "key") {
      const keyTypes: Record<string, string> = {
        first_key: "1ª llave",
        second_key: "2ª llave",
        card_key: "CardKey",
      }
      return keyTypes[movement.item_identifier] || movement.item_identifier
    }
    if (movement.movement_type === "document") {
      const docTypes: Record<string, string> = {
        technical_sheet: "Ficha Técnica",
        circulation_permit: "Permiso de Circulación",
      }
      return docTypes[movement.item_identifier] || movement.item_identifier
    }
    return "N/A"
  }

  const getItemBadgeColor = (movement: any) => {
    if (movement.movement_type === "key") {
      const keyColors: Record<string, string> = {
        first_key: "bg-blue-100 text-blue-700 border-blue-200",
        second_key: "bg-purple-100 text-purple-700 border-purple-200",
        card_key: "bg-green-100 text-green-700 border-green-200",
      }
      return keyColors[movement.item_identifier] || "bg-gray-100 text-gray-700 border-gray-200"
    }

    if (movement.movement_type === "document") {
      const docColors: Record<string, string> = {
        technical_sheet: "bg-orange-100 text-orange-700 border-orange-200",
        circulation_permit: "bg-teal-100 text-teal-700 border-teal-200",
      }
      return docColors[movement.item_identifier] || "bg-gray-100 text-gray-700 border-gray-200"
    }

    return "bg-gray-100 text-gray-700 border-gray-200"
  }

  const getStatusIcon = (movement: any) => {
    const status = getMovementStatus(movement)

    if (status === "rejected") {
      return <X className="h-2 w-2 text-red-500" />
    }
    if (status === "confirmed") {
      return <CheckCircle className="h-2 w-2 text-green-500" />
    }
    if (status === "auto_accepted") {
      return <CheckCircle className="h-2 w-2 text-gray-500" />
    }
    return <Clock className="h-2 w-2 text-yellow-500" />
  }

  if (movements.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No hay movimientos recientes</p>
      </div>
    )
  }

  const getMovementStatus = (movement: any) => {
    if (movement.rejected) {
      return "rejected"
    }
    if (movement.confirmed) {
      return "confirmed"
    }
    if (movement.auto_accepted) {
      return "auto_accepted"
    }
    return "pending"
  }

  const getItemIconUpdated = (tipo: string) => {
    return (
      <>
        {tipo === "1ª llave" && <Key className="h-3.5 w-3.5 mr-2 text-blue-600" />}
        {tipo === "2ª llave" && <Key className="h-3.5 w-3.5 mr-2 text-orange-600" />}
        {tipo === "CardKey" && <CreditCard className="h-3.5 w-3.5 mr-2 text-purple-600" />}
        {tipo === "Ficha Técnica" && <FileText className="h-3.5 w-3.5 mr-2 text-green-600" />}
        {tipo === "Permiso de Circulación" && <FileText className="h-3.5 w-3.5 mr-2 text-orange-600" />}
      </>
    )
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {movements.map((movement) => {
        const fromUser = getUserInfo(movement.from_user_id)
        const toUser = getUserInfo(movement.to_user_id)

        return (
          <div
            key={movement.id}
            className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/30 transition-colors text-sm"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-1">
                {getItemIconUpdated(getItemLabel(movement))}
                <span className="font-medium text-xs">{getLicensePlate(movement.vehicle_id)}</span>
              </div>
              <Badge className={`text-xs border ${getItemBadgeColor(movement)} px-1 py-0`}>
                {getItemLabel(movement)}
              </Badge>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* From User */}
              <div className="flex items-center gap-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={fromUser.avatar || "/placeholder.svg?height=24&width=24"} />
                  <AvatarFallback className="text-xs">{fromUser.initials}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-muted-foreground">{fromUser.name.split(" ")[0]}</span>
              </div>

              <ArrowRight className="h-3 w-3 text-muted-foreground" />

              {/* To User */}
              <div className="flex items-center gap-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={toUser.avatar || "/placeholder.svg?height=24&width=24"} />
                  <AvatarFallback className="text-xs">{toUser.initials}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-muted-foreground">{toUser.name.split(" ")[0]}</span>
              </div>
              {movement.reason && (
                <div className="text-xs text-muted-foreground mt-1">
                  <span className="font-semibold">Motivo:</span> {movement.reason}
                </div>
              )}
              {movement.notes && (
                <div className="text-xs text-muted-foreground mt-1">
                  <span className="font-semibold">Notas:</span> {movement.notes}
                </div>
              )}

              <Badge variant="outline" className="text-xs px-1 py-0 flex items-center gap-1">
                {getStatusIcon(movement)}
              </Badge>

              <span className="text-xs text-muted-foreground">
                {format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
