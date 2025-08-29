"use client"
import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client-singleton"
import { pathsProvincias, coordenadasProvincias } from "./mapa-final-data"
import { preciseProvinceMapping, inverseProvinceMapping } from "./precise-mapping"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"

interface VentaGeografica {
  nombre: string
  cantidad: number
}

// Función para normalizar nombres de provincias (igual que en el informe)
const normalizarProvincia = (provincia: string): string => {
  if (!provincia) return 'Sin provincia'
  
  const normalizada = provincia.toLowerCase().trim()
  
  const casosEspeciales: Record<string, string> = {
    'barcelona': 'Barcelona',
    'madrid': 'Madrid',
    'valencia': 'Valencia',
    'sevilla': 'Sevilla',
    'malaga': 'Málaga',
    'bilbao': 'Bilbao',
    'zaragoza': 'Zaragoza',
    'murcia': 'Murcia',
    'alicante': 'Alicante',
    'cordoba': 'Córdoba',
    'granada': 'Granada',
    'valladolid': 'Valladolid',
    'oviedo': 'Oviedo',
    'vigo': 'Vigo',
    'gijon': 'Gijón',
    'hospitalet': 'L\'Hospitalet',
    'a coruna': 'A Coruña',
    'vitoria': 'Vitoria',
    'gran canaria': 'Gran Canaria',
    'tenerife': 'Tenerife',
    'badajoz': 'Badajoz',
    'elche': 'Elche',
    'mostoles': 'Móstoles',
    'alcala de henares': 'Alcalá de Henares',
    'fuenlabrada': 'Fuenlabrada',
    'leganes': 'Leganés',
    'getafe': 'Getafe',
    'alcorcon': 'Alcorcón',
    'torrejon de ardoz': 'Torrejón de Ardoz',
    'parla': 'Parla',
    'alcobendas': 'Alcobendas',
    'san sebastian de los reyes': 'San Sebastián de los Reyes',
    'pozuelo de alarcon': 'Pozuelo de Alarcón',
    'coslada': 'Coslada',
    'las rozas de madrid': 'Las Rozas de Madrid',
    'majadahonda': 'Majadahonda',
    'rivas-vaciamadrid': 'Rivas-Vaciamadrid',
    'valdemoro': 'Valdemoro',
    'collado villalba': 'Collado Villalba',
    'san fernando de henares': 'San Fernando de Henares',
    'tres cantos': 'Tres Cantos',
    'boadilla del monte': 'Boadilla del Monte',
    'pinto': 'Pinto',
    'colmenar viejo': 'Colmenar Viejo',
    'san martin de la vega': 'San Martín de la Vega',
    'arganda del rey': 'Arganda del Rey',
    'torrelodones': 'Torrelodones',
    'navalcarnero': 'Navalcarnero',
    'villaviciosa de odon': 'Villaviciosa de Odón',
    'mejorada del campo': 'Mejorada del Campo',
    'velilla de san antonio': 'Velilla de San Antonio',
    'lleida': 'Lleida',
    'girona': 'Girona',
    'tarragona': 'Tarragona',
    'huelva': 'Huelva',
    'cadiz': 'Cádiz',
    'jaen': 'Jaén',
    'almeria': 'Almería',
    'albacete': 'Albacete',
    'ciudad real': 'Ciudad Real',
    'castellon': 'Castellón',
    'tortosa': 'Tortosa',
    'palma': 'Palma',
    'ceuta': 'Ceuta',
    'melilla': 'Melilla',
    'baleares': 'Baleares',
    'illes balears': 'Baleares',
    'canarias': 'Canarias',
    'asturias': 'Asturias',
    'cantabria': 'Cantabria',
    'galicia': 'Galicia',
    'pais vasco': 'País Vasco',
    'navarra': 'Navarra',
    'aragon': 'Aragón',
    'la rioja': 'La Rioja',
    'castilla y leon': 'Castilla y León',
    'castilla-la mancha': 'Castilla-La Mancha',
    'extremadura': 'Extremadura',
    'andalucia': 'Andalucía',
    'region de murcia': 'Región de Murcia',
    'comunidad valenciana': 'Comunidad Valenciana',
    'cataluna': 'Cataluña',
    'principado de asturias': 'Principado de Asturias'
  }
  
  if (casosEspeciales[normalizada]) {
    return casosEspeciales[normalizada]
  }
  
  return normalizada.charAt(0).toUpperCase() + normalizada.slice(1)
}

// Función para calcular el centro de un path SVG
const calcularCentroPath = (pathD: string): { x: number, y: number } => {
  const comandos = pathD.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/g) || []
  let puntos: { x: number, y: number }[] = []
  
  comandos.forEach(comando => {
    const tipo = comando[0]
    const valores = comando.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n))
    
    if (tipo === 'M' || tipo === 'L') {
      // Mover a o línea a
      for (let i = 0; i < valores.length; i += 2) {
        if (valores[i] !== undefined && valores[i + 1] !== undefined) {
          puntos.push({ x: valores[i], y: valores[i + 1] })
        }
      }
    } else if (tipo === 'H') {
      // Línea horizontal
      valores.forEach(x => {
        if (puntos.length > 0) {
          puntos.push({ x, y: puntos[puntos.length - 1].y })
        }
      })
    } else if (tipo === 'V') {
      // Línea vertical
      valores.forEach(y => {
        if (puntos.length > 0) {
          puntos.push({ x: puntos[puntos.length - 1].x, y })
        }
      })
    }
  })
  
  if (puntos.length === 0) return { x: 0, y: 0 }
  
  const sumX = puntos.reduce((sum, p) => sum + p.x, 0)
  const sumY = puntos.reduce((sum, p) => sum + p.y, 0)
  
  return {
    x: Math.round(sumX / puntos.length),
    y: Math.round(sumY / puntos.length)
  }
}

// Calcular coordenadas centradas para cada provincia
const calcularCoordenadasProvincias = () => {
  const coordenadas: Record<number, { x: number, y: number }> = {}
  
  pathsProvincias.forEach(path => {
    const centro = calcularCentroPath(path.d)
    coordenadas[path.id] = centro
  })
  
  return coordenadas
}

export function MapaEspanaSVGReal() {
  const [provincias, setProvincias] = useState<VentaGeografica[]>([])
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<string | null>(null)
  const [provinciaHover, setProvinciaHover] = useState<string | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState(true)
  const [mesSeleccionado, setMesSeleccionado] = useState<string>(format(new Date(), "yyyy-MM"))
  const supabase = createClientComponentClient()

  const getFechasMes = (mesString: string) => {
    const [year, month] = mesString.split("-").map(Number)
    const fechaInicio = startOfMonth(new Date(year, month - 1))
    const fechaFin = endOfMonth(new Date(year, month - 1))
    return { fechaInicio, fechaFin }
  }

  useEffect(() => {
    fetchVentasGeograficas()
  }, [mesSeleccionado])

  const fetchVentasGeograficas = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('sales_vehicles')
        .select('client_province, price')
        .not('client_province', 'is', null)

      if (mesSeleccionado !== "total") {
        const { fechaInicio, fechaFin } = getFechasMes(mesSeleccionado)
        console.log("🗺️ Obteniendo ventas geográficas del mes:", mesSeleccionado)
        console.log("📅 Desde:", fechaInicio.toISOString())
        console.log("📅 Hasta:", fechaFin.toISOString())
        
        query = query
          .gte("sale_date", fechaInicio.toISOString())
          .lte("sale_date", fechaFin.toISOString())
      } else {
        console.log("🗺️ Obteniendo ventas geográficas totales (sin filtro de fecha)")
      }

      const { data: ventas, error } = await query

      if (error) {
        console.error('Error fetching sales data:', error)
        return
      }

      console.log(`🗺️ Ventas geográficas encontradas: ${ventas?.length || 0}`)

      // Agrupar por provincia usando client_province directamente
      const ventasPorProvincia = ventas.reduce((acc, venta) => {
        const provincia = normalizarProvincia(venta.client_province || 'Sin provincia')
        
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
      
      console.log("🗺️ Provincias con ventas:", provinciasData)
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

  // Calcular coordenadas centradas dinámicamente para cada provincia
  const coordenadasCentradas = calcularCoordenadasProvincias()

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
        {/* Controles dentro del mapa */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <Select value={mesSeleccionado} onValueChange={setMesSeleccionado}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              {[...Array(12)].map((_, i) => {
                const fecha = subMonths(new Date(), i)
                const valor = format(fecha, "yyyy-MM")
                const etiqueta = format(fecha, "MMMM yyyy", { locale: es })
                return (
                  <SelectItem key={valor} value={valor}>
                    {etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1)}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <button
            onClick={() => setMesSeleccionado("total")}
            className={`px-3 py-1 text-xs rounded border ${
              mesSeleccionado === "total" 
                ? "bg-blue-600 text-white border-blue-600" 
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Total
          </button>
        </div>

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
                fill={(() => {
                  const mapeoIdsAProvincias = preciseProvinceMapping;
                  const provinciaNombre = mapeoIdsAProvincias[path.id];
                  if (provinciaNombre === provinciaSeleccionada) {
                    return "#059669"; // Verde para provincia seleccionada
                  }
                  return path.fill;
                })()}
                stroke={path.stroke}
                strokeWidth="0.5"
                className="cursor-pointer hover:fill-blue-200 dark:hover:fill-blue-800 transition-colors"
                onMouseEnter={(e) => {
                  const mapeoIdsAProvincias = preciseProvinceMapping;
                  const provinciaNombre = mapeoIdsAProvincias[path.id];
                  if (provinciaNombre) {
                    setProvinciaHover(provinciaNombre);
                    setMousePosition({ x: e.clientX, y: e.clientY });
                  }
                }}
                onMouseLeave={() => {
                  setProvinciaHover(null);
                }}
                onClick={() => {
                  const mapeoIdsAProvincias = preciseProvinceMapping;
                  const provinciaNombre = mapeoIdsAProvincias[path.id];
                  if (provinciaNombre) {
                    setProvinciaSeleccionada(provinciaSeleccionada === provinciaNombre ? null : provinciaNombre);
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
                  r={Math.max(10, Math.min(25, provincia.cantidad * 4))}
                  fill={provincia.nombre === provinciaSeleccionada ? "#059669" : getIntensidadColor(provincia.cantidad)}
                  stroke={provincia.nombre === provinciaSeleccionada ? "#047857" : "white"}
                  strokeWidth={provincia.nombre === provinciaSeleccionada ? 4 : 3}
                  className="cursor-pointer hover:opacity-80 transition-opacity drop-shadow-lg"
                  onMouseEnter={(e) => {
                    setProvinciaHover(provincia.nombre);
                    setMousePosition({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => {
                    setProvinciaHover(null);
                  }}
                  onClick={() => {
                    setProvinciaSeleccionada(provinciaSeleccionada === provincia.nombre ? null : provincia.nombre);
                  }}
                />
                <text
                  x={coord.x}
                  y={coord.y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-bold fill-current text-white pointer-events-none"
                  style={{ fontSize: '16px', textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}
                >
                  {provincia.cantidad}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Tooltip comparativo */}
        {provinciaSeleccionada ? (
          // Si hay provincia seleccionada, mostrar comparación
          provinciaHover && provinciaHover !== provinciaSeleccionada && (
            <div 
              className="absolute bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 pointer-events-none z-20"
              style={{
                left: `${mousePosition.x + 5}px`,
                top: `${mousePosition.y - 5}px`,
                transform: 'translateY(-100%)'
              }}
            >
              {/* Provincia seleccionada (fija) */}
              <div className="mb-2 pb-2 border-b border-gray-200 dark:border-gray-600">
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {provinciaSeleccionada}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {provincias.find(p => p.nombre === provinciaSeleccionada)?.cantidad || 0} ventas
                </p>
              </div>
              
              {/* Provincia del hover */}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {provinciaHover}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {provincias.find(p => p.nombre === provinciaHover)?.cantidad || 0} ventas
                </p>
              </div>
            </div>
          )
        ) : (
          // Si no hay provincia seleccionada, solo mostrar hover
          provinciaHover && (
            <div 
              className="absolute bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 pointer-events-none z-20"
              style={{
                left: `${mousePosition.x + 5}px`,
                top: `${mousePosition.y - 5}px`,
                transform: 'translateY(-100%)'
              }}
            >
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {provinciaHover}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {provincias.find(p => p.nombre === provinciaHover)?.cantidad || 0} ventas
              </p>
            </div>
          )
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