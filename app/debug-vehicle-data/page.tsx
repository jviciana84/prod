"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Car, Search, RefreshCw } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"

interface VehicleDataResult {
  timestamp: string
  matricula: string
  user: {
    id: string
    email: string
  }
  searchResults: {
    [key: string]: {
      count: number
      data: any[]
    }
    exactMatch?: any
    vehicleData?: {
      matricula: string
      client_name: string
      client_address: string
      client_postal_code: string
      client_city: string
      client_province: string
      client_phone: string
      client_email: string
      allColumns: string[]
    }
  }
  errors: Array<{
    table?: string
    operation?: string
    error: string
    code?: string
    details?: any
  }>
}

export default function DebugVehicleData() {
  const [matricula, setMatricula] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<VehicleDataResult | null>(null)
  const { toast } = useToast()

  const searchVehicle = async () => {
    if (!matricula.trim()) {
      toast({
        title: "❌ Error",
        description: "Introduce una matrícula",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setResults(null)

    try {
      const response = await fetch(`/api/debug-vehicle-data?matricula=${encodeURIComponent(matricula.trim())}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "❌ Error en la búsqueda",
          description: data.error || "Error desconocido",
          variant: "destructive",
        })
      } else {
        toast({
          title: "✅ Búsqueda completada",
          description: `Encontrados datos en ${Object.keys(data.searchResults).length} tablas`,
        })
      }

      setResults(data)
    } catch (error) {
      console.error("Error buscando vehículo:", error)
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
            <Car className="h-5 w-5" />
            Debug de Datos de Vehículos
          </CardTitle>
          <CardDescription>
            Busca y verifica los datos disponibles para una matrícula específica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                value={matricula}
                onChange={(e) => setMatricula(e.target.value.toUpperCase())}
                placeholder="Introduce la matrícula (ej: 9532LMN)"
                className="h-10"
                onKeyPress={(e) => e.key === 'Enter' && searchVehicle()}
              />
            </div>
            <Button 
              onClick={searchVehicle} 
              disabled={loading || !matricula.trim()}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <BMWMSpinner size={16} />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Buscar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Resultados para {results.matricula}
            </CardTitle>
            <CardDescription>
              Ejecutado el {formatTimestamp(results.timestamp)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Datos del vehículo encontrado */}
            {results.searchResults.vehicleData && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-green-600">✅ Datos del Vehículo Encontrados</h3>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <strong>Matrícula:</strong> {results.searchResults.vehicleData.matricula}
                    </div>
                    <div>
                      <strong>Cliente:</strong> {results.searchResults.vehicleData.client_name || "No especificado"}
                    </div>
                    <div>
                      <strong>Dirección:</strong> {results.searchResults.vehicleData.client_address || "No especificada"}
                    </div>
                    <div>
                      <strong>Código Postal:</strong> {results.searchResults.vehicleData.client_postal_code || "No especificado"}
                    </div>
                    <div>
                      <strong>Ciudad:</strong> {results.searchResults.vehicleData.client_city || "No especificada"}
                    </div>
                    <div>
                      <strong>Provincia:</strong> {results.searchResults.vehicleData.client_province || "No especificada"}
                    </div>
                    <div>
                      <strong>Teléfono:</strong> {results.searchResults.vehicleData.client_phone || "No especificado"}
                    </div>
                    <div>
                      <strong>Email:</strong> {results.searchResults.vehicleData.client_email || "No especificado"}
                    </div>
                  </div>
                  <div className="mt-4">
                    <strong>Columnas disponibles:</strong>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {results.searchResults.vehicleData.allColumns.map((column, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {column}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Resultados por tabla */}
            <div>
              <h3 className="text-lg font-semibold mb-3">📊 Resultados por Tabla</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(results.searchResults).map(([table, data]) => {
                  if (table === 'vehicleData' || table === 'exactMatch') return null
                  return (
                    <div key={table} className="bg-muted/30 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={data.count > 0 ? "default" : "secondary"}>
                          {data.count} registros
                        </Badge>
                        <strong>{table}</strong>
                      </div>
                      {data.count > 0 && (
                        <div className="text-sm text-muted-foreground">
                          Primer registro: {data.data[0]?.matricula || "Sin matrícula"}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Errores */}
            {results.errors.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-red-600">❌ Errores Encontrados</h3>
                <div className="space-y-3">
                  {results.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertDescription>
                        <div className="font-semibold">
                          {error.table && `Tabla: ${error.table}`}
                          {error.operation && `Operación: ${error.operation}`}
                        </div>
                        <div className="text-sm mt-1">{error.error}</div>
                        {error.code && (
                          <div className="text-xs text-red-300 mt-1">Código: {error.code}</div>
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
                {!results.searchResults.vehicleData ? (
                  <Alert>
                    <AlertDescription>
                      <strong>⚠️ No se encontraron datos del cliente:</strong> La matrícula existe pero no tiene datos de dirección, 
                      teléfono o email del cliente. Esto explica por qué aparecen "No especificado" en el email.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <AlertDescription>
                      <strong>✅ Datos completos:</strong> Se encontraron todos los datos del cliente. 
                      El email debería mostrar la información correcta.
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