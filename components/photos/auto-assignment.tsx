"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { assignVehiclesToPhotographers } from "@/server-actions/photos-assignment"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import UserDisplay from "./user-display"

interface AssignmentDetails {
  totalVehicles: number
  assignedVehicles: number
  photographerAssignments: {
    photographerId: string
    photographerName: string
    assignedCount: number
    percentage: number
  }[]
}

export default function AutoAssignment() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: AssignmentDetails
  } | null>(null)

  const handleAssign = async () => {
    if (!confirm("¿Estás seguro de que deseas asignar vehículos automáticamente?")) {
      return
    }

    setIsLoading(true)
    try {
      const result = await assignVehiclesToPhotographers()
      setResult(result)
    } catch (error) {
      console.error("Error al asignar vehículos:", error)
      setResult({
        success: false,
        message: `Error al asignar vehículos: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asignación Automática</CardTitle>
        <CardDescription>Asigna vehículos pendientes a fotógrafos según los porcentajes configurados</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Esta acción asignará automáticamente todos los vehículos pendientes a los fotógrafos activos según sus
            porcentajes configurados.
          </p>
          <Button onClick={handleAssign} disabled={isLoading}>
            {isLoading ? <BMWMSpinner size={16} className="mr-2" /> : null}
            Asignar Automáticamente
          </Button>
        </div>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{result.success ? "Éxito" : "Error"}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>

            {result.success && result.details && (
              <div className="mt-4">
                <p className="font-medium">Detalles de la asignación:</p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>Vehículos totales: {result.details.totalVehicles}</li>
                  <li>Vehículos asignados: {result.details.assignedVehicles}</li>
                </ul>

                {result.details.photographerAssignments.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium mb-2">Asignaciones por fotógrafo:</p>
                    <div className="bg-background/50 rounded-md p-2">
                      <table className="w-full text-sm">
                        <thead>
                          <tr>
                            <th className="text-left font-medium">Fotógrafo</th>
                            <th className="text-center font-medium">Porcentaje</th>
                            <th className="text-center font-medium">Asignados</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.details.photographerAssignments.map((assignment) => (
                            <tr key={assignment.photographerId}>
                              <td className="py-1">
                                <UserDisplay
                                  userId={assignment.photographerId}
                                  fallback={assignment.photographerName}
                                />
                              </td>
                              <td className="text-center">{assignment.percentage}%</td>
                              <td className="text-center">{assignment.assignedCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
