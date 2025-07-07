"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseClient } from "@/lib/supabase/singleton"
import { differenceInDays } from "date-fns"
import type { StockItem } from "@/lib/types/stock"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

interface StockStats {
  total: number
  highPriority: number
  mediumPriority: number
  lowPriority: number
  normalPriority: number
  avgDaysInStock: number
  avgDaysHighPriority: number
  avgDaysMediumPriority: number
  avgDaysLowPriority: number
}

interface StockStatsCardProps {
  initialStock: StockItem[]
}

export default function StockStatsCard({ initialStock }: StockStatsCardProps) {
  const [stats, setStats] = useState<StockStats>({
    total: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
    normalPriority: 0,
    avgDaysInStock: 0,
    avgDaysHighPriority: 0,
    avgDaysMediumPriority: 0,
    avgDaysLowPriority: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  const supabase = getSupabaseClient()

  useEffect(() => {
    async function calculateStats() {
      setIsLoading(true)
      try {
        // Obtener datos de fotografiado
        const licensePlates = initialStock.map((item) => item.license_plate)
        const { data: photosData } = await supabase
          .from("fotos")
          .select("license_plate, photos_completed, estado_pintura")
          .in("license_plate", licensePlates)

        const photoStatus: Record<string, { completed: boolean; paintStatus: string | null }> = {}
        photosData?.forEach((item) => {
          photoStatus[item.license_plate] = {
            completed: item.photos_completed || false,
            paintStatus: item.estado_pintura,
          }
        })

        // Calcular estadísticas
        let highPriority = 0
        let mediumPriority = 0
        let lowPriority = 0
        let normalPriority = 0

        let totalDays = 0
        let highPriorityDays = 0
        let mediumPriorityDays = 0
        let lowPriorityDays = 0

        let highPriorityCount = 0
        let mediumPriorityCount = 0
        let lowPriorityCount = 0

        const now = new Date()

        initialStock.forEach((item) => {
          // Calcular días en stock
          let daysInStock = 0
          if (item.reception_date) {
            daysInStock = differenceInDays(now, new Date(item.reception_date))
            totalDays += daysInStock
          }

          // Determinar prioridad
          const isPhotographed = photoStatus[item.license_plate]?.completed || false
          const paintStatus = photoStatus[item.license_plate]?.paintStatus

          if (paintStatus === "no_apto") {
            highPriority++
            highPriorityDays += daysInStock
            highPriorityCount++
          } else if (!isPhotographed) {
            mediumPriority++
            mediumPriorityDays += daysInStock
            mediumPriorityCount++
          } else if (daysInStock > 7) {
            lowPriority++
            lowPriorityDays += daysInStock
            lowPriorityCount++
          } else {
            normalPriority++
          }
        })

        setStats({
          total: initialStock.length,
          highPriority,
          mediumPriority,
          lowPriority,
          normalPriority,
          avgDaysInStock: initialStock.length > 0 ? Math.round(totalDays / initialStock.length) : 0,
          avgDaysHighPriority: highPriorityCount > 0 ? Math.round(highPriorityDays / highPriorityCount) : 0,
          avgDaysMediumPriority: mediumPriorityCount > 0 ? Math.round(mediumPriorityDays / mediumPriorityCount) : 0,
          avgDaysLowPriority: lowPriorityCount > 0 ? Math.round(lowPriorityDays / lowPriorityCount) : 0,
        })
      } catch (error) {
        console.error("Error al calcular estadísticas:", error)
      } finally {
        setIsLoading(false)
      }
    }

    calculateStats()
  }, [initialStock, supabase])

  // Calcular porcentajes
  const highPriorityPercentage = stats.total > 0 ? Math.round((stats.highPriority / stats.total) * 100) : 0
  const mediumPriorityPercentage = stats.total > 0 ? Math.round((stats.mediumPriority / stats.total) * 100) : 0
  const lowPriorityPercentage = stats.total > 0 ? Math.round((stats.lowPriority / stats.total) * 100) : 0
  const normalPriorityPercentage = stats.total > 0 ? Math.round((stats.normalPriority / stats.total) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estadísticas de Prioridad</CardTitle>
        <CardDescription>Análisis de prioridades y tiempos medios en stock</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center p-3 border rounded-lg">
                <div className="text-3xl font-bold">{stats.highPriority}</div>
                <div className="text-sm text-muted-foreground">Prioridad Alta</div>
                <div className="mt-1 text-xs font-semibold text-red-500">{highPriorityPercentage}%</div>
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse mt-2" />
              </div>
              <div className="flex flex-col items-center p-3 border rounded-lg">
                <div className="text-3xl font-bold">{stats.mediumPriority}</div>
                <div className="text-sm text-muted-foreground">Prioridad Media</div>
                <div className="mt-1 text-xs font-semibold text-amber-500">{mediumPriorityPercentage}%</div>
                <div className="w-3 h-3 rounded-full bg-amber-500 animate-[pulse_3s_ease-in-out_infinite] mt-2" />
              </div>
              <div className="flex flex-col items-center p-3 border rounded-lg">
                <div className="text-3xl font-bold">{stats.lowPriority}</div>
                <div className="text-sm text-muted-foreground">Prioridad Baja</div>
                <div className="mt-1 text-xs font-semibold text-blue-500">{lowPriorityPercentage}%</div>
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-[pulse_5s_ease-in-out_infinite] mt-2" />
              </div>
              <div className="flex flex-col items-center p-3 border rounded-lg">
                <div className="text-3xl font-bold">{stats.normalPriority}</div>
                <div className="text-sm text-muted-foreground">Sin Prioridad</div>
                <div className="mt-1 text-xs font-semibold text-gray-500">{normalPriorityPercentage}%</div>
                <div className="w-3 h-3 rounded-full bg-gray-300 mt-2" />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Tiempo medio en stock</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col p-3 border rounded-lg">
                  <div className="text-sm text-muted-foreground">General</div>
                  <div className="text-xl font-bold">{stats.avgDaysInStock} días</div>
                </div>
                <div className="flex flex-col p-3 border rounded-lg border-red-200 bg-red-50 dark:bg-red-900/10">
                  <div className="text-sm text-muted-foreground">Prioridad Alta</div>
                  <div className="text-xl font-bold">{stats.avgDaysHighPriority} días</div>
                </div>
                <div className="flex flex-col p-3 border rounded-lg border-amber-200 bg-amber-50 dark:bg-amber-900/10">
                  <div className="text-sm text-muted-foreground">Prioridad Media</div>
                  <div className="text-xl font-bold">{stats.avgDaysMediumPriority} días</div>
                </div>
                <div className="flex flex-col p-3 border rounded-lg border-blue-200 bg-blue-50 dark:bg-blue-900/10">
                  <div className="text-sm text-muted-foreground">Prioridad Baja</div>
                  <div className="text-xl font-bold">{stats.avgDaysLowPriority} días</div>
                </div>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-4">
              <div className="bg-red-500 h-2.5 rounded-l-full" style={{ width: `${highPriorityPercentage}%` }}></div>
              <div
                className="bg-amber-500 h-2.5"
                style={{
                  width: `${mediumPriorityPercentage}%`,
                  marginLeft: `${highPriorityPercentage}%`,
                  position: "relative",
                  marginTop: "-0.625rem",
                }}
              ></div>
              <div
                className="bg-blue-500 h-2.5"
                style={{
                  width: `${lowPriorityPercentage}%`,
                  marginLeft: `${highPriorityPercentage + mediumPriorityPercentage}%`,
                  position: "relative",
                  marginTop: "-0.625rem",
                }}
              ></div>
              <div
                className="bg-gray-300 h-2.5 rounded-r-full"
                style={{
                  width: `${normalPriorityPercentage}%`,
                  marginLeft: `${highPriorityPercentage + mediumPriorityPercentage + lowPriorityPercentage}%`,
                  position: "relative",
                  marginTop: "-0.625rem",
                }}
              ></div>
            </div>
          </>
        )}

        <Alert variant="outline" className="mt-4">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            <p className="text-sm">
              <span className="font-semibold">Prioridad Alta (Rojo):</span> Vehículos con estado de pintura "no_apto" en
              la tabla fotos.
              <br />
              <span className="font-semibold">Prioridad Media (Ámbar):</span> Vehículos sin fotografiar.
              <br />
              <span className="font-semibold">Prioridad Baja (Azul):</span> Vehículos con más de 7 días desde su
              recepción.
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Última actualización: {new Date().toLocaleString()}
      </CardFooter>
    </Card>
  )
}
