"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react"
import { updateAllVehicleTypes } from "@/server-actions/update-vehicle-types"

export default function UpdateVehicleTypesPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    message?: string
    updated?: number
    unchanged?: number
    errors?: number
  } | null>(null)

  const handleUpdate = async () => {
    setLoading(true)
    try {
      const updateResult = await updateAllVehicleTypes()
      setResult(updateResult)
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Actualizar Tipos de Vehículos</CardTitle>
          <CardDescription>
            Esta herramienta detecta automáticamente si un vehículo es una moto o un coche basado en su modelo y
            actualiza la base de datos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 mr-2" />
              <div>
                <h3 className="font-medium text-amber-800 dark:text-amber-300">Importante</h3>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Esta operación analizará todos los vehículos en la base de datos y actualizará su tipo (Coche o Moto)
                  basado en el nombre del modelo. Solo se modificarán los registros donde el tipo detectado sea
                  diferente al actual.
                </p>
              </div>
            </div>
          </div>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <AlertTitle>{result.success ? "Operación completada" : "Error"}</AlertTitle>
              <AlertDescription>
                {result.message}
                {result.success && result.updated !== undefined && (
                  <ul className="mt-2 list-disc pl-5 text-sm">
                    <li>
                      <strong>{result.updated}</strong> vehículos actualizados
                    </li>
                    <li>
                      <strong>{result.unchanged}</strong> vehículos sin cambios
                    </li>
                    <li>
                      <strong>{result.errors}</strong> errores
                    </li>
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleUpdate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              "Actualizar Tipos de Vehículos"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
