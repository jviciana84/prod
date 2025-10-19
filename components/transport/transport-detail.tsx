"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format, parseISO, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import {
  Car,
  Calendar,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  FileText,
  Edit,
  Trash2,
} from "lucide-react"

interface TransportDetailProps {
  transportId: string
  onBack: () => void
}

export default function TransportDetail({ transportId, onBack }: TransportDetailProps) {
  const [transport, setTransport] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  // NOTA: Crear cliente fresco en cada mutación para evitar zombie client
  const { toast } = useToast()

  useEffect(() => {
    fetchTransportDetail()
  }, [transportId])

  // Cambiar la consulta a la base de datos
  const fetchTransportDetail = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("nuevas_entradas").select("*").eq("id", transportId).single()

      if (error) throw error

      if (data) {
        // Obtener datos relacionados
        const [locationResult, expenseTypeResult] = await Promise.all([
          supabase.from("locations").select("*").eq("id", data.origin_location_id).single(),
          data.expense_type_id
            ? supabase.from("expense_types").select("*").eq("id", data.expense_type_id).single()
            : Promise.resolve({ data: null }),
        ])

        setTransport({
          ...data,
          origin_location: locationResult.data,
          expense_type: expenseTypeResult.data,
        })
      }
    } catch (error) {
      console.error("Error al cargar detalles de la nueva entrada:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles de la nueva entrada",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Cambiar la actualización de recepción
  const handleReceptionToggle = async () => {
    if (!transport) return

    setIsUpdating(true)
    try {
      const newStatus = !transport.is_received

      const response = await fetch("/api/transport/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: transport.id,
          isReceived: newStatus,
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || "Error al actualizar")
      }

      // Actualizar el estado local
      setTransport({
        ...transport,
        is_received: newStatus,
        reception_date: newStatus ? new Date().toISOString() : null,
      })

      toast({
        title: newStatus ? "Vehículo recibido" : "Recepción cancelada",
        description: newStatus
          ? "Se ha registrado la recepción del vehículo"
          : "Se ha cancelado la recepción del vehículo",
      })
    } catch (error) {
      console.error("Error al actualizar estado de recepción:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de recepción",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Calcular días de espera
  const calculateWaitingDays = () => {
    if (!transport || !transport.purchase_date) return { days: "-", status: "" }

    const purchaseDate = parseISO(transport.purchase_date)
    const today = new Date()

    let days: number
    let status: string

    if (transport.is_received && transport.reception_date) {
      const receptionDate = parseISO(transport.reception_date)
      days = differenceInDays(receptionDate, purchaseDate)
    } else {
      days = differenceInDays(today, purchaseDate)
    }

    // Determinar el estado según los días
    if (days <= 7) {
      status = "success"
    } else if (days <= 15) {
      status = "warning"
    } else {
      status = "danger"
    }

    return { days, status }
  }

  // Formatear fecha
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    try {
      return format(parseISO(dateString), "dd MMMM yyyy", { locale: es })
    } catch (error) {
      return "-"
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!transport) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium">Transporte no encontrado</h3>
            <p className="text-muted-foreground mt-2">No se pudo encontrar la información del transporte solicitado</p>
            <Button onClick={onBack} variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const waitingInfo = calculateWaitingDays()

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-xl">{transport.model}</CardTitle>
              <CardDescription>Matrícula: {transport.license_plate}</CardDescription>
            </div>
          </div>
          <Badge
            variant={transport.is_received ? "outline" : "default"}
            className={
              transport.is_received
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
            }
          >
            {transport.is_received ? "Recibido" : "Pendiente"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Información principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Car className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium">Vehículo</h3>
                <p>{transport.model}</p>
                <p className="text-sm text-muted-foreground">Matrícula: {transport.license_plate}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium">Sede de origen</h3>
                <p>{transport.origin_location?.name || "-"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium">Cargo de gastos</h3>
                <p>{transport.expense_type?.name || "-"}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium">Fecha de compra</h3>
                <p>{formatDate(transport.purchase_date)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium">Tiempo de espera</h3>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      waitingInfo.status === "success"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : waitingInfo.status === "warning"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                    }
                  >
                    {waitingInfo.days} días
                  </Badge>
                  {waitingInfo.status === "danger" && !transport.is_received && (
                    <span className="text-red-500 text-sm flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Espera prolongada
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium">Fecha de recepción</h3>
                <p>{transport.is_received ? formatDate(transport.reception_date) : "Pendiente"}</p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Información adicional */}
        <div>
          <h3 className="font-medium mb-2">Información adicional</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Creado:</span> {formatDate(transport.created_at)}
            </div>
            <div>
              <span className="text-muted-foreground">Última actualización:</span> {formatDate(transport.updated_at)}
            </div>
            <div>
              <span className="text-muted-foreground">ID:</span> {transport.id}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Generar informe
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Edit className="h-4 w-4" />
            Editar
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1 text-red-500 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        </div>
        <Button
          onClick={handleReceptionToggle}
          disabled={isUpdating}
          variant={transport.is_received ? "outline" : "default"}
          className={
            transport.is_received
              ? "border-green-200 text-green-700 hover:border-green-300 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:border-green-700 dark:hover:bg-green-950/50"
              : "border-amber-200 bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
          }
        >
          {isUpdating ? (
            <span className="flex items-center gap-1">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              Actualizando...
            </span>
          ) : transport.is_received ? (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Marcar como pendiente
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Marcar como recibido
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
