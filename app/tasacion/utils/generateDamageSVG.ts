'use client'

import type { VehicleDamage } from '@/types/tasacion'

/**
 * Convierte un SVG string a PNG en base64
 */
async function svgToPng(svgContent: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      reject(new Error('No se pudo obtener contexto del canvas'))
      return
    }
    
    img.onload = () => {
      // Establecer dimensiones del canvas
      canvas.width = img.width || 800
      canvas.height = img.height || 600
      
      // Fondo blanco
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Dibujar SVG
      ctx.drawImage(img, 0, 0)
      
      // Convertir a PNG base64
      const pngBase64 = canvas.toDataURL('image/png', 0.9)
      resolve(pngBase64)
    }
    
    img.onerror = () => {
      reject(new Error('Error cargando SVG como imagen'))
    }
    
    // Convertir SVG a data URL
    const svgBase64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`
    img.src = svgBase64
  })
}

// Colores por tipo de daño (mismos que MappedCarSilhouette)
const DAMAGE_COLORS: Record<string, string> = {
  'pulir': '#22c55e',    // verde
  'rayado': '#eab308',   // amarillo
  'golpe': '#f97316',    // naranja
  'sustituir': '#ef4444', // rojo
}

interface SVGMapping {
  svgId: string
  svgPath: string
  partName: string
  color: string
}

interface SVGMappings {
  [vista: string]: {
    [pathId: string]: string // pathId -> nombre de parte
  }
}

/**
 * Genera una imagen SVG coloreada con los daños marcados
 * @param vista - nombre de la vista (frontal, lateral_izquierda, etc.)
 * @param damages - array de daños para esa vista
 * @returns Promise con el SVG en base64 o undefined si hay error
 */
export async function generateDamageSVG(
  vista: string, 
  damages: VehicleDamage[]
): Promise<string | undefined> {
  try {
    // Mapeo de nombres de vista a nombres de archivo
    const viewFileMap: Record<string, string> = {
      'frontal': 'frontal',
      'lateral_izquierda': 'lateral_izquierda',
      'lateral_derecha': 'laterial_derecha', // typo en el nombre del archivo
      'laterial_derecha': 'laterial_derecha',
      'trasera': 'trasera',
      'interior_delantero_izq': 'interior_delantero_izquierda',
      'interior_delantero_izquierda': 'interior_delantero_izquierda',
      'interior_trasero_izq': 'interior_trasera_izquierda', // archivo es "trasera" no "trasero"
      'interior_trasero': 'interior_trasero', // archivo para vista interior trasero general
      'interior_trasera_izquierda': 'interior_trasera_izquierda', // archivo correcto
      'interior_salpicadero': 'interior_salpicadero',
      'interior_maletero': 'interior_maletero',
    }

    const fileName = viewFileMap[vista.toLowerCase()]
    if (!fileName) {
      console.warn(`Vista no encontrada: ${vista}`)
      return undefined
    }

    // Cargar SVG y mappings
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://controlvo.ovh'
    const svgUrl = `${baseUrl}/svg/new_car_svg/${fileName}.svg`
    const mappingsUrl = `${baseUrl}/data/svg-mappings.json`
    
    console.log(`Cargando SVG desde: ${svgUrl}`)
    console.log(`Cargando mappings desde: ${mappingsUrl}`)
    
    const [svgResponse, mappingsResponse] = await Promise.all([
      fetch(svgUrl),
      fetch(mappingsUrl)
    ])

    if (!svgResponse.ok) {
      console.error(`Error cargando SVG: ${svgUrl} - Status: ${svgResponse.status}`)
      return undefined
    }
    
    if (!mappingsResponse.ok) {
      console.error(`Error cargando mappings: ${mappingsUrl} - Status: ${mappingsResponse.status}`)
      return undefined
    }
    
    console.log(`✅ SVG y mappings cargados correctamente para: ${fileName}`)

    let svgContent = await svgResponse.text()
    const mappingsArray: SVGMapping[] = await mappingsResponse.json()

    // Convertir array a objeto de mappings para esta vista
    // Los IDs en el mapping son como "frontal-path-8"
    const viewMappings: { [svgId: string]: string } = {}
    
    mappingsArray.forEach(mapping => {
      if (mapping.svgPath === fileName) {
        // Ignorar flechas y NO MAPEAR
        if (!mapping.partName.includes('FLECHA') && !mapping.partName.includes('NO MAPEAR')) {
          // Guardar con el ID completo: "frontal-path-8"
          viewMappings[mapping.svgId] = mapping.partName
        }
      }
    })
    
    if (Object.keys(viewMappings).length === 0) {
      console.warn(`No hay mappings para la vista: ${fileName}`)
      return undefined
    }
    
    console.log(`Mappings encontrados para ${fileName}:`, Object.keys(viewMappings).length, 'paths')
    console.log(`Ejemplo de IDs:`, Object.keys(viewMappings).slice(0, 3))

    // Crear un mapa de parte -> color (por si hay múltiples daños, usar el más grave)
    const partColors = new Map<string, string>()
    const severityOrder = ['pulir', 'rayado', 'golpe', 'sustituir']
    
    console.log(`Daños recibidos para ${fileName}:`, damages.map(d => `${d.parte} (${d.tipo})`))
    
    damages.forEach(damage => {
      const currentColor = partColors.get(damage.parte)
      const newColor = DAMAGE_COLORS[damage.tipo]
      
      if (!currentColor || !newColor) {
        partColors.set(damage.parte, newColor || '#ef4444')
      } else {
        // Mantener el daño más severo
        const currentSeverity = severityOrder.indexOf(
          Object.keys(DAMAGE_COLORS).find(k => DAMAGE_COLORS[k] === currentColor) || ''
        )
        const newSeverity = severityOrder.indexOf(damage.tipo)
        
        if (newSeverity > currentSeverity) {
          partColors.set(damage.parte, newColor)
        }
      }
    })
    
    console.log(`Partes a colorear:`, Array.from(partColors.entries()))

    // Los SVG no tienen IDs, hay que asignarlos dinámicamente
    // Parsear el SVG para obtener los paths por índice
    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml')
    const allPaths = svgDoc.querySelectorAll('path, circle, rect, polygon, ellipse')
    
    console.log(`Total de paths en SVG: ${allPaths.length}`)
    
    // Colorear los paths correspondientes por índice
    let pathsColored = 0
    let pathsChecked = 0
    
    allPaths.forEach((element, index) => {
      // El ID dinámico es: "frontal-path-0", "frontal-path-1", etc.
      const dynamicId = `${fileName}-path-${index}`
      const partName = viewMappings[dynamicId]
      
      pathsChecked++
      
      if (partName) {
        const color = partColors.get(partName)
        if (color) {
          // Colorear el path
          element.setAttribute('fill', color)
          element.setAttribute('fill-opacity', '0.7')
          pathsColored++
          console.log(`  ✅ Path ${index} (${partName}) coloreado con ${color}`)
        } else {
          console.log(`  ⚠️ Path ${index} mapeado a "${partName}" pero sin daño`)
        }
      }
    })
    
    console.log(`Paths verificados: ${pathsChecked}, coloreados: ${pathsColored}`)
    
    if (pathsColored === 0) {
      console.warn(`⚠️ No se coloreó ningún path para ${fileName}. Verificar nombres de partes.`)
      console.warn(`Partes en mappings:`, Object.values(viewMappings).slice(0, 5))
      console.warn(`Partes en daños:`, Array.from(partColors.keys()))
    }
    
    // Convertir el documento SVG modificado de vuelta a string
    const serializer = new XMLSerializer()
    svgContent = serializer.serializeToString(svgDoc)
    
    console.log(`SVG serializado, tamaño: ${svgContent.length} caracteres`)
    console.log(`Primeros 500 caracteres:`, svgContent.substring(0, 500))

    // Convertir SVG a PNG usando Canvas (react-pdf no acepta SVG)
    console.log(`Convirtiendo SVG a PNG...`)
    const pngBase64 = await svgToPng(svgContent)
    console.log(`✅ PNG generado, tamaño: ${pngBase64.length} caracteres`)
    
    return pngBase64

  } catch (error) {
    console.error(`❌ Error generando SVG de daños para vista ${vista}:`, error)
    return undefined
  }
}

/**
 * Genera todas las imágenes SVG de daños agrupadas por vista
 * @param damages - array de todos los daños
 * @returns Promise con un objeto vista -> base64
 */
export async function generateAllDamageSVGs(
  damages: VehicleDamage[]
): Promise<Record<string, string>> {
  // Agrupar daños por vista
  const damagesByView = new Map<string, VehicleDamage[]>()
  
  damages.forEach(damage => {
    if (damage.vista) {
      const existing = damagesByView.get(damage.vista) || []
      existing.push(damage)
      damagesByView.set(damage.vista, existing)
    }
  })

  // Generar SVG para cada vista
  const result: Record<string, string> = {}
  
  for (const [vista, viewDamages] of damagesByView.entries()) {
    const svg = await generateDamageSVG(vista, viewDamages)
    if (svg) {
      result[vista] = svg
    }
  }

  return result
}

