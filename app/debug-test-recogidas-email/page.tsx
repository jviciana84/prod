"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Mail, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"

interface TestResult {
  timestamp: string
  steps: Array<{
    step: string
    data?: any
    timestamp: string
  }>
  errors: Array<{
    error: string
    details?: any
    timestamp: string
  }>
  success: boolean
  emailSent: boolean
}

export default function DebugTestRecogidasEmail() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<TestResult | null>(null)
  const { toast } = useToast()

  const runTest = async () => {
    setLoading(true)
    setResults(null)

    try {
      const response = await fetch("/api/debug-test-recogidas-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "❌ Error en la prueba",
          description: data.error || "Error desconocido",
          variant: "destructive",
        })
      } else {
        toast({
          title: data.success ? "✅ Prueba completada" : "⚠️ Prueba con errores",
          description: data.emailSent ? "Email enviado correctamente" : "Revisa los errores",
        })
      }

      setResults(data)
    } catch (error) {
      console.error("Error ejecutando prueba:", error)
      toast({
        title: "❌ Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("es-ES")
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Prueba de Envío de Emails - Recogidas
          </CardTitle>
          <CardDescription>
            Diagnostica y prueba el sistema de envío de emails para recogidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Esta prueba:</strong> Verifica la configuración SMTP, la conexión a la base de datos, 
              la configuración de emails y envía un email de prueba a la agencia configurada.
            </AlertDescription>
          </Alert>

          <div className="flex gap-4">
            <Button 
              onClick={runTest} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <BMWMSpinner size={16} />
                  Ejecutando prueba...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Ejecutar Prueba Completa
                </>
              )}
            </Button>

            {results && (
              <Button 
                onClick={runTest} 
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Repetir Prueba
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {results.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Resultados de la Prueba
            </CardTitle>
            <CardDescription>
              Ejecutada el {formatTimestamp(results.timestamp)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Resumen */}
            <div className="flex gap-4">
              <Badge variant={results.success ? "default" : "destructive"}>
                {results.success ? "✅ Exitoso" : "❌ Fallido"}
              </Badge>
              <Badge variant={results.emailSent ? "default" : "secondary"}>
                {results.emailSent ? "📧 Email Enviado" : "📧 Email No Enviado"}
              </Badge>
              <Badge variant="outline">
                {results.steps.length} Pasos
              </Badge>
              <Badge variant={results.errors.length > 0 ? "destructive" : "default"}>
                {results.errors.length} Errores
              </Badge>
            </div>

            {/* Errores */}
            {results.errors.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-red-600 mb-3">❌ Errores Encontrados</h3>
                <div className="space-y-3">
                  {results.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-semibold">{error.error}</div>
                        {error.details && (
                          <div className="text-sm mt-1">
                            <pre className="whitespace-pre-wrap bg-red-50 p-2 rounded text-xs">
                              {JSON.stringify(error.details, null, 2)}
                            </pre>
                          </div>
                        )}
                        <div className="text-xs text-red-300 mt-1">
                          {formatTimestamp(error.timestamp)}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Pasos */}
            <div>
              <h3 className="text-lg font-semibold mb-3">📋 Pasos Ejecutados</h3>
              <div className="space-y-2">
                {results.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{step.step}</div>
                      {step.data && (
                        <div className="text-sm text-muted-foreground mt-1">
                          <pre className="whitespace-pre-wrap bg-background p-2 rounded text-xs border">
                            {JSON.stringify(step.data, null, 2)}
                          </pre>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatTimestamp(step.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recomendaciones */}
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-3">💡 Recomendaciones</h3>
              <div className="space-y-2 text-sm">
                {!results.success && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Problemas detectados:</strong> Revisa los errores arriba y corrige la configuración antes de intentar enviar emails reales.
                    </AlertDescription>
                  </Alert>
                )}
                
                {results.success && !results.emailSent && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Configuración correcta:</strong> El sistema está configurado correctamente pero no se pudo enviar el email de prueba.
                    </AlertDescription>
                  </Alert>
                )}
                
                {results.success && results.emailSent && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>✅ Sistema funcionando:</strong> El sistema de emails está configurado correctamente y funcionando. Puedes proceder con el envío de recogidas reales.
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