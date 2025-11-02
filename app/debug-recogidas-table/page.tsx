"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Database, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"

interface DiagnosticResult {
  timestamp: string
  user: {
    id: string
    email: string
  }
  tables: {
    recogidas_historial?: {
      exists: boolean
      count: number
    }
    recogidas_pendientes?: {
      exists: boolean
      count: number
    }
    recogidas_historial_structure?: any
    test_insert?: {
      success: boolean
      id: string
      data: any
    }
  }
  errors: Array<{
    table?: string
    operation?: string
    error: string
    code?: string
    details?: any
    hint?: string
  }>
}

export default function DebugRecogidasTable() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<DiagnosticResult | null>(null)
  const { toast } = useToast()

  const runDiagnostic = async () => {
    setLoading(true)
    setResults(null)

    try {
      const response = await fetch("/api/debug-recogidas-table", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "❌ Error en el diagnóstico",
          description: data.error || "Error desconocido",
          variant: "destructive",
        })
      } else {
        toast({
          title: "✅ Diagnóstico completado",
          description: data.errors.length > 0 ? "Se encontraron problemas" : "Todo está funcionando correctamente",
        })
      }

      setResults(data)
    } catch (error) {
      console.error("Error ejecutando diagnóstico:", error)
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
            <Database className="h-5 w-5" />
            Diagnóstico de Tabla de Recogidas
          </CardTitle>
          <CardDescription>
            Verifica el estado de las tablas de recogidas y su capacidad de inserción
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Este diagnóstico:</strong> Verifica la existencia de las tablas, su estructura, 
              y prueba la inserción de datos para identificar problemas en el guardado de recogidas.
            </AlertDescription>
          </Alert>

          <div className="flex gap-4">
            <Button 
              onClick={runDiagnostic} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <BMWMSpinner size={16} />
                  Ejecutando diagnóstico...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  Ejecutar Diagnóstico
                </>
              )}
            </Button>

            {results && (
              <Button 
                onClick={runDiagnostic} 
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Repetir Diagnóstico
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {results.errors.length === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Resultados del Diagnóstico
            </CardTitle>
            <CardDescription>
              Ejecutado el {formatTimestamp(results.timestamp)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Usuario */}
            <div>
              <h3 className="text-lg font-semibold mb-3">👤 Usuario</h3>
              <div className="bg-muted/30 p-3 rounded-lg">
                <div><strong>ID:</strong> {results.user.id}</div>
                <div><strong>Email:</strong> {results.user.email}</div>
              </div>
            </div>

            {/* Estado de las Tablas */}
            <div>
              <h3 className="text-lg font-semibold mb-3">📊 Estado de las Tablas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.tables.recogidas_historial && (
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <strong>recogidas_historial</strong>
                    </div>
                    <div>Registros: {results.tables.recogidas_historial.count}</div>
                  </div>
                )}
                
                {results.tables.recogidas_pendientes && (
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <strong>recogidas_pendientes</strong>
                    </div>
                    <div>Registros: {results.tables.recogidas_pendientes.count}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Prueba de Inserción */}
            {results.tables.test_insert && (
              <div>
                <h3 className="text-lg font-semibold mb-3">✅ Prueba de Inserción</h3>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Inserción exitosa:</strong> Se pudo insertar y eliminar un registro de prueba.
                    <div className="mt-2 text-sm">
                      <strong>ID generado:</strong> {results.tables.test_insert.id}
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Errores */}
            {results.errors.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-red-600">❌ Errores Encontrados</h3>
                <div className="space-y-3">
                  {results.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-semibold">
                          {error.table && `Tabla: ${error.table}`}
                          {error.operation && `Operación: ${error.operation}`}
                        </div>
                        <div className="text-sm mt-1">{error.error}</div>
                        {error.code && (
                          <div className="text-xs text-red-300 mt-1">Código: {error.code}</div>
                        )}
                        {error.hint && (
                          <div className="text-xs text-red-300 mt-1">Hint: {error.hint}</div>
                        )}
                        {error.details && (
                          <div className="text-xs text-red-300 mt-1">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(error.details, null, 2)}
                            </pre>
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
                {results.errors.length === 0 ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>✅ Sistema funcionando:</strong> Las tablas están correctamente configuradas 
                      y la inserción funciona. El problema puede estar en el frontend o en la lógica de guardado.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>⚠️ Problemas detectados:</strong> Revisa los errores arriba y corrige 
                      la configuración de la base de datos antes de continuar.
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