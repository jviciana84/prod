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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileText, Key, CreditCard, FileCheck, Printer, Plus, Loader2, ChevronDown } from "lucide-react"
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

  const handleMaterialObservationsChange = (requestId: string, materialId: string, observations: string) => {
    setRequests(prev => prev.map(request => 
      request.id === requestId 
        ? {
            ...request,
            docuware_request_materials: request.docuware_request_materials.map(material =>
              material.id === materialId 
                ? { ...material, observations }
                : material
            )
          }
        : request
    ))
  }

  const handleDeleteMaterial = async (requestId: string, materialId: string) => {
    try {
      const response = await fetch("/api/docuware/requests/delete-material", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          materialId
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Material eliminado correctamente")
        loadRequests() // Recargar datos
      } else {
        toast.error("Error eliminando material")
      }
    } catch (error) {
      console.error("Error eliminando material:", error)
      toast.error("Error eliminando material")
    }
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
    // Obtener solicitudes según la pestaña actual
    const currentRequests = activeTab === "second_keys" ? secondKeyRequests : technicalSheetRequests
    const pendingRequests = currentRequests.filter(r => r.status === "pending")
    
    if (pendingRequests.length === 0) {
      toast.error(`No hay solicitudes de ${activeTab === "second_keys" ? "2ª llaves" : "fichas técnicas"} pendientes para imprimir`)
      return
    }

    // Función para parsear el asunto
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

    // Función para filtrar materiales a imprimir
    const filterMaterialsToPrint = (materials: any[]) => {
      // Material principal según pestaña
      const mainType = activeTab === "second_keys" ? "second_key" : "technical_sheet"
      // Materiales adicionales permitidos
      const allowedExtras = ["card_key", "circulation_permit"]
      return materials.filter(m => m.material_type === mainType || allowedExtras.includes(m.material_type))
    }

    // Generar HTML para imprimir
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Solicitudes Docuware</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 15px; font-size: 12px; }
          .header { margin-bottom: 20px; position: relative; min-height: 120px; }
          .logo-cvo { width: 180px; height: auto; display: block; margin-bottom: 2px; margin-left: 0; }
          .cvo-line { width: 180px; height: 3px; background: #222; margin: 4px 0 16px 0; border: none; }
          .header-title { font-size: 1.7em; font-weight: bold; margin: 0 0 0 0; text-align: center; width: 100%; }
          .header-content { text-align: center; padding-top: 0; }
          .request { border: 1px solid #ccc; margin: 10px 0; padding: 10px; page-break-inside: avoid; }
          .request h3 { margin: 0 0 8px 0; color: #333; font-size: 14px; }
          .info { margin: 3px 0; display: inline-block; margin-right: 20px; }
          .materials { margin: 8px 0; }
          .material { display: inline-block; margin: 2px 5px 2px 0; padding: 3px 8px; background: #f5f5f5; border-radius: 3px; }
          .material-main { background: #39e639; color: #000; font-weight: bold; }
          .observations { margin: 8px 0; font-style: italic; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cvo-KUNh8rXJGJ38lK00MJ9JTEci2nGA5o.png" alt="CVO Logo" class="logo-cvo" />
          <hr class="cvo-line" />
          <div class="header-title">SOLICITUDES DOCUWARE - ${activeTab === "second_keys" ? "2ª LLAVES" : "FICHAS TÉCNICAS"}</div>
          <div class="header-content">
            <p>Fecha: ${new Date().toLocaleDateString('es-ES')}</p>
            <p>Total: ${pendingRequests.length} solicitudes pendientes</p>
          </div>
        </div>
    `

    pendingRequests.forEach((request, index) => {
      const parsed = parseSubject(request.email_subject)
      const materials = filterMaterialsToPrint(request.docuware_request_materials || [])
      const mainType = activeTab === "second_keys" ? "second_key" : "technical_sheet"
      
      htmlContent += `
        <div class="request">
          <h3>Solicitud ${index + 1}: ${parsed.license_plate}</h3>
          <div class="info"><strong>Matrícula:</strong> ${parsed.license_plate}</div>
          <div class="info"><strong>Fecha:</strong> ${parsed.date}</div>
          <div class="info"><strong>Solicitante:</strong> ${parsed.requester}</div>
          <div class="info"><strong>Estado:</strong> ${request.status === 'pending' ? 'Pendiente' : 'Completado'}</div>
          
          <div class="materials">
            <strong>Materiales solicitados:</strong>
            ${materials.map(material => `
              <div class="material${material.material_type === mainType ? ' material-main' : ''}">
                ${material.material_type === 'second_key' ? '🔑' :
                  material.material_type === 'technical_sheet' ? '📄' :
                  material.material_type === 'card_key' ? '💳' :
                  material.material_type === 'circulation_permit' ? '📋' : '📦'} 
                ${material.material_label}
              </div>
            `).join('')}
          </div>
          
          ${request.observations ? `
            <div class="observations">
              <strong>Observaciones:</strong> ${request.observations}
            </div>
          ` : ''}
        </div>
      `
    })

    htmlContent += `
      </body>
      </html>
    `

    // Abrir ventana de impresión
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      
      // Esperar un poco y luego imprimir
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
      
      toast.success(`Abriendo impresora con ${pendingRequests.length} solicitudes`)
    } else {
      toast.error("No se pudo abrir la ventana de impresión")
    }
  }

  const handleAddMaterial = async (requestId: string, materialType: string, materialLabel: string) => {
    try {
      const response = await fetch("/api/docuware/requests/add-material", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          materialType,
          materialLabel
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`${materialLabel} añadido correctamente`)
        loadRequests() // Recargar datos
      } else {
        toast.error(data.message || "Error añadiendo material")
      }
    } catch (error) {
      console.error("Error añadiendo material:", error)
      toast.error("Error añadiendo material")
    }
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
    request.docuware_request_materials?.some(m => m.material_type === "second_key") || false
  )
  
  const technicalSheetRequests = requests.filter(request => 
    request.docuware_request_materials?.some(m => m.material_type === "technical_sheet") || false
  )

  // Función para obtener materiales adicionales (solo Card Key y Permiso Circulación)
  const getAdditionalMaterials = (materials: any[]) => {
    return materials.filter(m => 
      m.material_type === "card_key" || m.material_type === "circulation_permit"
    )
  }

  const renderRequestCard = (request: DocuwareRequest, currentTab: string) => {
    const parsed = parseSubject(request.email_subject)
    const materials = request.docuware_request_materials || []
    
    // Filtrar materiales según la pestaña actual
    const mainMaterial = materials.find(m => 
      currentTab === "second_keys" ? m.material_type === "second_key" : m.material_type === "technical_sheet"
    )
    
    const additionalMaterials = getAdditionalMaterials(materials)
    
    if (!mainMaterial) return null

    return (
      <Card key={request.id} className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedRequests.includes(request.id)}
                onCheckedChange={() => handleRequestToggle(request.id)}
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
          {/* Una línea compacta */}
          <div className="flex items-center gap-3">
            {/* Material principal */}
            <div className="flex items-center gap-2 min-w-[120px]">
              {currentTab === "second_keys" ? (
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
            {/* Materiales adicionales */}
            {additionalMaterials.map((material, index) => (
              <div key={material.id} className="flex items-center gap-1 group">
                {material.material_type === "card_key" ? (
                  <>
                    <CreditCard className="h-4 w-4 text-purple-500" />
                    <span className="text-xs font-medium">Card Key</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="h-4 w-4 text-green-500" />
                    <span className="text-xs font-medium">Permiso Circulación</span>
                  </>
                )}
                <button
                  onClick={() => handleDeleteMaterial(request.id, material.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 text-xs"
                  title="Eliminar material"
                >
                  ×
                </button>
              </div>
            ))}
            {/* Botón añadir */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 h-7 px-2 text-xs"
                >
                  <Plus className="h-3 w-3" />
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => handleAddMaterial(request.id, "card_key", "Card Key")}
                  className="flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Card Key
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleAddMaterial(request.id, "circulation_permit", "Permiso Circulación")}
                  className="flex items-center gap-2"
                >
                  <FileCheck className="h-4 w-4" />
                  Permiso Circulación
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Observaciones */}
            <Input
              placeholder="Observaciones..."
              value={request.observations || ""}
              onChange={(e) => handleObservationsChange(request.id, e.target.value)}
              className="h-7 text-sm flex-1 ml-2 min-w-0"
            />
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
                  secondKeyRequests.map(request => renderRequestCard(request, "second_keys"))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay solicitudes de 2ª llaves pendientes</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="technical_sheets" className="space-y-3 mt-4">
                {technicalSheetRequests.length > 0 ? (
                  technicalSheetRequests.map(request => renderRequestCard(request, "technical_sheets"))
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