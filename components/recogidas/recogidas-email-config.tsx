"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Save, Mail, Plus, X, Settings } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { toast } from "sonner"

interface EmailConfig {
  id: number
  enabled: boolean
  email_agencia: string
  email_remitente: string
  nombre_remitente: string
  asunto_template: string
  cc_emails: string[]
}

export function RecogidasEmailConfig() {
  const supabase = createClientComponentClient()
  const [config, setConfig] = useState<EmailConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newCcEmail, setNewCcEmail] = useState("")

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("recogidas_email_config")
        .select("*")
        .single()

      if (error) {
        console.error("Error cargando configuración:", error)
        toast.error("Error al cargar la configuración")
        return
      }

      setConfig(data)
    } catch (error) {
      console.error("Error inesperado:", error)
      toast.error("Error al cargar la configuración")
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    if (!config) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from("recogidas_email_config")
        .update({
          enabled: config.enabled,
          email_agencia: config.email_agencia,
          email_remitente: config.email_remitente,
          nombre_remitente: config.nombre_remitente,
          asunto_template: config.asunto_template,
          cc_emails: config.cc_emails,
          updated_at: new Date().toISOString()
        })
        .eq("id", config.id)

      if (error) {
        console.error("Error guardando configuración:", error)
        toast.error("Error al guardar la configuración")
        return
      }

      toast.success("Configuración guardada correctamente")
    } catch (error) {
      console.error("Error inesperado:", error)
      toast.error("Error al guardar la configuración")
    } finally {
      setSaving(false)
    }
  }

  const addCcEmail = () => {
    if (!newCcEmail.trim() || !config) return

    const email = newCcEmail.trim().toLowerCase()
    if (!email.includes("@")) {
      toast.error("Email inválido")
      return
    }

    if (config.cc_emails.includes(email)) {
      toast.error("Este email ya está en la lista")
      return
    }

    setConfig({
      ...config,
      cc_emails: [...config.cc_emails, email]
    })
    setNewCcEmail("")
  }

  const removeCcEmail = (emailToRemove: string) => {
    if (!config) return

    setConfig({
      ...config,
      cc_emails: config.cc_emails.filter(email => email !== emailToRemove)
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addCcEmail()
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <BMWMSpinner size={24} />
          <span className="ml-2">Cargando configuración...</span>
        </CardContent>
      </Card>
    )
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No se pudo cargar la configuración</p>
          <Button onClick={loadConfig} className="mt-2">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-500" />
            Configuración de Emails para Recogidas
          </CardTitle>
          <CardDescription>
            Configura los emails que se enviarán cuando se soliciten recogidas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Habilitar/Deshabilitar emails */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Habilitar envío de emails</Label>
              <p className="text-xs text-muted-foreground">
                Cuando esté deshabilitado, no se enviarán emails automáticamente
              </p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
            />
          </div>

          {/* Email de la agencia */}
          <div className="space-y-2">
            <Label htmlFor="email_agencia" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-green-500" />
              Email de la Agencia de Transporte *
            </Label>
            <Input
              id="email_agencia"
              type="email"
              value={config.email_agencia}
              onChange={(e) => setConfig({ ...config, email_agencia: e.target.value })}
              placeholder="recogidas@mrw.es"
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground">
              Email principal donde se enviarán las solicitudes de recogida
            </p>
          </div>

          {/* Configuración del remitente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email_remitente" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500" />
                Email Remitente *
              </Label>
              <Input
                id="email_remitente"
                type="email"
                value={config.email_remitente}
                onChange={(e) => setConfig({ ...config, email_remitente: e.target.value })}
                placeholder="recogidas@controlvo.ovh"
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground">
                Email desde el que se enviarán los mensajes
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre_remitente" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-purple-500" />
                Nombre del Remitente *
              </Label>
              <Input
                id="nombre_remitente"
                type="text"
                value={config.nombre_remitente}
                onChange={(e) => setConfig({ ...config, nombre_remitente: e.target.value })}
                placeholder="Recogidas - Sistema CVO"
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground">
                Nombre que aparecerá como remitente
              </p>
            </div>
          </div>

          {/* Plantilla del asunto */}
          <div className="space-y-2">
            <Label htmlFor="asunto_template" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-orange-500" />
              Plantilla del Asunto *
            </Label>
            <Input
              id="asunto_template"
              type="text"
              value={config.asunto_template}
              onChange={(e) => setConfig({ ...config, asunto_template: e.target.value })}
              placeholder="Recogidas Motor Munich - {cantidad} solicitudes"
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground">
              Plantilla del asunto del email. Usa {"{cantidad}"} para el número de recogidas
            </p>
          </div>

          {/* Emails CC */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-500" />
              Emails en Copia (CC)
            </Label>
            
            <div className="flex gap-2 max-w-md">
              <Input
                type="email"
                value={newCcEmail}
                onChange={(e) => setNewCcEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="email@ejemplo.com"
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={addCcEmail}
                disabled={!newCcEmail.trim()}
                className="px-3"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {config.cc_emails.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {config.cc_emails.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1">
                    {email}
                    <button
                      type="button"
                      onClick={() => removeCcEmail(email)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Emails adicionales que recibirán una copia de las solicitudes de recogida
            </p>
          </div>

          {/* Botón guardar */}
          <div className="pt-4 border-t">
            <Button
              onClick={saveConfig}
              disabled={saving || !config.email_agencia.trim() || !config.email_remitente.trim() || !config.nombre_remitente.trim() || !config.asunto_template.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <BMWMSpinner size={16} className="mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Configuración
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>Destinatario principal:</strong> {config.email_agencia}</p>
            <p><strong>Remitente:</strong> {config.nombre_remitente} &lt;{config.email_remitente}&gt;</p>
            <p><strong>Asunto:</strong> {config.asunto_template}</p>
            <p><strong>Emails en copia:</strong> {config.cc_emails.length > 0 ? config.cc_emails.join(", ") : "Ninguno"}</p>
            <p><strong>Estado:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-xs ${config.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {config.enabled ? 'Habilitado' : 'Deshabilitado'}
              </span>
            </p>
          </div>
          
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Nota:</strong> Los emails se enviarán automáticamente cuando se haga clic en "Enviar Recogidas" 
              desde la página principal de recogidas. El sistema también enviará una copia al usuario que solicita la recogida.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 