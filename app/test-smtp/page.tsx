"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export default function TestSMTPPage() {
  const [isTesting, setIsTesting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>("")

  const testSMTP = async () => {
    setIsTesting(true)
    setResult(null)
    setError("")

    try {
      const response = await fetch("/api/test-smtp-extorno", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.message || "Error desconocido")
      }
    } catch (err: any) {
      setError(err.message || "Error de red")
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Prueba de Configuración SMTP - Extornos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Esta página te permite probar si la configuración SMTP para el sistema de extornos está funcionando correctamente.
          </p>

          <Button 
            onClick={testSMTP} 
            disabled={isTesting}
            className="w-full"
          >
            {isTesting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Probando SMTP...
              </>
            ) : (
              "🧪 Probar Configuración SMTP"
            )}
          </Button>

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-800">✅ Prueba Exitosa</h3>
              </div>
              <p className="text-green-700 mb-2">{result.message}</p>
              <div className="text-sm text-green-600">
                <p><strong>Message ID:</strong> {result.messageId}</p>
                <p><strong>Servidor:</strong> {result.config.host}</p>
                <p><strong>Puerto:</strong> {result.config.port}</p>
                <p><strong>Usuario:</strong> {result.config.user}</p>
                <p><strong>Remitente:</strong> {result.config.from}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-red-800">❌ Error en la Prueba</h3>
              </div>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">📋 Variables Requeridas</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li><code>SMTP_HOST</code> - Servidor SMTP</li>
              <li><code>SMTP_PORT</code> - Puerto SMTP (por defecto 465)</li>
              <li><code>SMTP_USER</code> - Usuario SMTP</li>
              <li><code>SMTP_PASSWORD</code> - Contraseña SMTP</li>
              <li><code>EXTORNO_EMAIL</code> - Email de extornos</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 