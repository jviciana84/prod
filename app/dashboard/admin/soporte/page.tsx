"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { 
  Loader2, 
  Search, 
  Ticket, 
  Car, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  MessageSquare,
  Send,
  Image as ImageIcon,
  Download,
  Eye
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Ticket {
  id: string
  ticket_number: string
  license_plate: string
  client_dni: string
  client_email: string
  client_phone: string
  sale_date: string
  time_since_sale: string
  status: string
  created_at: string
  incidencias: Incidencia[]
}

interface Incidencia {
  id: string
  tipo_incidencia: string
  descripcion: string
  estado: string
  respuesta_admin: string
  respondido_at: string
  created_at: string
  imagenes: string[]
  archivos_admin: string[]
}

export default function SoporteAdminPage() {
  const { toast } = useToast()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("pendiente")
  const [showResponseDialog, setShowResponseDialog] = useState(false)
  const [selectedIncidencia, setSelectedIncidencia] = useState<Incidencia | null>(null)
  const [responseText, setResponseText] = useState("")
  const [sendingResponse, setSendingResponse] = useState(false)

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/soporte/tickets")
      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets)
      } else {
        toast({
          title: "Error",
          description: "Error cargando tickets",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
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

  const getIncidenciaStatusColor = (status: string) => {
    switch (status) {
      case "pendiente":
        return "bg-red-100 text-red-800"
      case "en_tramite":
        return "bg-yellow-100 text-yellow-800"
      case "resuelto":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.client_email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = 
      (activeTab === "pendiente" && ticket.status === "abierto") ||
      (activeTab === "en_tramite" && ticket.status === "en_tramite") ||
      (activeTab === "cerrado" && ticket.status === "cerrado")
    
    return matchesSearch && matchesStatus
  })

  const handleTicketSelect = async (ticket: Ticket) => {
    setSelectedTicket(ticket)
  }

  const handleResponseSubmit = async () => {
    if (!selectedIncidencia || !responseText.trim()) {
      toast({
        title: "Error",
        description: "Debe escribir una respuesta",
        variant: "destructive",
      })
      return
    }

    setSendingResponse(true)

    try {
      const response = await fetch("/api/admin/soporte/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidencia_id: selectedIncidencia.id,
          ticket_id: selectedTicket?.id,
          respuesta: responseText,
        }),
      })

      if (response.ok) {
        toast({
          title: "Respuesta enviada",
          description: "La respuesta ha sido enviada al cliente",
        })
        setShowResponseDialog(false)
        setResponseText("")
        setSelectedIncidencia(null)
        loadTickets() // Recargar tickets para actualizar estado
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Error enviando respuesta",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setSendingResponse(false)
    }
  }

  const openResponseDialog = (incidencia: Incidencia) => {
    setSelectedIncidencia(incidencia)
    setResponseText("")
    setShowResponseDialog(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Soporte</h1>
          <p className="text-gray-600">Administración de tickets de soporte</p>
        </div>
        <Button onClick={loadTickets} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando...
            </>
          ) : (
            "Actualizar"
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Tickets */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Tickets
              </CardTitle>
              <CardDescription>
                Lista de tickets de soporte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Buscador */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtros por estado */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pendiente">Pendiente</TabsTrigger>
                  <TabsTrigger value="en_tramite">En Trámite</TabsTrigger>
                  <TabsTrigger value="cerrado">Cerrado</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Lista de tickets */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedTicket?.id === ticket.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleTicketSelect(ticket)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm">{ticket.ticket_number}</span>
                      <Badge className={getStatusColor(ticket.status)}>
                        {getStatusText(ticket.status)}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-1 mb-1">
                        <Car className="h-3 w-3" />
                        {ticket.license_plate}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {ticket.client_email}
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredTickets.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay tickets en este estado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalle del Ticket */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Ticket #{selectedTicket.ticket_number}
                  </span>
                  <Badge className={getStatusColor(selectedTicket.status)}>
                    {getStatusText(selectedTicket.status)}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Detalles del ticket y respuestas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Información del ticket */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Matrícula</p>
                      <p className="font-medium">{selectedTicket.license_plate}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">DNI</p>
                      <p className="font-medium">{selectedTicket.client_dni}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{selectedTicket.client_email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
                      <p className="font-medium">{selectedTicket.client_phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Fecha de creación</p>
                      <p className="font-medium">
                        {new Date(selectedTicket.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Tiempo desde la venta</p>
                      <p className="font-medium">{selectedTicket.time_since_sale}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Incidencias */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Incidencias reportadas</h3>
                  
                  {selectedTicket.incidencias.map((incidencia) => (
                    <div key={incidencia.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{incidencia.tipo_incidencia}</h4>
                        <Badge className={getIncidenciaStatusColor(incidencia.estado)}>
                          {getStatusText(incidencia.estado)}
                        </Badge>
                      </div>
                      
                      {incidencia.descripcion && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-1">Descripción del cliente:</p>
                          <p className="text-sm bg-gray-50 p-3 rounded">{incidencia.descripcion}</p>
                        </div>
                      )}
                      
                      {/* Imágenes del cliente */}
                      {incidencia.imagenes && incidencia.imagenes.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-2">Imágenes adjuntas:</p>
                          <div className="flex gap-2 flex-wrap">
                            {incidencia.imagenes.map((imagen, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={imagen}
                                  alt={`Imagen ${index + 1}`}
                                  className="w-16 h-16 object-cover rounded border cursor-pointer"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded flex items-center justify-center">
                                  <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Respuesta del admin */}
                      {incidencia.respuesta_admin && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-1">Respuesta del equipo:</p>
                          <div className="bg-blue-50 p-3 rounded">
                            <p className="text-sm text-blue-800">{incidencia.respuesta_admin}</p>
                            {incidencia.respondido_at && (
                              <p className="text-xs text-blue-600 mt-2">
                                Respondido el {new Date(incidencia.respondido_at).toLocaleDateString('es-ES')}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Botón de respuesta */}
                      <Button
                        onClick={() => openResponseDialog(incidencia)}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Responder
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Seleccione un ticket para ver los detalles</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog de respuesta */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Responder incidencia</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Tipo de incidencia</Label>
              <p className="text-sm text-gray-600">{selectedIncidencia?.tipo_incidencia}</p>
            </div>
            
            {selectedIncidencia?.descripcion && (
              <div>
                <Label>Descripción del cliente</Label>
                <p className="text-sm bg-gray-50 p-3 rounded mt-1">
                  {selectedIncidencia.descripcion}
                </p>
              </div>
            )}
            
            <div>
              <Label htmlFor="response">Respuesta</Label>
              <Textarea
                id="response"
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Escriba su respuesta al cliente..."
                rows={6}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResponseDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleResponseSubmit}
              disabled={sendingResponse || !responseText.trim()}
            >
              {sendingResponse ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar respuesta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 