"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Database, Table } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ColumnInfo {
  column_name: string
  data_type: string
  is_nullable: string
}

interface TableDiagnostic {
  columns: ColumnInfo[]
  columnsError: string | null
  recordCount: number
  countError: string | null
  lastRecords: any[]
  lastRecordsError: string | null
}

interface DiagnosticData {
  timestamp: string
  pdf_extracted_data: TableDiagnostic
  sales_vehicles: TableDiagnostic
}

export default function DiagnosticoTablasPage() {
  const [data, setData] = useState<DiagnosticData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDiagnostic = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/diagnostico-tablas")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error obteniendo diagnóstico")
      }

      setData(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDiagnostic()
  }, [])

  const renderTableInfo = (tableName: string, tableData: TableDiagnostic) => (
    <Card key={tableName}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Table className="h-5 w-5" />
          {tableName}
          <Badge variant="outline">{tableData.recordCount} registros</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tableData.columnsError && (
          <Alert variant="destructive">
            <AlertDescription>Error obteniendo columnas: {tableData.columnsError}</AlertDescription>
          </Alert>
        )}

        <div>
          <h4 className="font-semibold mb-2">Columnas ({tableData.columns.length}):</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {tableData.columns.map((col) => (
              <div key={col.column_name} className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                <div className="font-medium">{col.column_name}</div>
                <div className="text-gray-600 dark:text-gray-300 text-xs">
                  {col.data_type} {col.is_nullable === "YES" ? "(nullable)" : "(not null)"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {tableData.lastRecords.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Últimos registros:</h4>
            <div className="space-y-2">
              {tableData.lastRecords.map((record, index) => (
                <div key={index} className="p-2 bg-blue-100 dark:bg-blue-900 rounded text-sm">
                  <pre className="text-xs">{JSON.stringify(record, null, 2)}</pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {tableData.countError && (
          <Alert variant="destructive">
            <AlertDescription>Error contando registros: {tableData.countError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8" />
            Diagnóstico de Tablas
          </h1>
          <p className="text-muted-foreground mt-1">
            Verificación de estructura y contenido de las tablas de la base de datos
          </p>
        </div>
        <Button onClick={fetchDiagnostic} disabled={loading} className="gap-2">
          {loading ? <BMWMSpinner size={16} /> : <RefreshCw className="h-4 w-4" />}
          Actualizar
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data && (
        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Última actualización: {new Date(data.timestamp).toLocaleString()}
          </div>

          <div className="grid gap-6">
            {renderTableInfo("pdf_extracted_data", data.pdf_extracted_data)}
            {renderTableInfo("sales_vehicles", data.sales_vehicles)}
          </div>
        </div>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center py-12">
          <BMWMSpinner size={32} />
          <span className="ml-2">Cargando diagnóstico...</span>
        </div>
      )}
    </div>
  )
}
