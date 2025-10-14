"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, CheckCircle2, AlertTriangle, Info } from "lucide-react"
import { forceCleanStorage, getStorageInfo } from "@/utils/safe-clean-storage"
import { Alert, AlertDescription } from "@/components/ui/alert"

/**
 * 🧹 CONFIGURACIÓN DE LIMPIEZA DE STORAGE
 * 
 * Permite al usuario limpiar manualmente el storage si tiene problemas
 */
export function StorageCleanerSettings() {
  const [cleaning, setCleaning] = useState(false)
  const [lastResult, setLastResult] = useState<{
    success: boolean
    itemsCleaned: number
    itemsPreserved: number
    errors: string[]
  } | null>(null)

  const storageInfo = typeof window !== 'undefined' ? getStorageInfo() : null

  const handleClean = async () => {
    if (cleaning) return

    const confirmed = window.confirm(
      '¿Limpiar datos temporales?\n\n' +
      'Esto eliminará cookies de autenticación corruptas.\n' +
      'Tus preferencias (tema, tasaciones) se preservarán.\n\n' +
      'Útil si las tablas no cargan correctamente.'
    )

    if (!confirmed) return

    setCleaning(true)
    setLastResult(null)

    try {
      // Pequeño delay para feedback visual
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const result = forceCleanStorage()
      setLastResult(result)

      if (result.success) {
        // Opcionalmente recargar después de 2 segundos
        setTimeout(() => {
          if (window.confirm('Limpieza exitosa. ¿Recargar la página para aplicar cambios?')) {
            window.location.reload()
          }
        }, 1000)
      }
    } catch (error) {
      console.error('Error en limpieza manual:', error)
      setLastResult({
        success: false,
        itemsCleaned: 0,
        itemsPreserved: 0,
        errors: [String(error)],
      })
    } finally {
      setCleaning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Limpiar datos temporales
        </CardTitle>
        <CardDescription>
          Elimina cookies corruptas que pueden causar problemas de carga
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info del estado actual */}
        {storageInfo && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Estado:</strong>{' '}
                  {storageInfo.needsCleaning ? (
                    <span className="text-yellow-600 dark:text-yellow-500">
                      Puede requerir limpieza
                    </span>
                  ) : (
                    <span className="text-green-600 dark:text-green-500">
                      Actualizado
                    </span>
                  )}
                </p>
                {storageInfo.supabaseItems.length > 0 && (
                  <p className="text-muted-foreground">
                    {storageInfo.supabaseItems.length} item(s) de Supabase detectados
                  </p>
                )}
                {storageInfo.protectedItems.length > 0 && (
                  <p className="text-muted-foreground">
                    {storageInfo.protectedItems.length} preferencia(s) de usuario protegidas
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Descripción de qué se hace */}
        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Esta herramienta:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Elimina cookies y datos de Supabase corruptos</li>
            <li>Resuelve problemas de "tablas que no cargan"</li>
            <li className="text-green-600 dark:text-green-500">
              ✓ Preserva tu tema y configuración
            </li>
            <li className="text-green-600 dark:text-green-500">
              ✓ Preserva tasaciones en progreso
            </li>
            <li className="text-green-600 dark:text-green-500">
              ✓ Preserva datos de chat
            </li>
          </ul>
        </div>

        {/* Resultado de última limpieza */}
        {lastResult && (
          <Alert variant={lastResult.success ? "default" : "destructive"}>
            {lastResult.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription>
              {lastResult.success ? (
                <div className="space-y-1">
                  <p className="font-medium">✅ Limpieza exitosa</p>
                  <p className="text-sm">
                    {lastResult.itemsCleaned} elementos limpiados,{' '}
                    {lastResult.itemsPreserved} preservados
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-medium">❌ Error en limpieza</p>
                  {lastResult.errors.length > 0 && (
                    <ul className="text-sm list-disc list-inside">
                      {lastResult.errors.slice(0, 3).map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Botón de limpieza */}
        <div className="flex justify-between items-center pt-2">
          <p className="text-sm text-muted-foreground">
            Úsalo si las tablas no cargan sin F5
          </p>
          <Button
            onClick={handleClean}
            disabled={cleaning}
            variant="outline"
            size="sm"
          >
            {cleaning ? (
              <>
                <span className="mr-2">🔄</span>
                Limpiando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Limpiar ahora
              </>
            )}
          </Button>
        </div>

        {/* Advertencia */}
        <Alert variant="default" className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm">
            <strong>Cuándo usar:</strong> Si después de actualizar la página 
            las tablas requieren F5 para cargar, o si ves errores de autenticación.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

