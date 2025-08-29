const fs = require('fs');
const path = require('path');

// Leer el archivo SVG
const svgPath = path.join(__dirname, '../app/dashboard/images/spain-provinces.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

console.log('🔍 Modificando mapa para integrar las Islas Canarias...');

// Extraer todos los paths del SVG
const pathMatches = svgContent.match(/<path[^>]*d="([^"]*)"[^>]*>/g);

if (!pathMatches) {
  console.log('❌ No se encontraron paths en el SVG');
  process.exit(1);
}

console.log(`📊 Se encontraron ${pathMatches.length} paths (provincias)`);

// Generar el código del componente con las Canarias integradas
const generateComponentCode = () => {
  const pathsCode = pathMatches.map((pathElement, index) => {
    const dMatch = pathElement.match(/d="([^"]*)"/);
    if (!dMatch) return '';
    
    const d = dMatch[1];
    return `              <path 
                d="${d}"
                fill="#e5e7eb"
                stroke="#9ca3af"
                strokeWidth="1"
                className="dark:fill-gray-700 dark:stroke-gray-500 hover:fill-blue-100 dark:hover:fill-blue-900 cursor-pointer transition-colors"
                onClick={() => setProvinciaSeleccionada("Provincia_${index}")}
              />`;
  }).filter(line => line).join('\n');

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
${pathsCode}
            </g>
            
            {/* Islas Canarias integradas */}
            <g id="canarias-integrated" transform="translate(650, 450) scale(0.8)">
              {/* Recuadro verde alrededor de las Canarias */}
              <rect 
                x="-30" 
                y="-25" 
                width="120" 
                height="80" 
                fill="none" 
                stroke="#22c55e" 
                strokeWidth="2" 
                strokeDasharray="5,5"
                className="dark:stroke-green-400"
              />
              
              {/* Islas Canarias simplificadas */}
              <g id="canarias-islands">
                {/* Tenerife */}
                <ellipse 
                  cx="10" 
                  cy="10" 
                  rx="8" 
                  ry="5" 
                  fill="#e5e7eb" 
                  stroke="#9ca3af" 
                  strokeWidth="1"
                  className="dark:fill-gray-700 dark:stroke-gray-500 hover:fill-blue-100 dark:hover:fill-blue-900 cursor-pointer transition-colors"
                  onClick={() => setProvinciaSeleccionada("Tenerife")}
                />
                
                {/* Gran Canaria */}
                <ellipse 
                  cx="25" 
                  cy="8" 
                  rx="6" 
                  ry="4" 
                  fill="#e5e7eb" 
                  stroke="#9ca3af" 
                  strokeWidth="1"
                  className="dark:fill-gray-700 dark:stroke-gray-500 hover:fill-blue-100 dark:hover:fill-blue-900 cursor-pointer transition-colors"
                  onClick={() => setProvinciaSeleccionada("Gran Canaria")}
                />
                
                {/* Lanzarote */}
                <ellipse 
                  cx="40" 
                  cy="12" 
                  rx="5" 
                  ry="3" 
                  fill="#e5e7eb" 
                  stroke="#9ca3af" 
                  strokeWidth="1"
                  className="dark:fill-gray-700 dark:stroke-gray-500 hover:fill-blue-100 dark:hover:fill-blue-900 cursor-pointer transition-colors"
                  onClick={() => setProvinciaSeleccionada("Lanzarote")}
                />
                
                {/* Fuerteventura */}
                <ellipse 
                  cx="50" 
                  cy="8" 
                  rx="7" 
                  ry="4" 
                  fill="#e5e7eb" 
                  stroke="#9ca3af" 
                  strokeWidth="1"
                  className="dark:fill-gray-700 dark:stroke-gray-500 hover:fill-blue-100 dark:hover:fill-blue-900 cursor-pointer transition-colors"
                  onClick={() => setProvinciaSeleccionada("Fuerteventura")}
                />
                
                {/* La Palma */}
                <ellipse 
                  cx="-5" 
                  cy="15" 
                  rx="4" 
                  ry="3" 
                  fill="#e5e7eb" 
                  stroke="#9ca3af" 
                  strokeWidth="1"
                  className="dark:fill-gray-700 dark:stroke-gray-500 hover:fill-blue-100 dark:hover:fill-blue-900 cursor-pointer transition-colors"
                  onClick={() => setProvinciaSeleccionada("La Palma")}
                />
                
                {/* La Gomera */}
                <ellipse 
                  cx="5" 
                  cy="20" 
                  rx="3" 
                  ry="2" 
                  fill="#e5e7eb" 
                  stroke="#9ca3af" 
                  strokeWidth="1"
                  className="dark:fill-gray-700 dark:stroke-gray-500 hover:fill-blue-100 dark:hover:fill-blue-900 cursor-pointer transition-colors"
                  onClick={() => setProvinciaSeleccionada("La Gomera")}
                />
                
                {/* El Hierro */}
                <ellipse 
                  cx="0" 
                  cy="25" 
                  rx="2" 
                  ry="2" 
                  fill="#e5e7eb" 
                  stroke="#9ca3af" 
                  strokeWidth="1"
                  className="dark:fill-gray-700 dark:stroke-gray-500 hover:fill-blue-100 dark:hover:fill-blue-900 cursor-pointer transition-colors"
                  onClick={() => setProvinciaSeleccionada("El Hierro")}
                />
              </g>
              
              {/* Texto "Islas Canarias" */}
              <text 
                x="30" 
                y="-5" 
                textAnchor="middle" 
                className="text-xs font-semibold fill-gray-700 dark:fill-gray-300"
              >
                Islas Canarias
              </text>
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
                "Córdoba": { x: 300, y: 360 },
                "Tenerife": { x: 670, y: 470 },
                "Gran Canaria": { x: 685, y: 468 },
                "Lanzarote": { x: 700, y: 472 },
                "Fuerteventura": { x: 710, y: 468 },
                "La Palma": { x: 655, y: 475 },
                "La Gomera": { x: 665, y: 480 },
                "El Hierro": { x: 660, y: 485 }
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
console.log(`✅ Componente actualizado en: ${outputPath}`);

console.log('\n🎯 Mapa actualizado con:');
console.log(`- ${pathMatches.length} provincias del SVG real de España`);
console.log('- Islas Canarias integradas en recuadro verde');
console.log('- Posición más cercana a la península');
console.log('- Funcionalidad interactiva');
console.log('- Compatibilidad con modo oscuro');
console.log('- Datos reales de la base de datos');

