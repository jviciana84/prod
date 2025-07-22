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
import { Loader2, Search, Truck, Key, CreditCard, FileText, FileCheck, Car, Leaf, Plus, Package, User, Phone, Mail, MapPin } from "lucide-react"
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
  "COC": FileText,
  "Pegatina Medioambiental": Leaf,
  "Otros": Plus
}

const MATERIAL_COLORS = {
  "2ª Llave": "text-yellow-500",
  "CardKey": "text-blue-500", 
  "Ficha técnica": "text-green-500",
  "Permiso circulación": "text-purple-500",
  "COC": "text-blue-600",
  "Pegatina Medioambiental": "text-green-600",
  "Otros": "text-gray-500"
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
    const matriculaUpper = matricula.toUpperCase()
    setFormData(prev => ({ ...prev, matricula: matriculaUpper }))
    
    if (matriculaUpper.length >= 3) {
      setSearchingVehicle(true)
      try {
        console.log("Buscando datos para matrícula:", matriculaUpper)
        const response = await fetch(`/api/recogidas/vehicle-data?matricula=${matriculaUpper}`)
        
        if (response.ok) {
          const { vehicleData, error } = await response.json()
          
          if (vehicleData) {
            console.log("Datos encontrados:", vehicleData)
            // Pre-cargar datos del cliente si están disponibles
            setFormData(prev => ({
              ...prev,
              nombre_cliente: vehicleData.client_name || "",
              direccion_cliente: vehicleData.client_address || "",
              codigo_postal: vehicleData.client_postal_code || "",
              ciudad: vehicleData.client_city || "",
              provincia: vehicleData.client_province || "",
              telefono: vehicleData.client_phone || "",
              email: vehicleData.client_email || "",
            }))
            
            // Mostrar información detallada sobre los datos cargados
            const datosCargados = []
            if (vehicleData.client_name) datosCargados.push("Nombre")
            if (vehicleData.client_address) datosCargados.push("Dirección")
            if (vehicleData.client_postal_code) datosCargados.push("CP")
            if (vehicleData.client_city) datosCargados.push("Ciudad")
            if (vehicleData.client_province) datosCargados.push("Provincia")
            if (vehicleData.client_phone) datosCargados.push("Teléfono")
            if (vehicleData.client_email) datosCargados.push("Email")
            
            if (datosCargados.length > 0) {
              toast.success(`Datos cargados: ${datosCargados.join(", ")}`)
            } else {
              toast.warning("Vehículo encontrado pero sin datos del cliente")
            }
          } else {
            console.log("No se encontraron datos para la matrícula")
            toast.info("Vehículo no encontrado en la base de datos")
          }
        } else {
          let errorMessage = "No se pudieron cargar los datos"
          try {
            const errorData = await response.json()
            console.error("Error en la respuesta:", errorData)
            errorMessage = errorData.error || errorMessage
          } catch (jsonError) {
            console.error("Error parseando respuesta de error:", jsonError)
            errorMessage = `Error ${response.status}: ${response.statusText}`
          }
          toast.error(`Error: ${errorMessage}`)
        }
      } catch (error) {
        console.error("Error buscando datos del vehículo:", error)
        toast.error("Error al cargar datos del vehículo")
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
            <CardTitle className="flex items-center gap-2 text-lg">
              <Truck className="h-5 w-5 text-blue-500" />
              Datos de la Recogida
            </CardTitle>
            <CardDescription>Información básica de la solicitud</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="matricula" className="flex items-center gap-1.5 text-sm">
                  <Car className="h-3 w-3 text-blue-500" />
                  Matrícula *
                </Label>
                <div className="relative">
                  <Input
                    id="matricula"
                    value={formData.matricula}
                    onChange={(e) => handleMatriculaChange(e.target.value)}
                    placeholder="1234ABC"
                    className="uppercase h-8 text-sm"
                    required
                  />
                  {searchingVehicle && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="mensajeria" className="flex items-center gap-1.5 text-sm">
                  <Truck className="h-3 w-3 text-green-500" />
                  Mensajería
                </Label>
                <Input
                  id="mensajeria"
                  value={formData.mensajeria}
                  onChange={(e) => setFormData(prev => ({ ...prev, mensajeria: e.target.value }))}
                  placeholder="MRW"
                  className="h-8 text-sm"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="centro" className="flex items-center gap-1.5 text-sm">
                  <MapPin className="h-3 w-3 text-purple-500" />
                  Centro de Recogida
                </Label>
                <Input
                  id="centro"
                  value={formData.centro_recogida}
                  onChange={(e) => setFormData(prev => ({ ...prev, centro_recogida: e.target.value }))}
                  placeholder="Terrassa"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Materiales */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" />
                Materiales a Enviar *
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {MATERIALES.map((material) => {
                  const Icon = MATERIAL_ICONS[material]
                  const color = MATERIAL_COLORS[material]
                  const isSelected = formData.materiales.includes(material)
                  return (
                    <Button
                      key={material}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={`justify-start h-8 text-xs ${isSelected ? '' : 'hover:border-blue-300'}`}
                      onClick={() => toggleMaterial(material)}
                    >
                      <Icon className={`h-3 w-3 mr-1.5 ${isSelected ? 'text-white' : color}`} />
                      {material}
                    </Button>
                  )
                })}
              </div>
              
              {/* Materiales seleccionados */}
              {formData.materiales.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.materiales.map((material) => {
                    const Icon = MATERIAL_ICONS[material]
                    const color = MATERIAL_COLORS[material]
                    return (
                      <Badge key={material} variant="secondary" className="gap-1 px-2 py-1 text-xs">
                        <Icon className={`h-3 w-3 ${color}`} />
                        {material}
                        <button
                          type="button"
                          onClick={() => removeMaterial(material)}
                          className="ml-1 hover:text-destructive text-xs"
                        >
                          ×
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sección 2: Datos del cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-green-500" />
              Datos del Cliente
            </CardTitle>
            <CardDescription>Información de contacto y dirección de entrega</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nombre" className="flex items-center gap-1.5 text-sm">
                  <User className="h-3 w-3 text-green-500" />
                  Nombre
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre_cliente}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre_cliente: e.target.value }))}
                  placeholder="Nombre del cliente"
                  className="h-8 text-sm"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="telefono" className="flex items-center gap-1.5 text-sm">
                  <Phone className="h-3 w-3 text-blue-500" />
                  Teléfono
                </Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                  placeholder="677233678"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="flex items-center gap-1.5 text-sm">
                <Mail className="h-3 w-3 text-purple-500" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="cliente@email.com"
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="direccion" className="flex items-center gap-1.5 text-sm">
                <MapPin className="h-3 w-3 text-red-500" />
                Dirección
              </Label>
              <Input
                id="direccion"
                value={formData.direccion_cliente}
                onChange={(e) => setFormData(prev => ({ ...prev, direccion_cliente: e.target.value }))}
                placeholder="C/Costa 6"
                className="h-8 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cp" className="text-sm">Código Postal</Label>
                <Input
                  id="cp"
                  value={formData.codigo_postal}
                  onChange={(e) => setFormData(prev => ({ ...prev, codigo_postal: e.target.value }))}
                  placeholder="08232"
                  className="h-8 text-sm"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="ciudad" className="text-sm">Ciudad</Label>
                <Input
                  id="ciudad"
                  value={formData.ciudad}
                  onChange={(e) => setFormData(prev => ({ ...prev, ciudad: e.target.value }))}
                  placeholder="Viladecavalls"
                  className="h-8 text-sm"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="provincia" className="text-sm">Provincia</Label>
                <Input
                  id="provincia"
                  value={formData.provincia}
                  onChange={(e) => setFormData(prev => ({ ...prev, provincia: e.target.value }))}
                  placeholder="Barcelona"
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sección 3: Observaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-orange-500" />
              Observaciones
            </CardTitle>
            <CardDescription>Información adicional sobre el envío</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label htmlFor="observaciones" className="flex items-center gap-1.5 text-sm">
                <FileText className="h-3 w-3 text-orange-500" />
                Observaciones de Envío
              </Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones_envio}
                onChange={(e) => setFormData(prev => ({ ...prev, observaciones_envio: e.target.value }))}
                placeholder="Observaciones adicionales sobre el envío..."
                rows={2}
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="min-w-[150px] bg-blue-600 hover:bg-blue-700">
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