"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, CheckCircle, XCircle, Settings } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"

export default function DebugSMTPPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleDebugSMTP = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/debug-smtp-config")
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
            <Settings className="h-5 w-5" />
            Debug Configuración SMTP
          </CardTitle>
          <CardDescription>
            Verifica la configuración SMTP y la conexión al servidor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleDebugSMTP} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <BMWMSpinner size={16} className="mr-2" />
                Verificando...
              </>
            ) : (
              <>
                <Settings className="mr-2 h-4 w-4" />
                Verificar Configuración SMTP
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
                  
                  {result.config && (
                    <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
                      <h4 className="font-medium mb-2">Configuración:</h4>
                      <div className="space-y-1">
                        <div><strong>SMTP_HOST:</strong> {result.config.SMTP_HOST || "NO CONFIGURADO"}</div>
                        <div><strong>SMTP_PORT:</strong> {result.config.SMTP_PORT || "465 (default)"}</div>
                        <div><strong>SMTP_USER:</strong> {result.config.SMTP_USER || "NO CONFIGURADO"}</div>
                        <div><strong>SMTP_PASSWORD:</strong> {result.config.SMTP_PASSWORD}</div>
                        <div><strong>EXTORNO_EMAIL:</strong> {result.config.EXTORNO_EMAIL || "NO CONFIGURADO"}</div>
                        <div><strong>NEXT_PUBLIC_SITE_URL:</strong> {result.config.NEXT_PUBLIC_SITE_URL || "NO CONFIGURADO"}</div>
                      </div>
                    </div>
                  )}
                  
                  {result.missing && (
                    <div className="mt-2 text-sm">
                      <strong>Variables faltantes:</strong> {result.missing.join(", ")}
                    </div>
                  )}
                  
                  {result.error && (
                    <div className="mt-2 text-sm">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}
                  
                  {result.connection && (
                    <div className="mt-2 text-sm">
                      <strong>Conexión:</strong> {result.connection}
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Variables de Entorno Necesarias:</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <div><code>SMTP_HOST</code> - Servidor SMTP (ej: smtp.gmail.com)</div>
              <div><code>SMTP_PORT</code> - Puerto SMTP (ej: 465 para SSL)</div>
              <div><code>SMTP_USER</code> - Usuario SMTP (ej: extorno@controlvo.ovh)</div>
              <div><code>SMTP_PASSWORD</code> - Contraseña SMTP</div>
              <div><code>EXTORNO_EMAIL</code> - Email remitente (ej: extorno@controlvo.ovh)</div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">Posibles Problemas:</h3>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>Variables de entorno no configuradas en .env.local</li>
              <li>Credenciales SMTP incorrectas</li>
              <li>Servidor SMTP no accesible</li>
              <li>Puerto bloqueado por firewall</li>
              <li>Email en carpeta de spam</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 