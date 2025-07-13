"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Key, CreditCard, FileCheck, Printer, Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface DocuwareRequest {
  id: string
  email_subject: string
  email_body: string
  license_plate: string
  requester: string
  request_date: string
  status: "pending" | "confirmed" | "completed"
  observations?: string
  docuware_request_materials: Array<{
    id: string
    material_type: string
    material_label: string
    selected: boolean
    observations?: string
  }>
}

interface DocuwareRequestsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MATERIAL_OPTIONS = [
  { type: "second_key", label: "2ª Llave", icon: Key, default: true },
  { type: "technical_sheet", label: "Ficha Técnica", icon: FileText, default: true },
  { type: "first_key", label: "1ª Llave", icon: Key, default: false },
  { type: "card_key", label: "Card Key", icon: CreditCard, default: false },
  { type: "circulation_permit", label: "Permiso Circulación", icon: FileCheck, default: false },
]

export function DocuwareRequestsModal({ open, onOpenChange }: DocuwareRequestsModalProps) {
  const [requests, setRequests] = useState<DocuwareRequest[]>([])
  const [selectedRequests, setSelectedRequests] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("second_keys")
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (open) {
      loadRequests()
    }
  }, [open])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/docuware/requests")
      const data = await response.json()

      if (data.success) {
        setRequests(data.requests)
        console.log("Solicitudes cargadas:", data.requests)
      } else {
        toast.error("Error cargando solicitudes")
      }
    } catch (error) {
      console.error("Error cargando solicitudes:", error)
      toast.error("Error cargando solicitudes")
    } finally {
      setLoading(false)
    }
  }

  const handleRequestToggle = (requestId: string) => {
    setSelectedRequests(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    )
  }

  const handleObservationsChange = (requestId: string, observations: string) => {
    setRequests(prev => prev.map(request => 
      request.id === requestId 
        ? { ...request, observations }
        : request
    ))
  }

  const handleConfirmSelected = async () => {
    if (selectedRequests.length === 0) {
      toast.error("Selecciona al menos una solicitud para confirmar")
      return
    }

    setConfirming(true)
    try {
      const response = await fetch("/api/docuware/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirmedRequests: selectedRequests
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setSelectedRequests([])
        loadRequests() // Recargar datos
      } else {
        toast.error("Error confirmando solicitudes")
      }
    } catch (error) {
      console.error("Error confirmando solicitudes:", error)
      toast.error("Error confirmando solicitudes")
    } finally {
      setConfirming(false)
    }
  }

  const handlePrintPending = () => {
    const pendingRequests = requests.filter(r => r.status === "pending")
    if (pendingRequests.length === 0) {
      toast.error("No hay solicitudes pendientes para imprimir")
      return
    }

    // Aquí iría la lógica de impresión
    console.log("Imprimiendo solicitudes pendientes:", pendingRequests)
    toast.success(`Imprimiendo ${pendingRequests.length} solicitudes`)
  }

  const parseSubject = (subject: string) => {
    const parts = subject.split(" || ")
    if (parts.length >= 4) {
      return {
        license_plate: parts[0].replace("Nuevo pedido ", ""),
        date: parts[1],
        requester: parts[3]
      }
    }
    return { license_plate: "", date: "", requester: "" }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Filtrar solicitudes por tipo de material
  const secondKeyRequests = requests.filter(request => 
    request.docuware_request_materials.some(m => m.material_type === "second_key" && m.selected)
  )
  
  const technicalSheetRequests = requests.filter(request => 
    request.docuware_request_materials.some(m => m.material_type === "technical_sheet" && m.selected)
  )

  const renderRequestCard = (request: DocuwareRequest, materialType: string) => {
    const parsed = parseSubject(request.email_subject)
    const material = request.docuware_request_materials.find(m => m.material_type === materialType)
    const isSelected = selectedRequests.includes(`${request.id}-${materialType}`)

    if (!material) return null

    return (
      <Card key={`${request.id}-${materialType}`} className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => handleRequestToggle(`${request.id}-${materialType}`)}
                className="h-5 w-5"
              />
              
              {/* Matrícula y avatares */}
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="font-bold text-lg">{parsed.license_plate}</div>
                  <div className="text-xs text-muted-foreground">{parsed.date}</div>
                </div>
                
                {/* Avatar entrega */}
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs bg-green-100 text-green-700">
                      {getInitials("Usuario Actual")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-xs">
                    <div className="font-medium">Entrega</div>
                    <div className="text-muted-foreground">Usuario Actual</div>
                  </div>
                </div>
                
                {/* Flecha */}
                <div className="text-muted-foreground">→</div>
                
                {/* Avatar recibe */}
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                      {getInitials(parsed.requester)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-xs">
                    <div className="font-medium">Recibe</div>
                    <div className="text-muted-foreground">{parsed.requester}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <Badge variant={request.status === "pending" ? "secondary" : "default"}>
              {request.status === "pending" ? "Pendiente" : "Completado"}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 pb-3">
          {/* Segunda línea compacta */}
          <div className="flex items-center gap-3">
            {/* Material específico */}
            <div className="flex items-center gap-2 min-w-[120px]">
              {materialType === "second_key" ? (
                <>
                  <Key className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">2ª Llave</span>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Ficha Técnica</span>
                </>
              )}
            </div>
            
            {/* Botón añadir material */}
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 h-7 px-2 text-xs"
            >
              <Plus className="h-3 w-3" />
              Añadir
            </Button>
            
            {/* Observaciones */}
            <div className="flex-1">
              <Input
                placeholder="Observaciones..."
                value={request.observations || ""}
                onChange={(e) => handleObservationsChange(request.id, e.target.value)}
                className="h-7 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Solicitudes Docuware
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header con botones */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {requests.filter(r => r.status === "pending").length} pendientes
              </Badge>
              {selectedRequests.length > 0 && (
                <Badge variant="default">
                  {selectedRequests.length} seleccionadas
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={handlePrintPending}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Imprimir Pendientes
              </Button>
              <Button 
                onClick={handleConfirmSelected}
                disabled={selectedRequests.length === 0 || confirming}
                className="flex items-center gap-2"
              >
                {confirming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Confirmando...
                  </>
                ) : (
                  "Confirmar Seleccionadas"
                )}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            /* Pestañas */
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="second_keys" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  2ª Llaves ({secondKeyRequests.length})
                </TabsTrigger>
                <TabsTrigger value="technical_sheets" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Fichas Técnicas ({technicalSheetRequests.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="second_keys" className="space-y-3 mt-4">
                {secondKeyRequests.length > 0 ? (
                  secondKeyRequests.map(request => renderRequestCard(request, "second_key"))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay solicitudes de 2ª llaves pendientes</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="technical_sheets" className="space-y-3 mt-4">
                {technicalSheetRequests.length > 0 ? (
                  technicalSheetRequests.map(request => renderRequestCard(request, "technical_sheet"))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay solicitudes de fichas técnicas pendientes</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 