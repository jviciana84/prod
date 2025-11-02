"use client"

import { useEffect, useState, useRef } from "react"

interface Damage {
  parte: string
  tipo: string
  vista?: string
}

interface DamageSilhouettesProps {
  danosExteriores: Damage[]
  danosInteriores: Damage[]
}

const DAMAGE_COLORS: Record<string, string> = {
  pulir: '#22c55e',
  rayado: '#eab308',
  golpe: '#f97316',
  sustituir: '#ef4444',
}

// SIEMPRE mostrar estas 4 vistas
const MAIN_VIEWS = [
  { key: 'frontal', file: 'frontal', label: 'Frontal' },
  { key: 'lateral_izquierda', file: 'lateral_izquierda', label: 'Lateral Izq.' },
  { key: 'laterial_derecha', file: 'laterial_derecha', label: 'Lateral Der.' },
  { key: 'trasera', file: 'trasera', label: 'Trasera' },
]

export function DamageSilhouettes({ danosExteriores, danosInteriores }: DamageSilhouettesProps) {
  const [svgsLoaded, setSvgsLoaded] = useState<Record<string, string>>({})
  const [mappings, setMappings] = useState<any[]>([])
  const svgRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Agrupar daños por vista (pueden estar vacíos)
  const damagesByView: Record<string, Damage[]> = {}
  MAIN_VIEWS.forEach(v => {
    damagesByView[v.key] = []
  })
  
  danosExteriores?.forEach((d) => {
    if (d.vista && damagesByView[d.vista] !== undefined) {
      damagesByView[d.vista].push(d)
    }
  })

  // Cargar SVGs y mappings - SIEMPRE las 4 vistas principales
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar mappings
        const mappingsRes = await fetch('/data/svg-mappings.json')
        const allMappings = await mappingsRes.json()
        setMappings(allMappings)

        // Cargar TODAS las vistas principales (con o sin daños)
        const svgsToLoad: Record<string, string> = {}
        for (const view of MAIN_VIEWS) {
          const res = await fetch(`/svg/new_car_svg/${view.file}.svg`)
          const svg = await res.text()
          svgsToLoad[view.key] = svg
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
    MAIN_VIEWS.forEach((view) => {
      const svgContent = svgsLoaded[view.key]
      const containerRef = svgRefs.current[view.key]
      
      if (!containerRef || !svgContent || !mappings.length) return

      containerRef.innerHTML = svgContent

      const svgElement = containerRef.querySelector('svg')
      if (!svgElement) return

      svgElement.setAttribute('width', '100%')
      svgElement.setAttribute('height', '100%')
      svgElement.style.maxHeight = '180px'

      const allElements = svgElement.querySelectorAll('path, circle, rect, polygon, ellipse')

      // Crear mapa de partes a colores (puede estar vacío si no hay daños)
      const partColors = new Map<string, string>()
      const danosDeVista = damagesByView[view.key] || []
      
      danosDeVista.forEach((damage) => {
        const color = DAMAGE_COLORS[damage.tipo.toLowerCase()]
        if (color) {
          partColors.set(damage.parte, color)
        }
      })

      // Colorear elementos que tengan daños
      allElements.forEach((element: any, index: number) => {
        const uniqueId = `${view.file}-path-${index}`
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
    })
  }, [svgsLoaded, mappings])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
      {MAIN_VIEWS.map((view) => {
        const danosCount = damagesByView[view.key]?.length || 0
        
        return (
          <div key={view.key} className="border rounded p-1 bg-muted/20">
            <p className="text-xs font-medium text-center mb-1">
              {view.label}
              {danosCount > 0 && <span className="text-red-600 ml-1">({danosCount})</span>}
            </p>
            <div ref={(el) => (svgRefs.current[view.key] = el)} className="w-full" />
          </div>
        )
      })}
    </div>
  )
}

