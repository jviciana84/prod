"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Wrench, CheckCircle, AlertTriangle, Trash2, RotateCcw, Mail, Database } from "lucide-react"

export default function DebugRecogidasTestingPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [cleanupLoading, setCleanupLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [result, setResult] = useState<any>(null)

  // Cargar estadísticas
  const loadStats = async () => {
    try {
      const response = await fetch("/api/debug-recogidas-stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error cargando estadísticas:", error)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const cleanupRecogidas = async () => {
    setCleanupLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/debug-cleanup-recogidas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        toast({
          title: "✅ Limpieza completada",
          description: "Historial limpiado y recogidas restauradas exitosamente.",
        })
        // Recargar estadísticas
        loadStats()
      } else {
        setResult(data)
        toast({
          title: "❌ Error en limpieza",
          description: data.error || "Error desconocido",
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error de conexión"
      setResult({ error: errorMessage })
      toast({
        title: "❌ Error de conexión",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setCleanupLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Panel de Pruebas - Recogidas
          </CardTitle>
          <CardDescription>
            Controla las pruebas de envío de recogidas y limpia el historial cuando termines
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estadísticas Actuales */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Recogidas Pendientes</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">{stats.recogidas_pendientes}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Enviadas (Historial)</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">{stats.recogidas_historial}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Total Vehículos</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">{stats.total_vehiculos}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Instrucciones de Pruebas */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Instrucciones para Pruebas:</strong>
              <br />
              1. <strong>Ve a la página de recogidas</strong> y añade algunos vehículos a la lista
              <br />
              2. <strong>Configura los emails</strong> en /dashboard/admin/email-config (pestaña Recogidas)
              <br />
              3. <strong>Envía las recogidas</strong> y verifica que lleguen los emails
              <br />
              4. <strong>Cuando termines las pruebas</strong>, usa el botón de limpieza abajo
            </AlertDescription>
          </Alert>

          {/* Botón de Limpieza */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Limpiar Historial y Restaurar
              </CardTitle>
              <CardDescription>
                ⚠️ Esta acción eliminará todo el historial de recogidas enviadas y restaurará todas las recogidas a pendientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Acción Destructiva:</strong> Esta operación:
                  <br />
                  • Elimina TODO el historial de recogidas enviadas
                  <br />
                  • Restaura todas las recogidas a estado pendiente
                  <br />
                  • Limpia los logs de email de recogidas
                  <br />
                  • <strong>Esta acción NO se puede deshacer</strong>
                </AlertDescription>
              </Alert>

              <Button 
                onClick={cleanupRecogidas} 
                disabled={cleanupLoading}
                variant="destructive"
                className="w-full"
              >
                {cleanupLoading ? (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                    Limpiando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpiar Historial y Restaurar Todo
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Resultado de la Limpieza */}
          {result && (
            <div className="mt-4">
              {result.success ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Limpieza Completada:</strong> {result.message}
                    {result.stats && (
                      <div className="mt-2 space-y-1">
                        <div>• Recogidas pendientes: <Badge variant="secondary">{result.stats.recogidas_pendientes}</Badge></div>
                        <div>• Recogidas en historial: <Badge variant="secondary">{result.stats.recogidas_historial}</Badge></div>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>❌ Error:</strong> {result.error}
                    {result.details && (
                      <div className="mt-2 p-2 bg-muted rounded text-sm">
                        <pre>{result.details}</pre>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 