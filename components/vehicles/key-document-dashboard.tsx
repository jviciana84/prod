"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, Clock, FileText, Key, Search, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"

// Tipos
interface Vehicle {
  id: string
  license_plate: string
  model: string
  status: string
  vehicle_type: string
}

interface KeyMovement {
  id: string
  vehicle_id: string
  key_type: string
  reason: string
  created_at: string
  confirmation_deadline: string
  from_user: {
    id: string
    email: string
    user_metadata: {
      full_name: string
    }
  } | null
  vehicle: {
    license_plate: string
    model: string
  }
}

interface DocumentMovement {
  id: string
  vehicle_id: string
  document_type: string
  reason: string
  created_at: string
  confirmation_deadline: string
  from_user: {
    id: string
    email: string
    user_metadata: {
      full_name: string
    }
  } | null
  vehicle: {
    license_plate: string
    model: string
  }
}

interface KeyStats {
  total_keys: number
  first_keys_in_dealership: number
  second_keys_in_dealership: number
  card_keys_in_dealership: number
  first_keys_assigned: number
  second_keys_assigned: number
  card_keys_assigned: number
  pending_confirmations: number
}

interface DocumentStats {
  total_documents: number
  documents_in_dealership: number
  documents_assigned: number
  pending_confirmations: number
}

interface AssignedKey {
  id: string
  vehicle_id: string
  license_plate: string
  first_key_status: string
  second_key_status: string
  card_key_status: string
  vehicle: {
    model: string
  }
}

interface AssignedDocument {
  id: string
  vehicle_id: string
  license_plate: string
  technical_sheet_status: string
  vehicle: {
    model: string
  }
}

interface KeyDocumentDashboardProps {
  vehicles: Vehicle[]
  pendingKeyMovements: KeyMovement[]
  pendingDocMovements: DocumentMovement[]
  keyStats: KeyStats | null
  docStats: DocumentStats | null
  assignedKeys: AssignedKey[]
  assignedDocs: AssignedDocument[]
  currentUser: any
}

export default function KeyDocumentDashboard({
  vehicles,
  pendingKeyMovements,
  pendingDocMovements,
  keyStats,
  docStats,
  assignedKeys,
  assignedDocs,
  currentUser,
}: KeyDocumentDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>(vehicles)
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Función para filtrar vehículos
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase()
    setSearchTerm(term)

    if (term.trim() === "") {
      setFilteredVehicles(vehicles)
    } else {
      const filtered = vehicles.filter(
        (vehicle) => vehicle.license_plate.toLowerCase().includes(term) || vehicle.model.toLowerCase().includes(term),
      )
      setFilteredVehicles(filtered)
    }
  }

  // Función para confirmar recepción de llave
  const confirmKeyReceived = async (movementId: string) => {
    try {
      const { error } = await supabase
        .from("key_movements")
        .update({
          confirmed: true,
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", movementId)

      if (error) throw error

      toast({
        title: "Recepción confirmada",
        description: "Has confirmado la recepción de la llave correctamente.",
      })

      // Recargar la página para actualizar los datos
      router.refresh()
    } catch (error) {
      console.error("Error al confirmar recepción:", error)
      toast({
        title: "Error",
        description: "No se pudo confirmar la recepción. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  // Función para confirmar recepción de documento
  const confirmDocReceived = async (movementId: string) => {
    try {
      const { error } = await supabase
        .from("document_movements")
        .update({
          confirmed: true,
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", movementId)

      if (error) throw error

      toast({
        title: "Recepción confirmada",
        description: "Has confirmado la recepción del documento correctamente.",
      })

      // Recargar la página para actualizar los datos
      router.refresh()
    } catch (error) {
      console.error("Error al confirmar recepción:", error)
      toast({
        title: "Error",
        description: "No se pudo confirmar la recepción. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  // Función para formatear fecha
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

  // Función para verificar si un plazo ha expirado
  const isDeadlineExpired = (deadlineString: string) => {
    if (!deadlineString) return false
    const deadline = new Date(deadlineString)
    const now = new Date()
    return now > deadline
  }

  // Función para traducir tipo de llave
  const translateKeyType = (keyType: string) => {
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

  // Función para traducir tipo de documento
  const translateDocType = (docType: string) => {
    switch (docType) {
      case "technical_sheet":
        return "Ficha técnica"
      default:
        return docType
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Llaves y Documentación</h1>
        <p className="text-muted-foreground">
          Administra las llaves y documentación de los vehículos en el concesionario.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="notifications">
            Notificaciones
            {(pendingKeyMovements.length > 0 || pendingDocMovements.length > 0) && (
              <Badge variant="destructive" className="ml-2">
                {pendingKeyMovements.length + pendingDocMovements.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="my-items">Mis asignaciones</TabsTrigger>
          <TabsTrigger value="vehicles">Vehículos</TabsTrigger>
        </TabsList>

        {/* Pestaña de Resumen */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Llaves</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{keyStats?.total_keys || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {keyStats?.first_keys_in_dealership || 0} primeras llaves en concesionario
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{docStats?.total_documents || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {docStats?.documents_in_dealership || 0} documentos en concesionario
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Llaves Asignadas</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(keyStats?.first_keys_assigned || 0) +
                    (keyStats?.second_keys_assigned || 0) +
                    (keyStats?.card_keys_assigned || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {keyStats?.pending_confirmations || 0} pendientes de confirmar
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documentos Asignados</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{docStats?.documents_assigned || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {docStats?.pending_confirmations || 0} pendientes de confirmar
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Distribución de Llaves</CardTitle>
                <CardDescription>Estado actual de las llaves en el sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 rounded-full bg-blue-500" />
                      <span>Primera llave</span>
                    </div>
                    <div className="flex space-x-4">
                      <span className="text-sm text-muted-foreground">
                        En concesionario: {keyStats?.first_keys_in_dealership || 0}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Asignadas: {keyStats?.first_keys_assigned || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 rounded-full bg-green-500" />
                      <span>Segunda llave</span>
                    </div>
                    <div className="flex space-x-4">
                      <span className="text-sm text-muted-foreground">
                        En concesionario: {keyStats?.second_keys_in_dealership || 0}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Asignadas: {keyStats?.second_keys_assigned || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 rounded-full bg-purple-500" />
                      <span>Card Key</span>
                    </div>
                    <div className="flex space-x-4">
                      <span className="text-sm text-muted-foreground">
                        En concesionario: {keyStats?.card_keys_in_dealership || 0}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Asignadas: {keyStats?.card_keys_assigned || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Distribución de Documentos</CardTitle>
                <CardDescription>Estado actual de los documentos en el sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 rounded-full bg-amber-500" />
                      <span>Ficha técnica</span>
                    </div>
                    <div className="flex space-x-4">
                      <span className="text-sm text-muted-foreground">
                        En concesionario: {docStats?.documents_in_dealership || 0}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Asignados: {docStats?.documents_assigned || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pestaña de Notificaciones */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Llaves pendientes de confirmar</CardTitle>
              <CardDescription>Llaves que te han sido asignadas y están pendientes de confirmación</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingKeyMovements.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No tienes llaves pendientes de confirmar</p>
              ) : (
                <div className="space-y-4">
                  {pendingKeyMovements.map((movement) => (
                    <Alert
                      key={movement.id}
                      variant={isDeadlineExpired(movement.confirmation_deadline) ? "destructive" : "default"}
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span>
                          {translateKeyType(movement.key_type)} - {movement.vehicle.license_plate}
                        </span>
                        <Button size="sm" onClick={() => confirmKeyReceived(movement.id)}>
                          Confirmar recepción
                        </Button>
                      </AlertTitle>
                      <AlertDescription>
                        <div className="mt-2 text-sm">
                          <p>
                            <strong>Vehículo:</strong> {movement.vehicle.model}
                          </p>
                          <p>
                            <strong>Entregado por:</strong> {movement.from_user?.user_metadata?.full_name || "Sistema"}
                          </p>
                          <p>
                            <strong>Motivo:</strong> {movement.reason}
                          </p>
                          <p>
                            <strong>Fecha:</strong> {formatDate(movement.created_at)}
                          </p>
                          {movement.confirmation_deadline && (
                            <p className="flex items-center mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              <span className={isDeadlineExpired(movement.confirmation_deadline) ? "text-red-500" : ""}>
                                Plazo de confirmación: {formatDate(movement.confirmation_deadline)}
                                {isDeadlineExpired(movement.confirmation_deadline) && " (Expirado)"}
                              </span>
                            </p>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentos pendientes de confirmar</CardTitle>
              <CardDescription>Documentos que te han sido asignados y están pendientes de confirmación</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingDocMovements.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No tienes documentos pendientes de confirmar</p>
              ) : (
                <div className="space-y-4">
                  {pendingDocMovements.map((movement) => (
                    <Alert
                      key={movement.id}
                      variant={isDeadlineExpired(movement.confirmation_deadline) ? "destructive" : "default"}
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span>
                          {translateDocType(movement.document_type)} - {movement.vehicle.license_plate}
                        </span>
                        <Button size="sm" onClick={() => confirmDocReceived(movement.id)}>
                          Confirmar recepción
                        </Button>
                      </AlertTitle>
                      <AlertDescription>
                        <div className="mt-2 text-sm">
                          <p>
                            <strong>Vehículo:</strong> {movement.vehicle.model}
                          </p>
                          <p>
                            <strong>Entregado por:</strong> {movement.from_user?.user_metadata?.full_name || "Sistema"}
                          </p>
                          <p>
                            <strong>Motivo:</strong> {movement.reason}
                          </p>
                          <p>
                            <strong>Fecha:</strong> {formatDate(movement.created_at)}
                          </p>
                          {movement.confirmation_deadline && (
                            <p className="flex items-center mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              <span className={isDeadlineExpired(movement.confirmation_deadline) ? "text-red-500" : ""}>
                                Plazo de confirmación: {formatDate(movement.confirmation_deadline)}
                                {isDeadlineExpired(movement.confirmation_deadline) && " (Expirado)"}
                              </span>
                            </p>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de Mis Asignaciones */}
        <TabsContent value="my-items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Llaves asignadas a mí</CardTitle>
              <CardDescription>Llaves que actualmente están bajo tu responsabilidad</CardDescription>
            </CardHeader>
            <CardContent>
              {assignedKeys.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No tienes llaves asignadas actualmente</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Tipo de llave</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedKeys.map((key) => {
                      // Determinar qué llaves tiene asignadas este usuario
                      const hasFirstKey = key.first_key_status.includes(currentUser.id)
                      const hasSecondKey = key.second_key_status.includes(currentUser.id)
                      const hasCardKey = key.card_key_status.includes(currentUser.id)

                      return (
                        <TableRow key={key.id}>
                          <TableCell>{key.license_plate}</TableCell>
                          <TableCell>{key.vehicle.model}</TableCell>
                          <TableCell>
                            {hasFirstKey && <Badge className="mr-1">Primera llave</Badge>}
                            {hasSecondKey && <Badge className="mr-1">Segunda llave</Badge>}
                            {hasCardKey && <Badge>Card Key</Badge>}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">Asignada a ti</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/dashboard/vehicles/${key.vehicle_id}`}>Gestionar</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentos asignados a mí</CardTitle>
              <CardDescription>Documentos que actualmente están bajo tu responsabilidad</CardDescription>
            </CardHeader>
            <CardContent>
              {assignedDocs.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No tienes documentos asignados actualmente</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedDocs.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>{doc.license_plate}</TableCell>
                        <TableCell>{doc.vehicle.model}</TableCell>
                        <TableCell>
                          <Badge>Ficha técnica</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Asignada a ti</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/vehicles/${doc.vehicle_id}`}>Gestionar</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de Vehículos */}
        <TabsContent value="vehicles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vehículos</CardTitle>
              <CardDescription>Listado de vehículos con gestión de llaves y documentación</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por matrícula o modelo..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="flex-1"
                />
              </div>

              {filteredVehicles.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No se encontraron vehículos que coincidan con la búsqueda
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVehicles.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell>{vehicle.license_plate}</TableCell>
                        <TableCell>{vehicle.model}</TableCell>
                        <TableCell>{vehicle.vehicle_type}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              vehicle.status === "Vendido"
                                ? "destructive"
                                : vehicle.status === "En stock"
                                  ? "success"
                                  : "default"
                            }
                          >
                            {vehicle.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/vehicles/${vehicle.id}`}>Gestionar</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {filteredVehicles.length} de {vehicles.length} vehículos
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
