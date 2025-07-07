"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getTableStructure } from "@/server-actions/table-structure"

export function TableDiagnostic() {
  const [loading, setLoading] = useState(false)
  const [structure, setStructure] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const checkTableStructure = async (tableName: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await getTableStructure(tableName)

      if (result.success) {
        setStructure(result.data)
      } else {
        setError(result.message || "Error desconocido")
      }
    } catch (err: any) {
      setError(err.message || "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Diagnóstico de Tablas</CardTitle>
        <CardDescription>Examina la estructura de las tablas para verificar las columnas disponibles</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => checkTableStructure("fotos")} disabled={loading} variant="outline">
              Examinar tabla "fotos"
            </Button>
            <Button onClick={() => checkTableStructure("fotos_asignadas")} disabled={loading} variant="outline">
              Examinar tabla "fotos_asignadas"
            </Button>
            <Button onClick={() => checkTableStructure("nuevas_entradas")} disabled={loading} variant="outline">
              Examinar tabla "nuevas_entradas"
            </Button>
          </div>

          {loading && <p className="text-sm text-muted-foreground">Cargando estructura de la tabla...</p>}

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {structure && (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Columna</th>
                    <th className="p-2 text-left">Tipo</th>
                    <th className="p-2 text-left">Nulo</th>
                    <th className="p-2 text-left">Por defecto</th>
                  </tr>
                </thead>
                <tbody>
                  {structure.map((column: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-background" : "bg-muted/50"}>
                      <td className="p-2">{column.column_name}</td>
                      <td className="p-2">{column.data_type}</td>
                      <td className="p-2">{column.is_nullable ? "Sí" : "No"}</td>
                      <td className="p-2">{column.column_default || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          Utiliza esta información para actualizar correctamente el código que accede a estas tablas.
        </p>
      </CardFooter>
    </Card>
  )
}
