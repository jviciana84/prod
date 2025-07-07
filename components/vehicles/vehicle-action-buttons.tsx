"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { AlertCircle, Check, Pencil } from "lucide-react"

interface VehicleActionButtonsProps {
  vehicleId: string
  isDelivered: boolean
  onMarkDelivered: () => void
  onRegisterIncident: () => void
  onEdit: () => void
}

export function VehicleActionButtons({
  vehicleId,
  isDelivered,
  onMarkDelivered,
  onRegisterIncident,
  onEdit,
}: VehicleActionButtonsProps) {
  const [isVehicleOwner, setIsVehicleOwner] = useState<boolean>(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const supabase = createClient()

  useEffect(() => {
    async function checkPermissions() {
      try {
        setIsLoading(true)

        // Verificar si el usuario está autenticado
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          setIsVehicleOwner(false)
          setUserRole(null)
          return
        }

        // Obtener el rol del usuario
        const { data: userData, error } = await supabase.from("users").select("role").eq("id", session.user.id).single()

        if (error || !userData) {
          console.error("Error al verificar rol:", error)
          setUserRole(null)
          return
        }

        setUserRole(userData.role)

        // Si es admin o supervisor, no necesitamos verificar si es propietario
        if (userData.role === "admin" || userData.role === "supervisor") {
          setIsVehicleOwner(true)
          return
        }

        // Si es vendedor, verificar si vendió este vehículo
        if (userData.role === "vendedor") {
          const { data: vehicleData, error: vehicleError } = await supabase
            .from("stock")
            .select("vendedor_id")
            .eq("id", vehicleId)
            .single()

          if (vehicleError || !vehicleData) {
            console.error("Error al verificar el vehículo:", vehicleError)
            setIsVehicleOwner(false)
            return
          }

          setIsVehicleOwner(vehicleData.vendedor_id === session.user.id)
        }
      } catch (error) {
        console.error("Error al verificar permisos:", error)
        setIsVehicleOwner(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkPermissions()
  }, [vehicleId, supabase])

  if (isLoading) {
    return (
      <div className="flex gap-2">
        <Button disabled className="animate-pulse">
          Cargando...
        </Button>
      </div>
    )
  }

  // Determinar si el usuario puede realizar acciones
  const canPerformActions = userRole === "admin" || userRole === "supervisor" || isVehicleOwner

  return (
    <div className="flex flex-wrap gap-2">
      {!isDelivered && (
        <Button
          onClick={onMarkDelivered}
          variant="default"
          className="bg-green-600 hover:bg-green-700"
          disabled={!canPerformActions}
        >
          <Check className="mr-2 h-4 w-4" />
          Marcar como Entregado
        </Button>
      )}

      <Button
        onClick={onRegisterIncident}
        variant="outline"
        className="border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
        disabled={!canPerformActions}
      >
        <AlertCircle className="mr-2 h-4 w-4" />
        Registrar Incidencia
      </Button>

      <Button onClick={onEdit} variant="outline" disabled={!canPerformActions}>
        <Pencil className="mr-2 h-4 w-4" />
        Editar
      </Button>

      {!canPerformActions && (
        <p className="text-sm text-muted-foreground mt-2">
          Solo el vendedor del vehículo, administradores y supervisores pueden realizar estas acciones.
        </p>
      )}
    </div>
  )
}
