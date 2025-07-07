"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Key, FileText, ArrowRight, Clock, CheckCircle2, AlertTriangle, ChevronLeft, Car } from "lucide-react"
import Link from "next/link"

export default function VehicleMovementsPage({ params }: { params: { licensePlate: string } }) {
  const { licensePlate } = params
  const decodedLicensePlate = decodeURIComponent(licensePlate)

  const supabase = createClientComponentClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [keyMovements, setKeyMovements] = useState<any[]>([])
  const [documentMovements, setDocumentMovements] = useState<any[]>([])
  const [users, setUsers] = useState<Record<string, any>>({})
  const [vehicle, setVehicle] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("all")

  // Cargar datos
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)

      try {
        // Cargar información del vehículo
        const { data: vehicleData, error: vehicleError } = await supabase
          .from("nuevas_entradas")
          .select("*")
          .eq("license_plate", decodedLicensePlate)
          .maybeSingle()

        if (vehicleError && vehicleError.code !== "PGRST116") {
          throw vehicleError
        }

        setVehicle(vehicleData)

        // Cargar movimientos de llaves
        const { data: keyData, error: keyError } = await supabase
          .from("key_movements")
          .select("*")
          .eq("license_plate", decodedLicensePlate)
          .order("created_at", { ascending: false })

        if (keyError) throw keyError

        // Cargar movimientos de documentos
        const { data: docData, error: docError } = await supabase
          .from("document_movements")
          .select("*")
          .eq("license_plate", decodedLicensePlate)
          .order("created_at", { ascending: false })

        if (docError) throw docError

        setKeyMovements(keyData || [])
        setDocumentMovements(docData || [])

        // Recopilar todos los IDs de usuario únicos
        const userIds = new Set<string>()

        keyData?.forEach((movement) => {
          if (movement.from_user_id) userIds.add(movement.from_user_id)
          if (movement.to_user_id) userIds.add(movement.to_user_id)
        })

        docData?.forEach((movement) => {
          if (movement.from_user_id) userIds.add(movement.from_user_id)
          if (movement.to_user_id) userIds.add(movement.to_user_id)
        })

        // Cargar información de usuarios
        if (userIds.size > 0) {
          const { data: userData, error: userError } = await supabase
            .from("profiles")
            .select("id, full_name, alias")
            .in("id", Array.from(userIds))

          if (userError) throw userError

          // Convertir a un objeto para fácil acceso
          const userMap: Record<string, any> = {}
          userData?.forEach((user) => {
            userMap[user.id] = user
          })

          setUsers(userMap)
        }
      } catch (err: any) {
        console.error("Error loading data:", err)
        setError(err.message || "Error al cargar datos")
      } finally {
        setLoading(false)
      }
    }

    if (decodedLicensePlate) {
      loadData()
    }
  }, [supabase, decodedLicensePlate])

  // Filtrar movimientos según la pestaña activa
  const filteredMovements = (() => {
    if (activeTab === "keys") {
      return keyMovements
    } else if (activeTab === "documents") {
      return documentMovements
    } else {
      // Combinar y ordenar por fecha
      return [
        ...keyMovements.map((m) => ({ ...m, type: "key" })),
        ...documentMovements.map((m) => ({ ...m, type: "document" })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
  })()

  // Función para obtener el nombre del usuario
  const getUserName = (userId: string | null) => {
    if (!userId) return "Concesionario"

    // Verificar si es un usuario especial
    const specialUsers = ["comerciales", "taller", "limpieza", "custodia"]
    if (specialUsers.includes(userId)) {
      return userId.toUpperCase()
    }

    return users[userId]?.full_name || "Usuario desconocido"
  }

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Función para obtener el nombre del tipo de llave
  const getKeyTypeName = (keyType: string) => {
    switch (keyType) {
      case "first_key":
        return "Primera llave"
      case "second_key":
        return "Segunda llave"
      case "card_key":
        return "Card Key"
      default:
        return keyType
    }
  }

  // Función para obtener el nombre del tipo de documento
  const getDocumentTypeName = (docType: string) => {
    switch (docType) {
      case "technical_sheet":
        return "Ficha técnica"
      case "circulation_permit":
        return "Permiso de circulación"
      default:
        return docType
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center py-12">
          <BMWMSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">Cargando historial de movimientos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button asChild variant="outline" size="icon" className="mr-4">
            <Link href="/dashboard/llaves">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Car className="mr-2 h-6 w-6" />
              {decodedLicensePlate}
            </h1>
            {vehicle && (
              <p className="text-muted-foreground">
                {vehicle.brand} {vehicle.model}
              </p>
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Movimientos</CardTitle>
          <CardDescription>Todos los movimientos registrados para la matrícula {decodedLicensePlate}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="keys">Llaves</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
            </TabsList>

            <div className="space-y-4">
              {filteredMovements.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No hay movimientos registrados para esta matrícula
                </div>
              ) : (
                filteredMovements.map((movement, index) => {
                  const isKeyMovement = movement.type === "key" || movement.key_type

                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          {isKeyMovement ? (
                            <Key className="h-5 w-5 mr-2 text-blue-500" />
                          ) : (
                            <FileText className="h-5 w-5 mr-2 text-green-500" />
                          )}
                          <span className="font-medium">
                            {isKeyMovement
                              ? getKeyTypeName(movement.key_type)
                              : getDocumentTypeName(movement.document_type)}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">{formatDate(movement.created_at)}</span>
                      </div>

                      <div className="flex items-center text-sm mb-2">
                        <span className="font-medium">{getUserName(movement.from_user_id)}</span>
                        <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
                        <span className="font-medium">{getUserName(movement.to_user_id)}</span>
                      </div>

                      {movement.reason && (
                        <div className="text-sm mb-2">
                          <span className="text-muted-foreground">Motivo:</span> {movement.reason}
                        </div>
                      )}

                      <div className="mt-2 flex items-center">
                        {movement.confirmed ? (
                          <div className="flex items-center text-green-600 text-xs">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            <span>Confirmado el {formatDate(movement.confirmed_at)}</span>
                          </div>
                        ) : movement.confirmation_deadline && new Date(movement.confirmation_deadline) < new Date() ? (
                          <div className="flex items-center text-amber-600 text-xs">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            <span>Plazo de confirmación vencido</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-blue-600 text-xs">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>Pendiente de confirmación</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
