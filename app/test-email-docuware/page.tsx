"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Mail, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export default function TestEmailDocuwarePage() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleTestEmail = async () => {
    setTesting(true)
    setResult(null)

    try {
      const response = await fetch("/api/test-email-docuware", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: data.message,
          messageId: data.messageId,
          recipient: data.recipient,
          testData: data.testData
        })
        toast.success("✅ Email de prueba enviado correctamente")
      } else {
        setResult({
          success: false,
          message: data.message,
          error: data.error
        })
        toast.error(`❌ Error: ${data.message}`)
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: "Error de conexión",
        error: error.message
      })
      toast.error("❌ Error de conexión")
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">🧪 Test Sistema Email Docuware</h1>
          <p className="text-muted-foreground">
            Prueba el sistema de email del modal de Docuware sin usar datos reales
          </p>
        </div>

        {/* Información del test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Información del Test
            </CardTitle>
            <CardDescription>
              Este test enviará un email de prueba a jordi.viciana@munichgroup.es con datos simulados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">📧 Destinatario:</h4>
                <p className="text-sm text-muted-foreground">jordi.viciana@munichgroup.es</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">📋 Datos de prueba:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Matrícula: TEST123 (2ª Llave)</li>
                  <li>• Matrícula: TEST456 (Ficha Técnica)</li>
                  <li>• Usuario entrega: Sistema de Prueba</li>
                  <li>• Usuario recibe: Jordi Viciana</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botón de test */}
        <div className="text-center">
          <Button 
            onClick={handleTestEmail}
            disabled={testing}
            size="lg"
            className="px-8"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Enviando email de prueba...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Enviar Email de Prueba
              </>
            )}
          </Button>
        </div>

        {/* Resultado */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Resultado del Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={result.success ? "default" : "destructive"}>
                  {result.success ? "✅ Éxito" : "❌ Error"}
                </Badge>
                <span className="text-sm">{result.message}</span>
              </div>

              {result.success && (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-1">📧 Message ID:</h4>
                    <p className="text-sm text-muted-foreground font-mono">{result.messageId}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">👤 Destinatario:</h4>
                    <p className="text-sm text-muted-foreground">{result.recipient}</p>
                  </div>
                  {result.testData && (
                    <div>
                      <h4 className="font-medium mb-2">📋 Datos enviados:</h4>
                      <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                        {JSON.stringify(result.testData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {result.error && (
                <div>
                  <h4 className="font-medium mb-1 text-red-600">❌ Error detallado:</h4>
                  <p className="text-sm text-red-500 font-mono">{result.error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instrucciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Instrucciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Haz clic en "Enviar Email de Prueba"</li>
              <li>El sistema verificará la configuración SMTP</li>
              <li>Se enviará un email con datos simulados</li>
              <li>Revisa la bandeja de entrada de jordi.viciana@munichgroup.es</li>
              <li>Verifica que el email llegue correctamente</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 