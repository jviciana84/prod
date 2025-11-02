"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Package, CheckCircle, Eye, Copy, Database, Mail } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"

const MATERIALES_OPCIONES = [
  "Permiso circulación",
  "Ficha técnica", 
  "Pegatina Medioambiental",
  "COC",
  "2ª Llave",
  "CardKey",
  "Otros"
]

export default function TestEntregaEnMano() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [materialesSeleccionados, setMaterialesSeleccionados] = useState<string[]>([])
  const [otrosMaterial, setOtrosMaterial] = useState("")
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    matricula: "1234ABC",
    nombre_cliente: "Cliente de Prueba",
    email_cliente: "cliente@test.com",
    nombre_recoge: "Persona que Recoge",
    dni_recoge: "12345678A",
    email_recoge: "recoge@test.com",
    usuario_solicitante: "Usuario Test"
  })

  const toggleMaterial = (material: string) => {
    if (material === "Otros") {
      if (materialesSeleccionados.includes("Otros")) {
        setMaterialesSeleccionados(prev => prev.filter(m => m !== "Otros"))
        setOtrosMaterial("")
      } else {
        setMaterialesSeleccionados(prev => [...prev, "Otros"])
      }
    } else {
      setMaterialesSeleccionados(prev => 
        prev.includes(material) 
          ? prev.filter(m => m !== material)
          : [...prev, material]
      )
    }
  }

  const addOtrosMaterial = () => {
    if (otrosMaterial.trim() && !materialesSeleccionados.includes(otrosMaterial.trim())) {
      setMaterialesSeleccionados(prev => [...prev, otrosMaterial.trim()])
      setOtrosMaterial("")
    }
  }

  const testEntregaEnMano = async () => {
    if (materialesSeleccionados.length === 0) {
      toast({
        title: "❌ Error",
        description: "Selecciona al menos un material",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setResult(null)
    setDebugInfo(null)

    try {
      console.log("🚀 Iniciando prueba de entrega en mano...")
      console.log("📋 Datos a enviar:", {
        ...formData,
        materiales: materialesSeleccionados
      })

      const response = await fetch("/api/recogidas/send-confirmation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          materiales: materialesSeleccionados
        }),
      })

      const data = await response.json()
      console.log("📨 Respuesta del servidor:", data)

      if (!response.ok) {
        toast({
          title: "❌ Error",
          description: data.error || "Error en la prueba",
          variant: "destructive",
        })
        setDebugInfo({
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          details: data
        })
      } else {
        toast({
          title: "✅ Prueba Exitosa",
          description: "Sistema funcionando correctamente",
        })
        setResult(data)
        setDebugInfo({
          status: response.status,
          success: true,
          data: data
        })
      }
    } catch (error) {
      console.error("💥 Error en la prueba:", error)
      toast({
        title: "❌ Error",
        description: "Error de conexión",
        variant: "destructive",
      })
      setDebugInfo({
        error: error instanceof Error ? error.message : "Error desconocido"
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "✅ Copiado",
      description: "Texto copiado al portapapeles",
    })
  }

  const testConfirmacion = async (token: string) => {
    if (!token) {
      toast({
        title: "❌ Error",
        description: "No hay token para probar",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      console.log("🔍 Probando confirmación con token:", token)
      
      const response = await fetch("/api/recogidas/confirm-entrega", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()
      console.log("📨 Respuesta de confirmación:", data)

      if (response.ok) {
        toast({
          title: "✅ Confirmación Exitosa",
          description: data.message || "Confirmación procesada correctamente",
        })
      } else {
        toast({
          title: "❌ Error en Confirmación",
          description: data.error || "Error procesando confirmación",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("💥 Error en confirmación:", error)
      toast({
        title: "❌ Error",
        description: "Error de conexión en confirmación",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🧪 Prueba de Entrega en Mano</h1>
        <p className="text-muted-foreground">
          Prueba el sistema completo de entregas en mano
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Datos de Prueba
          </CardTitle>
          <CardDescription>
            Configura los datos para la prueba de entrega en mano
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="matricula">Matrícula</Label>
              <Input
                id="matricula"
                value={formData.matricula}
                onChange={(e) => setFormData(prev => ({ ...prev, matricula: e.target.value }))}
                placeholder="1234ABC"
              />
            </div>
            <div>
              <Label htmlFor="nombre_cliente">Nombre del Cliente</Label>
              <Input
                id="nombre_cliente"
                value={formData.nombre_cliente}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre_cliente: e.target.value }))}
                placeholder="Cliente de Prueba"
              />
            </div>
            <div>
              <Label htmlFor="email_cliente">Email del Cliente</Label>
              <Input
                id="email_cliente"
                type="email"
                value={formData.email_cliente}
                onChange={(e) => setFormData(prev => ({ ...prev, email_cliente: e.target.value }))}
                placeholder="cliente@test.com"
              />
            </div>
            <div>
              <Label htmlFor="nombre_recoge">Nombre de Quien Recoge</Label>
              <Input
                id="nombre_recoge"
                value={formData.nombre_recoge}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre_recoge: e.target.value }))}
                placeholder="Persona que Recoge"
              />
            </div>
            <div>
              <Label htmlFor="dni_recoge">DNI de Quien Recoge</Label>
              <Input
                id="dni_recoge"
                value={formData.dni_recoge}
                onChange={(e) => setFormData(prev => ({ ...prev, dni_recoge: e.target.value }))}
                placeholder="12345678A"
              />
            </div>
            <div>
              <Label htmlFor="email_recoge">Email de Quien Recoge</Label>
              <Input
                id="email_recoge"
                type="email"
                value={formData.email_recoge}
                onChange={(e) => setFormData(prev => ({ ...prev, email_recoge: e.target.value }))}
                placeholder="recoge@test.com"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Materiales a Entregar *</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {MATERIALES_OPCIONES.map((material) => (
                <div key={material} className="flex items-center space-x-2">
                  <Checkbox
                    id={material}
                    checked={materialesSeleccionados.includes(material)}
                    onCheckedChange={() => toggleMaterial(material)}
                  />
                  <Label htmlFor={material} className="text-sm">{material}</Label>
                </div>
              ))}
            </div>
          </div>

          {materialesSeleccionados.includes("Otros") && (
            <div className="flex gap-2">
              <Input
                placeholder="Especificar otro material"
                value={otrosMaterial}
                onChange={(e) => setOtrosMaterial(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addOtrosMaterial()}
              />
              <Button onClick={addOtrosMaterial} size="sm">
                Añadir
              </Button>
            </div>
          )}

          {materialesSeleccionados.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {materialesSeleccionados.map((material) => (
                <Badge key={material} variant="secondary">
                  {material}
                </Badge>
              ))}
            </div>
          )}

          <Button 
            onClick={testEntregaEnMano} 
            disabled={loading || materialesSeleccionados.length === 0}
            className="w-full"
          >
            {loading ? (
              <>
                <BMWMSpinner size={16} className="mr-2" />
                Probando...
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Probar Sistema
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Resultado de la Prueba
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                ✅ La entrega en mano se ha registrado correctamente en la base de datos.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Token de Confirmación:</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={result.confirmacionUrl || "No disponible"}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(result.confirmacionUrl || "")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Destinatarios:</Label>
                <div className="mt-1 text-sm text-muted-foreground">
                  {result.destinatarios?.join(", ") || "No especificado"}
                </div>
              </div>
            </div>

            {result.confirmacionUrl && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Prueba de Confirmación:</Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(result.confirmacionUrl, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Abrir Página de Confirmación
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testConfirmacion(result.confirmacionUrl.split('token=')[1])}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Probar Confirmación
                  </Button>
                </div>
              </div>
            )}

            <div>
              <Label className="text-sm font-medium">Datos Completos:</Label>
              <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {debugInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              Información de Debug
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-2 bg-muted rounded text-xs overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 