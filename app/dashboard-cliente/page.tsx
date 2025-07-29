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
} from "lucide-react"
import React from "react"

export default function Dashboard() {
  const [activeStep, setActiveStep] = useState(1)
  const [expandedCards, setExpandedCards] = useState<string[]>(["vehicle-info"])



  const vehicleData = {
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

  const ownerData = {
    nombre: "Carlos Rodríguez Martín",
    dni: "45641484P",
    telefono: "+34 666 123 456",
    email: "carlos.rodriguez@email.com",
    direccion: "Calle Mayor 123, 28001 Madrid",
  }

  const saleData = {
    asesorComercial: "Ana García López",
    concesionario: "AutoMadrid Premium",
    telefonoAsesor: "+34 911 234 567",
    emailAsesor: "ana.garcia@automadrid.com",
    garantia: "24 meses",
    financiacion: "Financiado 60 meses",
    seguro: "Mapfre Comprehensive",
  }

  const incidents = [
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
                <Car className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Vehicular</h1>
                <p className="text-sm text-gray-600">Matrícula: {vehicleData.matricula}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Activo
              </Badge>
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                {ownerData.nombre}
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
            <span className="text-sm text-gray-600">{expandedCards.length} de 6 secciones expandidas</span>
          </div>
          <Progress value={(expandedCards.length / 6) * 100} className="h-2" />
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
                          <span className="font-medium">{vehicleData.marca}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Modelo:</span>
                          <span className="font-medium">{vehicleData.modelo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Año:</span>
                          <span className="font-medium">{vehicleData.año}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Color:</span>
                          <span className="font-medium">{vehicleData.color}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 border-b pb-2">Especificaciones</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Combustible:</span>
                          <span className="font-medium">{vehicleData.combustible}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Kilometraje:</span>
                          <span className="font-medium">{vehicleData.kilometraje.toLocaleString()} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">VIN:</span>
                          <span className="font-medium font-mono text-xs">{vehicleData.vin}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Matriculación:</span>
                          <span className="font-medium">{vehicleData.fechaMatriculacion}</span>
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
                            Última revisión: {vehicleData.fechaCertificacion}
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
                    {vehicleData.diasDesdeVenta} días desde venta
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
                          <span className="font-medium">{vehicleData.fechaVenta}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Precio de Venta:</span>
                          <span className="font-medium text-green-600">€{vehicleData.precio.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Precio Original:</span>
                          <span className="font-medium text-gray-500 line-through">
                            €{vehicleData.precioOriginal.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Descuento:</span>
                          <span className="font-medium text-red-600">
                            €{(vehicleData.precioOriginal - vehicleData.precio).toLocaleString()}
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
                            <p className="font-medium text-blue-900">{saleData.asesorComercial}</p>
                            <p className="text-sm text-blue-600">{saleData.concesionario}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <Phone className="h-3 w-3 text-blue-600" />
                            <span>{saleData.telefonoAsesor}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-3 w-3 text-blue-600" />
                            <span>{saleData.emailAsesor}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Award className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-purple-900">Garantía</span>
                      </div>
                      <p className="text-sm text-purple-700">{saleData.garantia}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-orange-900">Financiación</span>
                      </div>
                      <p className="text-sm text-orange-700">{saleData.financiacion}</p>
                    </div>
                    <div className="bg-teal-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className="h-4 w-4 text-teal-600" />
                        <span className="font-medium text-teal-900">Seguro</span>
                      </div>
                      <p className="text-sm text-teal-700">{saleData.seguro}</p>
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
                          <span className="font-medium">{ownerData.nombre}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">DNI:</span>
                          <span className="font-medium font-mono">{ownerData.dni}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 border-b pb-2">Contacto</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{ownerData.telefono}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{ownerData.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{ownerData.direccion}</span>
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