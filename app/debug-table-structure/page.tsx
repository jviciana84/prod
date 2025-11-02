"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Database, Search } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"

export default function DebugTableStructure() {
  const [tableName, setTableName] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const { toast } = useToast()

  const checkTable = async () => {
    if (!tableName.trim()) {
      toast({
        title: "❌ Error",
        description: "Introduce un nombre de tabla",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setResults(null)

    try {
      const response = await fetch(`/api/debug-table-structure?table=${encodeURIComponent(tableName.trim())}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "❌ Error",
          description: data.error || "Error desconocido",
          variant: "destructive",
        })
      } else {
        toast({
          title: "✅ Tabla verificada",
          description: data.error ? "Error en la tabla" : "Estructura obtenida",
        })
      }

      setResults(data)
    } catch (error) {
      console.error("Error verificando tabla:", error)
      toast({
        title: "❌ Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const quickCheck = (table: string) => {
    setTableName(table)
    setTimeout(() => checkTable(), 100)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Verificar Estructura de Tablas
          </CardTitle>
          <CardDescription>
            Verifica qué columnas tiene una tabla específica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="Nombre de la tabla (ej: sales_vehicles)"
                className="h-10"
                onKeyPress={(e) => e.key === 'Enter' && checkTable()}
              />
            </div>
            <Button 
              onClick={checkTable} 
              disabled={loading || !tableName.trim()}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <BMWMSpinner size={16} />
                  Verificando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Verificar
                </>
              )}
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => quickCheck('sales_vehicles')}
            >
              sales_vehicles
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => quickCheck('entregas')}
            >
              entregas
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => quickCheck('nuevas_entradas')}
            >
              nuevas_entradas
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => quickCheck('entregas_en_mano')}
            >
              entregas_en_mano
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Resultados para {results.table}
            </CardTitle>
            <CardDescription>
              Verificado el {new Date(results.timestamp).toLocaleString("es-ES")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {results.error ? (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="text-lg font-semibold text-red-600 mb-2">❌ Error</h3>
                <div className="text-sm">
                  <div><strong>Mensaje:</strong> {results.error.message}</div>
                  {results.error.code && <div><strong>Código:</strong> {results.error.code}</div>}
                  {results.error.details && <div><strong>Detalles:</strong> {JSON.stringify(results.error.details)}</div>}
                </div>
              </div>
            ) : (
              <>
                {results.structure.columns && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">📋 Columnas de la Tabla</h3>
                    <div className="flex flex-wrap gap-2">
                      {results.structure.columns.map((column: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {column}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Total: {results.structure.columns.length} columnas
                    </div>
                  </div>
                )}

                {results.structure.sampleRow && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">📄 Ejemplo de Registro</h3>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(results.structure.sampleRow, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {results.sampleData && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">📊 Muestra de Datos (3 registros)</h3>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(results.sampleData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 