"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { TestTube, CheckCircle, AlertTriangle, Play } from "lucide-react"

export default function DebugTestAddRecogidaPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testAddRecogida = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/debug-test-add-recogida", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        toast({
          title: "✅ Prueba exitosa",
          description: "La función de añadir recogida funciona correctamente.",
        })
      } else {
        setResult(data)
        toast({
          title: "❌ Error en la prueba",
          description: data.error || "Error desconocido",
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error de conexión"
      setResult({ error: errorMessage })
      toast({
        title: "❌ Error de conexión",
        description: errorMessage,
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
            <TestTube className="h-5 w-5" />
            Prueba de Función - Añadir Recogida
          </CardTitle>
          <CardDescription>
            Prueba la función de añadir recogida en el servidor para identificar problemas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Propósito:</strong> Esta prueba simula la función de añadir recogida en el servidor para identificar si el problema está en el frontend o en la lógica de datos.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={testAddRecogida} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Play className="h-4 w-4 mr-2 animate-spin" />
                Probando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Probar Función de Añadir Recogida
              </>
            )}
          </Button>

          {result && (
            <div className="mt-4">
              {result.success ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Prueba Exitosa:</strong> {result.message}
                    {result.datos_entrada && (
                      <div className="mt-2">
                        <strong>Datos de entrada:</strong>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                          {JSON.stringify(result.datos_entrada, null, 2)}
                        </pre>
                      </div>
                    )}
                    {result.recogida_creada && (
                      <div className="mt-2">
                        <strong>Recogida creada:</strong>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                          {JSON.stringify(result.recogida_creada, null, 2)}
                        </pre>
                      </div>
                    )}
                    {result.usuario && (
                      <div className="mt-2">
                        <strong>Usuario:</strong> {result.usuario.email} (ID: {result.usuario.id})
                      </div>
                    )}
                    {result.perfil && (
                      <div className="mt-2">
                        <strong>Perfil:</strong> {result.perfil.full_name} (Rol: {result.perfil.role})
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>❌ Error:</strong> {result.error}
                    {result.details && (
                      <div className="mt-2">
                        <strong>Detalles:</strong>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                          {result.details}
                        </pre>
                      </div>
                    )}
                    {result.stack && (
                      <div className="mt-2">
                        <strong>Stack trace:</strong>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                          {result.stack}
                        </pre>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 