"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertCircle, CheckCircle } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { getAssignmentStats } from "@/server-actions/photos-assignment"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface PhotographerStat {
  id: number
  userId: string
  name: string
  targetPercentage: number
  actualPercentage: number
  assignedCount: number
  isActive: boolean
  difference: number
}

export default function AssignmentStats() {
  const [stats, setStats] = useState<{
    success: boolean
    message?: string
    totalAssigned: number
    photographers: PhotographerStat[]
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const loadStats = async () => {
    setLoading(true)
    try {
      const result = await getAssignmentStats()
      setStats(result)
    } catch (error) {
      console.error("Error al cargar estadísticas:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas de Asignación</CardTitle>
          <CardDescription>Cargando estadísticas...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!stats.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas de Asignación</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{stats.message || "Error al cargar estadísticas"}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Estadísticas de Asignación</CardTitle>
          <CardDescription>
            Distribución actual de vehículos entre fotógrafos ({stats.totalAssigned} vehículos asignados)
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={loadStats} disabled={loading}>
          {loading ? <BMWMSpinner size={16} className="mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Actualizar
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fotógrafo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Objetivo</TableHead>
              <TableHead className="text-right">Actual</TableHead>
              <TableHead className="text-right">Diferencia</TableHead>
              <TableHead className="text-right">Vehículos</TableHead>
              <TableHead>Distribución</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.photographers.map((photographer, index) => (
              <TableRow key={`photographer-${photographer.userId}-${index}`}>
                <TableCell className="font-medium">{photographer.name}</TableCell>
                <TableCell>
                  {photographer.isActive ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Activo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                      Inactivo
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">{photographer.targetPercentage}%</TableCell>
                <TableCell className="text-right">{photographer.actualPercentage}%</TableCell>
                <TableCell className="text-right">
                  <span
                    className={
                      photographer.difference > 0 ? "text-green-600" : photographer.difference < 0 ? "text-red-600" : ""
                    }
                  >
                    {photographer.difference > 0 ? "+" : ""}
                    {photographer.difference}%
                  </span>
                </TableCell>
                <TableCell className="text-right">{photographer.assignedCount}</TableCell>
                <TableCell className="w-[200px]">
                  <div className="flex items-center gap-2">
                    <Progress
                      value={photographer.actualPercentage}
                      max={100}
                      className={`h-2 ${
                        Math.abs(photographer.difference) < 2
                          ? "bg-green-100"
                          : Math.abs(photographer.difference) < 5
                            ? "bg-yellow-100"
                            : "bg-red-100"
                      }`}
                      indicatorClassName={
                        Math.abs(photographer.difference) < 2
                          ? "bg-green-500"
                          : Math.abs(photographer.difference) < 5
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }
                    />
                    <span className="text-xs text-muted-foreground w-10">{photographer.actualPercentage}%</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-6 bg-muted/50 p-4 rounded-md border">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h3 className="font-medium">Asignación automática configurada correctamente</h3>
              <p className="text-sm text-muted-foreground mt-1">
                El sistema ahora asignará automáticamente fotógrafos a los nuevos vehículos cuando se marquen como
                recibidos, respetando los porcentajes configurados.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
