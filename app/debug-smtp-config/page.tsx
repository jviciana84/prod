"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Mail, CheckCircle, XCircle } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"

export default function DebugSMTPConfig() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const { toast } = useToast()

  const testSMTP = async () => {
    setLoading(true)
    setResults(null)

    try {
      const response = await fetch("/api/debug-smtp-config", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "❌ Error",
          description: data.error || "Error desconocido",
          variant: "destructive",
        })
      } else {
        toast({
          title: "✅ Configuración verificada",
          description: data.errors.length > 0 ? "Se encontraron problemas" : "Todo está funcionando correctamente",
        })
      }

      setResults(data)
    } catch (error) {
      console.error("Error verificando SMTP:", error)
      toast({
        title: "❌ Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Debug de Configuración SMTP
          </CardTitle>
          <CardDescription>
            Verifica la configuración SMTP y envía un email de prueba
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={testSMTP} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <BMWMSpinner size={16} />
                Verificando...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Verificar SMTP
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Resultados de la Verificación
            </CardTitle>
            <CardDescription>
              Verificado el {new Date(results.timestamp).toLocaleString("es-ES")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Configuración SMTP */}
            <div>
              <h3 className="text-lg font-semibold mb-3">🔧 Variables de Entorno SMTP</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(results.smtpConfig).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Badge variant={value.toString().includes("✅") ? "default" : "destructive"}>
                      {value.toString().includes("✅") ? "OK" : "ERROR"}
                    </Badge>
                    <span className="text-sm font-medium">{key}:</span>
                    <span className="text-sm">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Configuración de Email */}
            {results.emailConfig && Object.keys(results.emailConfig).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">📧 Configuración de Email</h3>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <strong>Habilitado:</strong> {results.emailConfig.enabled ? "✅ Sí" : "❌ No"}
                    </div>
                    <div>
                      <strong>Email Agencia:</strong> {results.emailConfig.email_agencia || "No configurado"}
                    </div>
                    <div>
                      <strong>Email Remitente:</strong> {results.emailConfig.email_remitente || "No configurado"}
                    </div>
                    <div>
                      <strong>Nombre Remitente:</strong> {results.emailConfig.nombre_remitente || "No configurado"}
                    </div>
                    <div className="md:col-span-2">
                      <strong>Asunto Template:</strong> {results.emailConfig.asunto_template || "No configurado"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pruebas */}
            <div>
              <h3 className="text-lg font-semibold mb-3">🧪 Pruebas Realizadas</h3>
              <div className="space-y-3">
                {results.tests.smtpConnection && (
                  <div className="flex items-center gap-2">
                    {results.tests.smtpConnection.includes("✅") ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      <strong>Conexión SMTP:</strong> {results.tests.smtpConnection}
                    </span>
                  </div>
                )}
                {results.tests.emailTest && (
                  <div className="flex items-center gap-2">
                    {results.tests.emailTest.includes("✅") ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      <strong>Email de Prueba:</strong> {results.tests.emailTest}
                    </span>
                  </div>
                )}
                {results.tests.messageId && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Message ID:</strong> {results.tests.messageId}
                  </div>
                )}
              </div>
            </div>

            {/* Errores */}
            {results.errors.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-red-600">❌ Errores Encontrados</h3>
                <div className="space-y-3">
                  {results.errors.map((error: any, index: number) => (
                    <Alert key={index} variant="destructive">
                      <AlertDescription>
                        <div className="font-semibold">
                          {error.operation && `Operación: ${error.operation}`}
                        </div>
                        <div className="text-sm mt-1">{error.error}</div>
                        {error.code && (
                          <div className="text-xs text-red-300 mt-1">Código: {error.code}</div>
                        )}
                        {error.details && (
                          <div className="text-xs text-red-300 mt-1">
                            Detalles: {JSON.stringify(error.details)}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Recomendaciones */}
            <div>
              <h3 className="text-lg font-semibold mb-3">💡 Recomendaciones</h3>
              <div className="space-y-2 text-sm">
                {!results.smtpConfig.SMTP_HOST?.includes("✅") && (
                  <Alert>
                    <AlertDescription>
                      <strong>⚠️ SMTP_HOST no configurado:</strong> Necesitas configurar la variable de entorno SMTP_HOST en tu archivo .env.local
                    </AlertDescription>
                  </Alert>
                )}
                {!results.smtpConfig.SMTP_USER?.includes("✅") && (
                  <Alert>
                    <AlertDescription>
                      <strong>⚠️ SMTP_USER no configurado:</strong> Necesitas configurar la variable de entorno SMTP_USER en tu archivo .env.local
                    </AlertDescription>
                  </Alert>
                )}
                {!results.smtpConfig.SMTP_PASSWORD?.includes("✅") && (
                  <Alert>
                    <AlertDescription>
                      <strong>⚠️ SMTP_PASSWORD no configurado:</strong> Necesitas configurar la variable de entorno SMTP_PASSWORD en tu archivo .env.local
                    </AlertDescription>
                  </Alert>
                )}
                {results.tests.smtpConnection?.includes("❌") && results.tests.smtpConnection?.includes("Error de conexión") && (
                  <Alert>
                    <AlertDescription>
                      <strong>⚠️ Error de conexión SMTP:</strong> Verifica que las credenciales SMTP sean correctas y que el servidor esté disponible
                    </AlertDescription>
                  </Alert>
                )}
                {results.tests.emailTest?.includes("✅") && (
                  <Alert>
                    <AlertDescription>
                      <strong>✅ Configuración correcta:</strong> El sistema SMTP está funcionando correctamente. El problema puede estar en otro lugar.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 