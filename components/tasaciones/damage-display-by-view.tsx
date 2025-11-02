"use client"

import { useEffect, useState, useRef } from "react"

interface Damage {
  parte: string
  tipo: string
  vista?: string
}

interface DamageDisplayByViewProps {
  damages: Damage[]
  type: 'exterior' | 'interior'
}

const VIEW_LABELS: Record<string, string> = {
  // Exteriores (exactamente como en el PDF)
  frontal: "Frontal",
  lateral_izquierda: "Lateral Izquierda",
  laterial_derecha: "Lateral Derecha", // El PDF mapea este typo a "Lateral Derecha"
  trasera: "Trasera",
  // Interiores (exactamente como en el PDF - líneas 29-34 de TasacionPDF.tsx)
  interior_salpicadero: "Interior Salpicadero",
  interior_delantero_izquierda: "Interior Delantero Izquierda",
  interior_trasera_izquierda: "Interior Trasera Izquierda",
  interior_maletero: "Interior Maletero",
}

const DAMAGE_TYPE_LABELS: Record<string, string> = {
  pulir: "Pulir",
  rayado: "Rayado",
  golpe: "Golpe",
  sustituir: "Sustituir",
  reparar: "Reparar",
}

const DAMAGE_COLORS: Record<string, string> = {
  pulir: '#22c55e',
  rayado: '#eab308',
  golpe: '#f97316',
  sustituir: '#ef4444',
}

// Mapeo de vistas a archivos SVG
const VIEW_FILE_MAP: Record<string, string> = {
  // Exteriores
  frontal: 'frontal',
  lateral_izquierda: 'lateral_izquierda',
  laterial_derecha: 'laterial_derecha',
  trasera: 'trasera',
  // Interiores
  interior_salpicadero: 'interior_salpicadero',
  interior_delantero_izquierda: 'interior_delantero_izquierda',
  interior_trasera_izquierda: 'interior_trasera_izquierda',
  interior_maletero: 'interior_maletero',
}

export function DamageDisplayByView({ damages, type }: DamageDisplayByViewProps) {
  // Definir vistas principales según el tipo (exactamente como en el PDF)
  const mainViews = type === 'exterior' 
    ? ['frontal', 'lateral_izquierda', 'laterial_derecha', 'trasera']
    : ['interior_salpicadero', 'interior_delantero_izquierda', 'interior_trasera_izquierda', 'interior_maletero']

  const [svgsLoaded, setSvgsLoaded] = useState<Record<string, string>>({})
  const [mappings, setMappings] = useState<any[]>([])
  const svgRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Agrupar daños por vista
  const damagesByView: Record<string, Damage[]> = {}
  
  // Inicializar vistas principales vacías
  mainViews.forEach(vista => {
    damagesByView[vista] = []
  })
  
  // Agregar daños a sus vistas correspondientes
  damages.forEach((damage) => {
    const vista = damage.vista || 'sin_vista'
    if (!damagesByView[vista]) {
      damagesByView[vista] = []
    }
    damagesByView[vista].push(damage)
  })

  // Cargar SVGs y mappings
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar mappings
        const mappingsRes = await fetch('/data/svg-mappings.json')
        const allMappings = await mappingsRes.json()
        setMappings(allMappings)

        // Cargar SVGs para todas las vistas principales
        const svgsToLoad: Record<string, string> = {}
        for (const vista of mainViews) {
          const fileName = VIEW_FILE_MAP[vista]
          if (fileName) {
            try {
              const res = await fetch(`/svg/new_car_svg/${fileName}.svg`)
              if (res.ok) {
                const svg = await res.text()
                svgsToLoad[vista] = svg
              }
            } catch (err) {
              console.warn(`No se pudo cargar SVG para ${vista}:`, err)
            }
          }
        }
        setSvgsLoaded(svgsToLoad)
      } catch (error) {
        console.error('Error cargando SVGs:', error)
      }
    }
    loadData()
  }, [])

  // Colorear SVGs cuando se cargan
  useEffect(() => {
    if (!mappings.length) return

    // Recalcular daños por vista
    const currentDamagesByView: Record<string, Damage[]> = {}
    mainViews.forEach(vista => {
      currentDamagesByView[vista] = []
    })
    damages.forEach((damage) => {
      const vista = damage.vista || 'sin_vista'
      if (currentDamagesByView[vista]) {
        currentDamagesByView[vista].push(damage)
      }
    })

    mainViews.forEach((vista) => {
      const svgContent = svgsLoaded[vista]
      const containerRef = svgRefs.current[vista]
      
      if (!containerRef || !svgContent) return

      containerRef.innerHTML = svgContent

      const svgElement = containerRef.querySelector('svg')
      if (!svgElement) return

      svgElement.setAttribute('width', '100%')
      svgElement.removeAttribute('height')
      svgElement.style.maxHeight = '120px'
      svgElement.style.height = 'auto'

      const allElements = svgElement.querySelectorAll('path, circle, rect, polygon, ellipse')

      // Crear mapa de partes a colores
      const partColors = new Map<string, string>()
      const danosDeVista = currentDamagesByView[vista] || []
      
      danosDeVista.forEach((damage) => {
        const color = DAMAGE_COLORS[damage.tipo.toLowerCase()]
        if (color) {
          partColors.set(damage.parte, color)
        }
      })

      // Colorear elementos que tengan daños
      const fileName = VIEW_FILE_MAP[vista]
      if (fileName) {
        allElements.forEach((element: any, index: number) => {
          const uniqueId = `${fileName}-path-${index}`
          const mapping = mappings.find((m: any) => m.svgId === uniqueId)

          if (mapping && mapping.partName) {
            const color = partColors.get(mapping.partName)
            if (color) {
              element.setAttribute('fill', color)
              element.setAttribute('fill-opacity', '0.7')
              element.setAttribute('stroke', color)
              element.setAttribute('stroke-width', '1')
            }
          }
        })
      }
    })
  }, [svgsLoaded, mappings, damages])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 mb-1">
      {mainViews.map((vista) => {
        const danos = damagesByView[vista] || []
        const vistaLabel = VIEW_LABELS[vista] || vista.replace('_', ' ')

        return (
          <div 
            key={vista} 
            className="p-2 bg-muted/30 rounded border border-border"
          >
            {/* Título de la vista */}
            <h4 className="font-bold text-[10px] text-foreground mb-1">
              {vistaLabel}
            </h4>

            {/* Lista de daños */}
            <div className="space-y-0.5 mb-1.5">
              {danos.length > 0 ? (
                danos.map((dano, idx) => (
                  <p key={idx} className="text-[10px] text-foreground">
                    • {dano.parte} - {DAMAGE_TYPE_LABELS[dano.tipo] || dano.tipo}
                  </p>
                ))
              ) : (
                <p className="text-[10px] text-muted-foreground italic">
                  Sin daños registrados
                </p>
              )}
            </div>

            {/* Imagen SVG */}
            <div className="flex justify-center">
              <div 
                ref={(el) => (svgRefs.current[vista] = el)} 
                className="w-full"
                style={{ minHeight: '80px' }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

