"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, CheckCircle, XCircle } from "lucide-react"

export default function TestEmailRealizadoPage() {
  const [extornoId, setExtornoId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleTestEmail = async () => {
    if (!extornoId.trim()) {
      alert("Por favor ingresa un ID de extorno")
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/test-email-realizado-standalone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          extorno_id: extornoId.trim(),
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: "Error de conexión",
        error: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Prueba Email de Extorno Realizado (Standalone)
          </CardTitle>
          <CardDescription>
            Prueba el envío de email usando un endpoint independiente sin autenticación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="extornoId" className="text-sm font-medium">
              ID del Extorno
            </label>
            <Input
              id="extornoId"
              type="text"
              placeholder="Ingresa el ID del extorno"
              value={extornoId}
              onChange={(e) => setExtornoId(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleTestEmail} 
            disabled={isLoading || !extornoId.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando Email...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Probar Email de Realizado
              </>
            )}
          </Button>

          {result && (
            <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                  <strong>{result.message}</strong>
                  {result.error && (
                    <div className="mt-2 text-sm">
                      <strong>Error:</strong> {typeof result.error === 'string' ? result.error : JSON.stringify(result.error)}
                    </div>
                  )}
                  {result.result && (
                    <div className="mt-2 text-sm">
                      <strong>Detalles:</strong> {JSON.stringify(result.result, null, 2)}
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Instrucciones:</h3>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Ingresa el ID de cualquier extorno (con o sin justificante)</li>
              <li>El email se enviará a la dirección configurada en EXTORNO_EMAIL</li>
              <li>Haz clic en "Probar Email de Realizado"</li>
              <li>Revisa la consola del servidor para ver los logs</li>
              <li>Verifica que el email se envíe correctamente</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 