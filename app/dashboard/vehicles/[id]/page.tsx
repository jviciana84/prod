"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { ArrowLeft, Car, FileText, Key, AlertTriangle, CheckCircle2, Clock } from "lucide-react"
import { VehicleKeyManagement } from "@/components/vehicles/key-management"
import { VehicleDocumentManagement } from "@/components/vehicles/document-management"
import { MovementHistory } from "@/components/vehicles/movement-history"

export default function VehicleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const vehicleId = params.id as string
  const supabase = createClientComponentClient()

  const [vehicle, setVehicle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("info")

  useEffect(() => {
    const fetchVehicleData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Intentamos obtener los datos del vehículo de la tabla sales_vehicles
        const { data: salesVehicle, error: salesError } = await supabase
          .from("sales_vehicles")
          .select("*")
          .eq("id", vehicleId)
          .single()

        if (salesError) {
          // Si no se encuentra en sales_vehicles, buscamos en stock
          const { data: stockVehicle, error: stockError } = await supabase
            .from("stock")
            .select("*")
            .eq("id", vehicleId)
            .single()

          if (stockError) {
            throw new Error("No se encontró el vehículo en la base de datos")
          }

          setVehicle({
            ...stockVehicle,
            source: "stock",
            sale_status: "En stock",
          })
        } else {
          // Obtenemos información adicional del stock si está disponible
          const { data: stockData } = await supabase
            .from("stock")
            .select("*")
            .eq("id", salesVehicle.stock_id)
            .maybeSingle()

          setVehicle({
            ...salesVehicle,
            stock_data: stockData || null,
            source: "sales",
            sale_status: "Vendido",
          })
        }
      } catch (err: any) {
        console.error("Error al cargar datos del vehículo:", err)
        setError(err.message || "Error al cargar datos del vehículo")
      } finally {
        setLoading(false)
      }
    }

    if (vehicleId) {
      fetchVehicleData()
    }
  }, [vehicleId, supabase])

  const handleGoBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <BMWMSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">Cargando información del vehículo...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Button variant="ghost" onClick={handleGoBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="container mx-auto py-6">
        <Button variant="ghost" onClick={handleGoBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Vehículo no encontrado</AlertTitle>
          <AlertDescription>No se encontró información para este vehículo.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "vendido":
        return "text-green-600 bg-green-100"
      case "en stock":
        return "text-blue-600 bg-blue-100"
      case "pendiente":
        return "text-amber-600 bg-amber-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={handleGoBack} className="mr-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <div className="flex items-center">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.sale_status)}`}>
            {vehicle.sale_status}
          </span>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">
                  {vehicle.license_plate || "Sin matrícula"} - {vehicle.model || "Modelo desconocido"}
                </CardTitle>
                <CardDescription>
                  {vehicle.vehicle_type || "Tipo no especificado"} •{" "}
                  {vehicle.source === "sales"
                    ? `Vendido el ${new Date(vehicle.sale_date).toLocaleDateString()}`
                    : "En stock"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="info" className="flex items-center">
                  <Car className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Información</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
                <TabsTrigger value="keys" className="flex items-center">
                  <Key className="mr-2 h-4 w-4" />
                  <span>Llaves</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Documentación</span>
                  <span className="sm:hidden">Docs</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Historial</span>
                  <span className="sm:hidden">Hist.</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Datos del vehículo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid grid-cols-1 gap-2 text-sm">
                        <div className="grid grid-cols-3 py-1">
                          <dt className="font-medium text-muted-foreground">Matrícula:</dt>
                          <dd className="col-span-2">{vehicle.license_plate || "No especificada"}</dd>
                        </div>
                        <div className="grid grid-cols-3 py-1">
                          <dt className="font-medium text-muted-foreground">Modelo:</dt>
                          <dd className="col-span-2">{vehicle.model || "No especificado"}</dd>
                        </div>
                        <div className="grid grid-cols-3 py-1">
                          <dt className="font-medium text-muted-foreground">Tipo:</dt>
                          <dd className="col-span-2">{vehicle.vehicle_type || "No especificado"}</dd>
                        </div>
                        {vehicle.expense_charge && (
                          <div className="grid grid-cols-3 py-1">
                            <dt className="font-medium text-muted-foreground">Cargo gastos:</dt>
                            <dd className="col-span-2">{vehicle.expense_charge}</dd>
                          </div>
                        )}
                      </dl>
                    </CardContent>
                  </Card>

                  {vehicle.source === "sales" && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Datos de venta</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="grid grid-cols-1 gap-2 text-sm">
                          <div className="grid grid-cols-3 py-1">
                            <dt className="font-medium text-muted-foreground">Fecha de venta:</dt>
                            <dd className="col-span-2">{new Date(vehicle.sale_date).toLocaleDateString()}</dd>
                          </div>
                          <div className="grid grid-cols-3 py-1">
                            <dt className="font-medium text-muted-foreground">Asesor:</dt>
                            <dd className="col-span-2">{vehicle.advisor || "No especificado"}</dd>
                          </div>
                          <div className="grid grid-cols-3 py-1">
                            <dt className="font-medium text-muted-foreground">Forma de pago:</dt>
                            <dd className="col-span-2">{vehicle.payment_method || "No especificada"}</dd>
                          </div>
                          <div className="grid grid-cols-3 py-1">
                            <dt className="font-medium text-muted-foreground">Precio:</dt>
                            <dd className="col-span-2">
                              {vehicle.price
                                ? new Intl.NumberFormat("es-ES", {
                                    style: "currency",
                                    currency: "EUR",
                                  }).format(vehicle.price)
                                : "No especificado"}
                            </dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Estado actual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {vehicle.source === "sales" && (
                        <>
                          <div className="flex flex-col items-center p-4 border rounded-lg">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                                vehicle.payment_status === "completado"
                                  ? "bg-green-100 text-green-600"
                                  : "bg-amber-100 text-amber-600"
                              }`}
                            >
                              {vehicle.payment_status === "completado" ? (
                                <CheckCircle2 className="h-5 w-5" />
                              ) : (
                                <Clock className="h-5 w-5" />
                              )}
                            </div>
                            <h3 className="font-medium text-sm">Estado de pago</h3>
                            <p className="text-xs text-muted-foreground mt-1 capitalize">
                              {vehicle.payment_status || "Pendiente"}
                            </p>
                          </div>

                          <div className="flex flex-col items-center p-4 border rounded-lg">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                                vehicle.cyp_status === "completado"
                                  ? "bg-green-100 text-green-600"
                                  : "bg-amber-100 text-amber-600"
                              }`}
                            >
                              {vehicle.cyp_status === "completado" ? (
                                <CheckCircle2 className="h-5 w-5" />
                              ) : (
                                <Clock className="h-5 w-5" />
                              )}
                            </div>
                            <h3 className="font-medium text-sm">CyP</h3>
                            <p className="text-xs text-muted-foreground mt-1 capitalize">
                              {vehicle.cyp_status || "Pendiente"}
                            </p>
                          </div>

                          <div className="flex flex-col items-center p-4 border rounded-lg">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                                vehicle.photo_360_status === "completado"
                                  ? "bg-green-100 text-green-600"
                                  : "bg-amber-100 text-amber-600"
                              }`}
                            >
                              {vehicle.photo_360_status === "completado" ? (
                                <CheckCircle2 className="h-5 w-5" />
                              ) : (
                                <Clock className="h-5 w-5" />
                              )}
                            </div>
                            <h3 className="font-medium text-sm">Foto 360</h3>
                            <p className="text-xs text-muted-foreground mt-1 capitalize">
                              {vehicle.photo_360_status || "Pendiente"}
                            </p>
                          </div>
                        </>
                      )}

                      {vehicle.source === "stock" && (
                        <div className="col-span-3">
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Vehículo en stock</AlertTitle>
                            <AlertDescription>
                              Este vehículo se encuentra actualmente en stock y no ha sido vendido.
                            </AlertDescription>
                          </Alert>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="keys">
                <VehicleKeyManagement vehicleId={vehicleId} vehicle={vehicle} />
              </TabsContent>

              <TabsContent value="documents">
                <VehicleDocumentManagement vehicleId={vehicleId} vehicle={vehicle} />
              </TabsContent>

              <TabsContent value="history">
                <MovementHistory vehicleId={vehicleId} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
