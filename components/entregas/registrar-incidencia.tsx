"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/utils/supabase/client"
import { registerIncident } from "@/app/actions/register-incident"

// Tipos de incidencias disponibles
const TIPOS_INCIDENCIA = ["CARROCERIA", "MECANICA", "LIMPIEZA", "2ª LLAVE", "FICHA TECNICA", "PERMISO CIRCULACION"]

interface RegistrarIncidenciaProps {
  entregaId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function RegistrarIncidencia({ entregaId, onSuccess, onCancel }: RegistrarIncidenciaProps) {
  const [description, setDescription] = useState("")
  const [incidentType, setIncidentType] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const [isCheckingPermission, setIsCheckingPermission] = useState(true)

  const supabase = createClient()

  // Verificar permisos al cargar el componente
  useEffect(() => {
    async function checkPermission() {
      try {
        setIsCheckingPermission(true)

        // Obtener sesión del usuario
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          setHasPermission(false)
          return
        }

        // Obtener rol del usuario
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single()

        if (userError) {
          console.error("Error al obtener el rol del usuario:", userError)
          setHasPermission(false)
          return
        }

        // Si es admin o supervisor, tiene permiso
        if (userData.role === "admin" || userData.role === "supervisor") {
          setHasPermission(true)
          return
        }

        // Si es vendedor, verificar si vendió este vehículo
        if (userData.role === "vendedor") {
          // Primero obtenemos el stock_id de la entrega
          const { data: entregaData, error: entregaError } = await supabase
            .from("entregas")
            .select("stock_id")
            .eq("id", entregaId)
            .single()

          if (entregaError || !entregaData) {
            console.error("Error al obtener datos de la entrega:", entregaError)
            setHasPermission(false)
            return
          }

          // Luego verificamos si el vendedor es el propietario del vehículo
          const { data: stockData, error: stockError } = await supabase
            .from("stock")
            .select("vendedor_id")
            .eq("id", entregaData.stock_id)
            .single()

          if (stockError) {
            console.error("Error al obtener datos del stock:", stockError)
            setHasPermission(false)
            return
          }

          setHasPermission(stockData.vendedor_id === session.user.id)
        } else {
          setHasPermission(false)
        }
      } catch (error) {
        console.error("Error al verificar permisos:", error)
        setHasPermission(false)
      } finally {
        setIsCheckingPermission(false)
      }
    }

    checkPermission()
  }, [entregaId, supabase])

  const handleSubmit = async () => {
    if (!incidentType) {
      toast.error("Debes seleccionar un tipo de incidencia")
      return
    }

    try {
      setIsSubmitting(true)

      const result = await registerIncident({
        vehicleId: entregaId,
        description,
        incidentType,
      })

      if (result.success) {
        toast.success("Incidencia registrada correctamente")
        if (onSuccess) onSuccess()
      } else {
        toast.error(result.message || "Error al registrar la incidencia")
      }
    } catch (error) {
      console.error("Error al registrar incidencia:", error)
      toast.error("Error al registrar la incidencia")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isCheckingPermission) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Verificando permisos...</span>
        </CardContent>
      </Card>
    )
  }

  if (!hasPermission) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>No tienes permiso para registrar incidencias para este vehículo.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Nueva Incidencia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="incident-type" className="text-sm font-medium">
            Tipo de Incidencia
          </label>
          <Select value={incidentType} onValueChange={setIncidentType}>
            <SelectTrigger id="incident-type">
              <SelectValue placeholder="Selecciona un tipo" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_INCIDENCIA.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Descripción
          </label>
          <Textarea
            id="description"
            placeholder="Describe la incidencia en detalle..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registrando...
            </>
          ) : (
            "Registrar Incidencia"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
