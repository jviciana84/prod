"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2, ArrowRight } from "lucide-react"

export default function AvatarMigrationTool() {
  const [tableExists, setTableExists] = useState<boolean | null>(null)
  const [isCheckingTable, setIsCheckingTable] = useState(true)
  const [isCreatingTable, setIsCreatingTable] = useState(false)
  const [createTableError, setCreateTableError] = useState<string | null>(null)
  const [createTableSuccess, setCreateTableSuccess] = useState(false)

  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationError, setMigrationError] = useState<string | null>(null)
  const [migrationSuccess, setMigrationSuccess] = useState(false)
  const [migrationStats, setMigrationStats] = useState<{
    total: number
    processed: number
    success: number
    failed: number
  } | null>(null)

  // Verificar si la tabla existe al cargar el componente
  useEffect(() => {
    checkTableExists()
  }, [])

  const checkTableExists = async () => {
    setIsCheckingTable(true)
    try {
      const response = await fetch(`/api/admin/rpc/check-table-exists?table=avatar_mappings`)

      if (!response.ok) {
        throw new Error(`Error al verificar tabla: ${response.statusText}`)
      }

      const data = await response.json()
      setTableExists(data.exists)
    } catch (error: any) {
      console.error("Error al verificar tabla:", error)
      setTableExists(false)
    } finally {
      setIsCheckingTable(false)
    }
  }

  const createTable = async () => {
    setIsCreatingTable(true)
    setCreateTableError(null)
    setCreateTableSuccess(false)

    try {
      const response = await fetch("/api/admin/avatars/create-mapping-table", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al crear tabla")
      }

      setCreateTableSuccess(true)
      await checkTableExists()
    } catch (error: any) {
      console.error("Error al crear tabla:", error)
      setCreateTableError(error.message)
    } finally {
      setIsCreatingTable(false)
    }
  }

  const migrateAvatars = async () => {
    setIsMigrating(true)
    setMigrationError(null)
    setMigrationSuccess(false)
    setMigrationStats(null)

    try {
      const response = await fetch("/api/admin/avatars/migrate-to-blob", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al migrar avatares")
      }

      const data = await response.json()
      setMigrationSuccess(true)
      setMigrationStats(data.stats)
    } catch (error: any) {
      console.error("Error al migrar avatares:", error)
      setMigrationError(error.message)
    } finally {
      setIsMigrating(false)
    }
  }

  const refreshCache = async () => {
    try {
      await fetch("/api/admin/avatars/refresh-cache", {
        method: "POST",
      })

      // No necesitamos manejar la respuesta, solo queremos refrescar la caché
    } catch (error) {
      console.error("Error al refrescar caché:", error)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Paso 1: Tabla de Mapeo</CardTitle>
          <CardDescription>
            Verifica y crea la tabla necesaria para mapear avatares locales a URLs de Blob
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCheckingTable ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verificando tabla...</span>
            </div>
          ) : tableExists === null ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>No se pudo verificar si la tabla existe</AlertDescription>
            </Alert>
          ) : tableExists ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-700">Tabla Existente</AlertTitle>
              <AlertDescription className="text-green-600">
                La tabla de mapeo ya existe en la base de datos
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Tabla No Encontrada</AlertTitle>
              <AlertDescription>
                La tabla de mapeo no existe. Haz clic en &quot;Crear Tabla&quot; para crearla.
              </AlertDescription>
            </Alert>
          )}

          {createTableSuccess && (
            <Alert className="bg-green-50 border-green-200 mt-4">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-700">Tabla Creada</AlertTitle>
              <AlertDescription className="text-green-600">
                La tabla de mapeo se ha creado correctamente
              </AlertDescription>
            </Alert>
          )}

          {createTableError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{createTableError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={checkTableExists} disabled={isCheckingTable}>
            {isCheckingTable ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              "Verificar Tabla"
            )}
          </Button>
          <Button onClick={createTable} disabled={isCreatingTable || tableExists === true}>
            {isCreatingTable ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear Tabla"
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paso 2: Migrar Avatares a Blob</CardTitle>
          <CardDescription>
            Sube los avatares existentes a Vercel Blob y guarda el mapeo en la base de datos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!tableExists && !isCheckingTable ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Tabla Requerida</AlertTitle>
              <AlertDescription>Primero debes crear la tabla de mapeo antes de migrar los avatares</AlertDescription>
            </Alert>
          ) : (
            <>
              {migrationSuccess && (
                <Alert className="bg-green-50 border-green-200 mb-4">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertTitle className="text-green-700">Migración Completada</AlertTitle>
                  <AlertDescription className="text-green-600">
                    Los avatares se han migrado correctamente a Vercel Blob
                  </AlertDescription>
                </Alert>
              )}

              {migrationError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{migrationError}</AlertDescription>
                </Alert>
              )}

              {migrationStats && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium mb-2">Estadísticas de Migración</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Total de avatares:</div>
                    <div className="font-medium">{migrationStats.total}</div>

                    <div>Procesados:</div>
                    <div className="font-medium">{migrationStats.processed}</div>

                    <div>Exitosos:</div>
                    <div className="font-medium text-green-600">{migrationStats.success}</div>

                    <div>Fallidos:</div>
                    <div className="font-medium text-red-600">{migrationStats.failed}</div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={migrateAvatars} disabled={isMigrating || !tableExists}>
            {isMigrating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Migrando...
              </>
            ) : (
              "Migrar Avatares"
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paso 3: Refrescar Caché</CardTitle>
          <CardDescription>
            Actualiza la caché de mapeo de avatares para que los cambios surtan efecto inmediatamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Después de migrar los avatares, es recomendable refrescar la caché para que los cambios se apliquen
            inmediatamente en toda la aplicación.
          </p>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline" onClick={refreshCache} disabled={!migrationSuccess}>
            Refrescar Caché
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="font-medium text-blue-800 mb-2 flex items-center">
          <ArrowRight className="h-4 w-4 mr-2" />
          Siguiente Paso
        </h3>
        <p className="text-sm text-blue-700">
          Una vez completada la migración, todos los avatares estarán disponibles desde Vercel Blob y no se perderán
          durante los despliegues. No es necesario realizar ningún cambio adicional en el código, ya que la aplicación
          utilizará automáticamente las URLs de Blob.
        </p>
      </div>
    </div>
  )
}
