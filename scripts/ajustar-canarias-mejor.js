const fs = require('fs');
const path = require('path');

// Leer el archivo SVG
const svgPath = path.join(__dirname, '../app/dashboard/images/spain-provinces.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

console.log('🔍 Ajustando mapa con Islas Canarias mejoradas...');

// Extraer todos los paths del SVG
const pathMatches = svgContent.match(/<path[^>]*d="([^"]*)"[^>]*>/g);

if (!pathMatches) {
  console.log('❌ No se encontraron paths en el SVG');
  process.exit(1);
}

console.log(`📊 Se encontraron ${pathMatches.length} paths (provincias)`);

// Generar el código del componente con las Canarias mejoradas
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
            
            {/* Islas Canarias mejoradas - más cerca de la península */}
            <g id="canarias-mejoradas" transform="translate(580, 350) scale(0.6)">
              {/* Recuadro verde alrededor de las Canarias */}
              <rect 
                x="-40" 
                y="-30" 
                width="140" 
                height="100" 
                fill="none" 
                stroke="#22c55e" 
                strokeWidth="3" 
                strokeDasharray="8,4"
                className="dark:stroke-green-400"
              />
              
              {/* Islas Canarias con formas más realistas */}
              <g id="canarias-islands-realistic">
                {/* Tenerife - forma más realista */}
                <path 
                  d="M 15 15 Q 20 10 25 15 Q 30 20 25 25 Q 20 30 15 25 Q 10 20 15 15 Z"
                  fill="#e5e7eb" 
                  stroke="#9ca3af" 
                  strokeWidth="1"
                  className="dark:fill-gray-700 dark:stroke-gray-500 hover:fill-blue-100 dark:hover:fill-blue-900 cursor-pointer transition-colors"
                  onClick={() => setProvinciaSeleccionada("Tenerife")}
                />
                
                {/* Gran Canaria - forma triangular */}
                <path 
                  d="M 35 12 L 45 18 L 35 25 Z"
                  fill="#e5e7eb" 
                  stroke="#9ca3af" 
                  strokeWidth="1"
                  className="dark:fill-gray-700 dark:stroke-gray-500 hover:fill-blue-100 dark:hover:fill-blue-900 cursor-pointer transition-colors"
                  onClick={() => setProvinciaSeleccionada("Gran Canaria")}
                />
                
                {/* Lanzarote - forma alargada */}
                <path 
                  d="M 55 15 Q 65 12 70 15 Q 65 18 55 18 Z"
                  fill="#e5e7eb" 
                  stroke="#9ca3af" 
                  strokeWidth="1"
                  className="dark:fill-gray-700 dark:stroke-gray-500 hover:fill-blue-100 dark:hover:fill-blue-900 cursor-pointer transition-colors"
                  onClick={() => setProvinciaSeleccionada("Lanzarote")}
                />
                
                {/* Fuerteventura - forma irregular */}
                <path 
                  d="M 75 10 Q 85 8 90 12 Q 88 18 80 20 Q 75 18 75 10 Z"
                  fill="#e5e7eb" 
                  stroke="#9ca3af" 
                  strokeWidth="1"
                  className="dark:fill-gray-700 dark:stroke-gray-500 hover:fill-blue-100 dark:hover:fill-blue-900 cursor-pointer transition-colors"
                  onClick={() => setProvinciaSeleccionada("Fuerteventura")}
                />
                
                {/* La Palma - forma redondeada */}
                <path 
                  d="M 5 20 Q 10 15 15 20 Q 10 25 5 20 Z"
                  fill="#e5e7eb" 
                  stroke="#9ca3af" 
                  strokeWidth="1"
                  className="dark:fill-gray-700 dark:stroke-gray-500 hover:fill-blue-100 dark:hover:fill-blue-900 cursor-pointer transition-colors"
                  onClick={() => setProvinciaSeleccionada("La Palma")}
                />
                
                {/* La Gomera - forma pequeña */}
                <path 
                  d="M 10 30 Q 12 28 14 30 Q 12 32 10 30 Z"
                  fill="#e5e7eb" 
                  stroke="#9ca3af" 
                  strokeWidth="1"
                  className="dark:fill-gray-700 dark:stroke-gray-500 hover:fill-blue-100 dark:hover:fill-blue-900 cursor-pointer transition-colors"
                  onClick={() => setProvinciaSeleccionada("La Gomera")}
                />
                
                {/* El Hierro - forma pequeña */}
                <path 
                  d="M 8 35 Q 10 33 12 35 Q 10 37 8 35 Z"
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
                y="-10" 
                textAnchor="middle" 
                className="text-sm font-semibold fill-gray-700 dark:fill-gray-300"
              >
                Islas Canarias
              </text>
              
              {/* Línea conectora hacia la península */}
              <line 
                x1="-40" 
                y1="20" 
                x2="-60" 
                y2="40" 
                stroke="#22c55e" 
                strokeWidth="2" 
                strokeDasharray="3,3"
                className="dark:stroke-green-400"
              />
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
                "Tenerife": { x: 595, y: 365 },
                "Gran Canaria": { x: 605, y: 363 },
                "Lanzarote": { x: 615, y: 365 },
                "Fuerteventura": { x: 625, y: 363 },
                "La Palma": { x: 585, y: 370 },
                "La Gomera": { x: 590, y: 375 },
                "El Hierro": { x: 588, y: 380 }
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

console.log('\n🎯 Mapa mejorado con:');
console.log(`- ${pathMatches.length} provincias del SVG real de España`);
console.log('- Islas Canarias con formas más realistas');
console.log('- Posición más cercana a la península (no abajo)');
console.log('- Recuadro verde mejor posicionado');
console.log('- Línea conectora hacia la península');
console.log('- Funcionalidad interactiva');
console.log('- Compatibilidad con modo oscuro');
console.log('- Datos reales de la base de datos');

