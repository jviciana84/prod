"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function EmailPreviewPage() {
  const { toast } = useToast()
  const [extornoId, setExtornoId] = useState("129") // Default to a sample ID
  const [emailType, setEmailType] = useState<"registro" | "tramitacion" | "confirmacion" | "rechazo">("registro")
  const [previewHtml, setPreviewHtml] = useState("")
  const [loading, setLoading] = useState(false)

  const fetchEmailPreview = async () => {
    if (!extornoId || !emailType) {
      toast({
        title: "Campos requeridos",
        description: "Por favor, introduce un ID de extorno y selecciona un tipo de email.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setPreviewHtml("")
    try {
      const response = await fetch(`/api/extornos/preview-email-html?extornoId=${extornoId}&type=${emailType}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al cargar la previsualización del email.")
      }
      const html = await response.text()
      setPreviewHtml(html)
      toast({
        title: "Previsualización cargada",
        description: "El email se ha cargado correctamente.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error fetching email preview:", error)
      toast({
        title: "Error de previsualización",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Previsualización de Emails de Extornos</h1>

      <Card>
        <CardHeader>
          <CardTitle>Configuración de Previsualización</CardTitle>
          <CardDescription>Selecciona un extorno y el tipo de email para previsualizar su contenido.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="extorno-id">ID de Extorno</Label>
              <Input
                id="extorno-id"
                type="number"
                value={extornoId}
                onChange={(e) => setExtornoId(e.target.value)}
                placeholder="Ej: 123"
              />
              <p className="text-sm text-muted-foreground">
                Usa un ID de extorno existente en tu base de datos para ver datos reales.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-type">Tipo de Email</Label>
              <Select value={emailType} onValueChange={(value: any) => setEmailType(value)}>
                <SelectTrigger id="email-type">
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="registro">Registro</SelectItem>
                  <SelectItem value="tramitacion">Tramitación</SelectItem>
                  <SelectItem value="confirmacion">Confirmación</SelectItem>
                  <SelectItem value="rechazo">Rechazo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={fetchEmailPreview} disabled={loading || !extornoId || !emailType}>
            {loading ? "Cargando..." : "Cargar Previsualización"}
          </Button>
        </CardContent>
      </Card>

      {previewHtml && (
        <Card>
          <CardHeader>
            <CardTitle>Previsualización del Email</CardTitle>
            <CardDescription>Así se verá el email en el cliente de correo.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden h-[600px] w-full">
              <iframe
                srcDoc={previewHtml}
                title="Email Preview"
                className="w-full h-full border-none"
                sandbox="allow-same-origin allow-scripts" // Permite scripts si son necesarios para el renderizado, pero con seguridad
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
