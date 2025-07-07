"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getAssignmentStats } from "@/server-actions/test-auto-assignment"
import { RefreshCw, BarChart2, CheckCircle, AlertCircle, User, Users } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"

interface PhotographerStats {
  user_id: string
  email: string | null
  percentage: number
  assigned_vehicles: number
  total_vehicles: number
  actual_percentage: number
  deficit: number
  is_active: boolean
}

export function StatsPanel() {
  const [stats, setStats] = useState<{
    photographers: PhotographerStats[]
    total_vehicles: number
    total_assigned: number
    total_unassigned: number
  } | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const fetchStats = async () => {
    setIsLoading(true)
    try {
      const result = await getAssignmentStats()
      setStats(result)
    } catch (error) {
      console.error("Error al obtener estadísticas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-blue-500" />
              Estadísticas de Asignación
            </CardTitle>
            <CardDescription>Distribución actual de vehículos entre fotógrafos</CardDescription>
          </div>
          <Button onClick={fetchStats} disabled={isLoading} variant="outline" size="sm" className="h-8 w-8 p-0">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="sr-only">Actualizar</span>
          </Button>
        </CardHeader>
        <CardContent>
          {stats ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 flex items-center">
                  <div className="rounded-full bg-blue-100 p-3 mr-4">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Total de vehículos</p>
                    <p className="text-2xl font-bold text-blue-800">{stats.total_vehicles}</p>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 flex items-center">
                  <div className="rounded-full bg-green-100 p-3 mr-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-green-600">Vehículos asignados</p>
                    <p className="text-2xl font-bold text-green-800">{stats.total_assigned}</p>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-lg p-4 flex items-center">
                  <div className="rounded-full bg-amber-100 p-3 mr-4">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-amber-600">Sin asignar</p>
                    <p className="text-2xl font-bold text-amber-800">{stats.total_unassigned}</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Fotógrafo
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Estado
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Porcentaje Objetivo
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Vehículos Asignados
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Porcentaje Actual
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Progreso
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.photographers.map((photographer) => (
                      <tr key={photographer.user_id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {photographer.email || `Usuario ${photographer.user_id.substring(0, 8)}...`}
                              </div>
                              <div className="text-sm text-gray-500">ID: {photographer.user_id.substring(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              photographer.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {photographer.is_active ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {photographer.percentage}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {photographer.assigned_vehicles} / {stats.total_assigned}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{photographer.actual_percentage.toFixed(1)}%</div>
                          <div className="text-xs text-gray-500">
                            {photographer.deficit > 0
                              ? `Faltan ${Math.ceil(photographer.deficit)} vehículos`
                              : photographer.deficit < 0
                                ? `Sobran ${Math.abs(Math.floor(photographer.deficit))} vehículos`
                                : "Porcentaje exacto"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-xs font-medium text-gray-500">
                                {photographer.actual_percentage.toFixed(1)}% / {photographer.percentage}%
                              </div>
                              <div
                                className={`text-xs font-medium ${
                                  Math.abs(photographer.actual_percentage - photographer.percentage) < 5
                                    ? "text-green-600"
                                    : Math.abs(photographer.actual_percentage - photographer.percentage) < 10
                                      ? "text-amber-600"
                                      : "text-red-600"
                                }`}
                              >
                                {photographer.actual_percentage > photographer.percentage
                                  ? `+${(photographer.actual_percentage - photographer.percentage).toFixed(1)}%`
                                  : photographer.actual_percentage < photographer.percentage
                                    ? `-${(photographer.percentage - photographer.actual_percentage).toFixed(1)}%`
                                    : "Exacto"}
                              </div>
                            </div>
                            <Progress
                              value={(photographer.actual_percentage / photographer.percentage) * 100}
                              className={
                                Math.abs(photographer.actual_percentage - photographer.percentage) < 5
                                  ? "bg-green-100"
                                  : Math.abs(photographer.actual_percentage - photographer.percentage) < 10
                                    ? "bg-amber-100"
                                    : "bg-red-100"
                              }
                              indicatorClassName={
                                Math.abs(photographer.actual_percentage - photographer.percentage) < 5
                                  ? "bg-green-500"
                                  : Math.abs(photographer.actual_percentage - photographer.percentage) < 10
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
