"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, Car, User, Mail, Phone, Calendar, Ticket, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface VehicleData {
  license_plate: string
  model: string
  client_email: string
  client_phone: string
  sale_date: string
  advisor: string
}

interface TicketData {
  ticket_number: string
  created_at: string
  time_since_sale: string
  client_email: string
  client_phone: string
  status: string
  incidencias: any[]
}

export default function SoportePage() {
  const { toast } = useToast()
  const [step, setStep] = useState<"validation" | "ticket" | "history">("validation")
  const [licensePlate, setLicensePlate] = useState("")
  const [dni, setDni] = useState("")
  const [loading, setLoading] = useState(false)
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null)
  const [ticketData, setTicketData] = useState<TicketData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [clientEmail, setClientEmail] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [selectedIncidencias, setSelectedIncidencias] = useState<string[]>([])
  const [incidenciaTexts, setIncidenciaTexts] = useState<Record<string, string>>({})
  const [showDocumentacionModal, setShowDocumentacionModal] = useState(false)
  const [documentacionInfo, setDocumentacionInfo] = useState<string | null>(null)

  // Tipos de incidencia disponibles
  const incidenciaTypes = [
    { id: "Carroceria", label: "Carrocería", icon: Car },
    { id: "Mecanica", label: "Mecánica", icon: Car },
    { id: "Documentacion", label: "Documentación", icon: User },
    { id: "2ª Llave", label: "2ª Llave", icon: User },
    { id: "Limpieza", label: "Limpieza", icon: Car },
    { id: "Otros", label: "Otros", icon: AlertTriangle },
  ]

  const validateVehicle = async () => {
    if (!licensePlate.trim() || !dni.trim()) {
      setError("Por favor, complete todos los campos")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/soporte/validate-vehicle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license_plate: licensePlate.trim().toUpperCase(),
          client_dni: dni.trim().toUpperCase(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Error al validar los datos")
        return
      }

      setVehicleData(data.vehicle)
      setClientEmail(data.vehicle.client_email || "")
      setClientPhone(data.vehicle.client_phone || "")
      setStep("ticket")
    } catch (error) {
      setError("Error de conexión. Por favor, inténtelo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const handleIncidenciaToggle = (tipo: string) => {
    if (selectedIncidencias.includes(tipo)) {
      setSelectedIncidencias(selectedIncidencias.filter(t => t !== tipo))
      const newTexts = { ...incidenciaTexts }
      delete newTexts[tipo]
      setIncidenciaTexts(newTexts)
    } else {
      setSelectedIncidencias([...selectedIncidencias, tipo])
      
      // Si es Documentación o 2ª Llave, buscar información automáticamente
      if (tipo === "Documentacion" || tipo === "2ª Llave") {
        checkDocumentacionInfo(tipo)
      }
    }
  }

  const checkDocumentacionInfo = async (tipo: string) => {
    try {
      const response = await fetch("/api/soporte/check-documentacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license_plate: vehicleData?.license_plate,
          tipo: tipo,
        }),
      })

      const data = await response.json()

      if (response.ok && data.info) {
        setDocumentacionInfo(data.info)
        setShowDocumentacionModal(true)
      }
    } catch (error) {
      console.error("Error checking documentación info:", error)
    }
  }

  const createTicket = async () => {
    if (selectedIncidencias.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un tipo de incidencia",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/soporte/create-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license_plate: vehicleData?.license_plate,
          client_dni: dni,
          client_email: clientEmail,
          client_phone: clientPhone,
          incidencias: selectedIncidencias.map(tipo => ({
            tipo,
            descripcion: incidenciaTexts[tipo] || "",
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Error al crear el ticket",
          variant: "destructive",
        })
        return
      }

      setTicketData(data.ticket)
      toast({
        title: "Ticket creado",
        description: `Su ticket ${data.ticket.ticket_number} ha sido creado exitosamente`,
      })
      setStep("history")
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTicketHistory = async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/soporte/ticket-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license_plate: licensePlate.trim().toUpperCase(),
          client_dni: dni.trim().toUpperCase(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setTicketData(data.ticket)
        setStep("history")
      } else {
        setError(data.error || "No se encontraron tickets")
      }
    } catch (error) {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "abierto":
        return "bg-blue-100 text-blue-800"
      case "en_tramite":
        return "bg-yellow-100 text-yellow-800"
      case "cerrado":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "abierto":
        return "Abierto"
      case "en_tramite":
        return "En Trámite"
      case "cerrado":
        return "Cerrado"
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Car className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Portal Soporte Motor Munich
          </h1>
          <p className="text-lg text-gray-600">
            Dept. Vehículo de Ocasión
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          {step === "validation" && (
            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Acceso al Sistema</CardTitle>
                <CardDescription>
                  Introduzca su matrícula y DNI para acceder al sistema de soporte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="licensePlate">Matrícula</Label>
                    <Input
                      id="licensePlate"
                      value={licensePlate}
                      onChange={(e) => setLicensePlate(e.target.value)}
                      placeholder="Ej: 1234ABC"
                      className="text-center text-lg font-mono"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="dni">DNI</Label>
                    <Input
                      id="dni"
                      value={dni}
                      onChange={(e) => setDni(e.target.value)}
                      placeholder="Ej: 12345678A"
                      className="text-center text-lg"
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  onClick={validateVehicle}
                  disabled={loading || !licensePlate.trim() || !dni.trim()}
                  className="w-full h-12 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    "Registrar"
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={loadTicketHistory}
                    disabled={loading}
                    className="text-blue-600"
                  >
                    ¿Ya tiene un ticket? Ver historial
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === "ticket" && vehicleData && (
            <div className="space-y-6">
              {/* Vehicle Info Card */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Información del Vehículo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {vehicleData.license_plate}
                      </Badge>
                      <span className="text-sm text-gray-600">Matrícula</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{vehicleData.model}</span>
                      <span className="text-sm text-gray-600">Modelo</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <Label htmlFor="clientEmail">Email</Label>
                        <Input
                          id="clientEmail"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          placeholder="Su email"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div>
                        <Label htmlFor="clientPhone">Teléfono</Label>
                        <Input
                          id="clientPhone"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="Su teléfono"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Incidencias Selection */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Tipos de Incidencia
                  </CardTitle>
                  <CardDescription>
                    Seleccione los tipos de incidencia que desea reportar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {incidenciaTypes.map((tipo) => {
                      const Icon = tipo.icon
                      const isSelected = selectedIncidencias.includes(tipo.id)
                      
                      return (
                        <Button
                          key={tipo.id}
                          variant={isSelected ? "default" : "outline"}
                          className={`h-auto p-4 flex flex-col items-center gap-2 ${
                            isSelected ? "bg-blue-600 text-white" : ""
                          }`}
                          onClick={() => handleIncidenciaToggle(tipo.id)}
                        >
                          <Icon className="h-6 w-6" />
                          <span className="text-sm font-medium">{tipo.label}</span>
                        </Button>
                      )
                    })}
                  </div>

                  {/* Text inputs for selected incidencias */}
                  {selectedIncidencias.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <Separator />
                      <h4 className="font-medium">Descripción de las incidencias</h4>
                      
                      {selectedIncidencias.map((tipo) => {
                        // Skip text input for Documentacion and 2ª Llave
                        if (tipo === "Documentacion" || tipo === "2ª Llave") {
                          return null
                        }
                        
                        return (
                          <div key={tipo} className="space-y-2">
                            <Label htmlFor={`desc-${tipo}`}>
                              {incidenciaTypes.find(t => t.id === tipo)?.label}
                            </Label>
                            <textarea
                              id={`desc-${tipo}`}
                              value={incidenciaTexts[tipo] || ""}
                              onChange={(e) => setIncidenciaTexts({
                                ...incidenciaTexts,
                                [tipo]: e.target.value
                              })}
                              placeholder={`Describa su problema con ${incidenciaTypes.find(t => t.id === tipo)?.label.toLowerCase()}`}
                              className="w-full p-3 border border-gray-300 rounded-md resize-none"
                              rows={3}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button
                onClick={createTicket}
                disabled={loading || selectedIncidencias.length === 0}
                className="w-full h-12 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creando ticket...
                  </>
                ) : (
                  <>
                    <Ticket className="mr-2 h-5 w-5" />
                    Registrar Ticket
                  </>
                )}
              </Button>
            </div>
          )}

          {step === "history" && ticketData && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Ticket #{ticketData.ticket_number}
                </CardTitle>
                <CardDescription>
                  Detalles del ticket y respuestas del equipo de soporte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Ticket Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Fecha de creación</p>
                      <p className="font-medium">
                        {new Date(ticketData.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Tiempo desde la venta</p>
                      <p className="font-medium">{ticketData.time_since_sale}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{ticketData.client_email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
                      <p className="font-medium">{ticketData.client_phone}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Status */}
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(ticketData.status)}>
                    {getStatusText(ticketData.status)}
                  </Badge>
                  <span className="text-sm text-gray-600">Estado del ticket</span>
                </div>

                {/* Incidencias */}
                {ticketData.incidencias && ticketData.incidencias.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Incidencias reportadas</h4>
                    {ticketData.incidencias.map((incidencia: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{incidencia.tipo_incidencia}</h5>
                          <Badge variant="outline" className={getStatusColor(incidencia.estado)}>
                            {getStatusText(incidencia.estado)}
                          </Badge>
                        </div>
                        
                        {incidencia.descripcion && (
                          <p className="text-gray-600 mb-3">{incidencia.descripcion}</p>
                        )}
                        
                        {incidencia.respuesta_admin && (
                          <div className="bg-blue-50 p-3 rounded-md">
                            <p className="text-sm font-medium text-blue-800 mb-1">Respuesta del equipo:</p>
                            <p className="text-sm text-blue-700">{incidencia.respuesta_admin}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Documentación Modal */}
      {showDocumentacionModal && documentacionInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Información de Documentación</h3>
            <p className="text-gray-600 mb-4">{documentacionInfo}</p>
            <Button
              onClick={() => setShowDocumentacionModal(false)}
              className="w-full"
            >
              Entendido
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 