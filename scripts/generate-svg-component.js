const fs = require('fs');
const path = require('path');

// Leer el archivo de datos de provincias
const svgDataPath = path.join(__dirname, '../components/reports/svg-provinces-data.ts');
const svgDataContent = fs.readFileSync(svgDataPath, 'utf8');

console.log('🔍 Generando componente con SVG real...');

// Extraer los paths del archivo de datos
const pathsMatch = svgDataContent.match(/const pathsProvincias = \[([\s\S]*?)\];/);
if (!pathsMatch) {
  console.log('❌ No se encontraron los paths en el archivo de datos');
  process.exit(1);
}

const pathsContent = pathsMatch[1];

// Generar el código del componente con todos los paths
const generateComponentCode = () => {
  return `"use client"
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

// Mapeo de nombres de provincias (aproximado basado en la posición)
const mapeoProvincias = {
  "Provincia_0": "Barcelona",
  "Provincia_1": "Madrid", 
  "Provincia_2": "Valencia",
  "Provincia_3": "Sevilla",
  "Provincia_4": "Málaga",
  "Provincia_5": "Bilbao",
  "Provincia_6": "Zaragoza",
  "Provincia_7": "Murcia",
  "Provincia_8": "Alicante",
  "Provincia_9": "Córdoba",
  "Provincia_10": "Granada",
  "Provincia_11": "Valladolid",
  "Provincia_12": "Oviedo",
  "Provincia_13": "Vigo",
  "Provincia_14": "Gijón",
  "Provincia_15": "L'Hospitalet",
  "Provincia_16": "A Coruña",
  "Provincia_17": "Vitoria",
  "Provincia_18": "Gran Canaria",
  "Provincia_19": "Tenerife",
  "Provincia_20": "Badajoz",
  "Provincia_21": "Elche",
  "Provincia_22": "Oviedo",
  "Provincia_23": "Móstoles",
  "Provincia_24": "Alcalá de Henares",
  "Provincia_25": "Fuenlabrada",
  "Provincia_26": "Leganés",
  "Provincia_27": "Getafe",
  "Provincia_28": "Alcorcón",
  "Provincia_29": "Torrejón de Ardoz",
  "Provincia_30": "Parla",
  "Provincia_31": "Alcobendas",
  "Provincia_32": "San Sebastián de los Reyes",
  "Provincia_33": "Pozuelo de Alarcón",
  "Provincia_34": "Coslada",
  "Provincia_35": "Las Rozas de Madrid",
  "Provincia_36": "Majadahonda",
  "Provincia_37": "Rivas-Vaciamadrid",
  "Provincia_38": "Valdemoro",
  "Provincia_39": "Collado Villalba",
  "Provincia_40": "San Fernando de Henares",
  "Provincia_41": "Tres Cantos",
  "Provincia_42": "Boadilla del Monte",
  "Provincia_43": "Pinto",
  "Provincia_44": "Colmenar Viejo",
  "Provincia_45": "San Martín de la Vega",
  "Provincia_46": "Arganda del Rey",
  "Provincia_47": "Torrelodones",
  "Provincia_48": "Navalcarnero",
  "Provincia_49": "Villaviciosa de Odón",
  "Provincia_50": "Mejorada del Campo",
  "Provincia_51": "Velilla de San Antonio"
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
    return \`rgba(59, 130, 246, \${intensidad})\`
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
              {/* Paths generados automáticamente del SVG real */}
              ${pathsContent.split('\n').map(line => {
                const pathMatch = line.match(/d="([^"]*)"/);
                const idMatch = line.match(/id: (\d+)/);
                if (pathMatch && idMatch) {
                  const id = idMatch[1];
                  const d = pathMatch[1];
                  const nombreProvincia = mapeoProvincias[\`Provincia_\${id}\`] || \`Provincia_\${id}\`;
                  return \`<path 
                d="\${d}"
                fill="#e5e7eb"
                stroke="#9ca3af"
                strokeWidth="1"
                className="dark:fill-gray-700 dark:stroke-gray-500 hover:fill-blue-100 dark:hover:fill-blue-900 cursor-pointer transition-colors"
                onClick={() => setProvinciaSeleccionada("\${nombreProvincia}")}
              />\`;
                }
                return '';
              }).filter(line => line).join('\n              ')}
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
}`;
};

// Guardar el componente generado
const outputPath = path.join(__dirname, '../components/reports/mapa-espana-svg-real.tsx');
const componentCode = generateComponentCode();

fs.writeFileSync(outputPath, componentCode);
console.log(`✅ Componente generado en: ${outputPath}`);

console.log('\n🎯 Componente actualizado con:');
console.log('- Todos los paths del SVG real de España');
console.log('- Mapeo de nombres de provincias');
console.log('- Funcionalidad interactiva');
console.log('- Compatibilidad con modo oscuro');
