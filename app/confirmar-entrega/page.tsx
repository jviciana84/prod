"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Package, Loader2, CheckCircle, XCircle, Calendar, User, Mail, Car } from "lucide-react"

interface Entrega {
  id: number
  matricula: string
  nombre_cliente: string
  materiales: string[]
  nombre_recoge: string
  dni_recoge?: string
  email_recoge: string
  fecha_envio?: string
  fecha_confirmacion?: string
  estado: string
}

function ConfirmarEntregaContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [entrega, setEntrega] = useState<Entrega | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (token) {
      loadEntrega()
    } else {
      setError("Token no válido")
      setLoading(false)
    }
  }, [token])

  const loadEntrega = async () => {
    try {
      const response = await fetch(`/api/recogidas/confirmar-entrega?token=${token}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Error cargando la entrega")
      } else {
        setEntrega(data.entrega)
        if (data.entrega.estado === "confirmado" || data.entrega.fecha_confirmacion) {
          setConfirmed(true)
        }
      }
    } catch (error) {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const confirmarRecepcion = async () => {
    setConfirming(true)
    try {
      const response = await fetch("/api/recogidas/confirmar-entrega", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "❌ Error",
          description: data.error || "Error confirmando la recepción",
          variant: "destructive",
        })
      } else {
        toast({
          title: "✅ Confirmado",
          description: "Recepción confirmada correctamente",
        })
        setConfirmed(true)
        setEntrega(data.entrega)
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando entrega...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!entrega) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Entrega no encontrada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                No se encontró la entrega con el token proporcionado.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {confirmed ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <Package className="h-6 w-6" />
            )}
            Confirmación de Entrega en Mano
          </CardTitle>
          <CardDescription>
            {confirmed 
              ? "✅ Esta entrega ya fue confirmada anteriormente"
              : "Confirma que has recibido la documentación"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estado */}
          <div className="flex justify-center">
            <Badge variant={confirmed ? "default" : "secondary"}>
              {confirmed ? "CONFIRMADO" : "PENDIENTE DE CONFIRMACIÓN"}
            </Badge>
          </div>

          {/* Información del vehículo */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Car className="h-4 w-4" />
              Información del Vehículo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div><strong>Matrícula:</strong> {entrega.matricula}</div>
              <div><strong>Cliente:</strong> {entrega.nombre_cliente}</div>
            </div>
          </div>

          {/* Materiales entregados */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">📦 Documentación Entregada:</h3>
            <div className="space-y-2">
              {entrega.materiales.map((material, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>{material}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Información de entrega */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Entregado a:
            </h3>
            <div className="space-y-2">
              <div><strong>Nombre:</strong> {entrega.nombre_recoge}</div>
              {entrega.dni_recoge && (
                <div><strong>DNI:</strong> {entrega.dni_recoge}</div>
              )}
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <strong>Email:</strong> {entrega.email_recoge}
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fechas
            </h3>
            <div className="space-y-2">
              <div>
                <strong>Fecha de envío:</strong> {
                  entrega.fecha_envio 
                    ? new Date(entrega.fecha_envio).toLocaleString('es-ES')
                    : "No especificada"
                }
              </div>
              {entrega.fecha_confirmacion && (
                <div>
                  <strong>Fecha de confirmación:</strong> {
                    new Date(entrega.fecha_confirmacion).toLocaleString('es-ES')
                  }
                </div>
              )}
            </div>
          </div>

          {/* Botón de confirmación */}
          {!confirmed && (
            <div className="flex justify-center">
              <Button 
                onClick={confirmarRecepcion} 
                disabled={confirming}
                size="lg"
                className="w-full max-w-xs"
              >
                {confirming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar Recepción
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Mensaje de confirmación */}
          {confirmed && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>¡Gracias!</strong> Has confirmado la recepción de la documentación correctamente.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ConfirmarEntrega() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando...</span>
          </CardContent>
        </Card>
      </div>
    }>
      <ConfirmarEntregaContent />
    </Suspense>
  )
} 