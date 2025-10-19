"use client"

import { useState } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Car, Key, FileText, Clock, AlertTriangle, ChevronLeft, Info } from "lucide-react"
import KeyManagement from "./key-management"
import DocumentManagement from "./document-management"
import MovementHistory from "./movement-history"
import Link from "next/link"

interface VehicleManagementProps {
  vehicle: any
  keys: any
  documents: any
  keyMovements: any[]
  documentMovements: any[]
  users: any[]
  currentUser: any
}

export default function VehicleManagement({
  vehicle,
  keys,
  documents,
  keyMovements,
  documentMovements,
  users,
  currentUser,
}: VehicleManagementProps) {
  const [activeTab, setActiveTab] = useState("info")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { toast } = useToast()

  // Formatear fecha
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    try {
      return format(parseISO(dateString), "dd MMMM yyyy", { locale: es })
    } catch (error) {
      return "-"
    }
  }

  // Inicializar registros de llaves y documentos si no existen
  const initializeRecords = async () => {
    setIsLoading(true)
    try {
      // Inicializar registro de llaves si no existe
      if (!keys) {
        const keysResponse = await fetch("/api/keys/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicleId: vehicle.id,
            licensePlate: vehicle.license_plate,
          }),
        })

        const keysResult = await keysResponse.json()
        if (!keysResponse.ok || keysResult.error) {
          throw new Error(keysResult.error || "Error al inicializar llaves")
        }
      }

      // Inicializar registro de documentos si no existe
      if (!documents) {
        const docsResponse = await fetch("/api/documents/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicleId: vehicle.id,
            licensePlate: vehicle.license_plate,
          }),
        })

        const docsResult = await docsResponse.json()
        if (!docsResponse.ok || docsResult.error) {
          throw new Error(docsResult.error || "Error al inicializar documentos")
        }
      }

      toast({
        title: "Registros inicializados",
        description: "Se han creado los registros de llaves y documentación para este vehículo",
      })

      // Recargar la página para mostrar los nuevos registros
      router.refresh()
    } catch (error: any) {
      console.error("Error al inicializar registros:", error)
      toast({
        title: "Error",
        description: "No se pudieron inicializar los registros",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado con información del vehículo */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/ventas">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{vehicle.model}</h1>
            <p className="text-muted-foreground">Matrícula: {vehicle.license_plate}</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          {vehicle.status || "En stock"}
        </Badge>
      </div>

      {/* Pestañas de gestión */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="info" className="flex items-center gap-1">
            <Info className="h-4 w-4" />
            <span>Información</span>
          </TabsTrigger>
          <TabsTrigger value="keys" className="flex items-center gap-1">
            <Key className="h-4 w-4" />
            <span>Llaves</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>Documentación</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Historial</span>
          </TabsTrigger>
        </TabsList>

        {/* Contenido de la pestaña de información */}
        <TabsContent value="info" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Información del vehículo
              </CardTitle>
              <CardDescription>Datos generales del vehículo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Modelo</h3>
                    <p className="text-lg">{vehicle.model}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Matrícula</h3>
                    <p className="text-lg">{vehicle.license_plate}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Tipo</h3>
                    <p className="text-lg">{vehicle.vehicle_type || "-"}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Cargo de gastos</h3>
                    <p className="text-lg">{vehicle.expense_type?.name || "-"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Fecha de compra</h3>
                    <p className="text-lg">{formatDate(vehicle.purchase_date)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Fecha de venta</h3>
                    <p className="text-lg">{formatDate(vehicle.sale_date) || "-"}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Precio de compra</h3>
                    <p className="text-lg">{vehicle.purchase_price ? `${vehicle.purchase_price} €` : "-"}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Precio de venta</h3>
                    <p className="text-lg">{vehicle.sale_price ? `${vehicle.sale_price} €` : "-"}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Notas</h3>
                <p>{vehicle.notes || "Sin notas adicionales"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Inicializar registros si no existen */}
          {(!keys || !documents) && (
            <Card className="border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                  Inicialización requerida
                </CardTitle>
                <CardDescription className="text-amber-600 dark:text-amber-300">
                  Este vehículo aún no tiene registros de llaves y/o documentación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={initializeRecords} disabled={isLoading}>
                  {isLoading ? "Inicializando..." : "Inicializar registros"}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Contenido de la pestaña de llaves */}
        <TabsContent value="keys" className="space-y-4 mt-4">
          {keys ? (
            <KeyManagement vehicleId={vehicle.id} keys={keys} users={users} currentUser={currentUser} />
          ) : (
            <Card className="border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                  Inicialización requerida
                </CardTitle>
                <CardDescription className="text-amber-600 dark:text-amber-300">
                  Este vehículo aún no tiene registros de llaves
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={initializeRecords} disabled={isLoading}>
                  {isLoading ? "Inicializando..." : "Inicializar registros"}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Contenido de la pestaña de documentación */}
        <TabsContent value="documents" className="space-y-4 mt-4">
          {documents ? (
            <DocumentManagement vehicleId={vehicle.id} documents={documents} users={users} currentUser={currentUser} />
          ) : (
            <Card className="border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                  Inicialización requerida
                </CardTitle>
                <CardDescription className="text-amber-600 dark:text-amber-300">
                  Este vehículo aún no tiene registros de documentación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={initializeRecords} disabled={isLoading}>
                  {isLoading ? "Inicializando..." : "Inicializar registros"}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Contenido de la pestaña de historial */}
        <TabsContent value="history" className="space-y-4 mt-4">
          <MovementHistory
            keyMovements={keyMovements}
            documentMovements={documentMovements}
            currentUser={currentUser}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
