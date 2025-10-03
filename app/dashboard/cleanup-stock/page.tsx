"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CleanupStockPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionResult, setConnectionResult] = useState<any>(null)
  const [result, setResult] = useState<any>(null)
  const { toast } = useToast()

  const testConnection = async () => {
    setIsTestingConnection(true)
    setConnectionResult(null)

    try {
      const response = await fetch('/api/test-supabase-connection', {
        method: 'GET',
      })

      const data = await response.json()
      setConnectionResult(data)
      
      toast({
        title: data.success ? "✅ Conexión exitosa" : "❌ Error de conexión",
        description: data.message || "Resultado de la conexión",
        variant: data.success ? "default" : "destructive"
      })

    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const executeCleanup = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/cleanup-sold-vehicles-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error ejecutando limpieza')
      }

      setResult(data)
      
      toast({
        title: data.success ? "✅ Limpieza completada" : "⚠️ Limpieza completada con advertencias",
        description: data.message || "Proceso completado",
        variant: data.success ? "default" : "destructive"
      })

    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Limpieza de Stock</h1>
        <p className="text-muted-foreground">
          Barrido de vehículos vendidos que aún están en el stock
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Limpieza de Vehículos Vendidos
          </CardTitle>
          <CardDescription>
            Este proceso identificará y moverá todos los vehículos vendidos (is_sold = true) 
            que aún están en el stock, marcándolos como entregados (estado = "entregado").
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Este proceso es irreversible. 
              Los vehículos vendidos se marcarán como entregados y saldrán del stock.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button 
              onClick={testConnection} 
              disabled={isTestingConnection}
              variant="outline"
              className="flex-1"
            >
              {isTestingConnection ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Probando conexión...
                </>
              ) : (
                "🔍 Probar Conexión"
              )}
            </Button>
            
            <Button 
              onClick={executeCleanup} 
              disabled={isLoading}
              className="flex-1"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ejecutando limpieza...
                </>
              ) : (
                "🚗 Ejecutar Barrido"
              )}
            </Button>
          </div>

          {connectionResult && (
            <div className="space-y-4">
              <Alert variant={connectionResult.success ? "default" : "destructive"}>
                {connectionResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <strong>{connectionResult.success ? "✅ Conexión exitosa:" : "❌ Error de conexión:"}</strong> {connectionResult.message}
                </AlertDescription>
              </Alert>

              {connectionResult.success && connectionResult.stockSample && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Muestra de Stock</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {connectionResult.stockSample.map((vehicle: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{vehicle.license_plate}</span>
                          <span className="text-muted-foreground">
                            {vehicle.is_sold ? "Vendido" : "Disponible"} - {vehicle.estado}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <strong>{result.success ? "✅ Éxito:" : "⚠️ Completado con advertencias:"}</strong> {result.message}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Estado Inicial</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total vehículos:</span>
                      <span className="font-mono">{result.summary.initial.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vendidos en stock:</span>
                      <span className="font-mono text-orange-600">{result.summary.initial.vendidos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Disponibles:</span>
                      <span className="font-mono text-green-600">{result.summary.initial.disponibles}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Entregados:</span>
                      <span className="font-mono text-blue-600">{result.summary.initial.entregados}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Estado Final</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total vehículos:</span>
                      <span className="font-mono">{result.summary.final.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vendidos en stock:</span>
                      <span className="font-mono text-orange-600">{result.summary.final.vendidos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Disponibles:</span>
                      <span className="font-mono text-green-600">{result.summary.final.disponibles}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Entregados:</span>
                      <span className="font-mono text-blue-600">{result.summary.final.entregados}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Procesamiento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Vehículos a procesar:</span>
                    <span className="font-mono">{result.processing.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Procesados exitosamente:</span>
                    <span className="font-mono text-green-600">{result.processing.processed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Errores:</span>
                    <span className="font-mono text-red-600">{result.processing.errors}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pendientes:</span>
                    <span className="font-mono text-orange-600">{result.remaining}</span>
                  </div>
                </CardContent>
              </Card>

              {result.processing.processedVehicles.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Vehículos Procesados (primeros 10)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {result.processing.processedVehicles.map((vehicle: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{vehicle.license_plate} - {vehicle.model}</span>
                          <span className="text-muted-foreground">({vehicle.source})</span>
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
