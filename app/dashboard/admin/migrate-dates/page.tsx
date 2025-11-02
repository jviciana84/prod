"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle, AlertCircle, Database, ArrowRight } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { toast } from "sonner"

interface MigrationStats {
  totalUpdated: number
  errorsCount: number
  errors: string[]
}

export default function MigrateDatesPage() {
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [stats, setStats] = useState<MigrationStats | null>(null)

  const runMigration = async () => {
    setLoading(true)
    setCompleted(false)
    setStats(null)

    try {
      console.log("🚀 Iniciando migración de fechas...")
      toast.info("Iniciando migración de fechas...")

      const response = await fetch("/api/migrate-dates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.details || result.error || "Error en la migración")
      }

      console.log("✅ Migración completada:", result)
      setStats(result.stats)
      setCompleted(true)
      toast.success(`✅ Migración completada! ${result.stats.totalUpdated} registros actualizados`)
    } catch (error) {
      console.error("❌ Error en migración:", error)
      toast.error(error instanceof Error ? error.message : "Error en la migración")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Calendar className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Migración de Formatos de Fecha</h1>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Esta herramienta convierte las fechas existentes de formato DD/MM/YYYY a formato ISO YYYY-MM-DD para
          compatibilidad con PostgreSQL.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información del proceso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Proceso de Migración
            </CardTitle>
            <CardDescription>Qué hace esta migración</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Tablas afectadas:</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline">pdf_extracted_data</Badge>
                  <span className="text-muted-foreground">fecha_pedido, primera_fecha_matriculacion</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">sales_vehicles</Badge>
                  <span className="text-muted-foreground">sale_date, order_date, registration_date</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Conversión:</h4>
              <div className="flex items-center gap-2 text-sm">
                <code className="bg-muted px-2 py-1 rounded">28/09/2020</code>
                <ArrowRight className="h-4 w-4" />
                <code className="bg-muted px-2 py-1 rounded">2020-09-28</code>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Características:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Solo convierte fechas en formato DD/MM/YYYY</li>
                <li>• Preserva fechas ya en formato correcto</li>
                <li>• Valida rangos de fecha antes de convertir</li>
                <li>• Proceso seguro y reversible</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Panel de control */}
        <Card>
          <CardHeader>
            <CardTitle>Ejecutar Migración</CardTitle>
            <CardDescription>Convertir fechas existentes al formato correcto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!completed ? (
              <Button onClick={runMigration} disabled={loading} className="w-full" size="lg">
                {loading ? (
                  <>
                    <BMWMSpinner size={16} className="mr-2" />
                    Migrando fechas...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Iniciar Migración
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">Migración Completada</span>
                </div>

                {stats && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{stats.totalUpdated}</div>
                        <div className="text-sm text-green-700">Registros actualizados</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{stats.errorsCount}</div>
                        <div className="text-sm text-red-700">Errores</div>
                      </div>
                    </div>

                    {stats.errors.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-red-600">Errores encontrados:</h4>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {stats.errors.map((error, index) => (
                            <div key={index} className="text-xs bg-red-50 p-2 rounded text-red-700">
                              {error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={() => {
                    setCompleted(false)
                    setStats(null)
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Ejecutar Nueva Migración
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Información Importante</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Recomendación:</strong> Ejecute esta migración una sola vez después de implementar el nuevo
              sistema de fechas. Los nuevos registros ya se guardarán en el formato correcto automáticamente.
            </AlertDescription>
          </Alert>

          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Seguridad:</strong> Esta migración solo actualiza fechas que están en formato DD/MM/YYYY. Las
              fechas ya en formato ISO se mantienen sin cambios.
            </p>
            <p>
              <strong>Validación:</strong> Cada fecha se valida antes de la conversión para asegurar que sea una fecha
              real (día 1-31, mes 1-12, año 1900-2100).
            </p>
            <p>
              <strong>Logs:</strong> Todos los cambios se registran en la consola del navegador para auditoría.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
