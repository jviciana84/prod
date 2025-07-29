"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Plus,
  Eye,
  FileText,
  Key,
  Wrench,
  Sparkles,
  Shield,
  AlertCircle,
  User,
  Paperclip,
  Send,
  Filter,
} from "lucide-react"

export default function IncidentManager() {
  const [incidents, setIncidents] = useState([
    {
      id: 1,
      tipo: "Llaves",
      estado: "Abierta",
      fecha: "2024-12-15",
      descripcion:
        "Llave de repuesto no funciona correctamente. Al intentar abrir el vehículo, la llave no responde y es necesario usar la llave principal.",
      prioridad: "Media",
      reportadoPor: "Carlos Rodríguez",
      adjuntos: ["foto_llave.jpg"],
      comentarios: [
        {
          id: 1,
          autor: "Servicio Técnico",
          fecha: "2024-12-16",
          mensaje: "Hemos recibido su reporte. Procederemos a revisar la llave de repuesto.",
        },
      ],
    },
    {
      id: 2,
      tipo: "Documentación",
      estado: "Cerrada",
      fecha: "2024-12-10",
      descripcion: "Falta manual de usuario en el vehículo",
      prioridad: "Baja",
      reportadoPor: "Carlos Rodríguez",
      adjuntos: [],
      comentarios: [
        {
          id: 1,
          autor: "Administración",
          fecha: "2024-12-11",
          mensaje: "Manual enviado por correo electrónico. Incidencia resuelta.",
        },
      ],
    },
    {
      id: 3,
      tipo: "Mecánica",
      estado: "En Proceso",
      fecha: "2024-12-12",
      descripcion:
        "Ruido extraño en el motor al arrancar en frío. Se escucha un sonido metálico durante los primeros segundos.",
      prioridad: "Alta",
      reportadoPor: "Carlos Rodríguez",
      adjuntos: ["audio_motor.mp3"],
      comentarios: [
        {
          id: 1,
          autor: "Taller Mecánico",
          fecha: "2024-12-13",
          mensaje: "Cita programada para revisión el 20/12/2024 a las 10:00h",
        },
      ],
    },
  ])

  const [selectedIncident, setSelectedIncident] = useState<any>(null)
  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState(false)
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  const [newIncident, setNewIncident] = useState({
    tipo: "",
    descripcion: "",
    prioridad: "Media",
  })

  const getIncidentIcon = (tipo: string) => {
    switch (tipo) {
      case "Llaves":
        return <Key className="h-4 w-4" />
      case "Documentación":
        return <FileText className="h-4 w-4" />
      case "Mecánica":
        return <Wrench className="h-4 w-4" />
      case "Carrocería":
        return <Shield className="h-4 w-4" />
      case "Limpieza":
        return <Sparkles className="h-4 w-4" />
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

  const handleCreateIncident = () => {
    if (!newIncident.tipo || !newIncident.descripcion) {
      return
    }

    const incident = {
      id: incidents.length + 1,
      ...newIncident,
      estado: "Abierta",
      fecha: new Date().toISOString().split("T")[0],
      reportadoPor: "Carlos Rodríguez",
      adjuntos: [],
      comentarios: [],
    }

    setIncidents([...incidents, incident])
    setNewIncident({ tipo: "", descripcion: "", prioridad: "Media" })
    setIsNewIncidentOpen(false)
  }

  const filteredIncidents = incidents.filter((incident) => {
    const typeMatch = filterType === "all" || incident.tipo === filterType
    const statusMatch = filterStatus === "all" || incident.estado === filterStatus
    return typeMatch && statusMatch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Incidencias</h2>
          <p className="text-gray-600">Administra y da seguimiento a las incidencias reportadas</p>
        </div>
        <Dialog open={isNewIncidentOpen} onOpenChange={setIsNewIncidentOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Incidencia
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crear Nueva Incidencia</DialogTitle>
              <DialogDescription>
                Completa los detalles de la nueva incidencia para que podamos ayudarte.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tipo">Tipo de Incidencia</Label>
                <Select value={newIncident.tipo} onValueChange={(value) => setNewIncident({ ...newIncident, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Llaves">Llaves</SelectItem>
                    <SelectItem value="Documentación">Documentación</SelectItem>
                    <SelectItem value="Mecánica">Mecánica</SelectItem>
                    <SelectItem value="Carrocería">Carrocería</SelectItem>
                    <SelectItem value="Limpieza">Limpieza</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="prioridad">Prioridad</Label>
                <Select value={newIncident.prioridad} onValueChange={(value) => setNewIncident({ ...newIncident, prioridad: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baja">Baja</SelectItem>
                    <SelectItem value="Media">Media</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Describe detalladamente la incidencia..."
                  value={newIncident.descripcion}
                  onChange={(e) => setNewIncident({ ...newIncident, descripcion: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsNewIncidentOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateIncident}>Crear Incidencia</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Incidencia</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="Llaves">Llaves</SelectItem>
                  <SelectItem value="Documentación">Documentación</SelectItem>
                  <SelectItem value="Mecánica">Mecánica</SelectItem>
                  <SelectItem value="Carrocería">Carrocería</SelectItem>
                  <SelectItem value="Limpieza">Limpieza</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="Abierta">Abierta</SelectItem>
                  <SelectItem value="En Proceso">En Proceso</SelectItem>
                  <SelectItem value="Cerrada">Cerrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incidents List */}
      <div className="space-y-4">
        {filteredIncidents.map((incident) => (
          <Card key={incident.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">{getIncidentIcon(incident.tipo)}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{incident.tipo}</h3>
                      <Badge className={getStatusColor(incident.estado)}>{incident.estado}</Badge>
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(incident.prioridad)}`}></div>
                      <Badge variant="outline">{incident.prioridad}</Badge>
                    </div>
                    <p className="text-gray-600 mb-3">{incident.descripcion}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Reportado por: {incident.reportadoPor}</span>
                      <span>Fecha: {incident.fecha}</span>
                      {incident.adjuntos.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />
                          {incident.adjuntos.length} adjunto(s)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Detalles de la Incidencia #{incident.id}</DialogTitle>
                      <DialogDescription>
                        Información completa y seguimiento de la incidencia
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Tipo</Label>
                          <p className="text-sm text-gray-600">{incident.tipo}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Estado</Label>
                          <Badge className={getStatusColor(incident.estado)}>{incident.estado}</Badge>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Prioridad</Label>
                          <Badge variant="outline">{incident.prioridad}</Badge>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Fecha</Label>
                          <p className="text-sm text-gray-600">{incident.fecha}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Descripción</Label>
                        <p className="text-sm text-gray-600 mt-1">{incident.descripcion}</p>
                      </div>
                      {incident.comentarios.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Comentarios</Label>
                          <div className="space-y-2 mt-2">
                            {incident.comentarios.map((comentario) => (
                              <div key={comentario.id} className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-gray-900">{comentario.autor}</span>
                                  <span className="text-xs text-gray-500">{comentario.fecha}</span>
                                </div>
                                <p className="text-sm text-gray-600">{comentario.mensaje}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 