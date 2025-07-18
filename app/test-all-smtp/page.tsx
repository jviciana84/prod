"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface SmtpResult {
  name: string
  success: boolean
  message?: string
  error?: string
  code?: string
  config: {
    host: string
    user: string
    pass: string
    port: string
  }
}

interface TestResponse {
  success: boolean
  results: SmtpResult[]
  workingConfig: {
    name: string
    config: {
      host: string
      user: string
      pass: string
      port: string
    }
  } | null
  timestamp: string
  recommendations: string[]
}

export default function TestAllSmtpPage() {
  const [result, setResult] = useState<TestResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const testAllSmtp = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-all-smtp", {
        method: "POST"
      })
      const data = await response.json()
      
      setResult(data)
      
      if (data.success) {
        toast.success("Configuración SMTP funcional encontrada")
      } else {
        toast.error("Ninguna configuración SMTP funcionó")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Prueba Todas Configuraciones SMTP</h1>
        <Button onClick={testAllSmtp} disabled={loading}>
          {loading ? "Probando..." : "Probar Todas Configuraciones"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instrucciones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Esta página probará todas las configuraciones SMTP disponibles en Vercel para encontrar cuál funciona.
            Esto nos ayudará a identificar qué variables están configuradas y cuál es la configuración correcta.
          </p>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Resultado General
                <Badge variant={result.success ? "default" : "destructive"}>
                  {result.success ? "Configuración Encontrada" : "Ninguna Funciona"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.workingConfig && (
                <div className="p-4 bg-green-50 border border-green-200 rounded mb-4">
                  <h3 className="font-medium text-green-800 mb-2">✅ Configuración Funcional:</h3>
                  <p className="text-sm text-green-700 mb-1"><strong>Nombre:</strong> {result.workingConfig.name}</p>
                  <p className="text-sm text-green-700 mb-1"><strong>Host:</strong> {result.workingConfig.config.host}</p>
                  <p className="text-sm text-green-700 mb-1"><strong>Usuario:</strong> {result.workingConfig.config.user}</p>
                  <p className="text-sm text-green-700 mb-1"><strong>Puerto:</strong> {result.workingConfig.config.port}</p>
                </div>
              )}
              
              {result.recommendations.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Recomendaciones:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {result.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-muted-foreground">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resultados Detallados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.results.map((test, index) => (
                  <div key={index} className={`p-3 border rounded ${test.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{test.name}</h4>
                      <Badge variant={test.success ? "default" : "destructive"}>
                        {test.success ? "✅ Éxito" : "❌ Error"}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                      <div>
                        <span className="font-medium">Host:</span> {test.config.host}
                      </div>
                      <div>
                        <span className="font-medium">Puerto:</span> {test.config.port}
                      </div>
                      <div>
                        <span className="font-medium">Usuario:</span> {test.config.user}
                      </div>
                      <div>
                        <span className="font-medium">Contraseña:</span> {test.config.pass}
                      </div>
                    </div>
                    
                    {test.success && test.message && (
                      <p className="text-sm text-green-700">{test.message}</p>
                    )}
                    
                    {!test.success && test.error && (
                      <div>
                        <p className="text-sm text-red-700 font-medium">Error: {test.error}</p>
                        {test.code && (
                          <p className="text-xs text-red-600">Código: {test.code}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timestamp</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-sm">{result.timestamp}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 