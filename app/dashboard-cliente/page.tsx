"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Car,
  User,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Key,
  Wrench,
  Sparkles,
  Shield,
  TrendingUp,
  DollarSign,
  Award,
  LogOut,
  Loader2,
  Receipt,
  File,
} from "lucide-react"
import React from "react"
import { CarFrontIcon } from "@/components/ui/car-front-icon"
import { CarModelSedanIcon } from "@/components/ui/car-model-sedan-icon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Dashboard() {
  const [activeStep, setActiveStep] = useState(1)
  const [expandedCards, setExpandedCards] = useState<string[]>(["vehicle-info"])
  const [loginData, setLoginData] = useState<{licensePlate: string, dni: string} | null>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Obtener datos del login al cargar el componente
  React.useEffect(() => {
    const storedLoginData = localStorage.getItem('loginData')
    if (storedLoginData) {
      try {
        const parsedData = JSON.parse(storedLoginData)
        setLoginData(parsedData)
      } catch (error) {
        console.error('Error parsing login data:', error)
      }
    }
  }, [])

  // Obtener datos reales del vehículo cuando se tenga la matrícula
  React.useEffect(() => {
    const fetchVehicleData = async () => {
      if (!loginData?.licensePlate) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        console.log(`🔍 Solicitando datos para matrícula: ${loginData.licensePlate}`)
        
        const response = await fetch(`/api/vehicle-dashboard-data?licensePlate=${loginData.licensePlate}&dni=${loginData.dni}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('❌ Error en la respuesta de la API:', errorData)
          throw new Error(errorData.error || 'Error al obtener datos del vehículo')
        }

        const data = await response.json()
        console.log('✅ Datos recibidos:', data)
        
        if (data.success) {
          setDashboardData(data)
          setError(null)
        } else {
          throw new Error(data.error || 'Error en los datos recibidos')
        }
      } catch (err) {
        console.error('💥 Error fetching vehicle data:', err)
        setError(err.message || 'Error al cargar los datos del vehículo')
      } finally {
        setLoading(false)
      }
    }

    fetchVehicleData()
  }, [loginData])

     // Datos del vehículo - usar datos reales si están disponibles
   const vehicleData = {
     matricula: loginData?.licensePlate || "",
     marca: dashboardData?.vehicleData?.marca,
     modelo: dashboardData?.vehicleData?.modelo,
     año: dashboardData?.vehicleData?.año,
     color: dashboardData?.vehicleData?.color,
     kilometraje: dashboardData?.vehicleData?.kilometraje,
     vin: dashboardData?.vehicleData?.vin,
     fechaMatriculacion: dashboardData?.vehicleData?.fechaMatriculacion,
     fechaEntrega: dashboardData?.vehicleData?.fechaEntrega,
     fechaVenta: dashboardData?.vehicleData?.fechaVenta,
     fechaCertificacion: dashboardData?.vehicleData?.fechaCertificacion,
     tipoCertificacion: dashboardData?.vehicleData?.tipoCertificacion,
     valoracion: dashboardData?.vehicleData?.valoracion,
     diasDesdeVenta: dashboardData?.vehicleData?.diasDesdeVenta,
     precio: dashboardData?.vehicleData?.precio,
     precioOriginal: dashboardData?.vehicleData?.precioOriginal,
   }

  const ownerData = {
    nombre: dashboardData?.ownerData?.nombre,
    dni: loginData?.dni || dashboardData?.ownerData?.dni,
    telefono: dashboardData?.ownerData?.telefono,
    email: dashboardData?.ownerData?.email,
    direccion: dashboardData?.ownerData?.direccion,
  }

  const saleData = {
    asesorComercial: dashboardData?.saleData?.asesorComercial,
    concesionario: dashboardData?.saleData?.concesionario,
    telefonoAsesor: dashboardData?.saleData?.telefonoAsesor,
    emailAsesor: dashboardData?.saleData?.emailAsesor,
  }

  const incidents = dashboardData?.incidents || []

  const toggleCard = (cardId: string) => {
    setExpandedCards((prev) => (prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]))
  }

  const getIncidentIcon = (tipo: string) => {
    switch (tipo) {
      case "Llaves":
        return <Key className="h-4 w-4" />
      case "Documentación":
        return <FileText className="h-4 w-4" />
      case "Carrocería":
        return <Shield className="h-4 w-4" />
      case "Limpieza":
        return <Sparkles className="h-4 w-4" />
      case "Mecánica":
        return <Wrench className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (estado: string) => {
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

  const handleLogout = () => {
    localStorage.removeItem('loginData')
    window.location.href = "/soporte"
  }

  // Mostrar loading mientras se cargan los datos
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando datos del vehículo...</p>
        </div>
      </div>
    )
  }

  // Mostrar error si hay algún problema
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar datos</h3>
          <p className="text-red-600 mb-4 text-sm">{error}</p>
          <div className="space-y-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              Reintentar
            </Button>
            <Button 
              variant="outline" 
              onClick={async () => {
                try {
                  const response = await fetch('/api/test-connection')
                  const data = await response.json()
                  alert(`Prueba de conexión: ${data.success ? '✅ Exitoso' : '❌ Fallido'}\n${data.error || data.message}`)
                } catch (err) {
                  alert('Error al probar conexión: ' + err.message)
                }
              }}
              className="w-full"
            >
              Probar Conexión
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = "/soporte"}
              className="w-full"
            >
              Volver al inicio
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <style jsx>{`
        /* Forzar tema claro para esta página */
        :global(html) {
          color-scheme: light !important;
        }
        :global(body) {
          color-scheme: light !important;
        }
        /* Sobrescribir cualquier tema oscuro */
        :global(.dark) {
          --background: 0 0% 100% !important;
          --foreground: 240 10% 3.9% !important;
          --card: 0 0% 100% !important;
          --card-foreground: 240 10% 3.9% !important;
          --popover: 0 0% 100% !important;
          --popover-foreground: 240 10% 3.9% !important;
          --primary: 240 5.9% 10% !important;
          --primary-foreground: 0 0% 98% !important;
          --secondary: 240 4.8% 95.9% !important;
          --secondary-foreground: 240 5.9% 10% !important;
          --muted: 240 4.8% 95.9% !important;
          --muted-foreground: 240 5% 70% !important;
          --accent: 240 4.8% 95.9% !important;
          --accent-foreground: 240 5.9% 10% !important;
          --destructive: 0 84.2% 60.2% !important;
          --destructive-foreground: 0 0% 98% !important;
          --border: 0 0% 68% !important;
          --input: 240 5.9% 90% !important;
          --ring: 240 5.9% 10% !important;
        }
      `}</style>
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
                         <div className="flex items-center space-x-4">
               <div className="bg-blue-600 p-2 rounded-lg">
                 <CarFrontIcon className="h-6 w-6 text-white" size={24} />
               </div>
               <div>
                 <h1 className="text-2xl font-bold text-gray-900">Dashboard Cliente</h1>
                                   <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-600">Matrícula: {vehicleData.matricula}</p>
                  </div>
               </div>
             </div>
                         <div className="flex items-center space-x-4">
               <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                 <CheckCircle className="h-3 w-3 mr-1" />
                 Activo
               </Badge>
                               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                                         <Button variant="outline" size="sm">
                       <User className="h-4 w-4 mr-2" />
                       {ownerData.nombre || "Usuario"}
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64" align="end">
                                         <DropdownMenuLabel className="font-bold text-base">
                       {ownerData.nombre || "Usuario"}
                     </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled className="text-sm">
                      <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{ownerData.telefono}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled className="text-sm">
                      <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{ownerData.email}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
                     <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-semibold text-gray-900">Progreso del Dashboard</h2>
             <span className="text-sm text-gray-600">{expandedCards.length} de 4 secciones expandidas</span>
           </div>
           <Progress value={(expandedCards.length / 4) * 100} className="h-2" />
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
                      <CarModelSedanIcon className="h-5 w-5 text-blue-600" />
                    </div>
                                         <div>
                       <CardTitle>Información del Vehículo</CardTitle>
                                               <CardDescription>
                          Datos técnicos y características
                        </CardDescription>
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
                           <span className="font-medium">{vehicleData.marca || "Cargando..."}</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-gray-600">Modelo:</span>
                           <span className="font-medium">{vehicleData.modelo || "Cargando..."}</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-gray-600">Año:</span>
                           <span className="font-medium">{vehicleData.año || "Cargando..."}</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-gray-600">Color:</span>
                           <span className="font-medium">{vehicleData.color || "Cargando..."}</span>
                         </div>
                      </div>
                    </div>

                                         <div className="space-y-4">
                       <h4 className="font-semibold text-gray-900 border-b pb-2">Especificaciones</h4>
                       <div className="space-y-3">
                         <div className="flex justify-between">
                           <span className="text-gray-600">Kilometraje:</span>
                           <span className="font-medium">{vehicleData.kilometraje ? `${vehicleData.kilometraje.toLocaleString()} km` : "Cargando..."}</span>
                         </div>
                                                   <div className="flex justify-between">
                            <span className="text-gray-600">Bastidor:</span>
                            <span className="font-medium">{vehicleData.vin || "Cargando..."}</span>
                          </div>
                                                   <div className="flex justify-between">
                            <span className="text-gray-600">Matriculación:</span>
                            <span className="font-medium">{vehicleData.fechaMatriculacion || "Cargando..."}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Entrega:</span>
                            <span className="font-medium">{vehicleData.fechaEntrega || "Cargando..."}</span>
                          </div>
                       </div>
                     </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 border-b pb-2">Estado</h4>
                      <div className="space-y-3">
                                                 <div className="bg-green-50 p-3 rounded-lg">
                           <div className="flex items-center space-x-2">
                             <CheckCircle className="h-4 w-4 text-green-600" />
                             <span className="text-sm font-medium text-green-800">{vehicleData.tipoCertificacion || "Cargando..."}</span>
                           </div>
                           <p className="text-xs text-green-600 mt-1">
                             Certificado el: {vehicleData.fechaCertificacion || "Cargando..."}
                           </p>
                         </div>
                         
                                                   {/* Valoración */}
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">Valoración</span>
                            </div>
                                                         <p className="text-xs text-blue-600 mt-1 leading-tight">
                               {vehicleData.valoracion || "Cargando..."}
                             </p>
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
                       <File className="h-5 w-5 text-green-600" />
                     </div>
                    <div>
                      <CardTitle>Información de Venta</CardTitle>
                      <CardDescription>Detalles de la transacción y asesor comercial</CardDescription>
                    </div>
                  </div>
                                     <Badge variant="secondary" className="bg-green-50 text-green-700">
                     {vehicleData.diasDesdeVenta || "Cargando..."} desde entrega
                   </Badge>
                </div>
              </CardHeader>
              {expandedCards.includes("sale-info") && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 border-b pb-2">Datos de Venta</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fecha de Venta:</span>
                          <span className="font-medium">{vehicleData.fechaVenta || "Cargando..."}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Precio de Venta:</span>
                                                     <span className="font-medium text-green-600">{vehicleData.precio ? `€${vehicleData.precio.toLocaleString()}` : "Cargando..."}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Precio Original:</span>
                          <span className="font-medium text-gray-500 line-through">
                            {vehicleData.precioOriginal ? `€${vehicleData.precioOriginal.toLocaleString()}` : "Cargando..."}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Descuento:</span>
                          <span className="font-medium text-red-600">
                            {vehicleData.precio && vehicleData.precioOriginal ? `€${(vehicleData.precioOriginal - vehicleData.precio).toLocaleString()}` : "Cargando..."}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 border-b pb-2">Asesor Comercial</h4>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="bg-blue-600 p-2 rounded-full">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div>
                                                     <p className="font-medium text-blue-900">{saleData.asesorComercial || "Cargando..."}</p>
                         <p className="text-sm text-blue-600">{saleData.concesionario || "Cargando..."}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <Phone className="h-3 w-3 text-blue-600" />
                            <span>{saleData.telefonoAsesor || "No disponible"}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-3 w-3 text-blue-600" />
                            <span>{saleData.emailAsesor || "No disponible"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>


                </CardContent>
              )}
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
              {expandedCards.includes("owner-info") && (
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 border-b pb-2">Datos Personales</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nombre Completo:</span>
                          <span className="font-medium">{ownerData.nombre || "No disponible"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">DNI:</span>
                          <span className="font-medium font-mono">{ownerData.dni || "No disponible"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 border-b pb-2">Contacto</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{ownerData.telefono || "No disponible"}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{ownerData.email || "No disponible"}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{ownerData.direccion || "No disponible"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
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
              {expandedCards.includes("incidents-summary") && (
                <CardContent>
                  <div className="space-y-4">
                    {incidents.map((incident) => (
                      <div key={incident.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="bg-gray-100 p-2 rounded-lg">{getIncidentIcon(incident.tipo)}</div>
                            <div>
                              <h5 className="font-medium">{incident.tipo}</h5>
                              <p className="text-sm text-gray-600">{incident.fecha}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(incident.prioridad)}`}></div>
                            <Badge className={getStatusColor(incident.estado)}>{incident.estado}</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 ml-11">{incident.descripcion}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="incidents">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Incidencias</CardTitle>
                <CardDescription>Administración y seguimiento de incidencias reportadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Gestor de incidencias en desarrollo</p>
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
  )
} 