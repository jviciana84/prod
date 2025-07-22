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
import { Package, Loader2, CheckCircle, Eye, Copy } from "lucide-react"

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

    try {
      const response = await fetch("/api/test-entrega-en-mano", {
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

      if (!response.ok) {
        toast({
          title: "❌ Error",
          description: data.error || "Error en la prueba",
          variant: "destructive",
        })
      } else {
        toast({
          title: "✅ Prueba Exitosa",
          description: "Sistema funcionando correctamente",
        })
        setResult(data)
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Error de conexión",
        variant: "destructive",
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Prueba Sistema Entrega en Mano
          </CardTitle>
          <CardDescription>
            Prueba el sistema completo sin enviar emails reales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Datos del vehículo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Matrícula</Label>
              <Input
                value={formData.matricula}
                onChange={(e) => setFormData(prev => ({ ...prev, matricula: e.target.value }))}
                placeholder="1234ABC"
              />
            </div>
            <div>
              <Label>Nombre Cliente</Label>
              <Input
                value={formData.nombre_cliente}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre_cliente: e.target.value }))}
                placeholder="Cliente de Prueba"
              />
            </div>
            <div>
              <Label>Email Cliente</Label>
              <Input
                type="email"
                value={formData.email_cliente}
                onChange={(e) => setFormData(prev => ({ ...prev, email_cliente: e.target.value }))}
                placeholder="cliente@test.com"
              />
            </div>
            <div>
              <Label>Usuario Solicitante</Label>
              <Input
                value={formData.usuario_solicitante}
                onChange={(e) => setFormData(prev => ({ ...prev, usuario_solicitante: e.target.value }))}
                placeholder="Usuario Test"
              />
            </div>
          </div>

          {/* Datos de quien recoge */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Nombre Quien Recoge</Label>
              <Input
                value={formData.nombre_recoge}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre_recoge: e.target.value }))}
                placeholder="Persona que Recoge"
              />
            </div>
            <div>
              <Label>DNI (opcional)</Label>
              <Input
                value={formData.dni_recoge}
                onChange={(e) => setFormData(prev => ({ ...prev, dni_recoge: e.target.value }))}
                placeholder="12345678A"
              />
            </div>
            <div>
              <Label>Email Quien Recoge</Label>
              <Input
                type="email"
                value={formData.email_recoge}
                onChange={(e) => setFormData(prev => ({ ...prev, email_recoge: e.target.value }))}
                placeholder="recoge@test.com"
              />
            </div>
          </div>

          {/* Materiales */}
          <div>
            <Label>Materiales a Entregar</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
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
            
            {materialesSeleccionados.includes("Otros") && (
              <div className="flex gap-2 mt-2">
                <Input
                  value={otrosMaterial}
                  onChange={(e) => setOtrosMaterial(e.target.value)}
                  placeholder="Especificar otro material"
                  onKeyDown={(e) => e.key === "Enter" && addOtrosMaterial()}
                />
                <Button onClick={addOtrosMaterial} size="sm">Añadir</Button>
              </div>
            )}
          </div>

          {/* Materiales seleccionados */}
          {materialesSeleccionados.length > 0 && (
            <div className="bg-muted/30 p-3 rounded-lg">
              <Label className="text-sm font-medium">Materiales seleccionados:</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {materialesSeleccionados.map((material, index) => (
                  <Badge key={index} variant="secondary">{material}</Badge>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={testEntregaEnMano} 
            disabled={loading || materialesSeleccionados.length === 0}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
          <CardContent className="space-y-6">
            <Alert>
              <AlertDescription>
                <strong>✅ {result.message}</strong><br/>
                {result.mensaje}
              </AlertDescription>
            </Alert>

            {/* Información del email */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">📧 Información del Email:</h3>
                <div className="bg-muted/30 p-3 rounded-lg space-y-2">
                  <div><strong>Asunto:</strong> {result.asunto}</div>
                  <div><strong>Destinatarios:</strong> {result.destinatarios.join(", ")}</div>
                  <div><strong>Modo:</strong> <Badge variant="outline">{result.modo}</Badge></div>
                </div>
              </div>

              {/* URL de confirmación */}
              <div>
                <h3 className="font-semibold mb-2">🔗 URL de Confirmación:</h3>
                <div className="flex gap-2">
                  <Input value={result.confirmacionUrl} readOnly />
                  <Button 
                    onClick={() => copyToClipboard(result.confirmacionUrl)}
                    size="sm"
                    variant="outline"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => window.open(result.confirmacionUrl, '_blank')}
                    size="sm"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Vista previa del email */}
              <div>
                <h3 className="font-semibold mb-2">👁️ Vista Previa del Email:</h3>
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div dangerouslySetInnerHTML={{ __html: result.emailHTML }} />
                </div>
              </div>

              {/* Datos guardados */}
              <div>
                <h3 className="font-semibold mb-2">💾 Datos Guardados:</h3>
                <div className="bg-muted/30 p-3 rounded-lg">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(result.entrega, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 