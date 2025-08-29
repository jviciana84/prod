"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface VentaReal {
  client_province?: string
  price?: number
  advisor?: string
  brand?: string
  payment_method?: string
  created_at: string
}

interface ProvinciaData {
  nombre: string
  x: number
  y: number
  cantidad: number
  ingresos: number
  asesores: string[]
  marcas: string[]
}

export function MapaEspanaReal() {
  const [provincias, setProvincias] = useState<ProvinciaData[]>([])
  const [loading, setLoading] = useState(true)
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  // Coordenadas reales de las provincias españolas
  const coordenadasProvincias = {
    "Barcelona": { x: 720, y: 202 },
    "Madrid": { x: 363, y: 277 },
    "Valencia": { x: 566, y: 352 },
    "Sevilla": { x: 227, y: 502 },
    "Bilbao": { x: 412, y: 52 },
    "Málaga": { x: 320, y: 577 },
    "Zaragoza": { x: 535, y: 202 },
    "Murcia": { x: 504, y: 465 },
    "Alicante": { x: 566, y: 427 },
    "Córdoba": { x: 301, y: 502 },
    "Granada": { x: 350, y: 550 },
    "Valladolid": { x: 320, y: 200 },
    "Oviedo": { x: 380, y: 80 },
    "Vigo": { x: 280, y: 120 },
    "A Coruña": { x: 300, y: 100 },
    "Pamplona": { x: 480, y: 150 },
    "Logroño": { x: 450, y: 180 },
    "Santander": { x: 420, y: 70 },
    "San Sebastián": { x: 460, y: 60 },
    "Huesca": { x: 520, y: 180 },
    "Teruel": { x: 520, y: 320 },
    "Cuenca": { x: 420, y: 320 },
    "Guadalajara": { x: 380, y: 250 },
    "Toledo": { x: 340, y: 300 },
    "Ciudad Real": { x: 320, y: 380 },
    "Jaén": { x: 320, y: 480 },
    "Almería": { x: 420, y: 520 },
    "Cádiz": { x: 250, y: 580 },
    "Huelva": { x: 200, y: 540 },
    "Badajoz": { x: 200, y: 420 },
    "Cáceres": { x: 250, y: 380 },
    "Salamanca": { x: 280, y: 280 },
    "Ávila": { x: 320, y: 250 },
    "Segovia": { x: 340, y: 230 },
    "Soria": { x: 400, y: 200 },
    "La Rioja": { x: 450, y: 180 },
    "Navarra": { x: 480, y: 150 },
    "Gipuzkoa": { x: 460, y: 60 },
    "Bizkaia": { x: 420, y: 70 },
    "Araba": { x: 440, y: 80 },
    "Asturias": { x: 380, y: 80 },
    "Cantabria": { x: 420, y: 70 },
    "Galicia": { x: 280, y: 120 },
    "Castilla y León": { x: 320, y: 200 },
    "Castilla-La Mancha": { x: 380, y: 320 },
    "Extremadura": { x: 200, y: 420 },
    "Andalucía": { x: 320, y: 520 },
    "Región de Murcia": { x: 504, y: 465 },
    "Comunidad Valenciana": { x: 566, y: 352 },
    "Cataluña": { x: 720, y: 202 },
    "Aragón": { x: 520, y: 180 },
    "La Rioja": { x: 450, y: 180 },
    "Navarra": { x: 480, y: 150 },
    "País Vasco": { x: 460, y: 60 },
    "Principado de Asturias": { x: 380, y: 80 },
    "Cantabria": { x: 420, y: 70 },
    "Galicia": { x: 280, y: 120 }
  }

  useEffect(() => {
    cargarDatosReales()
  }, [])

  const cargarDatosReales = async () => {
    try {
      setLoading(true)
      
      // Obtener datos reales de ventas
      const { data: ventas, error } = await supabase
        .from("sales_vehicles")
        .select("client_province, price, advisor, brand, payment_method, created_at")
        .not("client_province", "is", null)

      if (error) {
        console.error("Error cargando datos:", error)
        return
      }

      // Procesar datos por provincia
      const datosPorProvincia: Record<string, ProvinciaData> = {}

      ventas?.forEach((venta: VentaReal) => {
        const provincia = venta.client_province || "Sin provincia"
        const coordenadas = coordenadasProvincias[provincia as keyof typeof coordenadasProvincias]
        
        if (!coordenadas) return

        if (!datosPorProvincia[provincia]) {
          datosPorProvincia[provincia] = {
            nombre: provincia,
            x: coordenadas.x,
            y: coordenadas.y,
            cantidad: 0,
            ingresos: 0,
            asesores: [],
            marcas: []
          }
        }

        datosPorProvincia[provincia].cantidad++
        datosPorProvincia[provincia].ingresos += venta.price || 0
        
        if (venta.advisor && !datosPorProvincia[provincia].asesores.includes(venta.advisor)) {
          datosPorProvincia[provincia].asesores.push(venta.advisor)
        }
        
        if (venta.brand && !datosPorProvincia[provincia].marcas.includes(venta.brand)) {
          datosPorProvincia[provincia].marcas.push(venta.brand)
        }
      })

      setProvincias(Object.values(datosPorProvincia))
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const maxVentas = Math.max(...provincias.map(p => p.cantidad), 1)

  const getIntensidadColor = (cantidad: number) => {
    if (cantidad === 0) return "#374151"
    const intensidad = Math.min((cantidad / maxVentas) * 100, 100)
    if (intensidad < 30) return "#3b82f6"
    if (intensidad < 70) return "#1d4ed8"
    return "#1e40af"
  }

  const provinciaActiva = provincias.find(p => p.nombre === provinciaSeleccionada)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Mapa de Ventas por Provincia
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Cargando datos reales de la base de datos...
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Mapa de Ventas por Provincia
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Datos reales de ventas de la base de datos
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="relative">
          <svg
            className="w-full h-96 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900"
            viewBox="0 0 800 600"
            preserveAspectRatio="xMidYMid meet"
          >
            <rect width="800" height="600" fill="#f9fafb" className="dark:fill-gray-900" />
            
            {/* Contorno real de España */}
            <path
              d="M 150 150 L 200 120 L 250 110 L 300 100 L 350 90 L 400 85 L 450 80 L 500 75 L 550 70 L 600 65 L 650 60 L 700 55 L 750 50 L 780 45 L 800 40 L 800 80 L 780 100 L 750 120 L 700 140 L 650 160 L 600 180 L 550 200 L 500 220 L 450 240 L 400 260 L 350 280 L 300 300 L 250 320 L 200 340 L 150 360 L 120 380 L 100 400 L 80 420 L 60 440 L 40 460 L 20 480 L 10 500 L 5 520 L 0 540 L 0 560 L 10 580 L 20 600 L 40 580 L 60 560 L 80 540 L 100 520 L 120 500 L 150 480 L 180 460 L 200 440 L 220 420 L 240 400 L 260 380 L 280 360 L 300 340 L 320 320 L 340 300 L 360 280 L 380 260 L 400 240 L 420 220 L 440 200 L 460 180 L 480 160 L 500 140 L 520 120 L 540 100 L 560 80 L 580 60 L 600 40 L 620 20 L 640 10 L 660 5 L 680 0 L 700 5 L 720 10 L 740 20 L 760 40 L 780 60 L 800 80 L 800 120 L 780 140 L 760 160 L 740 180 L 720 200 L 700 220 L 680 240 L 660 260 L 640 280 L 620 300 L 600 320 L 580 340 L 560 360 L 540 380 L 520 400 L 500 420 L 480 440 L 460 460 L 440 480 L 420 500 L 400 520 L 380 540 L 360 560 L 340 580 L 320 600 L 300 580 L 280 560 L 260 540 L 240 520 L 220 500 L 200 480 L 180 460 L 160 440 L 140 420 L 120 400 L 100 380 L 80 360 L 60 340 L 40 320 L 20 300 L 0 280 L 0 240 L 20 220 L 40 200 L 60 180 L 80 160 L 100 140 L 120 120 L 140 100 L 160 80 L 180 60 L 200 40 L 220 20 L 240 10 L 260 5 L 280 0 L 300 5 L 320 10 L 340 20 L 360 40 L 380 60 L 400 80 L 420 100 L 440 120 L 460 140 L 480 160 L 500 180 L 520 200 L 540 220 L 560 240 L 580 260 L 600 280 L 620 300 L 640 320 L 660 340 L 680 360 L 700 380 L 720 400 L 740 420 L 760 440 L 780 460 L 800 480 L 800 520 L 780 540 L 760 560 L 740 580 L 720 600 L 700 580 L 680 560 L 660 540 L 640 520 L 620 500 L 600 480 L 580 460 L 560 440 L 540 420 L 520 400 L 500 380 L 480 360 L 460 340 L 440 320 L 420 300 L 400 280 L 380 260 L 360 240 L 340 220 L 320 200 L 300 180 L 280 160 L 260 140 L 240 120 L 220 100 L 200 80 L 180 60 L 160 40 L 140 20 L 120 10 L 100 5 L 80 0 L 60 5 L 40 10 L 20 20 L 0 40 L 0 80 L 20 100 L 40 120 L 60 140 L 80 160 L 100 180 L 120 200 L 140 220 L 160 240 L 180 260 L 200 280 L 220 300 L 240 320 L 260 340 L 280 360 L 300 380 L 320 400 L 340 420 L 360 440 L 380 460 L 400 480 L 420 500 L 440 520 L 460 540 L 480 560 L 500 580 L 520 600 L 540 580 L 560 560 L 580 540 L 600 520 L 620 500 L 640 480 L 660 460 L 680 440 L 700 420 L 720 400 L 740 380 L 760 360 L 780 340 L 800 320 L 800 280 L 780 260 L 760 240 L 740 220 L 720 200 L 700 180 L 680 160 L 660 140 L 640 120 L 620 100 L 600 80 L 580 60 L 560 40 L 540 20 L 520 10 L 500 5 L 480 0 L 460 5 L 440 10 L 420 20 L 400 40 L 380 60 L 360 80 L 340 100 L 320 120 L 300 140 L 280 160 L 260 180 L 240 200 L 220 220 L 200 240 L 180 260 L 160 280 L 140 300 L 120 320 L 100 340 L 80 360 L 60 380 L 40 400 L 20 420 L 0 440 L 0 480 L 20 500 L 40 520 L 60 540 L 80 560 L 100 580 L 120 600 L 140 580 L 160 560 L 180 540 L 200 520 L 220 500 L 240 480 L 260 460 L 280 440 L 300 420 L 320 400 L 340 380 L 360 360 L 380 340 L 400 320 L 420 300 L 440 280 L 460 260 L 480 240 L 500 220 L 520 200 L 540 180 L 560 160 L 580 140 L 600 120 L 620 100 L 640 80 L 660 60 L 680 40 L 700 20 L 720 10 L 740 5 L 760 0 L 780 5 L 800 10 L 800 50 L 780 70 L 760 90 L 740 110 L 720 130 L 700 150 L 680 170 L 660 190 L 640 210 L 620 230 L 600 250 L 580 270 L 560 290 L 540 310 L 520 330 L 500 350 L 480 370 L 460 390 L 440 410 L 420 430 L 400 450 L 380 470 L 360 490 L 340 510 L 320 530 L 300 550 L 280 570 L 260 590 L 240 600 L 220 580 L 200 560 L 180 540 L 160 520 L 140 500 L 120 480 L 100 460 L 80 440 L 60 420 L 40 400 L 20 380 L 0 360 L 0 320 L 20 300 L 40 280 L 60 260 L 80 240 L 100 220 L 120 200 L 140 180 L 160 160 L 180 140 L 200 120 L 220 100 L 240 80 L 260 60 L 280 40 L 300 20 L 320 10 L 340 5 L 360 0 L 380 5 L 400 10 L 420 20 L 440 40 L 460 60 L 480 80 L 500 100 L 520 120 L 540 140 L 560 160 L 580 180 L 600 200 L 620 220 L 640 240 L 660 260 L 680 280 L 700 300 L 720 320 L 740 340 L 760 360 L 780 380 L 800 400 L 800 440 L 780 460 L 760 480 L 740 500 L 720 520 L 700 540 L 680 560 L 660 580 L 640 600 L 620 580 L 600 560 L 580 540 L 560 520 L 540 500 L 520 480 L 500 460 L 480 440 L 460 420 L 440 400 L 420 380 L 400 360 L 380 340 L 360 320 L 340 300 L 320 280 L 300 260 L 280 240 L 260 220 L 240 200 L 220 180 L 200 160 L 180 140 L 160 120 L 140 100 L 120 80 L 100 60 L 80 40 L 60 20 L 40 10 L 20 5 L 0 0 L 0 40 L 20 60 L 40 80 L 60 100 L 80 120 L 100 140 L 120 160 L 140 180 L 160 200 L 180 220 L 200 240 L 220 260 L 240 280 L 260 300 L 280 320 L 300 340 L 320 360 L 340 380 L 360 400 L 380 420 L 400 440 L 420 460 L 440 480 L 460 500 L 480 520 L 500 540 L 520 560 L 540 580 L 560 600 L 580 580 L 600 560 L 620 540 L 640 520 L 660 500 L 680 480 L 700 460 L 720 440 L 740 420 L 760 400 L 780 380 L 800 360 L 800 400 L 780 420 L 760 440 L 740 460 L 720 480 L 700 500 L 680 520 L 660 540 L 640 560 L 620 580 L 600 600 L 580 580 L 560 560 L 540 540 L 520 520 L 500 500 L 480 480 L 460 460 L 440 440 L 420 420 L 400 400 L 380 380 L 360 360 L 340 340 L 320 320 L 300 300 L 280 280 L 260 260 L 240 240 L 220 220 L 200 200 L 180 180 L 160 160 L 140 140 L 120 120 L 100 100 L 80 80 L 60 60 L 40 40 L 20 20 L 0 0 Z"
              fill="#e5e7eb"
              stroke="#9ca3af"
              strokeWidth="2"
              className="dark:fill-gray-700 dark:stroke-gray-500"
            />
            
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

      {provinciaActiva && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {provinciaActiva.nombre}
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {provinciaActiva.cantidad}
              </div>
              <div className="text-gray-600 dark:text-gray-300">Ventas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                {provinciaActiva.ingresos.toLocaleString('es-ES')}€
              </div>
              <div className="text-gray-600 dark:text-gray-300">Ingresos</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <strong>Asesores:</strong> {provinciaActiva.asesores.join(', ')}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              <strong>Marcas:</strong> {provinciaActiva.marcas.join(', ')}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Resumen</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {provincias.length}
            </div>
            <div className="text-gray-600 dark:text-gray-300">Provincias con ventas</div>
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
