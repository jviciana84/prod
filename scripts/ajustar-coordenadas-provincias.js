const fs = require('fs');
const path = require('path');

// Leer el archivo SVG sin Canarias
const svgPath = path.join(__dirname, '../app/dashboard/images/spain-provinces (1).svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

console.log('🔍 Ajustando coordenadas de provincias...');

// Extraer todos los paths del SVG
const pathMatches = svgContent.match(/<path[^>]*d="([^"]*)"[^>]*>/g);

if (!pathMatches) {
  console.log('❌ No se encontraron paths en el SVG');
  process.exit(1);
}

console.log(`📊 Se encontraron ${pathMatches.length} paths (provincias peninsulares)`);

// Función mejorada para calcular el centro aproximado de un path SVG
const calcularCentroPath = (d) => {
  const comandos = d.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/g) || [];
  let xCoords = [];
  let yCoords = [];
  let currentX = 0;
  let currentY = 0;
  
  comandos.forEach(comando => {
    const tipo = comando[0];
    const valores = comando.slice(1).trim().split(/[\s,]+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
    
    if (tipo === 'M') {
      // Mover a - establece la posición inicial
      if (valores.length >= 2) {
        currentX = valores[0];
        currentY = valores[1];
        xCoords.push(currentX);
        yCoords.push(currentY);
      }
    } else if (tipo === 'L') {
      // Línea a - coordenadas absolutas
      for (let i = 0; i < valores.length; i += 2) {
        if (valores[i] !== undefined && valores[i + 1] !== undefined) {
          currentX = valores[i];
          currentY = valores[i + 1];
          xCoords.push(currentX);
          yCoords.push(currentY);
        }
      }
    } else if (tipo === 'l') {
      // Línea a - coordenadas relativas
      for (let i = 0; i < valores.length; i += 2) {
        if (valores[i] !== undefined && valores[i + 1] !== undefined) {
          currentX += valores[i];
          currentY += valores[i + 1];
          xCoords.push(currentX);
          yCoords.push(currentY);
        }
      }
    } else if (tipo === 'H') {
      // Línea horizontal absoluta
      valores.forEach(x => {
        if (x !== undefined) {
          currentX = x;
          xCoords.push(currentX);
          yCoords.push(currentY);
        }
      });
    } else if (tipo === 'h') {
      // Línea horizontal relativa
      valores.forEach(x => {
        if (x !== undefined) {
          currentX += x;
          xCoords.push(currentX);
          yCoords.push(currentY);
        }
      });
    } else if (tipo === 'V') {
      // Línea vertical absoluta
      valores.forEach(y => {
        if (y !== undefined) {
          currentY = y;
          xCoords.push(currentX);
          yCoords.push(currentY);
        }
      });
    } else if (tipo === 'v') {
      // Línea vertical relativa
      valores.forEach(y => {
        if (y !== undefined) {
          currentY += y;
          xCoords.push(currentX);
          yCoords.push(currentY);
        }
      });
    }
  });
  
  if (xCoords.length === 0 || yCoords.length === 0) {
    return { x: 400, y: 287 }; // Centro por defecto
  }
  
  // Calcular el centro usando solo los puntos más significativos
  const minX = Math.min(...xCoords);
  const maxX = Math.max(...xCoords);
  const minY = Math.min(...yCoords);
  const maxY = Math.max(...yCoords);
  
  const centroX = (minX + maxX) / 2;
  const centroY = (minY + maxY) / 2;
  
  return { x: centroX, y: centroY };
};

// Generar el código del componente con coordenadas ajustadas
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

  // Generar coordenadas ajustadas para las provincias principales
  const coordenadasAjustadas = {};
  pathMatches.forEach((pathElement, index) => {
    const dMatch = pathElement.match(/d="([^"]*)"/);
    if (dMatch) {
      const centro = calcularCentroPath(dMatch[1]);
      coordenadasAjustadas[`Provincia_${index}`] = centro;
    }
  });

  // Coordenadas específicas optimizadas para provincias conocidas
  const coordenadasEspecificas = {
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
    "Granada": { x: 270, y: 400 },
    "Valladolid": { x: 350, y: 220 },
    "Oviedo": { x: 600, y: 180 },
    "Vigo": { x: 550, y: 280 },
    "A Coruña": { x: 580, y: 250 },
    "Pamplona": { x: 650, y: 200 },
    "Logroño": { x: 580, y: 220 },
    "Huesca": { x: 620, y: 230 },
    "Teruel": { x: 520, y: 280 },
    "Cuenca": { x: 400, y: 300 },
    "Guadalajara": { x: 380, y: 280 },
    "Toledo": { x: 350, y: 320 },
    "Ciudad Real": { x: 320, y: 340 },
    "Jaén": { x: 290, y: 380 },
    "Cádiz": { x: 200, y: 450 },
    "Huelva": { x: 180, y: 420 },
    "Badajoz": { x: 220, y: 350 },
    "Cáceres": { x: 250, y: 320 },
    "Salamanca": { x: 320, y: 250 },
    "Ávila": { x: 340, y: 260 },
    "Segovia": { x: 360, y: 240 },
    "Soria": { x: 520, y: 240 },
    "Burgos": { x: 540, y: 200 },
    "Palencia": { x: 420, y: 200 },
    "León": { x: 450, y: 180 },
    "Zamora": { x: 380, y: 230 },
    "Ourense": { x: 520, y: 260 },
    "Lugo": { x: 560, y: 220 },
    "Pontevedra": { x: 540, y: 280 },
    "Asturias": { x: 600, y: 180 },
    "Cantabria": { x: 620, y: 160 },
    "Navarra": { x: 650, y: 200 },
    "La Rioja": { x: 580, y: 220 },
    "Aragón": { x: 620, y: 230 },
    "Cataluña": { x: 720, y: 202 },
    "Castilla y León": { x: 420, y: 200 },
    "Castilla-La Mancha": { x: 380, y: 300 },
    "Extremadura": { x: 220, y: 350 },
    "Andalucía": { x: 250, y: 420 },
    "Región de Murcia": { x: 420, y: 350 },
    "Comunidad Valenciana": { x: 470, y: 330 },
    "Comunidad de Madrid": { x: 363, y: 277 },
    "País Vasco": { x: 650, y: 150 },
    "Galicia": { x: 560, y: 250 }
  };

  // Combinar coordenadas calculadas con las específicas
  const todasLasCoordenadas = { ...coordenadasAjustadas, ...coordenadasEspecificas };

  // Convertir las coordenadas a string para la interpolación
  const coordenadasString = Object.entries(todasLasCoordenadas)
    .map(([nombre, coords]) => `    "${nombre}": { x: ${coords.x}, y: ${coords.y} }`)
    .join(',\n');

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
            Distribución geográfica de ventas en España (Península)
          </p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="relative">
          <svg
            className="w-full h-96 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900"
            viewBox="0 0 800 500"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Fondo */}
            <rect width="800" height="500" fill="#f9fafb" className="dark:fill-gray-900" />
            
            {/* SVG real de las provincias de España (solo península) */}
            <g id="spain-provinces">
${pathsCode}
            </g>
            
            {/* Puntos de ventas superpuestos con coordenadas ajustadas */}
            {provincias.map((provincia, index) => {
              // Coordenadas ajustadas para todas las provincias
              const coordenadas: Record<string, { x: number, y: number }> = {
${coordenadasString}
              }
              
              const coords = coordenadas[provincia.nombre]
              if (!coords) return null
              
              return (
                <g key={index}>
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={Math.max(6, Math.min(18, provincia.cantidad * 1.5))}
                    fill={getIntensidadColor(provincia.cantidad)}
                    stroke="#1e40af"
                    strokeWidth="2"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setProvinciaSeleccionada(provincia.nombre)}
                  />
                  <text
                    x={coords.x}
                    y={coords.y + 3}
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

console.log('\n🎯 Mapa con coordenadas ajustadas:');
console.log(`- ${pathMatches.length} provincias peninsulares`);
console.log('- Coordenadas calculadas automáticamente desde el SVG (mejoradas)');
console.log('- Coordenadas específicas para provincias principales');
console.log('- Puntos de ventas alineados con las provincias reales');
console.log('- ViewBox optimizado: 800x500 para mejor ajuste al card');
console.log('- Tamaño de círculos ajustado: 6-18px según cantidad');
console.log('- Sin Islas Canarias');
console.log('- Funcionalidad interactiva completa');
