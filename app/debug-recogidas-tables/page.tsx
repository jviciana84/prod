"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Database, CheckCircle, AlertTriangle, RefreshCw, Wrench } from "lucide-react"

export default function DebugRecogidasTablesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [tableInfo, setTableInfo] = useState<any>(null)

  const loadTableInfo = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug-recogidas-tables")
      if (response.ok) {
        const data = await response.json()
        setTableInfo(data)
        toast({
          title: "✅ Información cargada",
          description: "Estado de las tablas verificado.",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "❌ Error al cargar",
          description: errorData.error || "Error desconocido",
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error de conexión"
      toast({
        title: "❌ Error de conexión",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTableInfo()
  }, [])

  const renderTableStatus = (tableName: string, info: any) => {
    if (!info.exists) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>❌ Tabla no existe:</strong> {tableName}
            <br />
            <span className="text-sm">Error: {info.error}</span>
          </AlertDescription>
        </Alert>
      )
    }

    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>✅ Tabla existe:</strong> {tableName}
          <br />
          <span className="text-sm">Registros: <Badge variant="secondary">{info.recordCount}</Badge></span>
          {info.columns && (
            <div className="mt-2">
              <strong>Columnas:</strong>
              <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
                {info.columns.map((col: any, index: number) => (
                  <div key={index} className="flex justify-between">
                    <span>{col.column_name}:</span>
                    <span className="text-muted-foreground">{col.data_type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Estado de Tablas - Recogidas
          </CardTitle>
          <CardDescription>
            Verifica el estado de las tablas necesarias para el sistema de recogidas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Button 
              onClick={loadTableInfo} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Actualizar Estado
                </>
              )}
            </Button>
          </div>

          {tableInfo && (
            <div className="space-y-4">
              {/* Información del usuario */}
              {tableInfo.user && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Usuario Actual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>ID: <Badge variant="outline">{tableInfo.user.id}</Badge></div>
                      <div>Email: <Badge variant="outline">{tableInfo.user.email}</Badge></div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Estado de las tablas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Estado de las Tablas</h3>
                
                {tableInfo.tables && Object.entries(tableInfo.tables).map(([tableName, info]: [string, any]) => (
                  <Card key={tableName}>
                    <CardHeader>
                      <CardTitle className="text-base">{tableName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderTableStatus(tableName, info)}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Resumen */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resumen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {tableInfo.tables ? Object.values(tableInfo.tables).filter((t: any) => t.exists).length : 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Tablas Existentes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {tableInfo.tables ? Object.values(tableInfo.tables).filter((t: any) => !t.exists).length : 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Tablas Faltantes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {tableInfo.tables ? Object.values(tableInfo.tables).reduce((total: number, t: any) => total + (t.recordCount || 0), 0) : 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Registros</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 