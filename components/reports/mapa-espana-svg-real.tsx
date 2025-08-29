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
  cantidad: number
  ingresos: number
  asesores: string[]
  marcas: string[]
}

export function MapaEspanaSVGReal() {
  const [provincias, setProvincias] = useState<ProvinciaData[]>([])
  const [loading, setLoading] = useState(true)
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    cargarDatosReales()
  }, [])

  const cargarDatosReales = async () => {
    try {
      setLoading(true)
      const { data: ventas, error } = await supabase
        .from("sales_vehicles")
        .select("client_province, price, advisor, brand, payment_method, created_at")
        .not("client_province", "is", null)

      if (error) {
        console.error("Error cargando datos:", error)
        return
      }

      const datosPorProvincia: Record<string, ProvinciaData> = {}
      
      ventas?.forEach((venta: VentaReal) => {
        const provincia = venta.client_province || "Sin provincia"
        
        if (!datosPorProvincia[provincia]) {
          datosPorProvincia[provincia] = {
            nombre: provincia,
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
    const intensidad = (cantidad / maxVentas) * 0.8 + 0.2
    return `rgba(59, 130, 246, ${intensidad})`
  }

  const provinciaActiva = provincias.find(p => p.nombre === provinciaSeleccionada)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Mapa de Ventas por Provincia
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Distribución geográfica de ventas en España
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Mapa de Ventas por Provincia
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Distribución geográfica de ventas en España con datos reales
          </p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="relative">
          <svg
            className="w-full h-96 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900"
            viewBox="0 0 800 575"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Fondo */}
            <rect width="800" height="575" fill="#f9fafb" className="dark:fill-gray-900" />
            
            {/* SVG real de las provincias de España */}
            <g id="spain-provinces">
              {/* Paths del SVG real */}
              <path 
                d="M 759.47 137.08 757.36 138.29 756.8 138.12 756.54 138.16 755.82 139.14 754.73 139.04 754.86 139.99 755.63 140.62 758.64 139.39 759.14 139.51 758.56 139.77 758.88 140.47 758.22 141.22 756.17 141.53 756.68 143.28 760.85 145.17 763.56 144.09 764.24 143.04 767.22 144.61 768.25 144.51 767.95 145.42 768.87 145.65 768.09 146.02 767.94 146.84 768.06 147.76 767.53 147.76 767.37 148.55 765.97 148.76 765.55 150.02 766.22 150.49 763.66 151.87 763.96 152.07 762.24 153.51 761.64 156.29 761.36 155.87 761.14 156.01 760.56 157.66 759.77 157.82 760.13 158.22 758.56 158.56 757.95 159.47 757.08 159.34 754.32 161.59 753.66 161.63 752.37 160.04 751.39 159.84 751.56 159.1 750.39 158.19 748.82 158.55 747.7 158.06 744.34 158.17 742.73 156.64 742.92 155.39 742.02 154.17 742.96 152.93 740.16 151.09 738.85 150.88 738.4 151.55 739.09 151.44 738.84 151.71 737.73 151.5 737.54 151.65 737.59 151.77 737.35 152.01 737.35 152.21 737.28 152.12 736.84 152.12 736.82 152.21 736.44 152.32 736.33 152.18 735.6 152.43 734.91 154.85 733.29 154.51 733.4 153.6 732.59 153.14 733.42 152.68 732.61 152.09 731.28 152.5 731.08 151.93 730.13 152.57 730.19 152.11 729.28 152.15 730.26 151.67 728.7 151.02 729.03 149.56 732.8 147.92 735.13 146.16 737.18 145.64 738.39 144.23 739.93 143.64 740.15 142.94 741.04 142.97 741.22 142.28 743.92 141.25 744.02 140.69 746.39 140.47 750.12 138.4 751.27 138.82 752.88 137.87 754.05 137.96 754.02 138.41 756.16 138 757.76 136.99 759.47 137.08 Z"
                fill="#e5e7eb"
                stroke="#9ca3af"
                strokeWidth="1"
                className="dark:fill-gray-700 dark:stroke-gray-500 hover:fill-blue-100 dark:hover:fill-blue-900 cursor-pointer transition-colors"
                onClick={() => setProvinciaSeleccionada("Barcelona")}
              />
              {/* Más provincias se añadirán aquí */}
            </g>
            
            {/* Puntos de ventas superpuestos */}
            {provincias.map((provincia, index) => {
              // Coordenadas aproximadas para algunas provincias principales
              const coordenadas: Record<string, { x: number, y: number }> = {
                "Barcelona": { x: 720, y: 202 },
                "Madrid": { x: 363, y: 277 },
                "Valencia": { x: 450, y: 320 },
                "Sevilla": { x: 280, y: 380 },
                "Málaga": { x: 250, y: 420 },
                "Bilbao": { x: 650, y: 150 },
                "Zaragoza": { x: 500, y: 250 },
                "Murcia": { x: 420, y: 350 },
                "Alicante": { x: 470, y: 330 },
                "Córdoba": { x: 300, y: 360 }
              }
              
              const coords = coordenadas[provincia.nombre]
              if (!coords) return null
              
              return (
                <g key={index}>
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={Math.max(8, Math.min(20, provincia.cantidad * 2))}
                    fill={getIntensidadColor(provincia.cantidad)}
                    stroke="#1e40af"
                    strokeWidth="2"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setProvinciaSeleccionada(provincia.nombre)}
                  />
                  <text
                    x={coords.x}
                    y={coords.y + 4}
                    textAnchor="middle"
                    className="text-xs font-semibold fill-white dark:fill-white pointer-events-none"
                  >
                    {provincia.cantidad}
                  </text>
                </g>
              )
            })}
          </svg>
          
          {/* Leyenda */}
          <div className="mt-4 flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-200 rounded-full"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Pocas ventas</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Ventas medias</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Muchas ventas</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tarjeta de detalles de la provincia seleccionada */}
      {provinciaActiva && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {provinciaActiva.nombre}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ventas</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {provinciaActiva.cantidad}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ingresos</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {provinciaActiva.ingresos.toLocaleString('es-ES', {
                  style: 'currency',
                  currency: 'EUR'
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Asesores</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {provinciaActiva.asesores.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Marcas</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {provinciaActiva.marcas.length}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => setProvinciaSeleccionada(null)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Cerrar detalles
            </button>
          </div>
        </div>
      )}
      
      {/* Estadísticas generales */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Resumen General
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Provincias</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {provincias.length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Ventas</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {provincias.reduce((sum, p) => sum + p.cantidad, 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Ingresos</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {provincias.reduce((sum, p) => sum + p.ingresos, 0).toLocaleString('es-ES', {
                style: 'currency',
                currency: 'EUR'
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Promedio por Provincia</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {provincias.length > 0 
                ? Math.round(provincias.reduce((sum, p) => sum + p.cantidad, 0) / provincias.length)
                : 0
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}