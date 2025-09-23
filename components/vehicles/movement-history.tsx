"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Key, FileText, ArrowRight, Clock, CheckCircle2, User, Calendar } from "lucide-react"
import { format, addBusinessDays, isWeekend, isAfter } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

interface MovementHistoryProps {
  vehicleId: string
}

export function MovementHistory({ vehicleId }: MovementHistoryProps) {
  const supabase = createClientComponentClient()
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedMovement, setSelectedMovement] = useState<any | null>(null)
  const [confirmationNotes, setConfirmationNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)

  // Cargar el ID del usuario actual
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error) {
        console.error("Error al obtener el usuario actual:", error)
        return
      }

      if (data?.user) {
        setCurrentUserId(data.user.id)
        setCurrentUserEmail(data.user.email)
        console.log("ID del usuario actual:", data.user.id)
        console.log("Email del usuario actual:", data.user.email)
      }
    }

    fetchCurrentUser()
  }, [supabase])

  // Cargar historial de movimientos
  useEffect(() => {
    const fetchMovements = async () => {
      setLoading(true)
      setError(null)

      try {
        // Cargar movimientos de llaves
        const { data: keyMovements, error: keyError } = await supabase
          .from("key_movements")
          .select(`
            id,
            key_type,
            reason,
            notes,
            confirmed,
            confirmed_at,
            confirmation_deadline,
            created_at,
            from_user_id,
            to_user_id
          `)
          .eq("vehicle_id", vehicleId)
          .order("created_at", { ascending: false })

        if (keyError) throw keyError

        // Cargar movimientos de documentos
        const { data: docMovements, error: docError } = await supabase
          .from("document_movements")
          .select(`
            id,
            document_type,
            reason,
            notes,
            confirmed,
            confirmed_at,
            confirmation_deadline,
            created_at,
            from_user_id,
            to_user_id
          `)
          .eq("vehicle_id", vehicleId)
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
            .select("id, full_name, alias, email")
            .in("id", Array.from(userIds))

          if (userError) throw userError

          // Convertir a un objeto para fácil acceso
          userMap = {}
          userData?.forEach((user) => {
            userMap[user.id] = user
          })
        }

        // Combinar y formatear los resultados
        const allMovements = [
          ...(keyMovements || []).map((m) => ({
            ...m,
            type: "key",
            from_user_name: m.from_user_id
              ? userMap[m.from_user_id]?.full_name || "Usuario desconocido"
              : "Concesionario",
            to_user_name: m.to_user_id ? userMap[m.to_user_id]?.full_name || "Usuario desconocido" : "Concesionario",
            to_user_email: m.to_user_id ? userMap[m.to_user_id]?.email || null : null,
          })),
          ...(docMovements || []).map((m) => ({
            ...m,
            type: "document",
            from_user_name: m.from_user_id
              ? userMap[m.from_user_id]?.full_name || "Usuario desconocido"
              : "Concesionario",
            to_user_name: m.to_user_id ? userMap[m.to_user_id]?.full_name || "Usuario desconocido" : "Concesionario",
            to_user_email: m.to_user_id ? userMap[m.to_user_id]?.email || null : null,
          })),
        ]

        // Ordenar por fecha
        allMovements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        // Imprimir información de depuración
        allMovements.forEach((movement) => {
          console.log(`Movimiento ID: ${movement.id}`)
          console.log(`- to_user_id: ${movement.to_user_id}`)
          console.log(`- to_user_email: ${movement.to_user_email}`)
          console.log(`- confirmed: ${movement.confirmed}`)
        })

        setMovements(allMovements)
      } catch (err: any) {
        console.error("Error al cargar historial de movimientos:", err)
        setError(err.message || "Error al cargar historial de movimientos")
      } finally {
        setLoading(false)
      }
    }

    if (vehicleId) {
      fetchMovements()
    }
  }, [vehicleId, supabase])

  // Función para abrir el diálogo de confirmación
  const handleOpenConfirmDialog = (movement: any) => {
    setSelectedMovement(movement)
    setConfirmationNotes("")
    setConfirmDialogOpen(true)
  }

  // Función para confirmar la recepción
  const handleConfirmReceipt = async () => {
    if (!selectedMovement) return

    setIsSubmitting(true)

    try {
      const table = selectedMovement.type === "key" ? "key_movements" : "document_movements"

      const { error } = await supabase
        .from(table)
        .update({
          confirmed: true,
          confirmed_at: new Date().toISOString(),
          notes: confirmationNotes.trim() || null,
        })
        .eq("id", selectedMovement.id)

      if (error) throw error

      // Actualizar el estado local
      setMovements((prev) =>
        prev.map((m) =>
          m.id === selectedMovement.id
            ? {
                ...m,
                confirmed: true,
                confirmed_at: new Date().toISOString(),
                notes: confirmationNotes.trim() || null,
              }
            : m,
        ),
      )

      toast.success("Recepción confirmada correctamente")
      setConfirmDialogOpen(false)
    } catch (err: any) {
      console.error("Error al confirmar recepción:", err)
      toast.error(err.message || "Error al confirmar recepción")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es })
  }

  // Función para obtener el tipo de elemento
  const getItemTypeLabel = (movement: any) => {
    if (movement.type === "key") {
      const keyTypes: Record<string, string> = {
        first_key: "Primera llave",
        second_key: "Segunda llave",
        card_key: "Card Key",
      }
      return keyTypes[movement.key_type] || movement.key_type
    }

    if (movement.type === "document") {
      const docTypes: Record<string, string> = {
        technical_sheet: "Ficha técnica",
        circulation_permit: "Permiso de circulación",
      }
      return docTypes[movement.document_type] || movement.document_type
    }

    return "Desconocido"
  }

  // Función para obtener el icono del elemento
  const getItemIcon = (movement: any) => {
    if (movement.type === "key") {
      return <Key className="h-4 w-4" />
    }
    if (movement.type === "document") {
      return <FileText className="h-4 w-4" />
    }
    return null
  }

  // Función para calcular el plazo de confirmación (días laborables)
  const calculateBusinessDaysDeadline = (createdAt: string) => {
    // Fecha de creación
    const startDate = new Date(createdAt)

    // Añadir 1 día laborable (excluyendo fines de semana)
    let deadline = addBusinessDays(startDate, 1)

    // Si la fecha resultante cae en fin de semana, mover al siguiente día laborable
    if (isWeekend(deadline)) {
      deadline = addBusinessDays(deadline, 1)
    }

    return deadline
  }

  // Función para verificar si el usuario actual es el destinatario
  const isCurrentUserRecipient = (movement: any) => {
    // Verificar por ID de usuario
    if (currentUserId && movement.to_user_id === currentUserId) {
      return true
    }

    // Verificar por email (como respaldo)
    if (currentUserEmail && movement.to_user_email === currentUserEmail) {
      return true
    }

    // Imprimir información de depuración
    console.log("Verificando si el usuario actual es el destinatario:")
    console.log(`- currentUserId: ${currentUserId}`)
    console.log(`- movement.to_user_id: ${movement.to_user_id}`)
    console.log(`- currentUserEmail: ${currentUserEmail}`)
    console.log(`- movement.to_user_email: ${movement.to_user_email}`)

    return false
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <BMWMSpinner size="md" />
        <p className="mt-4 text-muted-foreground">Cargando historial de movimientos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        <p className="font-medium">Error al cargar el historial</p>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Historial de movimientos
        </CardTitle>
        <CardDescription>Registro de todos los movimientos de llaves y documentos de este vehículo</CardDescription>
      </CardHeader>
      <CardContent>
        {movements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay movimientos registrados para este vehículo</p>
          </div>
        ) : (
          <div className="space-y-4">
            {movements.map((movement) => {
              // Calcular el plazo de confirmación en días laborables
              const businessDaysDeadline = calculateBusinessDaysDeadline(movement.created_at)
              const isDeadlinePassed =
                movement.confirmation_deadline && isAfter(new Date(), new Date(movement.confirmation_deadline))

              // Verificar si el usuario actual es el destinatario
              const userIsRecipient = isCurrentUserRecipient(movement)

              // Mostrar información de depuración
              console.log(
                `Movimiento ${movement.id}: userIsRecipient = ${userIsRecipient}, confirmed = ${movement.confirmed}`,
              )

              return (
                <div key={movement.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getItemIcon(movement)}
                      <span className="font-medium">{getItemTypeLabel(movement)}</span>
                      <Badge variant="outline" className="ml-2">
                        {format(new Date(movement.created_at), "dd/MM/yyyy", { locale: es })}
                      </Badge>
                    </div>

                    {!movement.confirmed && userIsRecipient && (
                      <Button variant="outline" size="sm" onClick={() => handleOpenConfirmDialog(movement)}>
                        Confirmar recepción
                      </Button>
                    )}
                  </div>

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

                  {movement.reason && (
                    <div className="text-sm">
                      <span className="font-medium">Motivo:</span> {movement.reason}
                    </div>
                  )}

                  {movement.confirmed ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      <span className="text-xs">Confirmado el {formatDate(movement.confirmed_at)}</span>
                    </div>
                  ) : isDeadlinePassed ? (
                    <div className="flex items-center text-amber-600">
                      <Clock className="h-4 w-4 mr-1" />
                      <span className="text-xs">Plazo de confirmación vencido</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-blue-600">
                      <Clock className="h-4 w-4 mr-1" />
                      <span className="text-xs">Pendiente de confirmación</span>
                    </div>
                  )}

                  {movement.notes && (
                    <div className="text-sm bg-muted/50 p-2 rounded-md">
                      <span className="font-medium">Notas:</span> {movement.notes}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {/* Diálogo de confirmación */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar recepción</DialogTitle>
            <DialogDescription>
              Confirma que has recibido {selectedMovement?.type === "key" ? "la llave" : "el documento"}{" "}
              {getItemTypeLabel(selectedMovement || {})}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="text-sm">
              <p>
                <span className="font-medium">Fecha de entrega:</span>{" "}
                {selectedMovement && formatDate(selectedMovement.created_at)}
              </p>
              <p>
                <span className="font-medium">Entregado por:</span> {selectedMovement?.from_user_name}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Notas (opcional)
              </label>
              <Textarea
                id="notes"
                placeholder="Añade notas sobre la recepción si es necesario"
                value={confirmationNotes}
                onChange={(e) => setConfirmationNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmReceipt} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <BMWMSpinner size="sm" className="mr-2" />
                  Confirmando...
                </>
              ) : (
                "Confirmar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default MovementHistory
