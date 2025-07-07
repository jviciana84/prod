"use client"

import { CardContent } from "@/components/ui/card"

import { CardTitle } from "@/components/ui/card"

import { CardHeader } from "@/components/ui/card"

import { Card } from "@/components/ui/card"

import { Button } from "@/components/ui/button"

import { useState } from "react"

import { CardDescription } from "@/components/ui/card"
import { ExtornoTokenTester } from "@/components/admin/extorno-token-tester"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input" // Import Input
import { Label } from "@/components/ui/label" // Import Label
import { toast } from "sonner"
import { Bug, TestTube, CheckCircle, AlertTriangle, Send, Database, Settings, Mail, Lightbulb } from "lucide-react"

export default function ExtornosDiagnosticPage() {
  const [loading, setLoading] = useState(false)
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null)
  const [testEmailRecipient, setTestEmailRecipient] = useState("") // New state for recipient email

  const ejecutarDiagnostico = async () => {
    try {
      setLoading(true)
      console.log("🔍 Ejecutando diagnóstico completo...")

      const response = await fetch("/api/extornos/debug")
      const result = await response.json()

      setDiagnosticResult(result)
      console.log("🔍 Resultado del diagnóstico:", result)

      toast.success("Diagnóstico completado - Ver resultados abajo")
    } catch (error) {
      console.error("❌ Error en diagnóstico:", error)
      toast.error("Error ejecutando diagnóstico")
    } finally {
      setLoading(false)
    }
  }

  const sendTestEmail = async (type: "registro" | "tramitacion" | "rechazo" | "confirmacion" | "simple") => {
    if (!testEmailRecipient) {
      toast.error("Por favor, introduce una dirección de correo para el test.")
      return
    }

    try {
      setLoading(true)
      console.log(`📧 Enviando email de prueba tipo '${type}' a ${testEmailRecipient}...`)

      const response = await fetch("/api/extornos/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetEmail: testEmailRecipient,
          type: type === "simple" ? "registro" : type, // 'simple' maps to 'registro' for the old test button
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success(`✅ Email de prueba tipo '${type}' enviado correctamente a ${testEmailRecipient}`)
        console.log("✅ Email enviado:", result)
      } else {
        toast.error(`❌ Error en test: ${result.error}`)
        console.error("❌ Error en test:", result)
      }
    } catch (error) {
      console.error("❌ Error en test de email:", error)
      toast.error("Error en test de email")
    } finally {
      setLoading(false)
    }
  }

  const enviarEmailUltimoExtorno = async () => {
    try {
      setLoading(true)
      console.log("📧 Enviando email para último extorno...")

      if (!diagnosticResult?.lastExtorno?.id) {
        toast.error("No hay extorno para enviar email")
        return
      }

      const response = await fetch("/api/extornos/auto-send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          extorno_id: diagnosticResult.lastExtorno.id,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success("✅ Email enviado para el último extorno")
        console.log("✅ Email enviado:", result)
      } else {
        toast.error(`❌ Error enviando email: ${result.error}`)
        console.error("❌ Error:", result)
      }
    } catch (error) {
      console.error("❌ Error enviando email:", error)
      toast.error("Error enviando email")
    } finally {
      setLoading(false)
    }
  }

  const crearTrigger = async () => {
    try {
      setLoading(true)
      console.log("🔧 Creando trigger automático...")

      // Aquí ejecutarías el script SQL del trigger
      toast.success("Trigger creado - Ejecutar script SQL manualmente")
      console.log("📝 Ejecutar: scripts/create_extorno_email_trigger.sql")
    } catch (error) {
      console.error("❌ Error creando trigger:", error)
      toast.error("Error creando trigger")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Diagnóstico del Sistema de Extornos</h1>
        <p className="text-muted-foreground">
          Herramientas para verificar y solucionar problemas con el flujo de extornos.
        </p>
      </header>

      <ExtornoTokenTester />

      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertTitle>Flujo de Trabajo para Diagnóstico</AlertTitle>
        <AlertDescription>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Copia el ID de un extorno en estado "pendiente" o "tramitando" desde la tabla de extornos.</li>
            <li>Pega el ID en la herramienta de arriba y haz clic en "Generar y Guardar Token de Prueba".</li>
            <li>
              Revisa el resultado. Si es exitoso, el problema está resuelto. Si falla, los logs del servidor nos darán
              el error exacto de la base de datos.
            </li>
            <li>
              Una vez que la prueba sea exitosa, el flujo completo de envío de email debería funcionar correctamente.
            </li>
          </ol>
        </AlertDescription>
      </Alert>

      <Separator />

      {/* Acciones principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button onClick={ejecutarDiagnostico} disabled={loading} className="h-20 flex flex-col gap-2">
          <Bug className="h-6 w-6" />
          <span>Ejecutar Diagnóstico</span>
        </Button>

        <Button
          onClick={() => sendTestEmail("simple")}
          disabled={loading}
          variant="outline"
          className="h-20 flex flex-col gap-2"
        >
          <TestTube className="h-6 w-6" />
          <span>Test de Email (Simple)</span>
        </Button>

        <Button
          onClick={enviarEmailUltimoExtorno}
          disabled={loading || !diagnosticResult?.lastExtorno}
          variant="outline"
          className="h-20 flex flex-col gap-2 bg-transparent"
        >
          <Send className="h-6 w-6" />
          <span>Enviar Email Último</span>
        </Button>

        <Button
          onClick={crearTrigger}
          disabled={loading}
          variant="outline"
          className="h-20 flex flex-col gap-2 bg-transparent"
        >
          <Database className="h-6 w-6" />
          <span>Crear Trigger</span>
        </Button>
      </div>

      <Separator />

      {/* Sección de Test de Emails Simulados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Test de Emails Simulados
          </CardTitle>
          <CardDescription>Envía emails de prueba a una dirección específica sin afectar datos reales.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="test-email-recipient">Email de Destino</Label>
            <Input
              id="test-email-recipient"
              type="email"
              placeholder="tu.email@example.com"
              value={testEmailRecipient}
              onChange={(e) => setTestEmailRecipient(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button onClick={() => sendTestEmail("registro")} disabled={loading} variant="secondary">
              Simular Registro
            </Button>
            <Button onClick={() => sendTestEmail("tramitacion")} disabled={loading} variant="secondary">
              Simular Tramitación
            </Button>
            <Button onClick={() => sendTestEmail("rechazo")} disabled={loading} variant="secondary">
              Simular Rechazo
            </Button>
            <Button onClick={() => sendTestEmail("confirmacion")} disabled={loading} variant="secondary">
              Simular Confirmación
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados del diagnóstico */}
      {diagnosticResult && (
        <div className="space-y-6">
          <Separator />

          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Resultados del Diagnóstico
          </h2>

          {/* Estado de la configuración */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Estado de la Configuración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <Badge variant={diagnosticResult.config?.enabled ? "default" : "destructive"}>
                    {diagnosticResult.config?.enabled ? "✅ Habilitado" : "❌ Deshabilitado"}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">Sistema</p>
                </div>

                <div className="text-center">
                  <Badge variant={diagnosticResult.config?.email_tramitador ? "default" : "secondary"}>
                    {diagnosticResult.config?.email_tramitador ? "✅ Configurado" : "⚠️ Sin configurar"}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">Tramitador</p>
                </div>

                <div className="text-center">
                  <Badge variant={diagnosticResult.config?.email_pagador ? "default" : "secondary"}>
                    {diagnosticResult.config?.email_pagador ? "✅ Configurado" : "⚠️ Sin configurar"}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">Pagador</p>
                </div>

                <div className="text-center">
                  <Badge variant="outline">{diagnosticResult.config?.cc_emails?.length || 0} emails</Badge>
                  <p className="text-sm text-muted-foreground mt-1">CC</p>
                </div>
              </div>

              {diagnosticResult.config && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Detalles de configuración:</h4>
                  <ul className="text-sm space-y-1">
                    <li>
                      <strong>Tramitador:</strong> {diagnosticResult.config.email_tramitador || "No configurado"}
                    </li>
                    <li>
                      <strong>Pagador:</strong> {diagnosticResult.config.email_pagador || "No configurado"}
                    </li>
                    <li>
                      <strong>CC:</strong> {diagnosticResult.config.cc_emails?.join(", ") || "Ninguno"}
                    </li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Variables de entorno */}
          {diagnosticResult?.envVars && Object.keys(diagnosticResult.envVars).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Variables de Entorno</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(diagnosticResult.envVars).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <Badge variant={value ? "default" : "destructive"}>
                        {value ? "✅" : "❌"} {key}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Último extorno */}
          {diagnosticResult.lastExtorno && (
            <Card>
              <CardHeader>
                <CardTitle>Último Extorno Registrado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="font-medium">Matrícula</p>
                    <p className="text-sm text-muted-foreground">{diagnosticResult.lastExtorno.matricula}</p>
                  </div>
                  <div>
                    <p className="font-medium">Cliente</p>
                    <p className="text-sm text-muted-foreground">{diagnosticResult.lastExtorno.cliente}</p>
                  </div>
                  <div>
                    <p className="font-medium">Importe</p>
                    <p className="text-sm text-muted-foreground">{diagnosticResult.lastExtorno.importe} €</p>
                  </div>
                  <div>
                    <p className="font-medium">Fecha</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(diagnosticResult.lastExtorno.created_at).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Usuario actual */}
          <Card>
            <CardHeader>
              <CardTitle>Usuario Actual</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                <strong>Email:</strong> {diagnosticResult.currentUser}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Instrucciones */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Pasos para solucionar el problema:</strong>
          <br />
          1. Ejecutar diagnóstico para verificar configuración
          <br />
          2. Hacer test de email para verificar SMTP
          <br />
          3. Enviar email manual para el último extorno
          <br />
          4. Crear trigger automático para futuros extornos
          <br />
          5. Ejecutar script SQL: <code>scripts/create_extorno_email_trigger.sql</code>
        </AlertDescription>
      </Alert>
    </div>
  )
}
