"use client"
import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { pathsProvincias, coordenadasProvincias } from "./mapa-final-data"
import { preciseProvinceMapping, inverseProvinceMapping } from "./precise-mapping"

interface VentaGeografica {
  nombre: string
  cantidad: number
}



export function MapaEspanaSVGReal() {
  const [provincias, setProvincias] = useState<VentaGeografica[]>([])
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchVentasGeograficas()
  }, [])

  const fetchVentasGeograficas = async () => {
    try {
      setLoading(true)

      // Obtener datos de ventas de la tabla sales_vehicles
      const { data: ventas, error } = await supabase
        .from('sales_vehicles')
        .select('client_postal_code, price')
        .not('client_postal_code', 'is', null)

      if (error) {
        console.error('Error fetching sales data:', error)
        return
      }

      // Mapeo de códigos postales a provincias españolas
      const mapeoCodigosPostales = {
        '01': 'Álava', '02': 'Albacete', '03': 'Alicante', '04': 'Almería', '05': 'Ávila',
        '06': 'Badajoz', '07': 'Baleares', '08': 'Barcelona', '09': 'Burgos', '10': 'Cáceres',
        '11': 'Cádiz', '12': 'Castellón', '13': 'Ciudad Real', '14': 'Córdoba', '15': 'A Coruña',
        '16': 'Cuenca', '17': 'Girona', '18': 'Granada', '19': 'Guadalajara', '20': 'Gipuzkoa',
        '21': 'Huelva', '22': 'Huesca', '23': 'Jaén', '24': 'León', '25': 'Lleida',
        '26': 'La Rioja', '27': 'Lugo', '28': 'Madrid', '29': 'Málaga', '30': 'Murcia',
        '31': 'Navarra', '32': 'Ourense', '33': 'Asturias', '34': 'Palencia', '35': 'Las Palmas',
        '36': 'Pontevedra', '37': 'Salamanca', '38': 'Santa Cruz de Tenerife', '39': 'Cantabria', '40': 'Segovia',
        '41': 'Sevilla', '42': 'Soria', '43': 'Tarragona', '44': 'Teruel', '45': 'Toledo',
        '46': 'Valencia', '47': 'Valladolid', '48': 'Bizkaia', '49': 'Zamora', '50': 'Zaragoza'
      }

      // Agrupar por códigos postales y contar ventas
      const ventasPorProvincia = ventas.reduce((acc, venta) => {
        const codigo = venta.client_postal_code?.toString().substring(0, 2) || '00'
        const provincia = mapeoCodigosPostales[codigo]
        
        if (provincia) {
          acc[provincia] = (acc[provincia] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)

      // Convertir a formato requerido
      const provinciasData = Object.entries(ventasPorProvincia).map(([provincia, cantidad]) => ({
        nombre: provincia,
        cantidad
      }))
      setProvincias(provinciasData)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIntensidadColor = (cantidad: number) => {
    if (cantidad >= 10) return "#dc2626" // Rojo intenso
    if (cantidad >= 7) return "#ea580c" // Naranja
    if (cantidad >= 4) return "#ca8a04" // Amarillo
    if (cantidad >= 2) return "#16a34a" // Verde
    return "#0891b2" // Azul claro
  }

  // Coordenadas centradas manualmente para cada provincia
  const coordenadasCentradas = {
    0: { x: 720, y: 240 }, // Baleares
    1: { x: 280, y: 30 }, // Asturias
    2: { x: 95, y: 35 }, // A Coruña
    3: { x: 680, y: 100 }, // Girona
    4: { x: 50, y: 65 }, // Pontevedra
    5: { x: 360, y: 30 }, // Cantabria
    6: { x: 295, y: 410 }, // Málaga
    7: { x: 420, y: 370 }, // Almería
    8: { x: 480, y: 320 }, // Murcia
    9: { x: 460, y: 280 }, // Albacete
    10: { x: 260, y: 160 }, // Ávila
    11: { x: 375, y: 50 }, // Araba/Álava
    12: { x: 270, y: 280 }, // Badajoz
    13: { x: 540, y: 300 }, // Alicante
    14: { x: 80, y: 75 }, // Ourense
    15: { x: 665, y: 95 }, // Barcelona
    16: { x: 350, y: 65 }, // Burgos
    17: { x: 185, y: 200 }, // Cáceres
    18: { x: 230, y: 420 }, // Cádiz
    19: { x: 550, y: 200 }, // Castelló/Castellón
    20: { x: 290, y: 250 }, // Ciudad Real
    21: { x: 395, y: 320 }, // Jaén
    22: { x: 250, y: 340 }, // Córdoba
    23: { x: 430, y: 190 }, // Cuenca
    24: { x: 410, y: 350 }, // Granada
    25: { x: 380, y: 150 }, // Guadalajara
    26: { x: 440, y: 35 }, // Gipuzkoa/Guipúzcoa
    27: { x: 150, y: 340 }, // Huelva
    28: { x: 585, y: 70 }, // Huesca
    29: { x: 250, y: 65 }, // León
    30: { x: 645, y: 80 }, // Lleida
    31: { x: 375, y: 70 }, // La Rioja
    32: { x: 410, y: 100 }, // Soria
    33: { x: 485, y: 75 }, // Navarra
    34: { x: 235, y: 465 }, // Ceuta
    35: { x: 135, y: 20 }, // Lugo
    36: { x: 320, y: 175 }, // Madrid
    37: { x: 300, y: 70 }, // Palencia
    38: { x: 175, y: 150 }, // Salamanca
    39: { x: 320, y: 140 }, // Segovia
    40: { x: 235, y: 360 }, // Sevilla
    41: { x: 290, y: 205 }, // Toledo
    42: { x: 630, y: 130 }, // Tarragona
    43: { x: 560, y: 160 }, // Teruel
    44: { x: 480, y: 220 }, // València/Valencia
    45: { x: 235, y: 95 }, // Valladolid
    46: { x: 375, y: 40 }, // Bizkaia/Vizcaya
    47: { x: 165, y: 95 }, // Zamora
    48: { x: 485, y: 75 }, // Zaragoza
    49: { x: 375, y: 500 } // Melilla
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Contenedor del mapa que ocupa el espacio restante */}
      <div className="relative flex-1 min-h-0">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 800 507"
          className="w-full h-full border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* SVG paths para las provincias de España */}
          <g id="spain-provinces">
            {pathsProvincias.map((path, index) => (
              <path
                key={index}
                d={path.d}
                fill={path.fill}
                stroke={path.stroke}
                strokeWidth="0.5"
                className="cursor-pointer hover:fill-blue-200 dark:hover:fill-blue-800 transition-colors"
                onClick={() => {
                  // Usar el mapeo preciso generado por el script
                  const mapeoIdsAProvincias = preciseProvinceMapping;
                  const provinciaNombre = mapeoIdsAProvincias[path.id];
                  if (provinciaNombre) {
                    setProvinciaSeleccionada(provinciaNombre);
                  }
                }}
              />
            ))}
          </g>
          
          {/* Puntos de ventas centrados en cada provincia */}
          {provincias.map((provincia, index) => {
            // Usar el mapeo preciso generado por el script
            const mapeoProvinciasAIds = inverseProvinceMapping;

            const provinciaId = mapeoProvinciasAIds[provincia.nombre];
            if (provinciaId === undefined) return null;

            // Usar las coordenadas centradas manualmente
            const coord = coordenadasCentradas[provinciaId];
            if (!coord) return null;

            return (
              <g key={index}>
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={Math.max(6, Math.min(15, provincia.cantidad * 3))}
                  fill={getIntensidadColor(provincia.cantidad)}
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer hover:opacity-80 transition-opacity drop-shadow-lg"
                  onClick={() => setProvinciaSeleccionada(provincia.nombre)}
                />
                <text
                  x={coord.x}
                  y={coord.y + 2}
                  textAnchor="middle"
                  className="text-xs font-bold fill-current text-white pointer-events-none"
                  style={{ fontSize: '12px', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                >
                  {provincia.cantidad}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Información de provincia seleccionada */}
        {provinciaSeleccionada && (
          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {provinciaSeleccionada}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {provincias.find(p => p.nombre === provinciaSeleccionada)?.cantidad || 0} ventas
            </p>
          </div>
        )}
      </div>

      {/* Footer con leyenda y estadísticas en una línea */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>1-2 ventas</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>3-4 ventas</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>5-7 ventas</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>8-10 ventas</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>10+ ventas</span>
          </div>
        </div>
        <div>
          Total de provincias: {provincias.length} | Total de ventas: {provincias.reduce((sum, p) => sum + p.cantidad, 0)}
        </div>
      </div>
    </div>
  )
}