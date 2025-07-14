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
    // Log de depuración para ver qué está pasando
    console.log("[DEBUG] 🔍 getUserInfo llamado con userId:", userId);
    console.log("[DEBUG] 🔍 Lista de usuarios disponible:", users.map(u => ({ id: u.id, name: u.full_name })));
    
    if (!userId) {
      console.log("[DEBUG] 🔍 userId es null/undefined, devolviendo Concesionario");
      return { name: "Concesionario", avatar: null, initials: "CO" }
    }
    
    const user = users.find((u) => u.id === userId)
    console.log("[DEBUG] 🔍 Usuario encontrado:", user);
    
    const fullName = user?.full_name || "Usuario desconocido"
    const initials = fullName
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)

    console.log("[DEBUG] 🔍 Devolviendo:", { name: fullName, avatar: user?.avatar_url || null, initials: initials || "??" });

    return {
      name: fullName,
      avatar: user?.avatar_url || null,
      initials: initials || "??",
    }
  }

  const getLicensePlate = (vehicleId: string) => {
    if (!vehicleId) return "N/A"
    // Buscar en sales_vehicles
    const vehicleSales = vehicles.find((v) => v.id === vehicleId)
    if (vehicleSales) return vehicleSales.license_plate
    // Buscar en nuevas_entradas
    if (window?.externalMaterialVehicles) {
      const vehicleStock = window.externalMaterialVehicles.find((v: any) => v.id === vehicleId)
      if (vehicleStock) return vehicleStock.license_plate
    }
    // Buscar en external_material_vehicles (fetch si no está en memoria)
    // Si no está, mostrar el id
    return vehicleId
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
            className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/30 transition-colors text-xs gap-2 min-h-8"
          >
            {/* Matrícula y tipo */}
            <div className="flex items-center gap-2 min-w-0">
              {getItemIconUpdated(getItemLabel(movement))}
              <span className="font-semibold truncate max-w-[70px]">{getLicensePlate(movement.vehicle_id)}</span>
              <Badge className={`border ${getItemBadgeColor(movement)} px-1 py-0.5 font-normal`}>{getItemLabel(movement)}</Badge>
            </div>

            {/* Usuarios y flecha */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-muted-foreground font-medium truncate max-w-[60px]">{fromUser.name.split(" ")[0]}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground font-medium truncate max-w-[60px]">{toUser.name.split(" ")[0]}</span>
            </div>

            {/* Motivo si existe */}
            {/* Eliminado: no mostrar reason ni observaciones */}

            {/* Estado y fecha */}
            <Badge variant="outline" className="px-1 py-0 flex items-center gap-1 border-muted-foreground/20">
              {getStatusIcon(movement)}
            </Badge>
            <span className="text-muted-foreground tabular-nums min-w-[90px] text-right">
              {format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
            </span>
          </div>
        )
      })}
    </div>
  )
}
