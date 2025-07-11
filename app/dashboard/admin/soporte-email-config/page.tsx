"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  Mail, 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  Plus, 
  Trash2,
  Send,
  TestTube
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SoporteEmailConfig {
  enabled: boolean
  sender_email: string
  sender_name: string
  cc_emails: string[]
  subject_template: string
  body_template: string
}

export default function SoporteEmailConfigPage() {
  const { toast } = useToast()
  const [config, setConfig] = useState<SoporteEmailConfig>({
    enabled: true,
    sender_email: "soporte@controlvo.com",
    sender_name: "Sistema CVO - Soporte",
    cc_emails: [],
    subject_template: "Ticket Nº {ticket_number} | {license_plate}",
    body_template: `Estimado cliente,

Se ha registrado correctamente su ticket de soporte.

Detalles del ticket:
- Número de ticket: {ticket_number}
- Fecha de generación: {created_date}
- Tiempo desde la venta: {time_since_sale}
- Email: {client_email}
- Teléfono: {client_phone}

En la mayor brevedad posible será respondido a sus consultas.

Saludos cordiales,
Equipo de Soporte CVO`
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newCcEmail, setNewCcEmail] = useState("")
  const [testEmail, setTestEmail] = useState("")
  const [sendingTest, setSendingTest] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/soporte-email-config")
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      } else {
        toast({
          title: "Error",
          description: "Error cargando configuración",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/soporte-email-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        toast({
          title: "Configuración guardada",
          description: "La configuración de email se ha guardado correctamente",
        })
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Error guardando configuración",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const addCcEmail = () => {
    if (newCcEmail.trim() && !config.cc_emails.includes(newCcEmail.trim())) {
      setConfig({
        ...config,
        cc_emails: [...config.cc_emails, newCcEmail.trim()]
      })
      setNewCcEmail("")
    }
  }

  const removeCcEmail = (email: string) => {
    setConfig({
      ...config,
      cc_emails: config.cc_emails.filter(e => e !== email)
    })
  }

  const sendTestEmail = async () => {
    if (!testEmail.trim()) {
      toast({
        title: "Error",
        description: "Debe introducir un email de prueba",
        variant: "destructive",
      })
      return
    }

    setSendingTest(true)
    try {
      const response = await fetch("/api/admin/soporte-email-config/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          config: config
        }),
      })

      if (response.ok) {
        toast({
          title: "Email de prueba enviado",
          description: "Se ha enviado un email de prueba a la dirección indicada",
        })
        setTestEmail("")
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Error enviando email de prueba",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setSendingTest(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuración de Emails de Soporte</h1>
          <p className="text-gray-600">Configurar notificaciones por email para tickets de soporte</p>
        </div>
        <Button onClick={loadConfig} disabled={loading}>
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Cargando...
            </>
          ) : (
            "Actualizar"
          )}
        </Button>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Variables de entorno SMTP requeridas:</strong>
          <br />• SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuración General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Configuración General
            </CardTitle>
            <CardDescription>
              Configuración básica del sistema de emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="enabled">Habilitar envío de emails</Label>
              <Switch
                id="enabled"
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender_email">Email del remitente</Label>
              <Input
                id="sender_email"
                value={config.sender_email}
                onChange={(e) => setConfig({ ...config, sender_email: e.target.value })}
                placeholder="soporte@controlvo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender_name">Nombre del remitente</Label>
              <Input
                id="sender_name"
                value={config.sender_name}
                onChange={(e) => setConfig({ ...config, sender_name: e.target.value })}
                placeholder="Sistema CVO - Soporte"
              />
            </div>
          </CardContent>
        </Card>

        {/* Emails en Copia */}
        <Card>
          <CardHeader>
            <CardTitle>Emails en Copia (CC)</CardTitle>
            <CardDescription>
              Emails que recibirán copia de todas las notificaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newCcEmail}
                onChange={(e) => setNewCcEmail(e.target.value)}
                placeholder="email@ejemplo.com"
                onKeyPress={(e) => e.key === 'Enter' && addCcEmail()}
              />
              <Button onClick={addCcEmail} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {config.cc_emails.map((email, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">{email}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCcEmail(email)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {config.cc_emails.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay emails en copia configurados
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plantillas de Email */}
      <Card>
        <CardHeader>
          <CardTitle>Plantillas de Email</CardTitle>
          <CardDescription>
            Configurar el formato de los emails enviados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="subject_template">Asunto del email</Label>
            <Input
              id="subject_template"
              value={config.subject_template}
              onChange={(e) => setConfig({ ...config, subject_template: e.target.value })}
              placeholder="Ticket Nº {ticket_number} | {license_plate}"
            />
            <p className="text-xs text-gray-500">
              Variables disponibles: {"{ticket_number}"}, {"{license_plate}"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="body_template">Cuerpo del email</Label>
            <Textarea
              id="body_template"
              value={config.body_template}
              onChange={(e) => setConfig({ ...config, body_template: e.target.value })}
              rows={12}
              placeholder="Contenido del email..."
            />
            <p className="text-xs text-gray-500">
              Variables disponibles: {"{ticket_number}"}, {"{created_date}"}, {"{time_since_sale}"}, {"{client_email}"}, {"{client_phone}"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email de Prueba */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Email de Prueba
          </CardTitle>
          <CardDescription>
            Enviar un email de prueba para verificar la configuración
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              type="email"
            />
            <Button 
              onClick={sendTestEmail} 
              disabled={sendingTest || !testEmail.trim()}
            >
              {sendingTest ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Prueba
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Botón de Guardar */}
      <div className="flex justify-end">
        <Button onClick={saveConfig} disabled={saving} size="lg">
          {saving ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Configuración
            </>
          )}
        </Button>
      </div>
    </div>
  )
} 