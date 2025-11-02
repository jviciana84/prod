"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { Car, User, Mail, Phone, Calendar, Ticket, AlertTriangle, CheckCircle, Clock, Shield, Key, FileText, Wrench, Sparkles, TrendingUp, DollarSign, Award, MapPin, AlertCircle } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
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
  const [step, setStep] = useState<"captcha" | "validation" | "ticket" | "history" | "dashboard">("captcha")
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
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [captchaChecked, setCaptchaChecked] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [expandedCards, setExpandedCards] = useState<string[]>(["vehicle-info"])

  const incidents = [
    {
      id: 1,
      tipo: "Llaves",
      estado: "Abierta",
      fecha: "2024-12-15",
      descripcion: "Llave de repuesto no funciona correctamente. Al intentar abrir el vehículo, la llave no responde y es necesario usar la llave principal.",
      prioridad: "Media",
    },
    {
      id: 2,
      tipo: "Documentación",
      estado: "Cerrada",
      fecha: "2024-12-10",
      descripcion: "Falta manual de usuario en el vehículo",
      prioridad: "Baja",
    },
    {
      id: 3,
      tipo: "Mecánica",
      estado: "En Proceso",
      fecha: "2024-12-12",
      descripcion: "Ruido extraño en el motor al arrancar en frío. Se escucha un sonido metálico durante los primeros segundos.",
      prioridad: "Alta",
    },
  ]

  // Datos del dashboard
  const dashboardVehicleData = {
    matricula: "2025JVS",
    marca: "BMW",
    modelo: "Serie 3 320d",
    año: 2022,
    color: "Azul Metalizado",
    combustible: "Diésel",
    kilometraje: 45678,
    vin: "WBABA91060AL12345",
    fechaMatriculacion: "15/03/2022",
    fechaVenta: "28/11/2024",
    fechaCertificacion: "25/11/2024",
    diasDesdeVenta: 45,
    precio: 28500,
    precioOriginal: 45000,
  }

  const dashboardOwnerData = {
    nombre: "Carlos Rodríguez Martín",
    dni: "45641484P",
    telefono: "+34 666 123 456",
    email: "carlos.rodriguez@email.com",
    direccion: "Calle Mayor 123, 28001 Madrid",
  }

  const dashboardSaleData = {
    asesorComercial: "Ana García López",
    concesionario: "AutoMadrid Premium",
    telefonoAsesor: "+34 911 234 567",
    emailAsesor: "ana.garcia@automadrid.com",
    garantia: "24 meses",
    financiacion: "Financiado 60 meses",
    seguro: "Mapfre Comprehensive",
  }

  const dashboardIncidents = [
    {
      id: 1,
      tipo: "Llaves",
      estado: "Abierta",
      fecha: "2024-12-15",
      descripcion: "Llave de repuesto no funciona correctamente",
      prioridad: "Media",
    },
    {
      id: 2,
      tipo: "Documentación",
      estado: "Cerrada",
      fecha: "2024-12-10",
      descripcion: "Falta manual de usuario",
      prioridad: "Baja",
    },
    {
      id: 3,
      tipo: "Mecánica",
      estado: "En Proceso",
      fecha: "2024-12-12",
      descripcion: "Ruido extraño en el motor al arrancar",
      prioridad: "Alta",
    },
  ]

  // Funciones del dashboard
  const toggleCard = (cardId: string) => {
    setExpandedCards((prev) => (prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]))
  }

  const getIncidentIcon = (tipo: string) => {
    switch (tipo) {
      case "Llaves":
        return <Key className="h-4 w-4" />
      case "Documentación":
        return <FileText className="h-4 w-4" />
      case "Mecánica":
        return <Wrench className="h-4 w-4" />
      case "Carrocería":
        return <Car className="h-4 w-4" />
      case "Limpieza":
        return <Sparkles className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getDashboardStatusColor = (estado: string) => {
    switch (estado) {
      case "Abierta":
        return "bg-red-100 text-red-800"
      case "En Proceso":
        return "bg-yellow-100 text-yellow-800"
      case "Cerrada":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case "Alta":
        return "bg-red-500"
      case "Media":
        return "bg-yellow-500"
      case "Baja":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  // Tipos de incidencia disponibles
  const incidenciaTypes = [
    { id: "Carroceria", label: "Carrocería", icon: Car },
    { id: "Mecanica", label: "Mecánica", icon: Car },
    { id: "Documentacion", label: "Documentación", icon: User },
    { id: "2ª Llave", label: "2ª Llave", icon: User },
    { id: "Limpieza", label: "Limpieza", icon: Car },
    { id: "Otros", label: "Otros", icon: AlertTriangle },
  ]

  const handleCaptchaVerification = () => {
    if (!captchaChecked) {
      toast({
        title: "Verificación requerida",
        description: "Debe marcar la casilla 'No soy un robot'",
        variant: "destructive",
      })
      return
    }

    setVerifying(true)
    
    // Simular proceso de verificación
    setTimeout(() => {
      setVerifying(false)
      setCaptchaVerified(true)
      setStep("login")
      toast({
        title: "Verificación completada",
        description: "Puede continuar con el acceso al sistema",
      })
    }, 2000)
  }

  const validateVehicle = async () => {
    if (!licensePlate.trim() || !dni.trim()) {
      setError("Por favor, complete todos los campos")
      return
    }

    setLoading(true)
    setError(null)

    // Simular validación con datos de prueba
    setTimeout(() => {
      // Guardar datos del login en localStorage
      localStorage.setItem('loginData', JSON.stringify({
        licensePlate: licensePlate.trim().toUpperCase(),
        dni: dni.trim().toUpperCase()
      }))
      
      // Redirección normal como un login corriente
      window.location.href = "/dashboard-cliente"
    }, 1500)
  }

  const handleIncidenciaToggle = (tipo: string) => {
    if (selectedIncidencias.includes(tipo)) {
      setSelectedIncidencias(selectedIncidencias.filter(t => t !== tipo))
      const newTexts = { ...incidenciaTexts }
      delete newTexts[tipo]
      setIncidenciaTexts(newTexts)
    } else {
      setSelectedIncidencias([...selectedIncidencias, tipo])
      
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
        toast({
          title: "Ticket creado",
          description: `Ticket #${data.ticket.ticket_number} creado exitosamente`,
        })
        
        // FORZAR que aparezca el dashboard inmediatamente
        console.log("Ticket creado, mostrando dashboard...")
        setTimeout(() => {
          console.log("Cambiando a dashboard...")
          setStep("dashboard")
        }, 100)
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
        return "bg-red-100 text-red-800 border-red-200"
      case "en_tramite":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cerrado":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
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
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Background Paths */}
      <BuildingLines />
      
      {/* Fixed Header */}
      <div className="relative z-20 container mx-auto px-4 md:px-6 text-center mb-8">
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
                                        bg-gradient-to-r from-gray-900 to-gray-700"
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            ))}
          </h1>

          <motion.p 
            className="text-xl text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
          >
            Quadis Munich - Dept. Vehículo de Ocasión
          </motion.p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
        <div className="w-full max-w-md mx-auto">
          <AnimatePresence mode="wait">
            {step === "captcha" && (
              <motion.div
                key="captcha"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ x: -1000, opacity: 0 }}
                transition={{ duration: 0.8, delay: 1.5 }}
              >
                <div className="inline-block group relative bg-gradient-to-b from-white/20 to-white/10 
                              p-px rounded-2xl backdrop-blur-lg 
                              overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <Card className="rounded-[1.15rem] backdrop-blur-md bg-white/95 hover:bg-white/100 
                                   border border-gray-200 hover:shadow-md">
                    <CardHeader className="text-center pb-4">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <Shield className="h-8 w-8 text-green-600" />
                        <CardTitle className="text-xl font-semibold text-gray-900">Verificación de Seguridad</CardTitle>
                      </div>
                      <CardDescription className="text-sm text-gray-600">
                        Complete la verificación para acceder al sistema de soporte
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div 
                        className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => setCaptchaChecked(!captchaChecked)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all duration-200 ${
                            captchaChecked 
                              ? 'border-green-500 bg-green-500' 
                              : 'border-gray-400 hover:border-gray-500'
                          }`}>
                            {captchaChecked && <CheckCircle className="h-4 w-4 text-white" />}
                          </div>
                          <span className="text-gray-700 font-medium">No soy un robot</span>
                        </div>
                      </div>

                      <Button
                        onClick={handleCaptchaVerification}
                        disabled={verifying}
                        className={`w-full h-10 font-medium transition-all duration-200 ${
                          captchaChecked 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {verifying ? (
                          <>
                            <BMWMSpinner size={16} className="mr-2" />
                            Verificando...
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Verificar
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {step === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
              >
                <div className="inline-block group relative bg-gradient-to-b from-white/20 to-white/10 
                              p-px rounded-2xl backdrop-blur-lg 
                              overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <Card className="rounded-[1.15rem] backdrop-blur-md bg-white/95 hover:bg-white/100 
                                   border border-gray-200 hover:shadow-md">
                    <CardHeader className="text-center pb-4">
                      <CardTitle className="text-xl font-semibold text-gray-900">Acceso al Sistema</CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        Ingrese los datos de su vehículo para continuar
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="licensePlate" className="text-left block text-sm font-medium text-gray-700">
                          Matrícula del Vehículo
                        </Label>
                        <Input
                          id="licensePlate"
                          value={licensePlate}
                          onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                          placeholder="Ej: 1234ABC"
                          className="h-10 border border-gray-300 focus:border-blue-500 bg-white text-gray-900 text-center"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="dni" className="text-left block text-sm font-medium text-gray-700">
                          DNI del Propietario
                        </Label>
                        <Input
                          id="dni"
                          value={dni}
                          onChange={(e) => setDni(e.target.value.toUpperCase())}
                          placeholder="Ej: 12345678A"
                          className="h-10 border border-gray-300 focus:border-blue-500 bg-white text-gray-900 text-center"
                        />
                      </div>

                      {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-600">{error}</p>
                        </div>
                      )}

                      <Button
                        onClick={validateVehicle}
                        disabled={loading || !licensePlate || !dni}
                        className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                      >
                        {loading ? (
                          <>
                            <BMWMSpinner size={16} className="mr-2" />
                            Validando...
                          </>
                        ) : (
                          <>
                            <Car className="h-4 w-4 mr-2" />
                            Validar Vehículo
                          </>
                        )}
                      </Button>

                      <div className="text-center">
                        <Button
                          variant="link"
                          onClick={loadTicketHistory}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          ¿Ya tiene un ticket? Ver historial
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}



            {step === "dashboard" && (
              <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
                {/* Header */}
                <div className="bg-white shadow-sm border-b">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-600 p-2 rounded-lg">
                          <Car className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h1 className="text-2xl font-bold text-gray-900">Dashboard Vehicular</h1>
                          <p className="text-sm text-gray-600">Matrícula: 2025JVS</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Activo
                        </Badge>
                        <Button variant="outline" size="sm">
                          <User className="h-4 w-4 mr-2" />
                          Carlos Rodríguez Martín
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  {/* Progress Steps */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">Progreso del Dashboard</h2>
                      <span className="text-sm text-gray-600">1 de 6 secciones expandidas</span>
                    </div>
                    <Progress value={(1 / 6) * 100} className="h-2" />
                  </div>

                  <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="overview">Resumen</TabsTrigger>
                      <TabsTrigger value="incidents">Incidencias</TabsTrigger>
                      <TabsTrigger value="documents">Documentos</TabsTrigger>
                      <TabsTrigger value="history">Historial</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                      {/* Vehicle Info Card */}
                      <Card
                        className={`transition-all duration-300 ${expandedCards.includes("vehicle-info") ? "ring-2 ring-blue-200" : ""}`}
                      >
                        <CardHeader className="cursor-pointer" onClick={() => toggleCard("vehicle-info")}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="bg-blue-100 p-2 rounded-lg">
                                <Car className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <CardTitle>Información del Vehículo</CardTitle>
                                <CardDescription>Datos técnicos y características</CardDescription>
                              </div>
                            </div>
                            <Badge variant="secondary">
                              {expandedCards.includes("vehicle-info") ? "Expandido" : "Contraído"}
                            </Badge>
                          </div>
                        </CardHeader>
                        {expandedCards.includes("vehicle-info") && (
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 border-b pb-2">Datos Básicos</h4>
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Marca:</span>
                                    <span className="font-medium">BMW</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Modelo:</span>
                                    <span className="font-medium">Serie 3 320d</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Año:</span>
                                    <span className="font-medium">2022</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Color:</span>
                                    <span className="font-medium">Azul Metalizado</span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 border-b pb-2">Especificaciones</h4>
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Combustible:</span>
                                    <span className="font-medium">Diésel</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Kilometraje:</span>
                                    <span className="font-medium">45,678 km</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">VIN:</span>
                                    <span className="font-medium font-mono text-xs">WBABA91060AL12345</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Matriculación:</span>
                                    <span className="font-medium">15/03/2022</span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 border-b pb-2">Estado</h4>
                                <div className="space-y-3">
                                  <div className="bg-green-50 p-3 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                      <span className="text-sm font-medium text-green-800">Certificado</span>
                                    </div>
                                    <p className="text-xs text-green-600 mt-1">
                                      Última revisión: 25/11/2024
                                    </p>
                                  </div>
                                  <div className="bg-blue-50 p-3 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                      <TrendingUp className="h-4 w-4 text-blue-600" />
                                      <span className="text-sm font-medium text-blue-800">Valoración</span>
                                    </div>
                                    <p className="text-xs text-blue-600 mt-1">Excelente estado general</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>

                      {/* Sale Information Card */}
                      <Card
                        className={`transition-all duration-300 ${expandedCards.includes("sale-info") ? "ring-2 ring-green-200" : ""}`}
                      >
                        <CardHeader className="cursor-pointer" onClick={() => toggleCard("sale-info")}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="bg-green-100 p-2 rounded-lg">
                                <DollarSign className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <CardTitle>Información de Venta</CardTitle>
                                <CardDescription>Detalles de la transacción y asesor comercial</CardDescription>
                              </div>
                            </div>
                            <Badge variant="secondary" className="bg-green-50 text-green-700">
                              45 días desde venta
                            </Badge>
                          </div>
                        </CardHeader>
                      </Card>

                      {/* Owner Information Card */}
                      <Card
                        className={`transition-all duration-300 ${expandedCards.includes("owner-info") ? "ring-2 ring-purple-200" : ""}`}
                      >
                        <CardHeader className="cursor-pointer" onClick={() => toggleCard("owner-info")}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="bg-purple-100 p-2 rounded-lg">
                                <User className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <CardTitle>Información del Propietario</CardTitle>
                                <CardDescription>Datos de contacto y personales</CardDescription>
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              Verificado
                            </Badge>
                          </div>
                        </CardHeader>
                      </Card>

                      {/* Incidents Summary Card */}
                      <Card
                        className={`transition-all duration-300 ${expandedCards.includes("incidents-summary") ? "ring-2 ring-red-200" : ""}`}
                      >
                        <CardHeader className="cursor-pointer" onClick={() => toggleCard("incidents-summary")}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="bg-red-100 p-2 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                              </div>
                              <div>
                                <CardTitle>Resumen de Incidencias</CardTitle>
                                <CardDescription>Estado actual de las incidencias reportadas</CardDescription>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Badge variant="destructive">
                                {incidents.filter((i) => i.estado === "Abierta").length} Abiertas
                              </Badge>
                              <Badge variant="secondary">
                                {incidents.filter((i) => i.estado === "En Proceso").length} En Proceso
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    </TabsContent>

                    <TabsContent value="incidents">
                      <Card>
                        <CardHeader>
                          <CardTitle>Gestión de Incidencias</CardTitle>
                          <CardDescription>Administra y da seguimiento a las incidencias reportadas</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-8 text-gray-500">
                            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p>Sección de incidencias en desarrollo</p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="documents">
                      <Card>
                        <CardHeader>
                          <CardTitle>Documentos del Vehículo</CardTitle>
                          <CardDescription>Gestión de documentación oficial y certificados</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-8 text-gray-500">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p>Sección de documentos en desarrollo</p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="history">
                      <Card>
                        <CardHeader>
                          <CardTitle>Historial del Vehículo</CardTitle>
                          <CardDescription>Cronología completa de eventos y mantenimientos</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-8 text-gray-500">
                            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p>Historial completo en desarrollo</p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
} 