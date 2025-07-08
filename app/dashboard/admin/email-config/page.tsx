"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, Plus, Mail, Users, AlertTriangle, RefreshCw, ArrowRightLeft, Truck, Eye, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface EmailConfig {
  enabled: boolean
  cc_emails: string[]
}

interface ExtornosEmailConfig {
  enabled: boolean
  email_tramitador: string
  email_pagador: string
  cc_emails: string[]
}

export default function EmailConfigPage() {
  const { toast } = useToast()
  const [config, setConfig] = useState<EmailConfig>({
    enabled: false,
    cc_emails: [],
  })
  const [extornosConfig, setExtornosConfig] = useState<ExtornosEmailConfig>({
    enabled: true,
    email_tramitador: "",
    email_pagador: "",
    cc_emails: [],
  })
  const [entregasConfig, setEntregasConfig] = useState<{ enabled: boolean; cc_emails: string[] }>({
    enabled: true,
    cc_emails: [],
  })
  const [recogidasConfig, setRecogidasConfig] = useState<{ enabled: boolean; email_agencia: string; cc_emails: string[] }>({
    enabled: true,
    email_agencia: "recogidas@mrw.es",
    cc_emails: [],
  })
  const [newCcEmail, setNewCcEmail] = useState("")
  const [newExtornosCcEmail, setNewExtornosCcEmail] = useState("")
  const [newEntregasCcEmail, setNewEntregasCcEmail] = useState("")
  const [newRecogidasCcEmail, setNewRecogidasCcEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [testEmail, setTestEmail] = useState("")
  const [loadError, setLoadError] = useState<string | null>(null)

  // Estados para la previsualización de extornos
  const [previewExtornoId, setPreviewExtornoId] = useState("129") // ID de extorno de ejemplo
  // Estados para la previsualización de entregas (ahora usa matrícula)
  const [previewEntregaMatricula, setPreviewEntregaMatricula] = useState("1234ABC") // Matrícula de ejemplo

  const [previewHtml, setPreviewHtml] = useState("")
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [currentPreviewType, setCurrentPreviewType] = useState("")
  const [sendingTestEmail, setSendingTestEmail] = useState(false)

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    setLoading(true)
    setLoadError(null)

    try {
      // Cargar configuración de movimientos
      try {
        const response = await fetch("/api/admin/email-config")
        if (response.ok) {
          const data = await response.json()
          setConfig({
            enabled: data.enabled || false,
            cc_emails: data.cc_emails || [],
          })
        } else {
          console.warn("⚠️ Error cargando configuración de movimientos:", response.status)
          // Usar configuración por defecto
          setConfig({
            enabled: false,
            cc_emails: [],
          })
        }
      } catch (error) {
        console.warn("⚠️ Error en fetch de movimientos:", error instanceof Error ? error.message : String(error))
        setConfig({
          enabled: false,
          cc_emails: [],
        })
      }

      // Cargar configuración de extornos
      try {
        const extornosResponse = await fetch("/api/admin/extornos-email-config")
        if (extornosResponse.ok) {
          const extornosData = await extornosResponse.json()
          setExtornosConfig({
            enabled: extornosData.enabled || true,
            email_tramitador: extornosData.email_tramitador || "",
            email_pagador: extornosData.email_pagador || "",
            cc_emails: extornosData.cc_emails || [],
          })
        } else {
          console.warn("⚠️ Error cargando configuración de extornos:", extornosResponse.status)
          setExtornosConfig({
            enabled: true,
            email_tramitador: "",
            email_pagador: "",
            cc_emails: [],
          })
        }
      } catch (error) {
        console.warn("⚠️ Error en fetch de extornos:", error instanceof Error ? error.message : String(error))
        setExtornosConfig({
          enabled: true,
          email_tramitador: "",
          email_pagador: "",
          cc_emails: [],
        })
      }

      // Cargar configuración de entregas
      try {
        const entregasResponse = await fetch("/api/admin/entregas-email-config")
        if (entregasResponse.ok) {
          const entregasData = await entregasResponse.json()
          setEntregasConfig({
            enabled: entregasData.enabled || true,
            cc_emails: entregasData.cc_emails || [],
          })
        } else {
          console.warn("⚠️ Error cargando configuración de entregas:", entregasResponse.status)
          setEntregasConfig({
            enabled: true,
            cc_emails: [],
          })
        }
      } catch (error) {
        console.warn("⚠️ Error en fetch de entregas:", error instanceof Error ? error.message : String(error))
        setEntregasConfig({
          enabled: true,
          cc_emails: [],
        })
      }

      // Cargar configuración de recogidas
      try {
        const recogidasResponse = await fetch("/api/admin/recogidas-email-config")
        if (recogidasResponse.ok) {
          const recogidasData = await recogidasResponse.json()
          setRecogidasConfig({
            enabled: recogidasData.enabled || true,
            email_agencia: recogidasData.email_agencia || "recogidas@mrw.es",
            cc_emails: recogidasData.cc_emails || [],
          })
        } else {
          console.warn("⚠️ Error cargando configuración de recogidas:", recogidasResponse.status)
          setRecogidasConfig({
            enabled: true,
            email_agencia: "recogidas@mrw.es",
            cc_emails: [],
          })
        }
      } catch (error) {
        console.warn("⚠️ Error en fetch de recogidas:", error instanceof Error ? error.message : String(error))
        setRecogidasConfig({
          enabled: true,
          email_agencia: "recogidas@mrw.es",
          cc_emails: [],
        })
      }

      toast({
        title: "Configuración cargada",
        description: "Las configuraciones se han cargado correctamente.",
        variant: "default",
      })
    } catch (error) {
      console.error("❌ Error crítico cargando configuración:", error instanceof Error ? error.message : String(error))
      setLoadError(error instanceof Error ? error.message : String(error))

      toast({
        title: "Error cargando configuración",
        description: "Algunas configuraciones no se pudieron cargar. Se usarán valores por defecto.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveMovimientosConfig = async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/admin/email-config")
      const currentConfig = await response.json()

      const updatedConfig = {
        ...currentConfig,
        enabled: config.enabled,
        cc_emails: config.cc_emails,
      }

      const saveResponse = await fetch("/api/admin/email-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedConfig),
      })

      const result = await saveResponse.json()

      if (!saveResponse.ok) {
        throw new Error(result.error || `Error ${saveResponse.status}`)
      }

      toast({
        title: "Configuración guardada",
        description: "La configuración de movimientos ha sido actualizada.",
        variant: "default",
      })
    } catch (error) {
      console.error("❌ Error guardando configuración:", error)
      toast({
        title: "Error guardando configuración",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveExtornosConfig = async () => {
    setLoading(true)

    try {
      const saveResponse = await fetch("/api/admin/extornos-email-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(extornosConfig),
      })

      const result = await saveResponse.json()

      if (!saveResponse.ok) {
        throw new Error(result.error || `Error ${saveResponse.status}`)
      }

      toast({
        title: "Configuración guardada",
        description: "La configuración de extornos ha sido actualizada.",
        variant: "default",
      })
    } catch (error) {
      console.error("❌ Error guardando configuración:", error)
      toast({
        title: "Error guardando configuración",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveEntregasConfig = async () => {
    setLoading(true)

    try {
      const saveResponse = await fetch("/api/admin/entregas-email-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(entregasConfig),
      })

      const result = await saveResponse.json()

      if (!saveResponse.ok) {
        throw new Error(result.error || `Error ${saveResponse.status}`)
      }

      toast({
        title: "Configuración guardada",
        description: "La configuración de entregas ha sido actualizada.",
        variant: "default",
      })
    } catch (error) {
      console.error("❌ Error guardando configuración:", error)
      toast({
        title: "Error guardando configuración",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveRecogidasConfig = async () => {
    setLoading(true)

    try {
      const saveResponse = await fetch("/api/admin/recogidas-email-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(recogidasConfig),
      })

      const result = await saveResponse.json()

      if (!saveResponse.ok) {
        throw new Error(result.error || `Error ${saveResponse.status}`)
      }

      toast({
        title: "Configuración guardada",
        description: "La configuración de recogidas ha sido actualizada.",
        variant: "default",
      })
    } catch (error) {
      console.error("❌ Error guardando configuración:", error)
      toast({
        title: "Error guardando configuración",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addCcEmail = () => {
    if (newCcEmail && !config.cc_emails.includes(newCcEmail)) {
      setConfig((prev) => ({
        ...prev,
        cc_emails: [...prev.cc_emails, newCcEmail],
      }))
      setNewCcEmail("")
    }
  }

  const removeCcEmail = (email: string) => {
    setConfig((prev) => ({
      ...prev,
      cc_emails: prev.cc_emails.filter((e) => e !== email),
    }))
  }

  const addExtornosCcEmail = () => {
    if (newExtornosCcEmail && !extornosConfig.cc_emails.includes(newExtornosCcEmail)) {
      setExtornosConfig((prev) => ({
        ...prev,
        cc_emails: [...prev.cc_emails, newExtornosCcEmail],
      }))
      setNewExtornosCcEmail("")
    }
  }

  const removeExtornosCcEmail = (email: string) => {
    setExtornosConfig((prev) => ({
      ...prev,
      cc_emails: prev.cc_emails.filter((e) => e !== email),
    }))
  }

  const addEntregasCcEmail = () => {
    if (newEntregasCcEmail && !entregasConfig.cc_emails.includes(newEntregasCcEmail)) {
      setEntregasConfig((prev) => ({
        ...prev,
        cc_emails: [...prev.cc_emails, newEntregasCcEmail],
      }))
      setNewEntregasCcEmail("")
    }
  }

  const removeEntregasCcEmail = (email: string) => {
    setEntregasConfig((prev) => ({
      ...prev,
      cc_emails: prev.cc_emails.filter((e) => e !== email),
    }))
  }

  const addRecogidasCcEmail = () => {
    if (newRecogidasCcEmail.trim() && !recogidasConfig.cc_emails.includes(newRecogidasCcEmail.trim())) {
      setRecogidasConfig((prev) => ({
        ...prev,
        cc_emails: [...prev.cc_emails, newRecogidasCcEmail.trim()],
      }))
      setNewRecogidasCcEmail("")
    }
  }

  const removeRecogidasCcEmail = (email: string) => {
    setRecogidasConfig((prev) => ({
      ...prev,
      cc_emails: prev.cc_emails.filter((e) => e !== email),
    }))
  }

  const sendTestEmail = async () => {
    if (!testEmail) return

    setLoading(true)
    try {
      console.log("📧 Enviando email de prueba a:", testEmail)

      const response = await fetch("/api/admin/email-config/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testEmail,
          config: config,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        console.log("✅ Email de prueba enviado:", result)

        toast({
          title: "Email de prueba enviado",
          description: `Se ha enviado un correo de prueba a ${testEmail}`,
          variant: "default",
        })
      } else {
        throw new Error(result.error || "Error enviando email de prueba")
      }
    } catch (error) {
      console.error("❌ Error enviando email de prueba:", error)

      toast({
        title: "Error enviando email de prueba",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePreviewExtornoEmail = async (type: "registro" | "tramitacion" | "confirmacion" | "rechazo") => {
    if (!previewExtornoId) {
      toast({
        title: "ID de Extorno Requerido",
        description: "Por favor, introduce un ID de extorno para previsualizar.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setPreviewHtml("")
    setCurrentPreviewType(`extorno-${type}`)
    try {
      const response = await fetch(`/api/extornos/preview-email-html?extornoId=${previewExtornoId}&type=${type}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al cargar la previsualización del email.")
      }
      const html = await response.text()
      setPreviewHtml(html)
      setIsPreviewModalOpen(true)
      toast({
        title: "Previsualización cargada",
        description: `Previsualización del email de ${type} cargada.`,
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

  const handlePreviewMovimientoEmail = async () => {
    setLoading(true)
    setPreviewHtml("")
    setCurrentPreviewType("movimiento")
    try {
      // Para movimientos, no hay un ID específico, la API genera un ejemplo
      const response = await fetch(`/api/movimientos/preview-email-html`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al cargar la previsualización del email de movimientos.")
      }
      const html = await response.text()
      setPreviewHtml(html)
      setIsPreviewModalOpen(true)
      toast({
        title: "Previsualización cargada",
        description: `Previsualización del email de movimientos cargada.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error fetching movement email preview:", error)
      toast({
        title: "Error de previsualización",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePreviewEntregaEmail = async () => {
    if (!previewEntregaMatricula) {
      toast({
        title: "Matrícula Requerida",
        description: "Por favor, introduce una matrícula para previsualizar.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setPreviewHtml("")
    setCurrentPreviewType("entrega")
    try {
      const response = await fetch(
        `/api/entregas/preview-email-html?matricula=${encodeURIComponent(previewEntregaMatricula)}`,
      )
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al cargar la previsualización del email de entregas.")
      }
      const html = await response.text()
      setPreviewHtml(html)
      setIsPreviewModalOpen(true)
      toast({
        title: "Previsualización cargada",
        description: `Previsualización del email de entregas cargada.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error fetching entrega email preview:", error)
      toast({
        title: "Error de previsualización",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendTestEmail = async () => {
    setSendingTestEmail(true)
    try {
      const requestBody: any = { type: currentPreviewType }

      // Añadir IDs específicos según el tipo
      if (currentPreviewType.startsWith("extorno-")) {
        requestBody.extornoId = previewExtornoId
      } else if (currentPreviewType === "entrega") {
        // Para entregas, necesitamos buscar el ID por matrícula primero
        const response = await fetch(
          `/api/entregas/preview-email-html?matricula=${encodeURIComponent(previewEntregaMatricula)}`,
        )
        if (response.ok) {
          // Obtener el ID de la entrega desde la respuesta
          const supabase = await import("@/lib/supabase/client")
          const { data } = await supabase
            .createClient()
            .from("entregas")
            .select("id")
            .eq("matricula", previewEntregaMatricula.toUpperCase())
            .single()

          if (data) {
            requestBody.entregaId = data.id
          }
        }
      }

      const response = await fetch("/api/admin/email-config/send-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Email de prueba enviado",
          description: `Se ha enviado un correo de prueba a jordi.viciana@munichgroup.es`,
          variant: "default",
        })
      } else {
        throw new Error(result.error || "Error enviando email de prueba")
      }
    } catch (error) {
      console.error("❌ Error enviando email de prueba:", error)
      toast({
        title: "Error enviando email de prueba",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSendingTestEmail(false)
    }
  }

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="flex items-center gap-2">
        <Mail className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Configuración de Notificaciones por Email</h1>
      </div>

      {loadError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error cargando configuración:</strong> {loadError}
            <br />
            <Button variant="outline" size="sm" onClick={loadConfigs} className="mt-2 bg-transparent">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Variables de entorno SMTP requeridas:</strong>
          <br />• SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
          <br />• EXTORNO_EMAIL, EXTORNO_PASSWORD (para extornos)
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="movimientos" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="movimientos" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Movimientos
          </TabsTrigger>
          <TabsTrigger value="entregas" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Entregas
          </TabsTrigger>
          <TabsTrigger value="recogidas" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Recogidas
          </TabsTrigger>
          <TabsTrigger value="extornos" className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Extornos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="movimientos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Estado del Sistema - Movimientos
              </CardTitle>
              <CardDescription>
                Activar o desactivar el envío automático de notificaciones de movimientos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={config.enabled}
                  onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, enabled: checked }))}
                />
                <Label htmlFor="enabled">
                  {config.enabled ? "✅ Envío automático activado" : "❌ Envío automático desactivado"}
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Cuentas en Copia - Movimientos
              </CardTitle>
              <CardDescription>
                Estas cuentas recibirán copia de TODAS las notificaciones de movimientos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={newCcEmail}
                  onChange={(e) => setNewCcEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addCcEmail()}
                />
                <Button onClick={addCcEmail} size="sm" disabled={!newCcEmail}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {config.cc_emails.map((email, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {email}
                    <button onClick={() => removeCcEmail(email)} className="ml-1 hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {config.cc_emails.length === 0 && (
                <p className="text-sm text-muted-foreground">No hay cuentas configuradas</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Previsualización de Plantilla de Movimientos
              </CardTitle>
              <CardDescription>Previsualiza el email de movimientos con datos de ejemplo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handlePreviewMovimientoEmail} disabled={loading}>
                <Eye className="h-4 w-4 mr-2" />
                Previsualizar Email de Movimientos
              </Button>
              <p className="text-sm text-muted-foreground">
                Este email se genera con datos de ejemplo, ya que los movimientos se agrupan.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prueba de Configuración</CardTitle>
              <CardDescription>
                Envía un correo de prueba para verificar que el sistema funciona correctamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <Button onClick={sendTestEmail} disabled={!testEmail || loading}>
                  {loading ? "Enviando..." : "Enviar Prueba"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveMovimientosConfig} disabled={loading}>
              {loading ? "Guardando..." : "Guardar Configuración de Movimientos"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="entregas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Estado del Sistema - Entregas
              </CardTitle>
              <CardDescription>
                Activar o desactivar el envío automático de notificaciones de entregas
                <br />
                <strong>Remitente:</strong> entrega@controlvo.ovh
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="entregas-enabled"
                  checked={entregasConfig.enabled}
                  onCheckedChange={(checked) => setEntregasConfig((prev) => ({ ...prev, enabled: checked }))}
                />
                <Label htmlFor="entregas-enabled">
                  {entregasConfig.enabled ? "✅ Envío automático activado" : "❌ Envío automático desactivado"}
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cuentas en Copia - Entregas</CardTitle>
              <CardDescription>Estas cuentas recibirán copia de TODAS las notificaciones de entregas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={newEntregasCcEmail}
                  onChange={(e) => setNewEntregasCcEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addEntregasCcEmail()}
                />
                <Button onClick={addEntregasCcEmail} size="sm" disabled={!newEntregasCcEmail}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {entregasConfig.cc_emails.map((email, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {email}
                    <button onClick={() => removeEntregasCcEmail(email)} className="ml-1 hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {entregasConfig.cc_emails.length === 0 && (
                <p className="text-sm text-muted-foreground">No hay cuentas configuradas</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Previsualización de Plantilla de Entregas
              </CardTitle>
              <CardDescription>Selecciona una matrícula para previsualizar el email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="preview-entrega-matricula">Matrícula para Previsualizar</Label>
                <Input
                  id="preview-entrega-matricula"
                  type="text"
                  value={previewEntregaMatricula}
                  onChange={(e) => setPreviewEntregaMatricula(e.target.value.toUpperCase())}
                  placeholder="Ej: 1234ABC"
                />
                <p className="text-sm text-muted-foreground">
                  Usa una matrícula existente en tu base de datos de entregas para ver datos reales.
                </p>
              </div>
              <Button onClick={handlePreviewEntregaEmail} disabled={loading || !previewEntregaMatricula}>
                <Eye className="h-4 w-4 mr-2" />
                Previsualizar Email de Entrega
              </Button>
            </CardContent>
          </Card>

          <Alert>
            <Truck className="h-4 w-4" />
            <AlertDescription>
              <strong>Proceso automático de entregas:</strong>
              <br />
              1. <strong>Registro:</strong> Se registra la fecha de entrega manualmente
              <br />
              2. <strong>Envío:</strong> Se hace clic en el botón de avión para enviar notificación
              <br />
              3. <strong>Notificación:</strong> Email a todos los configurados con detalles de la entrega
              <br />
              <br />
              <strong>Incluye información de incidencias destacadas en rojo.</strong>
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Button onClick={saveEntregasConfig} disabled={loading}>
              {loading ? "Guardando..." : "Guardar Configuración de Entregas"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="recogidas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Estado del Sistema - Recogidas
              </CardTitle>
              <CardDescription>
                Activar o desactivar el envío automático de notificaciones de recogidas
                <br />
                <strong>Remitente:</strong> recogidas@controlvo.ovh
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="recogidas-enabled"
                  checked={recogidasConfig.enabled}
                  onCheckedChange={(checked) => setRecogidasConfig((prev) => ({ ...prev, enabled: checked }))}
                />
                <Label htmlFor="recogidas-enabled">
                  {recogidasConfig.enabled ? "✅ Envío automático activado" : "❌ Envío automático desactivado"}
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cuentas en Copia - Recogidas</CardTitle>
              <CardDescription>Estas cuentas recibirán copia de TODAS las notificaciones de recogidas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={newRecogidasCcEmail}
                  onChange={(e) => setNewRecogidasCcEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addRecogidasCcEmail()}
                />
                <Button onClick={addRecogidasCcEmail} size="sm" disabled={!newRecogidasCcEmail}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {recogidasConfig.cc_emails.map((email, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {email}
                    <button onClick={() => removeRecogidasCcEmail(email)} className="ml-1 hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {recogidasConfig.cc_emails.length === 0 && (
                <p className="text-sm text-muted-foreground">No hay cuentas configuradas</p>
              )}
            </CardContent>
          </Card>

          <Alert>
            <Truck className="h-4 w-4" />
            <AlertDescription>
              <strong>Proceso automático de recogidas:</strong>
              <br />
              1. <strong>Registro:</strong> Email a Usuario 1 (quien registra), Usuario 2 (CC) y Usuario 3 (tramitador)
              <br />
              2. <strong>Tramitación:</strong> Email a todos + Usuario 4 (pagador) con botón de confirmación
              <br />
              3. <strong>Confirmación:</strong> Email final a todos confirmando que el pago se completó
              <br />
              <br />
              <strong>Las plantillas de email están predefinidas y optimizadas.</strong>
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Button onClick={saveRecogidasConfig} disabled={loading}>
              {loading ? "Guardando..." : "Guardar Configuración de Recogidas"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="extornos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Estado del Sistema - Extornos
              </CardTitle>
              <CardDescription>
                Activar o desactivar el envío automático de notificaciones de extornos
                <br />
                <strong>Remitente:</strong> extorno@controlvo.ovh
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="extornos-enabled"
                  checked={extornosConfig.enabled}
                  onCheckedChange={(checked) => setExtornosConfig((prev) => ({ ...prev, enabled: checked }))}
                />
                <Label htmlFor="extornos-enabled">
                  {extornosConfig.enabled ? "✅ Envío automático activado" : "❌ Envío automático desactivado"}
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usuarios del Proceso de Extornos</CardTitle>
              <CardDescription>Configurar los emails de los usuarios involucrados en el proceso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email_tramitador">Email del Tramitador (Usuario 3)</Label>
                  <Input
                    id="email_tramitador"
                    type="email"
                    value={extornosConfig.email_tramitador}
                    onChange={(e) => setExtornosConfig((prev) => ({ ...prev, email_tramitador: e.target.value }))}
                    placeholder="tramitador@ejemplo.com"
                  />
                  <p className="text-xs text-muted-foreground">Quien revisa y tramita los extornos</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_pagador">Email del Responsable de Pagos (Usuario 4)</Label>
                  <Input
                    id="email_pagador"
                    type="email"
                    value={extornosConfig.email_pagador}
                    onChange={(e) => setExtornosConfig((prev) => ({ ...prev, email_pagador: e.target.value }))}
                    placeholder="pagos@ejemplo.com"
                  />
                  <p className="text-xs text-muted-foreground">Quien realiza los pagos de extornos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cuentas en Copia - Extornos</CardTitle>
              <CardDescription>
                Estas cuentas recibirán copia de TODAS las notificaciones de extornos (Usuario 2)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={newExtornosCcEmail}
                  onChange={(e) => setNewExtornosCcEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addExtornosCcEmail()}
                />
                <Button onClick={addExtornosCcEmail} size="sm" disabled={!newExtornosCcEmail}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {extornosConfig.cc_emails.map((email, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {email}
                    <button onClick={() => removeExtornosCcEmail(email)} className="ml-1 hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {extornosConfig.cc_emails.length === 0 && (
                <p className="text-sm text-muted-foreground">No hay cuentas configuradas</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Previsualización de Plantillas de Extornos
              </CardTitle>
              <CardDescription>
                Selecciona un ID de extorno para previsualizar los diferentes tipos de emails.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="preview-extorno-id">ID de Extorno para Previsualizar</Label>
                <Input
                  id="preview-extorno-id"
                  type="number"
                  value={previewExtornoId}
                  onChange={(e) => setPreviewExtornoId(e.target.value)}
                  placeholder="Ej: 129"
                />
                <p className="text-sm text-muted-foreground">
                  Usa un ID de extorno existente en tu base de datos para ver datos reales.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => handlePreviewExtornoEmail("registro")} disabled={loading || !previewExtornoId}>
                  <Eye className="h-4 w-4 mr-2" />
                  Previsualizar Registro
                </Button>
                <Button
                  onClick={() => handlePreviewExtornoEmail("tramitacion")}
                  disabled={loading || !previewExtornoId}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Previsualizar Tramitación
                </Button>
                <Button
                  onClick={() => handlePreviewExtornoEmail("confirmacion")}
                  disabled={loading || !previewExtornoId}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Previsualizar Confirmación
                </Button>
                <Button onClick={() => handlePreviewExtornoEmail("rechazo")} disabled={loading || !previewExtornoId}>
                  <Eye className="h-4 w-4 mr-2" />
                  Previsualizar Rechazo
                </Button>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              <strong>Proceso automático de extornos:</strong>
              <br />
              1. <strong>Registro:</strong> Email a Usuario 1 (quien registra), Usuario 2 (CC) y Usuario 3 (tramitador)
              <br />
              2. <strong>Tramitación:</strong> Email a todos + Usuario 4 (pagador) con botón de confirmación
              <br />
              3. <strong>Confirmación:</strong> Email final a todos confirmando que el pago se completó
              <br />
              <br />
              <strong>Las plantillas de email están predefinidas y optimizadas.</strong>
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Button onClick={saveExtornosConfig} disabled={loading}>
              {loading ? "Guardando..." : "Guardar Configuración de Extornos"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Previsualización de Email</DialogTitle>
          </DialogHeader>
          <div className="flex-grow border rounded-lg overflow-hidden">
            {previewHtml ? (
              <iframe
                srcDoc={previewHtml}
                title="Email Preview"
                className="w-full h-full border-none"
                sandbox="allow-same-origin allow-scripts"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Cargando previsualización...
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewModalOpen(false)}>
              Cerrar
            </Button>
            <Button onClick={handleSendTestEmail} disabled={sendingTestEmail}>
              <Send className="h-4 w-4 mr-2" />
              {sendingTestEmail ? "Enviando..." : "Enviar a Jordi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
