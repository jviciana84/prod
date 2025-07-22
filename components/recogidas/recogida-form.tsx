"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2, Search, Truck, Key, CreditCard, FileText, FileCheck, Car, Leaf, Plus } from "lucide-react"
import { toast } from "sonner"
import type { RecogidaFormData, MaterialTipo } from "@/types/recogidas"

interface RecogidaFormProps {
  onSuccess?: () => void
  preselectedMatricula?: string
}

const MATERIALES: MaterialTipo[] = [
  "2ª Llave",
  "CardKey", 
  "Ficha técnica",
  "Permiso circulación",
  "COC",
  "Pegatina Medioambiental",
  "Otros"
]

const MATERIAL_ICONS = {
  "2ª Llave": Key,
  "CardKey": CreditCard,
  "Ficha técnica": FileText,
  "Permiso circulación": FileCheck,
  "COC": Car,
  "Pegatina Medioambiental": Leaf,
  "Otros": Plus
}

export function RecogidaForm({ onSuccess, preselectedMatricula }: RecogidaFormProps) {
  const [formData, setFormData] = useState<RecogidaFormData>({
    matricula: preselectedMatricula || "",
    mensajeria: "MRW",
    centro_recogida: "Terrassa",
    materiales: [],
    nombre_cliente: "",
    direccion_cliente: "",
    codigo_postal: "",
    ciudad: "",
    provincia: "",
    telefono: "",
    email: "",
    observaciones_envio: ""
  })

  // Efecto para cargar datos del vehículo cuando se preselecciona una matrícula
  useEffect(() => {
    if (preselectedMatricula) {
      handleMatriculaChange(preselectedMatricula)
    }
  }, [preselectedMatricula])

  const [loading, setLoading] = useState(false)
  const [searchingVehicle, setSearchingVehicle] = useState(false)
  const [showOthersDialog, setShowOthersDialog] = useState(false)
  const [otrosMaterial, setOtrosMaterial] = useState("")

  // Buscar datos del vehículo cuando se ingresa la matrícula
  const handleMatriculaChange = async (matricula: string) => {
    setFormData(prev => ({ ...prev, matricula: matricula.toUpperCase() }))
    
    if (matricula.length >= 3) {
      setSearchingVehicle(true)
      try {
        const response = await fetch(`/api/recogidas/vehicle-data?matricula=${matricula.toUpperCase()}`)
        if (response.ok) {
          const { vehicleData } = await response.json()
          
          // Pre-cargar datos del cliente si están disponibles
          setFormData(prev => ({
            ...prev,
            nombre_cliente: vehicleData.client_name || prev.nombre_cliente,
            direccion_cliente: vehicleData.client_address || prev.direccion_cliente,
            codigo_postal: vehicleData.client_postal_code || prev.codigo_postal,
            ciudad: vehicleData.client_city || prev.ciudad,
            provincia: vehicleData.client_province || prev.provincia,
            telefono: vehicleData.client_phone || prev.telefono,
            email: vehicleData.client_email || prev.email,
          }))
        }
      } catch (error) {
        console.error("Error buscando datos del vehículo:", error)
      } finally {
        setSearchingVehicle(false)
      }
    }
  }

  const toggleMaterial = (material: MaterialTipo) => {
    if (material === "Otros") {
      setShowOthersDialog(true)
      return
    }

    setFormData(prev => ({
      ...prev,
      materiales: prev.materiales.includes(material)
        ? prev.materiales.filter(m => m !== material)
        : [...prev.materiales, material]
    }))
  }

  const addOtrosMaterial = () => {
    if (otrosMaterial.trim()) {
      setFormData(prev => ({
        ...prev,
        materiales: [...prev.materiales, otrosMaterial.trim()]
      }))
      setOtrosMaterial("")
      setShowOthersDialog(false)
    }
  }

  const removeMaterial = (material: string) => {
    setFormData(prev => ({
      ...prev,
      materiales: prev.materiales.filter(m => m !== material)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.matricula || formData.materiales.length === 0) {
      toast.error("Matrícula y materiales son obligatorios")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/recogidas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error creando recogida")
      }

      const { recogida } = await response.json()
      
      // Enviar email automáticamente
      const emailResponse = await fetch("/api/recogidas/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recogidaId: recogida.id })
      })

      if (emailResponse.ok) {
        toast.success("Recogida creada y email enviado correctamente")
      } else {
        toast.success("Recogida creada correctamente, pero hubo un problema enviando el email")
      }

      // Limpiar formulario
      setFormData({
        matricula: "",
        mensajeria: "MRW",
        centro_recogida: "Terrassa",
        materiales: [],
        nombre_cliente: "",
        direccion_cliente: "",
        codigo_postal: "",
        ciudad: "",
        provincia: "",
        telefono: "",
        email: "",
        observaciones_envio: ""
      })

      onSuccess?.()
    } catch (error) {
      console.error("Error:", error)
      toast.error(error instanceof Error ? error.message : "Error creando recogida")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección 1: Datos básicos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datos de la Recogida</CardTitle>
            <CardDescription>Información básica de la solicitud</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula *</Label>
                <div className="relative">
                  <Input
                    id="matricula"
                    value={formData.matricula}
                    onChange={(e) => handleMatriculaChange(e.target.value)}
                    placeholder="1234ABC"
                    className="uppercase"
                    required
                  />
                  {searchingVehicle && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mensajeria">Mensajería</Label>
                <Input
                  id="mensajeria"
                  value={formData.mensajeria}
                  onChange={(e) => setFormData(prev => ({ ...prev, mensajeria: e.target.value }))}
                  placeholder="MRW"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="centro">Centro de Recogida</Label>
                <Input
                  id="centro"
                  value={formData.centro_recogida}
                  onChange={(e) => setFormData(prev => ({ ...prev, centro_recogida: e.target.value }))}
                  placeholder="Terrassa"
                />
              </div>
            </div>

            {/* Materiales */}
            <div className="space-y-2">
              <Label>Materiales a Enviar *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {MATERIALES.map((material) => {
                  const Icon = MATERIAL_ICONS[material]
                  return (
                    <Button
                      key={material}
                      type="button"
                      variant={formData.materiales.includes(material) ? "default" : "outline"}
                      size="sm"
                      className="justify-start"
                      onClick={() => toggleMaterial(material)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {material}
                    </Button>
                  )
                })}
              </div>
              
              {/* Materiales seleccionados */}
              {formData.materiales.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.materiales.map((material) => (
                    <Badge key={material} variant="secondary" className="gap-1">
                      {material}
                      <button
                        type="button"
                        onClick={() => removeMaterial(material)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sección 2: Datos del cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datos del Cliente</CardTitle>
            <CardDescription>Información de contacto y dirección de entrega</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={formData.nombre_cliente}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre_cliente: e.target.value }))}
                  placeholder="Nombre del cliente"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                  placeholder="677233678"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={formData.direccion_cliente}
                onChange={(e) => setFormData(prev => ({ ...prev, direccion_cliente: e.target.value }))}
                placeholder="C/Costa 6"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cp">Código Postal</Label>
                <Input
                  id="cp"
                  value={formData.codigo_postal}
                  onChange={(e) => setFormData(prev => ({ ...prev, codigo_postal: e.target.value }))}
                  placeholder="08232"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  value={formData.ciudad}
                  onChange={(e) => setFormData(prev => ({ ...prev, ciudad: e.target.value }))}
                  placeholder="Viladecavalls"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="provincia">Provincia</Label>
                <Input
                  id="provincia"
                  value={formData.provincia}
                  onChange={(e) => setFormData(prev => ({ ...prev, provincia: e.target.value }))}
                  placeholder="Barcelona"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="cliente@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones de Envío</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones_envio}
                onChange={(e) => setFormData(prev => ({ ...prev, observaciones_envio: e.target.value }))}
                placeholder="Observaciones adicionales sobre el envío..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="min-w-[150px]">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Truck className="h-4 w-4 mr-2" />
                Solicitar Recogida
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Dialog para otros materiales */}
      <Dialog open={showOthersDialog} onOpenChange={setShowOthersDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Otro Material</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otros-material">Descripción del material</Label>
              <Input
                id="otros-material"
                value={otrosMaterial}
                onChange={(e) => setOtrosMaterial(e.target.value)}
                placeholder="Ej: Escobillas, Manual de usuario..."
                onKeyDown={(e) => e.key === "Enter" && addOtrosMaterial()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOthersDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={addOtrosMaterial} disabled={!otrosMaterial.trim()}>
              Añadir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 