"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { assignPhotographersToExistingVehicles } from "@/server-actions/assign-photographers"
import { useToast } from "@/hooks/use-toast"
import { Camera, Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function AssignExistingVehicles() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { toast } = useToast()

  const handleAssign = async () => {
    setIsLoading(true)
    try {
      const result = await assignPhotographersToExistingVehicles()
      setResult(result)

      if (result.success) {
        toast({
          title: "Asignación completada",
          description: result.message,
        })
      } else {
        toast({
          title: "Error en la asignación",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al asignar fotógrafos:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al asignar fotógrafos a los vehículos existentes.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Asignar Fotógrafos a Vehículos Existentes
        </CardTitle>
        <CardDescription>
          Asigna fotógrafos a todos los vehículos que actualmente no tienen fotógrafo asignado
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Esta herramienta asignará fotógrafos a todos los vehículos pendientes que actualmente no tienen un fotógrafo
          asignado. La asignación se realizará de forma equitativa entre los fotógrafos activos.
        </p>

        {result && (
          <div className="mt-4 mb-4">
            {result.success ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-green-800 font-medium">{result.message}</span>
                </div>
                {result.details && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">Vehículos totales:</span>
                      <Badge variant="outline">{result.details.totalVehicles}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">Vehículos asignados:</span>
                      <Badge variant="outline">{result.details.assignedVehicles}</Badge>
                    </div>
                    {result.details.photographerAssignments && result.details.photographerAssignments.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm text-green-700">Asignaciones por fotógrafo:</span>
                        <div className="mt-1 space-y-1">
                          {result.details.photographerAssignments.map((assignment: any, index: number) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <span>{assignment.photographerName}</span>
                              <Badge variant="outline">{assignment.assignedCount} vehículos</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-red-800 font-medium">{result.message}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleAssign} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Asignando...
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Asignar Fotógrafos
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
