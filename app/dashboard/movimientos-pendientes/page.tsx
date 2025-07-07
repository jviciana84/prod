"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, Car, FileText, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Tipos
type Movement = {
  id: string
  vehicle_id: string
  key_type?: string
  document_type?: string
  from_user_id: string | null
  to_user_id: string
  reason: string
  confirmed: boolean
  rejected?: boolean
  confirmation_deadline: string | null
  confirmed_at: string | null
  rejected_at?: string | null
  notes: string | null
  created_at: string
  license_plate?: string
  from_user_name?: string
  to_user_name?: string
  type: "key" | "document"
}

// Función para calcular si han pasado 24 horas laborables
const isAutoAccepted = (createdAt: string, confirmationDeadline: string | null): boolean => {
  if (!confirmationDeadline) return false

  const now = new Date()
  const deadline = new Date(confirmationDeadline)

  // Si ya pasó la fecha límite, se considera auto-aceptado
  return now > deadline
}

// Función para obtener el estado del movimiento
const getMovementStatus = (movement: Movement) => {
  if (movement.rejected) return "rejected"
  if (movement.confirmed) return "confirmed"
  if (movement.confirmation_deadline && isAutoAccepted(movement.created_at, movement.confirmation_deadline)) {
    return "auto_accepted"
  }
  return "pending"
}

export default function PendingMovementsPage() {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [keyMovements, setKeyMovements] = useState<Movement[]>([])
  const [documentMovements, setDocumentMovements] = useState<Movement[]>([])
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null)
  const [confirmationNotes, setConfirmationNotes] = useState("")
  const [rejectionNotes, setRejectionNotes] = useState("")
  const [confirming, setConfirming] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [vehiclesMap, setVehiclesMap] = useState<Record<string, string>>({})
  const [usersMap, setUsersMap] = useState<Record<string, any>>({})

  // Verificar sesión y cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Verificando sesión...")
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error al verificar sesión:", sessionError)
          setError(`Error de autenticación: ${sessionError.message}`)
          setLoading(false)
          return
        }

        if (!sessionData.session) {
          console.log("No hay sesión activa")
          setError("No hay sesión activa. Por favor, inicia sesión nuevamente.")
          setLoading(false)
          return
        }

        const userId = sessionData.session.user.id
        console.log("ID de usuario encontrado:", userId)

        // Cargar vehículos
        console.log("Cargando vehículos...")
        try {
          const { data: salesVehicles, error: salesError } = await supabase
            .from("sales_vehicles")
            .select("id, license_plate")

          if (salesError) {
            console.error("Error al cargar sales_vehicles:", salesError)
            throw salesError
          }

          const vehiclesMapTemp: Record<string, string> = {}

          if (salesVehicles && salesVehicles.length > 0) {
            salesVehicles.forEach((vehicle) => {
              if (vehicle.id && vehicle.license_plate) {
                vehiclesMapTemp[vehicle.id] = vehicle.license_plate
              }
            })
          }

          if (Object.keys(vehiclesMapTemp).length === 0) {
            const { data: stockVehicles, error: stockError } = await supabase.from("stock").select("id, license_plate")

            if (stockError) {
              console.error("Error al cargar stock:", stockError)
              throw stockError
            }

            if (stockVehicles && stockVehicles.length > 0) {
              stockVehicles.forEach((vehicle) => {
                if (vehicle.id && vehicle.license_plate) {
                  vehiclesMapTemp[vehicle.id] = vehicle.license_plate
                }
              })
            }
          }

          setVehiclesMap(vehiclesMapTemp)
          console.log("Vehículos cargados:", Object.keys(vehiclesMapTemp).length)
        } catch (vehicleError: any) {
          console.error("Error al cargar vehículos:", vehicleError)
        }

        // Cargar usuarios
        console.log("Cargando usuarios...")
        try {
          const { data: users, error: usersError } = await supabase.from("profiles").select("id, full_name, avatar_url")

          if (usersError) {
            console.error("Error al cargar usuarios:", usersError)
            throw usersError
          }

          const usersMapTemp: Record<string, any> = {}

          if (users && users.length > 0) {
            users.forEach((user) => {
              if (user.id && user.full_name) {
                usersMapTemp[user.id] = user
              }
            })
          }

          setUsersMap(usersMapTemp)
          console.log("Usuarios cargados:", Object.keys(usersMapTemp).length)
        } catch (usersError: any) {
          console.error("Error al cargar usuarios:", usersError)
        }

        // Cargar movimientos de llaves pendientes (incluyendo rechazados y auto-aceptados)
        console.log("Cargando movimientos de llaves...")
        try {
          const { data: keyData, error: keyError } = await supabase
            .from("key_movements")
            .select("*")
            .eq("to_user_id", userId)
            .order("created_at", { ascending: false })

          if (keyError) {
            console.error("Error al cargar movimientos de llaves:", keyError)
            throw keyError
          }

          const processedKeyMovements =
            keyData?.map((movement) => ({
              ...movement,
              type: "key" as const,
            })) || []

          setKeyMovements(processedKeyMovements)
          console.log("Movimientos de llaves cargados:", processedKeyMovements.length)
        } catch (keyError: any) {
          console.error("Error al cargar movimientos de llaves:", keyError)
          setError(`Error al cargar movimientos de llaves: ${keyError.message}`)
          setLoading(false)
          return
        }

        // Cargar movimientos de documentos
        console.log("Cargando movimientos de documentos...")
        try {
          const { data: docData, error: docError } = await supabase
            .from("document_movements")
            .select("*")
            .eq("to_user_id", userId)
            .order("created_at", { ascending: false })

          if (docError) {
            console.error("Error al cargar movimientos de documentos:", docError)
            throw docError
          }

          const processedDocMovements =
            docData?.map((movement) => ({
              ...movement,
              type: "document" as const,
            })) || []

          setDocumentMovements(processedDocMovements)
          console.log("Movimientos de documentos cargados:", processedDocMovements.length)
        } catch (docError: any) {
          console.error("Error al cargar movimientos de documentos:", docError)
          setError(`Error al cargar movimientos de documentos: ${docError.message}`)
          setLoading(false)
          return
        }

        setLoading(false)
      } catch (error: any) {
        console.error("Error general:", error)
        setError(`Error al cargar datos: ${error.message || "Error desconocido"}`)
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const handleOpenConfirmDialog = (movement: Movement) => {
    setSelectedMovement(movement)
    setConfirmationNotes("")
    setConfirmDialogOpen(true)
  }

  const handleOpenRejectDialog = (movement: Movement) => {
    setSelectedMovement(movement)
    setRejectionNotes("")
    setRejectDialogOpen(true)
  }

  const handleConfirmMovement = async () => {
    if (!selectedMovement) return

    setConfirming(true)

    try {
      const table = selectedMovement.type === "key" ? "key_movements" : "document_movements"

      const { error } = await supabase
        .from(table)
        .update({
          confirmed: true,
          confirmed_at: new Date().toISOString(),
          notes: confirmationNotes || null,
        })
        .eq("id", selectedMovement.id)

      if (error) {
        console.error(`Error al confirmar movimiento de ${selectedMovement.type}:`, error)
        throw error
      }

      // Actualizar el estado local
      if (selectedMovement.type === "key") {
        setKeyMovements(
          keyMovements.map((m) =>
            m.id === selectedMovement.id
              ? { ...m, confirmed: true, confirmed_at: new Date().toISOString(), notes: confirmationNotes || null }
              : m,
          ),
        )
      } else {
        setDocumentMovements(
          documentMovements.map((m) =>
            m.id === selectedMovement.id
              ? { ...m, confirmed: true, confirmed_at: new Date().toISOString(), notes: confirmationNotes || null }
              : m,
          ),
        )
      }

      setConfirmDialogOpen(false)
    } catch (error: any) {
      console.error("Error al confirmar movimiento:", error)
      alert(`Error al confirmar: ${error.message}`)
    } finally {
      setConfirming(false)
    }
  }

  const handleRejectMovement = async () => {
    if (!selectedMovement) return

    setRejecting(true)

    try {
      const table = selectedMovement.type === "key" ? "key_movements" : "document_movements"

      const { error } = await supabase
        .from(table)
        .update({
          rejected: true,
          rejected_at: new Date().toISOString(),
          notes: rejectionNotes || null,
        })
        .eq("id", selectedMovement.id)

      if (error) {
        console.error(`Error al rechazar movimiento de ${selectedMovement.type}:`, error)
        throw error
      }

      // Actualizar el estado local
      if (selectedMovement.type === "key") {
        setKeyMovements(
          keyMovements.map((m) =>
            m.id === selectedMovement.id
              ? { ...m, rejected: true, rejected_at: new Date().toISOString(), notes: rejectionNotes || null }
              : m,
          ),
        )
      } else {
        setDocumentMovements(
          documentMovements.map((m) =>
            m.id === selectedMovement.id
              ? { ...m, rejected: true, rejected_at: new Date().toISOString(), notes: rejectionNotes || null }
              : m,
          ),
        )
      }

      setRejectDialogOpen(false)
    } catch (error: any) {
      console.error("Error al rechazar movimiento:", error)
      alert(`Error al rechazar: ${error.message}`)
    } finally {
      setRejecting(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return format(new Date(dateString), "dd/MM/yy HH:mm", { locale: es })
  }

  const getStatusBadge = (movement: Movement) => {
    const status = getMovementStatus(movement)

    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-700 border-green-200">Aceptada</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-700 border-red-200">Rechazada</Badge>
      case "auto_accepted":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Aceptada por omisión</Badge>
      case "pending":
      default:
        const isExpired = movement.confirmation_deadline && new Date(movement.confirmation_deadline) < new Date()
        return isExpired ? (
          <Badge className="bg-orange-100 text-orange-700 border-orange-200">Plazo vencido</Badge>
        ) : (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pendiente</Badge>
        )
    }
  }

  const renderMovementCard = (movement: Movement) => {
    const licensePlate = vehiclesMap[movement.vehicle_id] || "Matrícula no disponible"
    const fromUserName = movement.from_user_id
      ? usersMap[movement.from_user_id]?.full_name || "Usuario desconocido"
      : "Concesionario"
    const toUserName = usersMap[movement.to_user_id]?.full_name || "Usuario desconocido"
    const status = getMovementStatus(movement)
    const isExpired = movement.confirmation_deadline && new Date(movement.confirmation_deadline) < new Date()
    const canReject = status === "pending" && !isExpired

    const itemType = movement.type === "key" ? movement.key_type : movement.document_type
    const itemLabel =
      movement.type === "key"
        ? itemType === "first_key"
          ? "Primera llave"
          : itemType === "second_key"
            ? "Segunda llave"
            : "Card Key"
        : itemType === "technical_sheet"
          ? "Ficha técnica"
          : "Permiso de circulación"

    return (
      <Card key={movement.id} className="mb-3">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header compacto */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                {movement.type === "key" ? (
                  <Car className="h-4 w-4 text-blue-500" />
                ) : (
                  <FileText className="h-4 w-4 text-green-500" />
                )}
                <span className="font-semibold text-sm">{licensePlate}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm">{itemLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(movement)}
                <span className="text-xs text-muted-foreground">{formatDate(movement.created_at)}</span>
              </div>
            </div>

            {/* Usuarios compacto */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={movement.from_user_id ? usersMap[movement.from_user_id]?.avatar_url : null} />
                    <AvatarFallback className="text-xs">{fromUserName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground">De:</span>
                  <span className="font-medium">{fromUserName}</span>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={usersMap[movement.to_user_id]?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">{toUserName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground">Para:</span>
                  <span className="font-medium">{toUserName}</span>
                </div>
              </div>
            </div>

            {movement.reason && (
              <div className="text-sm">
                <span className="text-muted-foreground">Motivo:</span> {movement.reason}
              </div>
            )}

            {/* Botones solo para movimientos pendientes */}
            {status === "pending" && (
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenRejectDialog(movement)}
                  disabled={!canReject}
                  className={canReject ? "border-red-600 text-red-600 hover:bg-red-600 hover:text-white" : ""}
                >
                  {canReject ? "Rechazar" : "No rechazable"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleOpenConfirmDialog(movement)}>
                  Confirmar recepción
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <BMWMSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">Cargando movimientos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p className="text-muted-foreground text-center max-w-md mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    )
  }

  const allMovements = [...keyMovements, ...documentMovements]
  const pendingMovements = allMovements.filter((m) => getMovementStatus(m) === "pending")
  const totalMovements = allMovements.length

  if (totalMovements === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No tienes movimientos</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Cuando recibas llaves o documentos, aparecerán aquí.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Movimientos de Llaves y Documentos</h1>
        <p className="text-muted-foreground mt-2">
          Tienes {pendingMovements.length} movimientos pendientes de {totalMovements} totales.
        </p>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Funcionamiento de confirmaciones</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • Tienes <strong>24 horas laborables</strong> para confirmar o rechazar un movimiento
            </li>
            <li>• Después de 24h, el movimiento se acepta automáticamente</li>
            <li>• Solo puedes rechazar durante las primeras 24h laborables</li>
            <li>• Los movimientos auto-aceptados ya no aparecen como pendientes</li>
          </ul>
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pendientes ({pendingMovements.length})</TabsTrigger>
          <TabsTrigger value="all">Todos ({totalMovements})</TabsTrigger>
          <TabsTrigger value="keys">Llaves ({keyMovements.length})</TabsTrigger>
          <TabsTrigger value="documents">Documentos ({documentMovements.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-4">
          {pendingMovements.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay movimientos pendientes</h3>
              <p className="text-muted-foreground">Todos tus movimientos han sido procesados.</p>
            </div>
          ) : (
            pendingMovements.map(renderMovementCard)
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4 space-y-4">
          {allMovements
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map(renderMovementCard)}
        </TabsContent>

        <TabsContent value="keys" className="mt-4 space-y-4">
          {keyMovements.map(renderMovementCard)}
        </TabsContent>

        <TabsContent value="documents" className="mt-4 space-y-4">
          {documentMovements.map(renderMovementCard)}
        </TabsContent>
      </Tabs>

      {/* Dialog de confirmación */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar recepción</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              ¿Confirmas que has recibido {selectedMovement?.type === "key" ? "la llave" : "el documento"} del vehículo{" "}
              {selectedMovement ? vehiclesMap[selectedMovement.vehicle_id] || "Matrícula no disponible" : ""}?
            </p>
            <Textarea
              placeholder="Notas (opcional)"
              value={confirmationNotes}
              onChange={(e) => setConfirmationNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={confirming}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmMovement} disabled={confirming}>
              {confirming ? <BMWMSpinner size="sm" className="mr-2" /> : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de rechazo */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar movimiento</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              ¿Estás seguro de que quieres rechazar la recepción de{" "}
              {selectedMovement?.type === "key" ? "la llave" : "el documento"} del vehículo{" "}
              {selectedMovement ? vehiclesMap[selectedMovement.vehicle_id] || "Matrícula no disponible" : ""}?
            </p>
            <Textarea
              placeholder="Motivo del rechazo (opcional)"
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={rejecting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRejectMovement} disabled={rejecting}>
              {rejecting ? <BMWMSpinner size="sm" className="mr-2" /> : null}
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
