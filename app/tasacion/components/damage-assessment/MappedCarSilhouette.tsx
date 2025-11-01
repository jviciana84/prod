'use client'

import { useState, useRef, useEffect } from 'react'
import { VehicleDamage, DamageType } from '@/types/tasacion'
import { X } from 'lucide-react'

interface PartMapping {
  svgId: string
  svgPath: string
  partName: string
  color: string
}

interface MappedCarSilhouetteProps {
  svgFileName: string // ej: "frontal", "lateral_izquierda"
  viewTitle: string
  onDamageAdd?: (damage: VehicleDamage) => void
  damages?: VehicleDamage[]
  onNavigateToView?: (viewName: string) => void
}

export default function MappedCarSilhouette({ 
  svgFileName, 
  viewTitle,
  onDamageAdd,
  damages = [],
  onNavigateToView
}: MappedCarSilhouetteProps) {
  const [svgContent, setSvgContent] = useState<string>('')
  const [mappings, setMappings] = useState<PartMapping[]>([])
  const [showDamageSelector, setShowDamageSelector] = useState(false)
  const [selectedPart, setSelectedPart] = useState<string | null>(null)
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null)
  const svgContainerRef = useRef<HTMLDivElement>(null)

  // Cargar SVG y mapeos
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar SVG
        const svgResponse = await fetch(`/svg/new_car_svg/${svgFileName}.svg`)
        const svgText = await svgResponse.text()
        setSvgContent(svgText)

        // Cargar mapeos
        const mappingsResponse = await fetch('/data/svg-mappings.json')
        const allMappings: PartMapping[] = await mappingsResponse.json()
        
        // Filtrar solo los mapeos de esta vista
        const viewMappings = allMappings.filter(m => m.svgPath === svgFileName)
        setMappings(viewMappings)
        
        console.log(`📋 Cargados ${viewMappings.length} mapeos para ${svgFileName}`)
      } catch (error) {
        console.error('Error cargando SVG o mapeos:', error)
      }
    }
    loadData()
  }, [svgFileName])

  // Inyectar SVG y agregar event listeners
  useEffect(() => {
    if (!svgContainerRef.current || !svgContent || mappings.length === 0) return

    svgContainerRef.current.innerHTML = svgContent

    const svgElement = svgContainerRef.current.querySelector('svg')
    if (!svgElement) return

    // Hacer el SVG responsivo
    svgElement.setAttribute('width', '100%')
    svgElement.setAttribute('height', '100%')
    svgElement.style.maxHeight = '400px'

    const allElements = svgElement.querySelectorAll('path, circle, rect, polygon, ellipse')
    
    allElements.forEach((element: any, index: number) => {
      const uniqueId = `${svgFileName}-path-${index}`
      element.id = uniqueId

      // Buscar si este elemento tiene un mapeo
      const mapping = mappings.find(m => m.svgId === uniqueId)
      
      if (mapping) {
        // Zonas no mapeables - deshabilitar completamente
        if (mapping.partName.startsWith('❌')) {
          element.style.pointerEvents = 'none'
          return
        }

        // Flechas de navegación - hacer clickeables
        if (mapping.partName.startsWith('⬅️')) {
          element.style.cursor = 'pointer'
          element.style.pointerEvents = 'all'
          
          // Extraer el nombre de la vista del texto de la flecha
          // Ejemplo: "⬅️ FLECHA → Lateral Izquierda" -> "lateral_izquierda"
          const extractViewName = (partName: string): string => {
            // IMPORTANTE: Orden de más específico a menos específico
            const viewMap: Record<string, string> = {
              'Interior Trasera Izquierda': 'interior_trasera_izquierda',
              'Interior Trasero Izq.': 'interior_trasera_izquierda',
              'Interior Delantero Izquierda': 'interior_delantero_izquierda',
              'Interior Delantero Derecha': 'interior_delatero_derecha',
              'Interior Salpicadero': 'interior_salpicadero',
              'Interior Trasero': 'interior_trasero',
              'Interior Maletero': 'interior_maletero',
              'Lateral Izquierda': 'lateral_izquierda',
              'Lateral Derecha': 'laterial_derecha',
              'Trasera': 'trasera',
              'Frontal': 'frontal',
            }
            
            for (const [key, value] of Object.entries(viewMap)) {
              if (partName.includes(key)) return value
            }
            return ''
          }

          const targetView = extractViewName(mapping.partName)
          
          // Hover effect para flechas (más visible)
          element.addEventListener('mouseenter', () => {
            element.style.fill = '#10b981'
            element.style.fillOpacity = '0.8'
            element.style.stroke = '#059669'
            element.style.strokeWidth = '3'
            element.style.filter = 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))'
          })

          element.addEventListener('mouseleave', () => {
            const originalFill = element.getAttribute('data-original-fill') || 'none'
            const originalStroke = element.getAttribute('data-original-stroke') || 'none'
            element.style.fill = originalFill
            element.style.fillOpacity = '1'
            element.style.stroke = originalStroke
            element.style.strokeWidth = '1'
            element.style.filter = ''
          })

          // Click handler para navegación
          element.addEventListener('click', (e: any) => {
            e.stopPropagation()
            if (targetView && onNavigateToView) {
              console.log(`🔄 Navegando a vista: ${targetView}`)
              onNavigateToView(targetView)
            }
          })
          
          return
        }

        // Es una pieza mapeada - hacerla clickable
        element.style.cursor = 'pointer'
        element.style.pointerEvents = 'all'
        
        // Guardar valores originales
        const originalFill = element.getAttribute('fill') || 'none'
        const originalStroke = element.getAttribute('stroke') || 'none'
        element.setAttribute('data-original-fill', originalFill)
        element.setAttribute('data-original-stroke', originalStroke)
        element.setAttribute('data-part-name', mapping.partName)

        // Hover effect
        element.addEventListener('mouseenter', () => {
          element.style.fill = '#3b82f6'
          element.style.fillOpacity = '0.3'
          element.style.stroke = '#2563eb'
          element.style.strokeWidth = '2'
        })

        element.addEventListener('mouseleave', () => {
          // Verificar si tiene daño
          const hasDamage = damages.some(d => d.parte === mapping.partName)
          if (hasDamage) {
            const damage = damages.find(d => d.parte === mapping.partName)
            if (damage) {
              const damageColor = getDamageColor(damage.tipo)
              element.style.fill = damageColor
              element.style.fillOpacity = '0.7'
              element.style.stroke = damageColor
              element.style.strokeWidth = '3'
            }
          } else {
            element.style.fill = originalFill
            element.style.fillOpacity = '1'
            element.style.stroke = originalStroke
            element.style.strokeWidth = '1'
          }
        })

        // Click handler
        element.addEventListener('click', (e: any) => {
          e.stopPropagation()
          setSelectedPart(mapping.partName)
          setSelectedElement(element)
          setShowDamageSelector(true)
          
          // Highlight seleccionado
          element.style.fill = '#10b981'
          element.style.fillOpacity = '0.5'
          element.style.stroke = '#059669'
          element.style.strokeWidth = '3'
        })
      }
    })

    // Aplicar daños existentes
    damages.forEach(damage => {
      const mappingForDamage = mappings.find(m => m.partName === damage.parte)
      if (mappingForDamage) {
        const element = svgElement.querySelector(`#${CSS.escape(mappingForDamage.svgId)}`)
        if (element) {
          const damageColor = getDamageColor(damage.tipo)
          ;(element as HTMLElement).style.fill = damageColor
          ;(element as HTMLElement).style.fillOpacity = '0.7'
          ;(element as HTMLElement).style.stroke = damageColor
          ;(element as HTMLElement).style.strokeWidth = '3'
        }
      }
    })

  }, [svgContent, mappings, damages])

  const getDamageColor = (tipo: DamageType): string => {
    const colors: Record<DamageType, string> = {
      pulir: '#22c55e',    // verde
      rayado: '#eab308',   // amarillo
      golpe: '#f97316',    // naranja
      sustituir: '#ef4444', // rojo
    }
    return colors[tipo] || '#6b7280'
  }

  const getDamageLabel = (tipo: DamageType): string => {
    const labels: Record<DamageType, string> = {
      pulir: 'Pulir',
      rayado: 'Rayado',
      golpe: 'Golpe',
      sustituir: 'Sustituir',
    }
    return labels[tipo] || tipo
  }

  const handleDamageSelect = (damageType: DamageType) => {
    if (!selectedPart) return

    const newDamage: VehicleDamage = {
      parte: selectedPart,
      tipo: damageType,
      vista: svgFileName,
    }

    // Aplicar color al elemento
    if (selectedElement) {
      const damageColor = getDamageColor(damageType)
      selectedElement.style.fill = damageColor
      selectedElement.style.fillOpacity = '0.7'
      selectedElement.style.stroke = damageColor
      selectedElement.style.strokeWidth = '3'
    }

    onDamageAdd?.(newDamage)
    setShowDamageSelector(false)
    setSelectedPart(null)
    setSelectedElement(null)
  }

  const handleCancelDamage = () => {
    // Restaurar elemento a su estado original
    if (selectedElement) {
      const originalFill = selectedElement.getAttribute('data-original-fill') || 'none'
      const originalStroke = selectedElement.getAttribute('data-original-stroke') || 'none'
      selectedElement.style.fill = originalFill
      selectedElement.style.fillOpacity = '1'
      selectedElement.style.stroke = originalStroke
      selectedElement.style.strokeWidth = '1'
    }
    
    setShowDamageSelector(false)
    setSelectedPart(null)
    setSelectedElement(null)
  }

  const damageTypes: DamageType[] = ['pulir', 'rayado', 'golpe', 'sustituir']

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">{viewTitle}</h3>
      
      <div className="relative">
        <div className="bg-white rounded-xl p-4 border-2 border-gray-300 shadow-lg">
          {/* SVG Container */}
          <div 
            ref={svgContainerRef}
            className="w-full min-h-[300px] flex items-center justify-center"
          />

          {!svgContent && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-400">Cargando...</p>
            </div>
          )}
        </div>

        {/* Selector de tipo de daño */}
        {showDamageSelector && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 relative animate-in fade-in zoom-in duration-200">
              <button
                onClick={handleCancelDamage}
                className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>

              <h4 className="text-xl font-bold text-gray-900 mb-2">
                {selectedPart}
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Selecciona el tipo de daño:
              </p>

              <div className="space-y-2">
                {damageTypes.map(tipo => (
                  <button
                    key={tipo}
                    onClick={() => handleDamageSelect(tipo)}
                    className="w-full p-4 text-left rounded-xl border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all font-semibold text-lg"
                    style={{
                      borderColor: getDamageColor(tipo),
                      color: getDamageColor(tipo),
                    }}
                  >
                    {getDamageLabel(tipo)}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCancelDamage}
                className="w-full mt-4 p-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Leyenda de daños */}
      <div className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
        <p className="text-xs font-bold text-gray-700 mb-2">Leyenda:</p>
        <div className="grid grid-cols-2 gap-2">
          {damageTypes.map(tipo => (
            <div key={tipo} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getDamageColor(tipo) }}
              />
              <span className="text-xs text-gray-600 font-medium">
                {getDamageLabel(tipo).replace(/[🟢🟡🟠🔴] /, '')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen compacto de daños en esta vista */}
      {damages.filter(d => d.vista === svgFileName).length > 0 && (
        <div className="mt-4 bg-red-50 rounded-xl p-3">
          <p className="text-xs font-bold text-red-800 text-center">
            ✓ {damages.filter(d => d.vista === svgFileName).length} daño(s) marcado(s) en esta vista
          </p>
        </div>
      )}
    </div>
  )
}

