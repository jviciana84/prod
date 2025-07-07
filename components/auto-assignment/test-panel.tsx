"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { testAutoAssignment, simplifyAutoAssignmentTrigger } from "@/server-actions/photos-assignment"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Wrench } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function TestPanel() {
  const [result, setResult] = useState<{
    success: boolean
    message: string
    vehicle?: { id: string; license_plate: string; assigned_to: string | null }
    photographer?: { id: string; email: string; percentage: number }
  } | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [isSimplifying, setIsSimplifying] = useState(false)
  const { toast } = useToast()

  const handleTest = async () => {
    setIsLoading(true)
    try {
      const testResult = await testAutoAssignment()
      setResult(testResult)
    } catch (error) {
      console.error("Error al probar la asignación automática:", error)
      toast({
        title: "Error",
        description: "No se pudo probar la asignación automática. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSimplify = async () => {
    setIsSimplifying(true)
    try {
      const simplifyResult = await simplifyAutoAssignmentTrigger()
      toast({
        title: simplifyResult.success ? "Éxito" : "Error",
        description: simplifyResult.message,
        variant: simplifyResult.success ? "default" : "destructive",
      })
    } catch (error) {
      console.error("Error al simplificar el trigger:", error)
      toast({
        title: "Error",
        description: "No se pudo simplificar el trigger. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSimplifying(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-500" />
            Probar Asignación Automática
          </CardTitle>
          <CardDescription>
            Inserta un vehículo de prueba y verifica si se le asigna automáticamente un fotógrafo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleTest} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Probando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Probar Asignación Automática
              </>
            )}
          </Button>

          {result && (
            <div
              className={`mt-4 p-4 rounded-md ${result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${result.success ? "text-green-800" : "text-red-800"}`}>
                    {result.success ? "Prueba exitosa" : "Prueba fallida"}
                  </h3>
                  <div className={`mt-2 text-sm ${result.success ? "text-green-700" : "text-red-700"}`}>
                    <p>{result.message}</p>
                  </div>

                  {result.vehicle && (
                    <div className="mt-4 bg-white p-3 rounded-md border">
                      <h4 className="text-sm font-medium text-gray-900">Detalles del vehículo:</h4>
                      <dl className="mt-2 divide-y divide-gray-200">
                        <div className="flex justify-between py-1">
                          <dt className="text-sm text-gray-500">ID:</dt>
                          <dd className="text-sm text-gray-900 font-mono">{result.vehicle.id.substring(0, 8)}...</dd>
                        </div>
                        <div className="flex justify-between py-1">
                          <dt className="text-sm text-gray-500">Matrícula:</dt>
                          <dd className="text-sm text-gray-900 font-medium">{result.vehicle.license_plate}</dd>
                        </div>
                        <div className="flex justify-between py-1">
                          <dt className="text-sm text-gray-500">Fotógrafo asignado:</dt>
                          <dd
                            className={`text-sm ${result.vehicle.assigned_to ? "text-green-600 font-medium" : "text-red-600"}`}
                          >
                            {result.vehicle.assigned_to
                              ? result.photographer?.email || result.vehicle.assigned_to.substring(0, 8) + "..."
                              : "No asignado"}
                          </dd>
                        </div>
                        {result.photographer && (
                          <div className="flex justify-between py-1">
                            <dt className="text-sm text-gray-500">Porcentaje del fotógrafo:</dt>
                            <dd className="text-sm text-gray-900">{result.photographer.percentage}%</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-amber-500" />
            Simplificar Trigger
          </CardTitle>
          <CardDescription>
            Si la asignación automática no funciona, puedes simplificar el trigger para hacerlo más robusto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Atención</h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>
                    Esta acción reemplazará el trigger de asignación automática existente con una versión simplificada.
                    Solo debes usar esta opción si la asignación automática no está funcionando correctamente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button onClick={handleSimplify} disabled={isSimplifying} variant="outline" className="w-full">
            {isSimplifying ? (
              <>
                <Wrench className="mr-2 h-4 w-4 animate-spin" />
                Simplificando...
              </>
            ) : (
              <>
                <Wrench className="mr-2 h-4 w-4" />
                Simplificar Trigger
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
