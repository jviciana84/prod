"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Mail, AlertCircle, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface Recogida {
  id: number
  matricula: string
  centro_recogida: string
  materiales: string[]
  usuario_solicitante: string
  fecha_solicitud: string
  fecha_envio?: string
}

interface EmailConfig {
  id: number
  enabled: boolean
  email_agencia: string
  email_remitente: string
  nombre_remitente: string
  asunto_template: string
  cc_emails: string[]
}

export default function DebugRecogidasEmailPage() {
  const supabase = createClientComponentClient()
  const [recogidas, setRecogidas] = useState<Recogida[]>([])
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [selectedRecogidas, setSelectedRecogidas] = useState<number[]>([])
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null)
  const [testEmail, setTestEmail] = useState("jordi.viciana@munichgroup.es")
  const [cleaningCookies, setCleaningCookies] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Cargar recogidas del historial
      const { data: recogidasData, error: recogidasError } = await supabase
        .from("recogidas_historial")
        .select("*")
        .order("fecha_solicitud", { ascending: false })
        .limit(10)

      if (recogidasError) {
        console.error("Error cargando recogidas:", recogidasError)
        toast.error("Error cargando recogidas")
      } else {
        setRecogidas(recogidasData || [])
      }

      // Cargar configuración de email
      const { data: configData, error: configError } = await supabase
        .from("recogidas_email_config")
        .select("*")
        .single()

      if (configError) {
        console.error("Error cargando configuración:", configError)
        toast.error("Error cargando configuración de email")
      } else {
        setEmailConfig(configData)
      }
    } catch (error) {
      console.error("Error inesperado:", error)
      toast.error("Error cargando datos")
    } finally {
      setLoading(false)
    }
  }

  const toggleRecogidaSelection = (recogidaId: number) => {
    setSelectedRecogidas(prev => 
      prev.includes(recogidaId) 
        ? prev.filter(id => id !== recogidaId)
        : [...prev, recogidaId]
    )
  }

  const selectAllRecogidas = () => {
    setSelectedRecogidas(recogidas.map(r => r.id))
  }

  const clearSelection = () => {
    setSelectedRecogidas([])
  }

  const cleanCookies = async () => {
    setCleaningCookies(true)
    try {
      console.log("🧹 Limpiando cookies...")
      
      const response = await fetch("/api/debug-cleanup-cookies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        toast.success("Cookies limpiadas correctamente")
        console.log("✅ Cookies limpiadas:", result)
        
        // Mostrar instrucciones
        alert(`Cookies limpiadas correctamente.\n\nPara completar la limpieza:\n${result.cleanupInstructions.join('\n')}`)
      } else {
        toast.error(result.error || "Error limpiando cookies")
      }
    } catch (error) {
      console.error("Error limpiando cookies:", error)
      toast.error("Error limpiando cookies")
    } finally {
      setCleaningCookies(false)
    }
  }

  const sendTestEmail = async () => {
    if (selectedRecogidas.length === 0) {
      toast.warning("Selecciona al menos una recogida para enviar")
      return
    }

    setSending(true)
    setDiagnosticResult(null)
    
    try {
      console.log("Enviando email de prueba para recogidas:", selectedRecogidas)
      console.log("Email de prueba:", testEmail)
      
      const response = await fetch("/api/debug-recogidas-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recogidaIds: selectedRecogidas,
          testEmail: testEmail.trim() || undefined
        }),
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        toast.success("Email enviado correctamente")
        setDiagnosticResult({
          success: true,
          message: result.message,
          diagnosticInfo: result.diagnosticInfo,
          isTestEmail: result.isTestEmail
        })
        // Recargar datos para ver la fecha de envío actualizada (solo si no es prueba)
        if (!result.isTestEmail) {
          await loadData()
        }
      } else {
        toast.error(result.error || "Error enviando email")
        setDiagnosticResult({
          success: false,
          error: result.error,
          details: result.details,
          diagnosticInfo: result.diagnosticInfo
        })
      }
    } catch (error) {
      console.error("Error enviando email:", error)
      toast.error("Error enviando email")
      setDiagnosticResult({
        success: false,
        error: "Error de conexión",
        details: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setSending(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES')
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando datos...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Debug - Emails de Recogidas</h1>
          <p className="text-muted-foreground">
            Diagnóstico y prueba del sistema de envío de emails de recogidas
          </p>
        </div>
                 <div className="flex gap-2">
           <Button onClick={loadData} variant="outline">
             <RefreshCw className="h-4 w-4 mr-2" />
             Recargar
           </Button>
           <Button onClick={cleanCookies} variant="destructive" disabled={cleaningCookies}>
             {cleaningCookies ? (
               <>
                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                 Limpiando...
               </>
             ) : (
               <>
                 <XCircle className="h-4 w-4 mr-2" />
                 Limpiar Cookies
               </>
             )}
           </Button>
         </div>
      </div>

      {/* Configuración de Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Configuración de Email
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emailConfig ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Estado</Label>
                <div className="flex items-center mt-1">
                  {emailConfig.enabled ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  <span>{emailConfig.enabled ? "Habilitado" : "Deshabilitado"}</span>
                </div>
              </div>
              <div>
                <Label>Email Agencia</Label>
                <p className="text-sm text-muted-foreground mt-1">{emailConfig.email_agencia}</p>
              </div>
              <div>
                <Label>Email Remitente</Label>
                <p className="text-sm text-muted-foreground mt-1">{emailConfig.email_remitente}</p>
              </div>
              <div>
                <Label>Nombre Remitente</Label>
                <p className="text-sm text-muted-foreground mt-1">{emailConfig.nombre_remitente}</p>
              </div>
              <div className="md:col-span-2">
                <Label>Plantilla Asunto</Label>
                <p className="text-sm text-muted-foreground mt-1">{emailConfig.asunto_template}</p>
              </div>
              <div className="md:col-span-2">
                <Label>Emails en CC</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {emailConfig.cc_emails.length > 0 ? (
                    emailConfig.cc_emails.map((email, index) => (
                      <Badge key={index} variant="secondary">{email}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Ninguno configurado</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center text-red-500">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span>No se pudo cargar la configuración de email</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selección de Recogidas */}
      <Card>
        <CardHeader>
          <CardTitle>Recogidas Disponibles</CardTitle>
          <CardDescription>
            Selecciona las recogidas para enviar un email de prueba
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button onClick={selectAllRecogidas} variant="outline" size="sm">
              Seleccionar Todas
            </Button>
            <Button onClick={clearSelection} variant="outline" size="sm">
              Limpiar Selección
            </Button>
          </div>

          {recogidas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay recogidas en el historial
            </div>
          ) : (
            <div className="space-y-2">
              {recogidas.map((recogida) => (
                <div
                  key={recogida.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedRecogidas.includes(recogida.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => toggleRecogidaSelection(recogida.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{recogida.matricula}</span>
                        <Badge variant="outline">{recogida.centro_recogida}</Badge>
                        {recogida.fecha_envio && (
                          <Badge variant="secondary">Enviado</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <span>Materiales: {recogida.materiales.join(", ")}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span>Solicitante: {recogida.usuario_solicitante}</span>
                        <span className="mx-2">•</span>
                        <span>Fecha: {formatDate(recogida.fecha_solicitud)}</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {selectedRecogidas.includes(recogida.id) && (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuración de Email de Prueba */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Email de Prueba</CardTitle>
          <CardDescription>
            Especifica un email personalizado para enviar la prueba (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="testEmail">Email de Prueba</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="jordi.viciana@munichgroup.es"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Si dejas vacío, se usará el email de la agencia configurado
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón de Envío */}
      <Card>
        <CardHeader>
          <CardTitle>Enviar Email de Prueba</CardTitle>
          <CardDescription>
            Envía un email de prueba con las recogidas seleccionadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button 
              onClick={sendTestEmail} 
              disabled={selectedRecogidas.length === 0 || sending}
              className="min-w-[200px]"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Email de Prueba
                </>
              )}
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedRecogidas.length} recogida{selectedRecogidas.length !== 1 ? 's' : ''} seleccionada{selectedRecogidas.length !== 1 ? 's' : ''}
              {testEmail && (
                <span className="ml-2">• Enviando a: {testEmail}</span>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Resultado del Diagnóstico */}
      {diagnosticResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {diagnosticResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
              )}
              Resultado del Diagnóstico
              {diagnosticResult.isTestEmail && (
                <Badge variant="outline" className="ml-2">Email de Prueba</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {diagnosticResult.success ? (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">{diagnosticResult.message}</p>
                </div>
                
                                 {diagnosticResult.duration && (
                   <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                     <p className="text-blue-800 font-medium">
                       ⏱️ Duración del proceso: {diagnosticResult.duration}ms
                     </p>
                   </div>
                 )}
                 
                 {diagnosticResult.duration && (
                   <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                     <p className="text-blue-800 font-medium">
                       ⏱️ Duración hasta el error: {diagnosticResult.duration}ms
                     </p>
                   </div>
                 )}
                 
                 {diagnosticResult.diagnosticInfo && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-medium">Configuración SMTP</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        <p>Host: {diagnosticResult.diagnosticInfo.smtpConfig.host}</p>
                        <p>Puerto: {diagnosticResult.diagnosticInfo.smtpConfig.port}</p>
                        <p>Usuario: {diagnosticResult.diagnosticInfo.smtpConfig.user}</p>
                        <p>Seguro: {diagnosticResult.diagnosticInfo.smtpConfig.secure ? "Sí" : "No"}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="font-medium">Destinatarios</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        <p>Para: {diagnosticResult.diagnosticInfo.recipients.to.join(", ")}</p>
                        <p>CC: {diagnosticResult.diagnosticInfo.recipients.cc.join(", ") || "Ninguno"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium">Error: {diagnosticResult.error}</p>
                  {diagnosticResult.details && (
                    <p className="text-red-700 text-sm mt-1">{diagnosticResult.details}</p>
                  )}
                </div>
                
                {diagnosticResult.diagnosticInfo && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-medium">Configuración SMTP</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        <p>Host: {diagnosticResult.diagnosticInfo.smtpConfig?.host || "No disponible"}</p>
                        <p>Puerto: {diagnosticResult.diagnosticInfo.smtpConfig?.port || "No disponible"}</p>
                        <p>Usuario: {diagnosticResult.diagnosticInfo.smtpConfig?.user || "No disponible"}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="font-medium">Configuración Email</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        <p>Habilitado: {diagnosticResult.diagnosticInfo.emailConfig?.enabled ? "Sí" : "No"}</p>
                        <p>Agencia: {diagnosticResult.diagnosticInfo.emailConfig?.email_agencia || "No disponible"}</p>
                        <p>Remitente: {diagnosticResult.diagnosticInfo.emailConfig?.email_remitente || "No disponible"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 