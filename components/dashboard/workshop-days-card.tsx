"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Car, Paintbrush, Wrench, Clock, CircleAlert } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { useState } from "react"

interface WorkshopDaysCardProps {
  currentAverage: number
  last15Average: number
  previous15Average: number
  totalAverage: number
  trendDirection: "up" | "down"
  trendPercentage: string
  soldPending: number
  carsInWorkshop: number
  maxCapacity: number
  saturationPercentage: number
  averagePaintDays: string
  averageWorkshopDays: string
  chartData: { unit: string; days: number; saturation: number; matricula?: string }[]
  incidentPercentage: string // New prop for incident percentage
}

// Custom Tooltip component for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded-lg border bg-background p-2 text-sm shadow-md">
        <p className="font-bold">{data.matricula}</p>
        <p className="text-muted-foreground">{data.days} días</p>
      </div>
    )
  }
  return null
}

// Función para obtener color según días
const getDaysColor = (days: number) => {
  if (days <= 10) return "text-green-500 border-green-500"
  if (days <= 15) return "text-yellow-500 border-yellow-500"
  if (days <= 20) return "text-orange-500 border-orange-500"
  return "text-red-500 border-red-500"
}

// Función para obtener color del porcentaje de incidencias
const getIncidentColor = (percentage: string) => {
  const value = Number.parseFloat(percentage)
  if (value <= 10) return "text-green-500"
  if (value <= 15) return "text-amber-500"
  return "text-red-500"
}

const getBorderClass = (value: number) => {
  if (value <= 10) return "border-green-500"
  if (value <= 15) return "border-amber-500"
  return "border-red-500"
}

interface MetricItem {
  icon: React.ElementType
  label: string
  value: string
  iconColorClass?: string
  valueColorClass?: string
  circleBorderClass?: string
}

export function WorkshopDaysCard({
  currentAverage,
  last15Average,
  previous15Average,
  totalAverage,
  trendDirection,
  trendPercentage,
  soldPending,
  carsInWorkshop,
  maxCapacity,
  saturationPercentage,
  averagePaintDays,
  averageWorkshopDays,
  chartData,
  incidentPercentage, // Destructure new prop
}: WorkshopDaysCardProps) {
  const [hoveredData, setHoveredData] = useState<{ matricula: string; days: number } | null>(null)

  const metrics: MetricItem[] = [
    {
      icon: Car,
      label: "Vendidos pendientes",
      value: `${soldPending} und.`,
      circleBorderClass: getBorderClass(soldPending),
    },
    {
      icon: Paintbrush,
      label: "Promedio pintura",
      value: `${averagePaintDays} días`,
      circleBorderClass: getBorderClass(Number.parseFloat(averagePaintDays)),
    },
    {
      icon: Wrench,
      label: "Promedio taller",
      value: `${averageWorkshopDays} días`,
      circleBorderClass: getBorderClass(Number.parseFloat(averageWorkshopDays)),
    },
    {
      icon: CircleAlert,
      label: "Porcentaje entregas con incidencia",
      value: `${incidentPercentage}%`,
      iconColorClass: "text-red-500", // Icon remains red for alert
      valueColorClass: getIncidentColor(incidentPercentage), // Value color based on percentage
      circleBorderClass: getBorderClass(Number.parseFloat(incidentPercentage)), // Border color based on percentage
    },
  ]

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Clock className="h-5 w-5 text-primary" />
          Promedio de Días en Taller
        </CardTitle>
        <p className="text-sm text-muted-foreground">Seguimiento de tiempos desde venta hasta finalización</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Subcard 1 - Promedio Principal + Saturación */}
          <Card className="border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center text-4xl font-bold ${getDaysColor(
                      currentAverage,
                    )}`}
                  >
                    {currentAverage}
                    <span className="text-xs font-normal mt-1">días</span>
                  </div>
                  <div className="flex items-center">
                    {trendDirection === "down" ? (
                      <TrendingDown className="h-6 w-6 text-green-500" />
                    ) : (
                      <TrendingUp className="h-6 w-6 text-red-500" />
                    )}
                    <span
                      className={`ml-1 text-sm font-medium ${
                        trendDirection === "down" ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {trendPercentage}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex justify-between">
                  <span>Últimas 15 unidades:</span>
                  <span className="font-medium">{last15Average} días</span>
                </div>
                <div className="flex justify-between">
                  <span>Últimas 20 unidades:</span>
                  <span className="font-medium">{last15Average} días</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Promedio total:</span>
                  <span className="font-bold">{totalAverage} días</span>
                </div>
              </div>

              {/* Saturación del Taller */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Saturación Taller</span>
                  <span className="text-sm font-bold">{saturationPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-red-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${saturationPercentage}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {carsInWorkshop} de {maxCapacity} coches en taller
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subcard 2 - Gráfico */}
          <Card className="border">
            <CardContent className="p-2 h-full flex flex-col">
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 2, right: 5, left: -36, bottom: -23 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.7)" />
                    <XAxis dataKey="unit" axisLine={false} tickLine={false} tick={false} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      domain={[0, (dataMax: number) => Math.max(dataMax + 5, 20)]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="days"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{
                        r: 6,
                        onClick: (e, data) => setHoveredData(data.payload),
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {/* Información del vehículo al pasar el cursor */}
              <div className="mt-2 text-center text-sm font-mono bg-muted/30 rounded px-3 py-2 min-h-[2.5rem] flex items-center justify-center">
                {hoveredData ? (
                  <span className="text-foreground font-medium">
                    {hoveredData.matricula} - {hoveredData.days} días
                  </span>
                ) : (
                  <span className="text-muted-foreground">Últimos {chartData.length} vehículos completados</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subcard 3 - Métricas Simplificadas */}
          <Card className="border">
            <CardContent className="p-4">
              <div className="space-y-4">
                {metrics.map((metric, index) => {
                  const IconComponent = metric.icon
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg font-bold ${
                          metric.circleBorderClass || ""
                        }`}
                      >
                        <IconComponent className={`h-4 w-4 ${metric.iconColorClass || "text-current"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">{metric.label}</span>
                          <span className={`text-sm font-bold ml-2 ${metric.valueColorClass || ""}`}>
                            {metric.value}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}
