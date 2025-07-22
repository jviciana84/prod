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
import { motion } from "framer-motion"
import BuildingLines from "@/components/ui/building-lines"

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
      
      // Check documentacion info for Documentacion type
      if (tipo === "Documentacion") {
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
          tipo_incidencia: tipo,
        }),
      })

      const data = await response.json()

      if (response.ok && data.info) {
        setDocumentacionInfo(data.info)
        setShowDocumentacionModal(true)
      }
    } catch (error) {
      console.error("Error checking documentacion:", error)
    }
  }

  const createTicket = async () => {
    if (selectedIncidencias.length === 0) {
      setError("Por favor, seleccione al menos un tipo de incidencia")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const incidencias = selectedIncidencias.map(tipo => ({
        tipo_incidencia: tipo,
        descripcion: incidenciaTexts[tipo] || "",
      }))

      const response = await fetch("/api/soporte/create-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license_plate: vehicleData?.license_plate,
          client_dni: dni,
          client_email: clientEmail,
          client_phone: clientPhone,
          incidencias,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setTicketData(data.ticket)
        setStep("history")
        toast({
          title: "Ticket creado",
          description: `Ticket #${data.ticket.ticket_number} creado exitosamente`,
        })
      } else {
        setError(data.error || "Error al crear el ticket")
      }
    } catch (error) {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const loadTicketHistory = async () => {
    if (!licensePlate.trim() || !dni.trim()) {
      setError("Por favor, complete todos los campos")
      return
    }

    setLoading(true)
    setError(null)

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
        return "bg-gray-700 text-gray-200"
      case "en_tramite":
        return "bg-gray-600 text-gray-200"
      case "cerrado":
        return "bg-gray-500 text-gray-200"
      default:
        return "bg-gray-800 text-gray-200"
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

  const title = "Portal Soporte"
  const words = title.split(" ")

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black dark:bg-neutral-950">
      {/* Background Paths */}
      <BuildingLines />
      
      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="max-w-4xl mx-auto"
        >
          {/* Animated Title */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold mb-8 tracking-tighter">
            {words.map((word, wordIndex) => (
              <span key={wordIndex} className="inline-block mr-4 last:mr-0">
                {word.split("").map((letter, letterIndex) => (
                  <motion.span
                    key={`${wordIndex}-${letterIndex}`}
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      delay: wordIndex * 0.1 + letterIndex * 0.03,
                      type: "spring",
                      stiffness: 150,
                      damping: 25,
                    }}
                    className="inline-block text-transparent bg-clip-text 
                                        bg-gradient-to-r from-white to-gray-300/80 
                                        dark:from-white dark:to-gray-300/80"
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            ))}
          </h1>

          <motion.p 
            className="text-xl text-gray-300 dark:text-gray-400 mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
          >
            Motor Munich - Dept. Vehículo de Ocasión
          </motion.p>

          {/* Main Content */}
          <div className="w-full max-w-md mx-auto">
            {step === "validation" && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.5 }}
              >
                <div
                  className="inline-block group relative bg-gradient-to-b from-white/10 to-black/10 
                              dark:from-white/10 dark:to-black/10 p-px rounded-2xl backdrop-blur-lg 
                              overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <Card className="rounded-[1.15rem] backdrop-blur-md bg-black/95 hover:bg-black/100 
                                   dark:bg-black/95 dark:hover:bg-black/100 border border-white/10 
                                   dark:border-white/10 hover:shadow-md dark:hover:shadow-white/10">
                    <CardHeader className="text-center pb-4">
                      <CardTitle className="text-xl font-semibold text-white">Acceso al Sistema</CardTitle>
                      <CardDescription className="text-sm text-gray-300">
                        Introduzca su matrícula y DNI para acceder al sistema de soporte
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        </motion.div>
                      )}

                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="licensePlate" className="text-sm text-gray-300">Matrícula</Label>
                          <Input
                            id="licensePlate"
                            value={licensePlate}
                            onChange={(e) => setLicensePlate(e.target.value)}
                            placeholder="Ej: 1234ABC"
                            className="text-center h-10 border border-gray-600 focus:border-white bg-gray-900 text-white placeholder-gray-400"
                            disabled={loading}
                          />
                        </div>

                        <div>
                          <Label htmlFor="dni" className="text-sm text-gray-300">DNI</Label>
                          <Input
                            id="dni"
                            value={dni}
                            onChange={(e) => setDni(e.target.value)}
                            placeholder="Ej: 12345678A"
                            className="text-center h-10 border border-gray-600 focus:border-white bg-gray-900 text-white placeholder-gray-400"
                            disabled={loading}
                          />
                        </div>
                      </div>

                      <Button
                        onClick={validateVehicle}
                        disabled={loading || !licensePlate.trim() || !dni.trim()}
                        className="w-full h-10 bg-white hover:bg-gray-200 text-black font-medium"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Validando...
                          </>
                        ) : (
                          "Registrar"
                        )}
                      </Button>

                      <div className="text-center pt-2">
                        <Button
                          variant="link"
                          onClick={loadTicketHistory}
                          disabled={loading}
                          className="text-gray-300 hover:text-white text-sm"
                        >
                          ¿Ya tiene un ticket? Ver historial
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {step === "ticket" && vehicleData && (
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                {/* Vehicle Info Card */}
                <div
                  className="inline-block group relative bg-gradient-to-b from-white/10 to-black/10 
                              dark:from-white/10 dark:to-black/10 p-px rounded-2xl backdrop-blur-lg 
                              overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <Card className="rounded-[1.15rem] backdrop-blur-md bg-black/95 hover:bg-black/100 
                                   dark:bg-black/95 dark:hover:bg-black/100 border border-white/10 
                                   dark:border-white/10 hover:shadow-md dark:hover:shadow-white/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-white">Información del Vehículo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Matrícula:</span>
                        <Badge variant="outline" className="font-mono bg-gray-800 text-white border-gray-600">
                          {vehicleData.license_plate}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Modelo:</span>
                        <span className="font-medium text-white">{vehicleData.model}</span>
                      </div>
                      
                      <Separator className="bg-gray-700" />
                      
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="clientEmail" className="text-sm text-gray-300">Email</Label>
                          <Input
                            id="clientEmail"
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            placeholder="Su email"
                            className="h-9 border border-gray-600 focus:border-white bg-gray-900 text-white placeholder-gray-400"
                          />
                        </div>
                        <div>
                          <Label htmlFor="clientPhone" className="text-sm text-gray-300">Teléfono</Label>
                          <Input
                            id="clientPhone"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            placeholder="Su teléfono"
                            className="h-9 border border-gray-600 focus:border-white bg-gray-900 text-white placeholder-gray-400"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Incidencias Selection */}
                <div
                  className="inline-block group relative bg-gradient-to-b from-white/10 to-black/10 
                              dark:from-white/10 dark:to-black/10 p-px rounded-2xl backdrop-blur-lg 
                              overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <Card className="rounded-[1.15rem] backdrop-blur-md bg-black/95 hover:bg-black/100 
                                   dark:bg-black/95 dark:hover:bg-black/100 border border-white/10 
                                   dark:border-white/10 hover:shadow-md dark:hover:shadow-white/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-white">Tipos de Incidencia</CardTitle>
                      <CardDescription className="text-sm text-gray-300">
                        Seleccione los tipos de incidencia que desea reportar
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        {incidenciaTypes.map((tipo) => {
                          const Icon = tipo.icon
                          const isSelected = selectedIncidencias.includes(tipo.id)
                          
                          return (
                            <Button
                              key={tipo.id}
                              variant={isSelected ? "default" : "outline"}
                              className={`h-auto p-3 flex flex-col items-center gap-1 text-xs ${
                                isSelected 
                                  ? "bg-white text-black" 
                                  : "hover:bg-gray-800 border-gray-600 text-gray-300"
                              }`}
                              onClick={() => handleIncidenciaToggle(tipo.id)}
                            >
                              <Icon className="h-4 w-4" />
                              <span className="font-medium">{tipo.label}</span>
                            </Button>
                          )
                        })}
                      </div>

                      {/* Text inputs for selected incidencias */}
                      {selectedIncidencias.length > 0 && (
                        <div className="mt-4 space-y-3">
                          <Separator className="bg-gray-700" />
                          <h4 className="font-medium text-sm text-white">Descripción de las incidencias</h4>
                          
                          {selectedIncidencias.map((tipo) => {
                            // Skip text input for Documentacion and 2ª Llave
                            if (tipo === "Documentacion" || tipo === "2ª Llave") {
                              return null
                            }
                            
                            return (
                              <div key={tipo} className="space-y-1">
                                <Label htmlFor={`desc-${tipo}`} className="text-sm text-gray-300">
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
                                  className="w-full p-2 border border-gray-600 resize-none focus:border-white bg-gray-900 text-white placeholder-gray-400 text-sm"
                                  rows={2}
                                />
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={createTicket}
                  disabled={loading || selectedIncidencias.length === 0}
                  className="w-full h-10 bg-white hover:bg-gray-200 text-black font-medium"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando ticket...
                    </>
                  ) : (
                    <>
                      <Ticket className="mr-2 h-4 w-4" />
                      Registrar Ticket
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {step === "history" && ticketData && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div
                  className="inline-block group relative bg-gradient-to-b from-white/10 to-black/10 
                              dark:from-white/10 dark:to-black/10 p-px rounded-2xl backdrop-blur-lg 
                              overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <Card className="rounded-[1.15rem] backdrop-blur-md bg-black/95 hover:bg-black/100 
                                   dark:bg-black/95 dark:hover:bg-black/100 border border-white/10 
                                   dark:border-white/10 hover:shadow-md dark:hover:shadow-white/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-white">
                        Ticket #{ticketData.ticket_number}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-300">
                        Detalles del ticket y respuestas del equipo de soporte
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Ticket Info */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Fecha de creación:</span>
                          <span className="font-medium text-white">
                            {new Date(ticketData.created_at).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-300">Tiempo desde la venta:</span>
                          <span className="font-medium text-white">{ticketData.time_since_sale}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-300">Email:</span>
                          <span className="font-medium text-white">{ticketData.client_email}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-300">Teléfono:</span>
                          <span className="font-medium text-white">{ticketData.client_phone}</span>
                        </div>
                      </div>

                      <Separator className="bg-gray-700" />

                      {/* Status */}
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(ticketData.status)} text-xs`}>
                          {getStatusText(ticketData.status)}
                        </Badge>
                        <span className="text-sm text-gray-300">Estado del ticket</span>
                      </div>

                      {/* Incidencias */}
                      {ticketData.incidencias && ticketData.incidencias.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm text-white">Incidencias reportadas</h4>
                          {ticketData.incidencias.map((incidencia: any, index: number) => (
                            <div 
                              key={index} 
                              className="border border-gray-700 p-3 bg-gray-800"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-sm text-white">{incidencia.tipo_incidencia}</h5>
                                <Badge variant="outline" className={`${getStatusColor(incidencia.estado)} text-xs border-gray-600`}>
                                  {getStatusText(incidencia.estado)}
                                </Badge>
                              </div>
                              
                              {incidencia.descripcion && (
                                <p className="text-gray-300 text-sm mb-2">{incidencia.descripcion}</p>
                              )}
                              
                              {incidencia.respuesta_admin && (
                                <div className="bg-gray-700 p-2 rounded">
                                  <p className="text-xs font-medium text-gray-200 mb-1">Respuesta del equipo:</p>
                                  <p className="text-xs text-gray-300">{incidencia.respuesta_admin}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Documentación Modal */}
      {showDocumentacionModal && documentacionInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-black rounded-lg p-4 max-w-sm w-full shadow-lg border border-white/10">
            <h3 className="text-lg font-medium mb-3 text-white">Información de Documentación</h3>
            <p className="text-gray-300 text-sm mb-4">{documentacionInfo}</p>
            <Button
              onClick={() => setShowDocumentacionModal(false)}
              className="w-full bg-white hover:bg-gray-200 text-black"
            >
              Entendido
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 