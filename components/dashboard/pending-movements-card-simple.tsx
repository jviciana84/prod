"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, Key, FileText, Clock, CheckCircle, XCircle } from "lucide-react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "@/hooks/use-toast"

interface DocumentMovement {
  id: string
  vehicle_id: string
  document_type: string
  from_user_id: string | null
  to_user_id: string
  reason: string
  confirmation_status: string
  created_at: string
  notes: string | null
}

interface KeyMovement {
  id: string
  vehicle_id: string
  key_type: string
  from_user_id: string | null
  to_user_id: string
  reason: string
  confirmation_status: string
  created_at: string
  notes: string | null
}

export function PendingMovementsCardSimple() {
  const { user } = useAuth()
  const [documentMovements, setDocumentMovements] = useState<DocumentMovement[]>([])
  const [keyMovements, setKeyMovements] = useState<KeyMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vehicleNames, setVehicleNames] = useState<Record<string, string>>({})
  const [userNames, setUserNames] = useState<Record<string, string>>({})
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    loadPendingMovements()
  }, [user?.id])

  const loadPendingMovements = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      // Cargar movimientos SIN JOINS (más seguro)
      const { data: docMovements, error: docError } = await supabase
        .from("document_movements")
        .select("*")
        .eq("to_user_id", user.id)
        .eq("confirmation_status", "pending")
        .order("created_at", { ascending: false })

      if (docError) {
        console.error("Error cargando movimientos de documentos:", docError)
        setError("Error al cargar movimientos de documentos")
      } else {
        setDocumentMovements(docMovements || [])
      }

      const { data: keyMovs, error: keyError } = await supabase
        .from("key_movements")
        .select("*")
        .eq("to_user_id", user.id)
        .eq("confirmation_status", "pending")
        .order("created_at", { ascending: false })

      if (keyError) {
        console.error("Error cargando movimientos de llaves:", keyError)
        setError("Error al cargar movimientos de llaves")
      } else {
        setKeyMovements(keyMovs || [])
      }

      // Cargar nombres de vehículos y usuarios por separado
      await loadAdditionalData([...(docMovements || []), ...(keyMovs || [])])
    } catch (err) {
      console.error("Error inesperado:", err)
      setError("Error inesperado al cargar movimientos")
    } finally {
      setLoading(false)
    }
  }

  const loadAdditionalData = async (movements: any[]) => {
    const vehicleIds = [...new Set(movements.map((m) => m.vehicle_id))]
    const userIds = [...new Set(movements.map((m) => m.from_user_id).filter(Boolean))]

    // Cargar nombres de vehículos
    if (vehicleIds.length > 0) {
      const { data: vehicles } = await supabase
        .from("sales_vehicles")
        .select("id, license_plate, model")
        .in("id", vehicleIds)

      const vehicleMap: Record<string, string> = {}
      vehicles?.forEach((v) => {
        vehicleMap[v.id] = `${v.license_plate} - ${v.model}`
      })
      setVehicleNames(vehicleMap)
    }

    // Cargar nombres de usuarios
    if (userIds.length > 0) {
      const { data: users } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds)

      const userMap: Record<string, string> = {}
      users?.forEach((u) => {
        userMap[u.id] = u.full_name || u.email
      })
      setUserNames(userMap)
    }
  }

  const handleConfirmMovement = async (type: "document" | "key", movementId: string) => {
    try {
      const table = type === "document" ? "document_movements" : "key_movements"

      const { error } = await supabase
        .from(table)
        .update({
          confirmation_status: "confirmed",
          confirmed_at: new Date().toISOString(),
          confirmed: true,
        })
        .eq("id", movementId)

      if (error) {
        console.error(`Error confirmando movimiento de ${type}:`, error)
        toast({
          title: "Error",
          description: `No se pudo confirmar el movimiento de ${type === "document" ? "documento" : "llave"}`,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Movimiento confirmado",
        description: `El movimiento de ${type === "document" ? "documento" : "llave"} ha sido confirmado`,
      })

      loadPendingMovements()
    } catch (err) {
      console.error("Error inesperado:", err)
      toast({
        title: "Error",
        description: "Error inesperado al confirmar el movimiento",
        variant: "destructive",
      })
    }
  }

  const handleRejectMovement = async (type: "document" | "key", movementId: string) => {
    const reason = prompt("Motivo del rechazo (opcional):")

    try {
      const table = type === "document" ? "document_movements" : "key_movements"

      const { error } = await supabase
        .from(table)
        .update({
          confirmation_status: "rejected",
          rejected_at: new Date().toISOString(),
          rejected: true,
          rejection_reason: reason || null,
        })
        .eq("id", movementId)

      if (error) {
        console.error(`Error rechazando movimiento de ${type}:`, error)
        toast({
          title: "Error",
          description: `No se pudo rechazar el movimiento de ${type === "document" ? "documento" : "llave"}`,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Movimiento rechazado",
        description: `El movimiento de ${type === "document" ? "documento" : "llave"} ha sido rechazado`,
      })

      loadPendingMovements()
    } catch (err) {
      console.error("Error inesperado:", err)
      toast({
        title: "Error",
        description: "Error inesperado al rechazar el movimiento",
        variant: "destructive",
      })
    }
  }

  const totalPendingMovements = documentMovements.length + keyMovements.length

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "technical_sheet":
        return "Ficha técnica"
      case "circulation_permit":
        return "Permiso de circulación"
      default:
        return type
    }
  }

  const getKeyTypeLabel = (type: string) => {
    switch (type) {
      case "first_key":
        return "Primera llave"
      case "second_key":
        return "Segunda llave"
      case "card_key":
        return "Llave tarjeta"
      default:
        return type
    }
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Movimientos Pendientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Inicia sesión para ver tus movimientos pendientes</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 animate-spin" />
            Movimientos Pendientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando movimientos pendientes...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Movimientos Pendientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="outline" size="sm" onClick={loadPendingMovements} className="mt-2">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Movimientos Pendientes
          {totalPendingMovements > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {totalPendingMovements}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {totalPendingMovements === 0
            ? "No tienes movimientos pendientes de confirmación"
            : `Tienes ${totalPendingMovements} movimiento${totalPendingMovements > 1 ? "s" : ""} pendiente${totalPendingMovements > 1 ? "s" : ""} de confirmación`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {totalPendingMovements === 0 ? (
          <div className="text-center py-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">¡Todo al día!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Movimientos de documentos */}
            {documentMovements.map((movement) => (
              <div key={movement.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-sm">{getDocumentTypeLabel(movement.document_type)}</span>
                  <Badge variant="outline" className="ml-auto">
                    Documento
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>
                    <strong>Vehículo:</strong> {vehicleNames[movement.vehicle_id] || movement.vehicle_id}
                  </p>
                  <p>
                    <strong>De:</strong>{" "}
                    {movement.from_user_id ? userNames[movement.from_user_id] || movement.from_user_id : "Sistema"}
                  </p>
                  <p>
                    <strong>Motivo:</strong> {movement.reason}
                  </p>
                  <p>
                    <strong>Fecha:</strong> {new Date(movement.created_at).toLocaleDateString("es-ES")}
                  </p>
                  {movement.notes && (
                    <p>
                      <strong>Notas:</strong> {movement.notes}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => handleConfirmMovement("document", movement.id)} className="flex-1">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectMovement("document", movement.id)}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Rechazar
                  </Button>
                </div>
              </div>
            ))}

            {/* Movimientos de llaves */}
            {keyMovements.map((movement) => (
              <div key={movement.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-amber-500" />
                  <span className="font-medium text-sm">{getKeyTypeLabel(movement.key_type)}</span>
                  <Badge variant="outline" className="ml-auto">
                    Llave
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>
                    <strong>Vehículo:</strong> {vehicleNames[movement.vehicle_id] || movement.vehicle_id}
                  </p>
                  <p>
                    <strong>De:</strong>{" "}
                    {movement.from_user_id ? userNames[movement.from_user_id] || movement.from_user_id : "Sistema"}
                  </p>
                  <p>
                    <strong>Motivo:</strong> {movement.reason}
                  </p>
                  <p>
                    <strong>Fecha:</strong> {new Date(movement.created_at).toLocaleDateString("es-ES")}
                  </p>
                  {movement.notes && (
                    <p>
                      <strong>Notas:</strong> {movement.notes}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => handleConfirmMovement("key", movement.id)} className="flex-1">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectMovement("key", movement.id)}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Rechazar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
