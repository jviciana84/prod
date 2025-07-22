"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Wrench, CheckCircle, AlertTriangle } from "lucide-react"

export default function DebugFixRecogidasConfigPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const fixRecogidasConfig = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/debug-fix-recogidas-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        toast({
          title: "✅ Configuración arreglada",
          description: "La tabla recogidas_email_config ha sido arreglada exitosamente.",
        })
      } else {
        setResult(data)
        toast({
          title: "❌ Error al arreglar",
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
            <Wrench className="h-5 w-5" />
            Arreglar Configuración de Recogidas
          </CardTitle>
          <CardDescription>
            Este script arreglará la tabla recogidas_email_config añadiendo las columnas faltantes y actualizando los valores por defecto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Acción:</strong> Este script ejecutará las siguientes operaciones:
              <br />
              • Crear la tabla si no existe
              <br />
              • Añadir columnas faltantes (email_remitente, nombre_remitente, asunto_template)
              <br />
              • Actualizar registros existentes con valores por defecto
              <br />
              • Actualizar el formato del asunto para incluir {`{centro}`}
            </AlertDescription>
          </Alert>

          <Button 
            onClick={fixRecogidasConfig} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Arreglando..." : "Arreglar Configuración de Recogidas"}
          </Button>

          {result && (
            <div className="mt-4">
              {result.success ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Éxito:</strong> {result.message}
                    {result.config && (
                      <div className="mt-2 p-2 bg-muted rounded text-sm">
                        <pre>{JSON.stringify(result.config, null, 2)}</pre>
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
                      <div className="mt-2 p-2 bg-muted rounded text-sm">
                        <pre>{result.details}</pre>
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