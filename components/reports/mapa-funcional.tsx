"use client"

import { useState } from "react"

// Datos de prueba
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

export function MapaFuncional() {
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<string | null>(null)

  const maxVentas = Math.max(...provincias.map(p => p.cantidad))

  const getIntensidadColor = (cantidad: number) => {
    if (cantidad === 0) return "#374151" // Gris oscuro
    const intensidad = Math.min((cantidad / maxVentas) * 100, 100)
    if (intensidad < 30) return "#3b82f6" // Azul claro
    if (intensidad < 70) return "#1d4ed8" // Azul medio
    return "#1e40af" // Azul oscuro
  }

  const provinciaActiva = provincias.find(p => p.nombre === provinciaSeleccionada)

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Mapa de Ventas por Provincia
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Haz clic en una provincia para ver los detalles
        </p>
      </div>

      {/* Mapa */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="relative">
          <svg
            className="w-full h-96 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900"
            viewBox="0 0 800 600"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Fondo */}
            <rect width="800" height="600" fill="#f9fafb" className="dark:fill-gray-900" />
            
            {/* Provincias como círculos */}
            {provincias.map((provincia, index) => (
              <g key={index}>
                <circle
                  cx={provincia.x}
                  cy={provincia.y}
                  r={25}
                  fill={getIntensidadColor(provincia.cantidad)}
                  stroke={provincia.cantidad > 0 ? "#ffffff" : "#6b7280"}
                  strokeWidth={2}
                  className="transition-all duration-200 hover:opacity-80 cursor-pointer"
                  onClick={() => setProvinciaSeleccionada(provincia.nombre)}
                />
                
                {/* Etiqueta de cantidad */}
                <text
                  x={provincia.x}
                  y={provincia.y + 5}
                  textAnchor="middle"
                  fontSize="14"
                  fill="#ffffff"
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  {provincia.cantidad}
                </text>
                
                {/* Nombre de la provincia */}
                <text
                  x={provincia.x}
                  y={provincia.y + 40}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#374151"
                  className="dark:fill-gray-300 pointer-events-none font-medium"
                >
                  {provincia.nombre}
                </text>
              </g>
            ))}
          </svg>

          {/* Leyenda */}
          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Leyenda</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Sin ventas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Baja densidad</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-700 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Alta densidad</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detalle de provincia seleccionada */}
      {provinciaActiva && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {provinciaActiva.nombre}
          </h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {provinciaActiva.cantidad}
            </div>
            <div className="text-gray-600 dark:text-gray-300">Ventas</div>
          </div>
        </div>
      )}

      {/* Estadísticas generales */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Resumen</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {provincias.length}
            </div>
            <div className="text-gray-600 dark:text-gray-300">Provincias</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {provincias.reduce((sum, p) => sum + p.cantidad, 0)}
            </div>
            <div className="text-gray-600 dark:text-gray-300">Total Ventas</div>
          </div>
        </div>
      </div>
    </div>
  )
}
