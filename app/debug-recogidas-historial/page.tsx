"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database, AlertCircle, CheckCircle } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { toast } from "sonner"

interface DebugData {
  total: number
  recogidas: any[]
  message: string
}

export default function DebugRecogidasHistorial() {
  const [data, setData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/debug-recogidas-historial')
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      setData(result)
      
      if (result.total === 0) {
        toast.warning("No hay recogidas en el historial")
      } else {
        toast.success(`Encontradas ${result.total} recogidas`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkData()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-500" />
            Debug - Recogidas Historial
          </CardTitle>
          <CardDescription>
            Verificar datos en la tabla recogidas_historial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={checkData} 
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <BMWMSpinner size={16} className="mr-2" />
                Verificando...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Verificar Datos
              </>
            )}
          </Button>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {data && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span className="text-blue-700">{data.message}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">{data.total}</div>
                    <div className="text-sm text-muted-foreground">Total Recogidas</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">{data.recogidas.length}</div>
                    <div className="text-sm text-muted-foreground">Mostradas</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-orange-600">
                      {data.total > 0 ? Math.ceil(data.total / 20) : 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Páginas (20 por página)</div>
                  </CardContent>
                </Card>
              </div>

              {data.recogidas.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Primeras 5 Recogidas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.recogidas.map((recogida, index) => (
                        <div key={recogida.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{recogida.matricula}</span>
                              <Badge variant="outline">{recogida.estado}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {recogida.nombre_cliente} • {recogida.usuario_solicitante}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(recogida.fecha_solicitud).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 