"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { Mail, Upload, Send, FileText, CheckCircle, XCircle, Plus, RefreshCw } from "lucide-react"
import { DocumentUploaderCompact } from "@/components/extornos/document-uploader-compact"
import { createClientComponentClient } from "@/lib/supabase/client"

interface EmailTestData {
  targetEmail: string
  ccEmails: string[]
  tipo: "registro" | "tramitacion" | "rechazo" | "confirmacion"
  extornoData: {
    id: string
    matricula: string
    cliente: string
    numero_cliente: string
    concepto: string
    importe: number
    numero_cuenta: string
    concesion: number
    created_at: string
    confirmation_token?: string
  }
  documentos: any[]
}

export default function ExtornosTestRealPage() {
  const [testData, setTestData] = useState<EmailTestData>({
    targetEmail: "",
    ccEmails: [],
    tipo: "registro",
    extornoData: {
      id: "TEST-001",
      matricula: "TEST123",
      cliente: "Cliente de Prueba Real",
      numero_cliente: "12345",
      concepto: "Concepto de prueba para testing del sistema de emails",
      importe: 1250.75,
      numero_cuenta: "ES1234567890123456789012",
      concesion: 1,
      created_at: new Date().toISOString(),
    },
    documentos: [],
  })

  const [ccEmailInput, setCcEmailInput] = useState("")
  const [sending, setSending] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)
  const [testExtornoId, setTestExtornoId] = useState<number | null>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Function to create a temporary extorno for testing
  const createTestExtorno = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/extornos/create-test-extorno", { method: "POST" })
      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || "Error desconocido al crear extorno de prueba")
      }
      setTestExtornoId(result.data.id)
      setDocuments(result.data.documentos_adjuntos || [])
      toast({
        title: "Extorno de prueba creado",
        description: `ID: ${result.data.id}`,
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: `No se pudo crear extorno de prueba: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Function to cleanup the temporary extorno
  const cleanupTestExtorno = async () => {
    if (!testExtornoId) return
    setLoading(true)
    try {
      const response = await fetch(`/api/extornos/cleanup-test-extorno?extorno_id=${testExtornoId}`, {
        method: "DELETE",
      })
      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || "Error desconocido al limpiar extorno de prueba")
      }
      setTestExtornoId(null)
      setDocuments([])
      toast({
        title: "Extorno de prueba limpiado",
        description: `ID: ${testExtornoId} eliminado.`,
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: `No se pudo limpiar extorno de prueba: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Create a test extorno when the component mounts
    createTestExtorno()

    // Cleanup when the component unmounts
    return () => {
      cleanupTestExtorno()
    }
  }, []) // Run only once on mount

  const addCcEmail = () => {
    if (ccEmailInput.trim() && !testData.ccEmails.includes(ccEmailInput.trim())) {
      setTestData((prev) => ({
        ...prev,
        ccEmails: [...prev.ccEmails, ccEmailInput.trim()],
      }))
      setCcEmailInput("")
    }
  }

  const removeCcEmail = (email: string) => {
    setTestData((prev) => ({
      ...prev,
      ccEmails: prev.ccEmails.filter((e) => e !== email),
    }))
  }

  const handleDocumentUploaded = (documento: any) => {
    console.log("📎 Documento subido para test:", documento)
    setTestData((prev) => ({
      ...prev,
      documentos: [...prev.documentos, documento],
    }))
    setDocuments((prev) => [...prev, documento])
    toast({
      title: "Documento subido",
      description: `Se ha subido: ${documento.nombre}`,
    })
  }

  const handleDocumentRemoved = (documentoId: string) => {
    console.log("🗑️ Documento eliminado del test:", documentoId)
    setTestData((prev) => ({
      ...prev,
      documentos: prev.documentos.filter((doc) => doc.id !== documentoId),
    }))
    setDocuments((prev) => prev.filter((doc) => doc.id !== documentoId))
    toast({
      title: "Documento eliminado",
      description: `Se ha eliminado el documento con ID: ${documentoId}`,
    })
  }

  const sendTestEmail = async () => {
    if (!testData.targetEmail.trim()) {
      toast({
        title: "Error",
        description: "Debe especificar un email de destino",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    setLastResult(null)

    try {
      console.log("📧 Enviando email de prueba real:", testData)

      const response = await fetch("/api/extornos/send-test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetEmail: testData.targetEmail,
          tipo: testData.tipo,
          extornoData: testData.extornoData,
          documentos: testData.documentos,
          ccEmails: testData.ccEmails,
        }),
      })

      const result = await response.json()
      setLastResult(result)

      if (response.ok && result.success) {
        console.log("✅ Email de prueba enviado exitosamente")
        toast({
          title: "Email enviado",
          description: `Email de prueba tipo "${testData.tipo}" enviado correctamente`,
        })
      } else {
        console.error("❌ Error enviando email de prueba:", result)
        toast({
          title: "Error enviando email",
          description: result.error || "Error desconocido",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Error crítico:", error)
      toast({
        title: "Error crítico",
        description: "Error inesperado al enviar email de prueba",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const resetTest = () => {
    setTestData({
      targetEmail: "",
      ccEmails: [],
      tipo: "registro",
      extornoData: {
        id: "TEST-001",
        matricula: "TEST123",
        cliente: "Cliente de Prueba Real",
        numero_cliente: "12345",
        concepto: "Concepto de prueba para testing del sistema de emails",
        importe: 1250.75,
        numero_cuenta: "ES1234567890123456789012",
        concesion: 1,
        created_at: new Date().toISOString(),
      },
      documentos: [],
    })
    setLastResult(null)
  }

  const getStatusIcon = (success: boolean) => {
    return success ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando extorno de prueba...</p>
      </div>
    )
  }

  if (!testExtornoId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error al cargar</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No se pudo inicializar el extorno de prueba. Intente recargar la página.</p>
            <Button onClick={createTestExtorno} className="mt-4">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">📧 Test Real - Emails de Extornos</h1>
        <p className="text-gray-600">Prueba real del sistema de emails con datos personalizables y archivos adjuntos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de Configuración */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configuración del Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email de destino */}
              <div className="space-y-2">
                <Label htmlFor="targetEmail">Email de Destino *</Label>
                <Input
                  id="targetEmail"
                  type="email"
                  value={testData.targetEmail}
                  onChange={(e) => setTestData((prev) => ({ ...prev, targetEmail: e.target.value }))}
                  placeholder="destinatario@example.com"
                  required
                />
              </div>

              {/* Emails CC */}
              <div className="space-y-2">
                <Label>Emails en Copia (CC)</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={ccEmailInput}
                    onChange={(e) => setCcEmailInput(e.target.value)}
                    placeholder="cc@example.com"
                    onKeyPress={(e) => e.key === "Enter" && addCcEmail()}
                  />
                  <Button type="button" onClick={addCcEmail} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {testData.ccEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {testData.ccEmails.map((email) => (
                      <Badge key={email} variant="secondary" className="flex items-center gap-1">
                        {email}
                        <button onClick={() => removeCcEmail(email)} className="ml-1">
                          <XCircle className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Tipo de email */}
              <div className="space-y-2">
                <Label>Tipo de Email</Label>
                <Select
                  value={testData.tipo}
                  onValueChange={(value: any) => setTestData((prev) => ({ ...prev, tipo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registro">📝 Registro</SelectItem>
                    <SelectItem value="tramitacion">✅ Tramitación</SelectItem>
                    <SelectItem value="rechazo">❌ Rechazo</SelectItem>
                    <SelectItem value="confirmacion">💰 Confirmación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Datos del Extorno */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Datos del Extorno
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="matricula">Matrícula</Label>
                  <Input
                    id="matricula"
                    value={testData.extornoData.matricula}
                    onChange={(e) =>
                      setTestData((prev) => ({
                        ...prev,
                        extornoData: { ...prev.extornoData, matricula: e.target.value.toUpperCase() },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente</Label>
                  <Input
                    id="cliente"
                    value={testData.extornoData.cliente}
                    onChange={(e) =>
                      setTestData((prev) => ({
                        ...prev,
                        extornoData: { ...prev.extornoData, cliente: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero_cliente">Número Cliente</Label>
                  <Input
                    id="numero_cliente"
                    value={testData.extornoData.numero_cliente}
                    onChange={(e) =>
                      setTestData((prev) => ({
                        ...prev,
                        extornoData: { ...prev.extornoData, numero_cliente: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="importe">Importe (€)</Label>
                  <Input
                    id="importe"
                    type="number"
                    step="0.01"
                    value={testData.extornoData.importe}
                    onChange={(e) =>
                      setTestData((prev) => ({
                        ...prev,
                        extornoData: { ...prev.extornoData, importe: Number.parseFloat(e.target.value) || 0 },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="concepto">Concepto</Label>
                <Textarea
                  id="concepto"
                  value={testData.extornoData.concepto}
                  onChange={(e) =>
                    setTestData((prev) => ({
                      ...prev,
                      extornoData: { ...prev.extornoData, concepto: e.target.value },
                    }))
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero_cuenta">Número de Cuenta</Label>
                <Input
                  id="numero_cuenta"
                  value={testData.extornoData.numero_cuenta}
                  onChange={(e) =>
                    setTestData((prev) => ({
                      ...prev,
                      extornoData: { ...prev.extornoData, numero_cuenta: e.target.value },
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Concesión</Label>
                <Select
                  value={testData.extornoData.concesion.toString()}
                  onValueChange={(value) =>
                    setTestData((prev) => ({
                      ...prev,
                      extornoData: { ...prev.extornoData, concesion: Number.parseInt(value) },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Motor Múnich SA</SelectItem>
                    <SelectItem value="2">Motor Múnich Cadí</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Documentos Adjuntos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Documentos Adjuntos ({documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentUploaderCompact
                extornoId={testExtornoId}
                tipo="adjunto"
                documentos={documents}
                onDocumentUploaded={handleDocumentUploaded}
                onDocumentRemoved={handleDocumentRemoved}
                disabled={sending}
              />
            </CardContent>
          </Card>
        </div>

        {/* Panel de Acciones y Resultados */}
        <div className="space-y-6">
          {/* Acciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Acciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={sendTestEmail} disabled={sending || !testData.targetEmail.trim()} className="flex-1">
                  {sending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Email de Prueba
                    </>
                  )}
                </Button>

                <Button variant="outline" onClick={resetTest} disabled={sending}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>

              <div className="text-sm text-gray-600">
                <p>
                  <strong>Tipo:</strong> {testData.tipo}
                </p>
                <p>
                  <strong>Destinatario:</strong> {testData.targetEmail || "No especificado"}
                </p>
                <p>
                  <strong>CC:</strong> {testData.ccEmails.length > 0 ? testData.ccEmails.join(", ") : "Ninguno"}
                </p>
                <p>
                  <strong>Adjuntos:</strong> {documents.length} archivos
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Resultado del último envío */}
          {lastResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(lastResult.success)}
                  Resultado del Envío
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={lastResult.success ? "default" : "destructive"}>
                      {lastResult.success ? "✅ Exitoso" : "❌ Error"}
                    </Badge>
                    <span className="text-sm text-gray-600">{new Date().toLocaleTimeString()}</span>
                  </div>

                  <p className="text-sm">
                    <strong>Mensaje:</strong> {lastResult.message}
                  </p>

                  {lastResult.messageId && (
                    <p className="text-sm">
                      <strong>ID del mensaje:</strong> {lastResult.messageId}
                    </p>
                  )}

                  {lastResult.estadisticas && (
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Adjuntos incluidos:</strong> {lastResult.estadisticas.adjuntos_incluidos}
                      </p>
                      <p>
                        <strong>Destinatarios:</strong> {lastResult.estadisticas.destinatarios?.length || 0}
                      </p>
                      <p>
                        <strong>Tipo de email:</strong> {lastResult.estadisticas.tipo_email}
                      </p>
                    </div>
                  )}

                  {lastResult.error && (
                    <div className="bg-red-50 p-3 rounded-md">
                      <p className="text-sm text-red-700">
                        <strong>Error:</strong> {lastResult.error}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Vista previa de tipos de email */}
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa de Tipos de Email</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={testData.tipo}
                onValueChange={(value: any) => setTestData((prev) => ({ ...prev, tipo: value }))}
              >
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="registro">Registro</TabsTrigger>
                  <TabsTrigger value="tramitacion">Tramitación</TabsTrigger>
                  <TabsTrigger value="rechazo">Rechazo</TabsTrigger>
                  <TabsTrigger value="confirmacion">Confirmación</TabsTrigger>
                </TabsList>

                <TabsContent value="registro" className="space-y-2">
                  <h4 className="font-medium">📝 Email de Registro</h4>
                  <p className="text-sm text-gray-600">
                    Notifica que se ha registrado un nuevo extorno. Incluye todos los detalles del extorno y documentos
                    adjuntos.
                  </p>
                </TabsContent>

                <TabsContent value="tramitacion" className="space-y-2">
                  <h4 className="font-medium">✅ Email de Tramitación</h4>
                  <p className="text-sm text-gray-600">
                    Notifica que el extorno ha sido revisado y aprobado. Incluye botón de confirmación de pago.
                  </p>
                </TabsContent>

                <TabsContent value="rechazo" className="space-y-2">
                  <h4 className="font-medium">❌ Email de Rechazo</h4>
                  <p className="text-sm text-gray-600">
                    Notifica que el extorno ha sido rechazado. Incluye motivo del rechazo.
                  </p>
                </TabsContent>

                <TabsContent value="confirmacion" className="space-y-2">
                  <h4 className="font-medium">💰 Email de Confirmación</h4>
                  <p className="text-sm text-gray-600">
                    Notifica que el pago del extorno ha sido confirmado y completado.
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
