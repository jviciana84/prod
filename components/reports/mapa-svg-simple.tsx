"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Datos de prueba hardcodeados
const provincias = [
  { nombre: "Barcelona", x: 720, y: 202, cantidad: 15 },
  { nombre: "Madrid", x: 363, y: 277, cantidad: 12 },
  { nombre: "Valencia", x: 566, y: 352, cantidad: 8 },
  { nombre: "Sevilla", x: 227, y: 502, cantidad: 6 },
  { nombre: "Bilbao", x: 412, y: 52, cantidad: 4 },
  { nombre: "Málaga", x: 320, y: 577, cantidad: 3 },
  { nombre: "Zaragoza", x: 535, y: 202, cantidad: 2 },
  { nombre: "Murcia", x: 504, y: 465, cantidad: 1 },
  { nombre: "Alicante", x: 566, y: 427, cantidad: 1 },
  { nombre: "Córdoba", x: 301, y: 502, cantidad: 0 }
]

export function MapaSVGSimple() {
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<string | null>(null)

  const maxVentas = Math.max(...provincias.map(p => p.cantidad))

  const getIntensidadColor = (cantidad: number) => {
    if (cantidad === 0) return "rgba(59, 130, 246, 0.1)"
    const intensidad = Math.min((cantidad / maxVentas) * 100, 100)
    return `rgba(59, 130, 246, ${intensidad / 100})`
  }

  const provinciaActiva = provincias.find(p => p.nombre === provinciaSeleccionada)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Mapa SVG Simple de España</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <svg
              className="w-full h-96 border rounded-lg"
              viewBox="0 0 800 600"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Fondo */}
              <rect width="800" height="600" fill="#f8fafc" />
              
              {/* Provincias como círculos */}
              {provincias.map((provincia, index) => (
                <g key={index}>
                  <circle
                    cx={provincia.x}
                    cy={provincia.y}
                    r={20}
                    fill={getIntensidadColor(provincia.cantidad)}
                    stroke={provincia.cantidad > 0 ? "#1e40af" : "#cbd5e1"}
                    strokeWidth={provincia.cantidad > 0 ? 2 : 1}
                    className="transition-all duration-200 hover:fill-opacity-80 cursor-pointer"
                    onClick={() => setProvinciaSeleccionada(provincia.nombre)}
                  />
                  
                  {/* Etiqueta de cantidad */}
                  {provincia.cantidad > 0 && (
                    <text
                      x={provincia.x}
                      y={provincia.y + 4}
                      textAnchor="middle"
                      fontSize="12"
                      fill="#1e40af"
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      {provincia.cantidad}
                    </text>
                  )}
                  
                  {/* Nombre de la provincia */}
                  <text
                    x={provincia.x}
                    y={provincia.y + 35}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#374151"
                    className="pointer-events-none"
                  >
                    {provincia.nombre}
                  </text>
                </g>
              ))}
            </svg>

            {/* Leyenda */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 border">
              <div className="text-xs font-medium mb-2">Leyenda</div>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
                  <span>Sin ventas</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-300 rounded-full"></div>
                  <span>Baja densidad</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Alta densidad</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalle de provincia seleccionada */}
      {provinciaActiva && (
        <Card>
          <CardHeader>
            <CardTitle>{provinciaActiva.nombre}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {provinciaActiva.cantidad}
              </div>
              <div className="text-sm text-muted-foreground">Ventas</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas generales */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {provincias.length}
              </div>
              <div className="text-sm text-muted-foreground">Provincias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {provincias.reduce((sum, p) => sum + p.cantidad, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Ventas</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
