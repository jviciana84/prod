'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Download, Upload, ChevronLeft, ChevronRight, Edit3, X } from 'lucide-react'

interface PartMapping {
  svgId: string
  svgPath: string
  partName: string
  color: string
}

export default function SvgMapperDemo() {
  const [selectedSvgPart, setSelectedSvgPart] = useState<{ svgFile: string; elementId: string; pathIndex: number } | null>(null)
  const [mappings, setMappings] = useState<PartMapping[]>([])
  const [currentSvg, setCurrentSvg] = useState<'frontal' | 'lateral_izquierda' | 'laterial_derecha' | 'trasera' | 'interior_salpicadero' | 'interior_delantero_izquierda' | 'interior_delatero_derecha' | 'interior_trasera_izquierda' | 'interior_trasero' | 'interior_maletero'>('frontal')
  const [svgContent, setSvgContent] = useState<string>('')
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const [svgLoaded, setSvgLoaded] = useState(false)
  const [manualPartName, setManualPartName] = useState<string>('')
  const [showManualInput, setShowManualInput] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  const [lastClickedElement, setLastClickedElement] = useState<string>('')
  const [svgKey, setSvgKey] = useState(0) // Key para forzar re-render del SVG solo cuando sea necesario

  // Lista completa de partes del vehículo (por vista)
  const vehicleParts = [
    // OPCIONES ESPECIALES
    '❌ NO MAPEAR (ignorar esta zona)',
    '⬅️ FLECHA → Frontal',
    '⬅️ FLECHA → Lateral Izquierda',
    '⬅️ FLECHA → Lateral Derecha',
    '⬅️ FLECHA → Trasera',
    '⬅️ FLECHA → Interior Salpicadero',
    '⬅️ FLECHA → Interior Delantero Izquierda',
    '⬅️ FLECHA → Interior Delantero Derecha',
    '⬅️ FLECHA → Interior Trasera Izquierda',
    '⬅️ FLECHA → Interior Trasero',
    '⬅️ FLECHA → Interior Maletero',
    
    // FRONTAL
    'Retrovisor izquierda',
    'Retrovisor derecha',
    'Faro izquierda',
    'Faro derecha',
    'Faro Xenon izquierda',
    'Faro Xenon derecha',
    'Anti niebla izquierda',
    'Anti niebla derecha',
    'Capó',
    'Luna parabrisas',
    'Neumático delantero izquierda',
    'Neumático delantero derecha',
    'Paragolpes delantero',
    
    // LATERAL IZQUIERDO
    'Piloto trasero izquierda',
    'Techo',
    'Aleta delantera izquierda',
    'Neumático delantero izquierdo',
    'Llanta delantera izquierda',
    'Puerta delantera izquierda',
    'Puerta trasera izquierda',
    'Retrovisor izquierdo',
    'Aleta trasera izquierda',
    'Llanta trasera izquierda',
    
    // TRASERA
    'Portón',
    'Paragolpes trasero',
    'Neumático trasero derecha',
    'Neumático trasero izquierda',
    
    // LATERAL DERECHO
    'Piloto trasero derecha',
    'Faro derecha',
    'Aleta delantera derecha',
    'Neumático delantero derecha',
    'Llanta delantera derecha',
    'Puerta delantera derecha',
    'Puerta trasera derecha',
    'Paragolpes derecho',
    'Retrovisor derecho',
    'Aleta trasera derecha',
    'Llanta trasera derecha',
    
    // INTERIOR DELANTERO DERECHA
    'Volante',
    'Tapa apoya brazos',
    'Guarnecido techo',
    'Tapizado banqueta delantera derecha',
    'Tapizado respaldo delantero derecha',
    'Guarnecido puerta delantera izquierda',
    'Botonera puerta delantera izquierda',
    'Tapizado banqueta delantera izquierda',
    'Tapizado respaldo delantero izquierda',
    
    // INTERIOR DELANTERA IZQUIERDO
    'Tapa apoyabrazos',
    'Guarnecido puerta delantera derecha',
    'Tapizado respaldo delantero derecho',
    
    // SALPICADERO
    'Airbag Volante',
    'Airbag Salpicadero',
    'Cuadro',
    'Rejilla ventilación',
    'Consola central',
    'Guantera',
    'Parasol',
    
    // INTERIOR TRASERO IZQUIERDA
    'Guarnecido puerta trasera izquierda',
    'Tapizado banqueta trasera izquierda',
    'Tapizado respaldo trasero izquierdo',
    'Tapizado banqueta trasera derecha',
    'Tapizado respaldo trasero derecho',
    
    // MALETERO
    'Moqueta maletero',
    'Bandeja',
    
    // INTERIOR TRASERO DERECHA
    'Guarnecido puerta trasera derecha',
    'Tapizado banqueta trasera derecha',
    'Tapizado respaldo trasero derecha',
    'Tapizado banqueta trasera izquierda',
    'Tapizado respaldo trasero izquierda',
  ]

  const svgFiles = [
    { id: 'frontal', label: 'Frontal' },
    { id: 'lateral_izquierda', label: 'Lateral Izquierda' },
    { id: 'laterial_derecha', label: 'Lateral Derecha' },
    { id: 'trasera', label: 'Trasera' },
    { id: 'interior_salpicadero', label: 'Interior Salpicadero' },
    { id: 'interior_delantero_izquierda', label: 'Interior Delantero Izq.' },
    { id: 'interior_delatero_derecha', label: 'Interior Delantero Der.' },
    { id: 'interior_trasera_izquierda', label: 'Interior Trasero Izq.' },
    { id: 'interior_trasero', label: 'Interior Trasero' },
    { id: 'interior_maletero', label: 'Interior Maletero' },
  ]

  // Cargar SVG cuando cambia
  useEffect(() => {
    const loadSvg = async () => {
      try {
        console.log(`🔄 Cargando SVG: /svg/new_car_svg/${currentSvg}.svg`)
        const response = await fetch(`/svg/new_car_svg/${currentSvg}.svg`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const text = await response.text()
        console.log(`✅ SVG cargado, tamaño: ${text.length} caracteres`)
        console.log('Primeros 200 caracteres:', text.substring(0, 200))
        setSvgContent(text)
      } catch (error) {
        console.error('❌ Error cargando SVG:', error)
        setSvgContent(`<div class="text-red-500 p-4 text-center">
          <p class="font-bold">Error al cargar el SVG</p>
          <p class="text-sm">${error}</p>
          <p class="text-xs mt-2">Ruta: /svg/new_car_svg/${currentSvg}.svg</p>
        </div>`)
      }
    }
    loadSvg()
  }, [currentSvg])

  // Inyectar SVG directamente al DOM y asignar IDs únicos
  useEffect(() => {
    console.log('🔄 useEffect ejecutándose - Razón: svgContent cambió')
    console.log('  Container ref existe:', !!svgContainerRef.current)
    console.log('  svgContent longitud:', svgContent?.length)
    
    if (!svgContainerRef.current || !svgContent || svgContent.includes('Error')) return

    // IMPORTANTE: Inyectar el HTML directamente al DOM (solo una vez)
    svgContainerRef.current.innerHTML = svgContent
    
    const svgElement = svgContainerRef.current.querySelector('svg')
    if (!svgElement) {
      console.log('❌ No se encontró elemento SVG en el container')
      return
    }

    // Obtener TODOS los paths (incluyendo el fondo)
    const allPaths = svgElement.querySelectorAll('path, circle, rect, polygon, ellipse')
    
    console.log(`📊 Total elementos SVG encontrados: ${allPaths.length}`)
    
    allPaths.forEach((element: any, index: number) => {
      // Asignar ID único
      const uniqueId = `${currentSvg}-path-${index}`
      element.id = uniqueId
      console.log(`  🆔 Asignado ID: ${uniqueId}`)
      
      // 🔥 RESTAURAR COLOR SI YA ESTÁ MAPEADO EN ESTA VISTA
      const existingMapping = mappings.find(m => 
        m.svgId === uniqueId && m.svgPath === currentSvg
      )
      if (existingMapping) {
        console.log(`  🎨 Restaurando color de mapeo: ${existingMapping.color} para ${uniqueId}`)
        element.style.fill = existingMapping.color
        element.style.stroke = existingMapping.color
        element.style.strokeWidth = '2'
        element.style.opacity = '0.7'
        element.setAttribute('data-mapped', 'true')
        element.setAttribute('data-mapped-view', currentSvg)
        element.setAttribute('data-mapping-color', existingMapping.color)
        return  // No agregar event listeners a elementos ya mapeados
      }
      
      // Obtener atributos del path para identificación
      const fill = element.getAttribute('fill') || 'none'
      const d = element.getAttribute('d') || ''
      const transform = element.getAttribute('transform') || ''
      
      // Guardar metadata en data-attributes para debug
      element.setAttribute('data-index', index.toString())
      element.setAttribute('data-fill', fill)
      
      // Detectar flechas de navegación (normalmente pequeñas y negras/grises)
      // Las flechas suelen tener un tamaño muy pequeño comparado con las partes del coche
      const bbox = element.getBBox ? element.getBBox() : null
      const isSmallElement = bbox && (bbox.width < 50 || bbox.height < 50)
      const isDarkArrow = fill.toLowerCase().includes('#000') || fill.toLowerCase().includes('black') || fill.toLowerCase().includes('#333')
      const isArrow = isSmallElement && isDarkArrow
      
      // Ignorar solo el fondo
      const isBackground = index === 0 && (fill.toLowerCase().includes('#fefefe') || fill.toLowerCase().includes('#fff'))
      
      if (isArrow) {
        // Las flechas son para navegación entre vistas
        element.style.pointerEvents = 'all'
        element.style.cursor = 'pointer'
        element.setAttribute('data-navigation-arrow', 'true')
        console.log(`  🔄 Flecha de navegación detectada (índice ${index})`)
        
        // Click en flecha = cambiar de vista
        element.addEventListener('click', (e: any) => {
          e.preventDefault()
          e.stopPropagation()
          
          // Determinar dirección según posición
          const elementBBox = e.target.getBBox()
          const svgWidth = svgElement?.getBBox().width || 2048
          const isLeftArrow = elementBBox.x < svgWidth / 2
          
          console.log(`🔄 Flecha clicada: ${isLeftArrow ? 'ANTERIOR' : 'SIGUIENTE'}`)
          handleNavigate(isLeftArrow ? 'prev' : 'next')
        })
      } else if (!isBackground) {
        // Partes del coche normales
        element.style.pointerEvents = 'all'
        element.style.cursor = 'pointer'
        element.style.transition = 'all 0.2s ease'
      } else {
        // Fondo
        element.style.pointerEvents = 'none'
        element.style.cursor = 'default'
      }
      
      if (!isBackground && !isArrow) {
        // Efecto hover - TODOS los elementos excepto fondo
        element.addEventListener('mouseenter', (e: any) => {
          // No aplicar hover si está seleccionado o ya mapeado
          if (e.target.getAttribute('data-selected') || e.target.getAttribute('data-mapped')) {
            return
          }
          
          const currentFill = e.target.getAttribute('fill') || ''
          const currentStroke = e.target.getAttribute('stroke') || ''
          const currentStrokeWidth = e.target.getAttribute('stroke-width') || ''
          
          // Guardar valores originales
          e.target.setAttribute('data-original-fill', currentFill)
          e.target.setAttribute('data-original-stroke', currentStroke)
          e.target.setAttribute('data-original-stroke-width', currentStrokeWidth)
          
          // Aplicar hover effect - SIEMPRE visible
          e.target.style.stroke = '#3b82f6'
          e.target.style.strokeWidth = '4'
          e.target.style.opacity = '0.8'
          
          // Si tiene fill, también cambiar el fill
          if (currentFill && currentFill !== 'none') {
            e.target.style.fill = '#60a5fa'
          }
        })
        
        element.addEventListener('mouseleave', (e: any) => {
          // Si está mapeado, mantener el color del mapeo
          if (e.target.getAttribute('data-mapped')) {
            const mappingColor = e.target.getAttribute('data-mapping-color')
            e.target.style.fill = mappingColor
            e.target.style.stroke = mappingColor
            e.target.style.strokeWidth = '2'
            e.target.style.opacity = '0.7'
            return
          }
          
          // Si no está seleccionado ni mapeado, restaurar valores originales
          if (!e.target.getAttribute('data-selected')) {
            const originalFill = e.target.getAttribute('data-original-fill')
            const originalStroke = e.target.getAttribute('data-original-stroke')
            const originalStrokeWidth = e.target.getAttribute('data-original-stroke-width')
            
            // Restaurar valores originales
            if (originalFill) e.target.setAttribute('fill', originalFill)
            if (originalStroke) {
              e.target.setAttribute('stroke', originalStroke)
            } else {
              e.target.removeAttribute('stroke')
            }
            if (originalStrokeWidth) {
              e.target.setAttribute('stroke-width', originalStrokeWidth)
            } else {
              e.target.removeAttribute('stroke-width')
            }
            e.target.style.opacity = '1'
            e.target.style.fill = ''
            e.target.style.stroke = ''
            e.target.style.strokeWidth = ''
          }
        })
      }
    })
    
    console.log(`✅ ${allPaths.length} elementos SVG preparados para interacción`)
  }, [svgContent, mappings, currentSvg]) // Re-ejecutar cuando cambie el SVG, mappings o vista actual

  const handleSvgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('🖱️ Clic detectado en SVG')
    
    // Obtener todos los elementos SVG en el punto del clic
    const elements = document.elementsFromPoint(e.clientX, e.clientY)
    console.log('📍 Elementos en el punto:', elements.map(el => `${el.tagName}#${el.id}`))
    
    let target: SVGElement | null = null
    
    // Buscar el elemento SVG más específico (no div, no svg root, no flechas)
    for (const element of elements) {
      const tagName = element.tagName.toLowerCase()
      
      console.log(`  Evaluando: ${tagName}#${element.id || '(sin ID)'}`)
      
      // Ignorar flechas de navegación
      if (element.getAttribute('data-navigation-arrow') === 'true') {
        console.log('  ⚠️ Es flecha de navegación, ignorando...')
        continue
      }
      
      // Aceptar cualquier elemento SVG interactivo con ID
      if (tagName !== 'div' && 
          tagName !== 'svg' &&
          element.id) {
        target = element as SVGElement
        console.log('✅ Elemento objetivo encontrado:', target.tagName, target.id)
        break
      }
    }
    
    if (!target) {
      console.log('❌ No se encontró ningún elemento SVG válido')
      console.log('❌ Elementos disponibles:', elements.map(el => `${el.tagName}#${el.id || '(sin ID)'}`))
      return
    }
    
    const pathIndex = parseInt(target.getAttribute('data-index') || '0')
    
    console.log('📦 Datos capturados:', {
      svgFile: currentSvg,
      elementId: target.id,
      pathIndex: pathIndex
    })
    
    // Modo debug: mostrar información detallada
    if (debugMode) {
      const debugInfo = `
🔍 DEBUG - Elemento clicado:
━━━━━━━━━━━━━━━━━━━━━
Tag: ${target.tagName}
ID: ${target.id}
Index: ${pathIndex}
Fill: ${target.getAttribute('fill') || '(sin fill)'}
Stroke: ${target.getAttribute('stroke') || '(sin stroke)'}
━━━━━━━━━━━━━━━━━━━━━
      `.trim()
      
      console.log(debugInfo)
      setLastClickedElement(debugInfo)
    }
    
    // Limpiar selección anterior
    if (svgContainerRef.current) {
      const previousSelected = svgContainerRef.current.querySelectorAll('[data-selected="true"]')
      previousSelected.forEach((el: any) => {
        el.removeAttribute('data-selected')
        const originalFill = el.getAttribute('data-original-fill')
        const originalStroke = el.getAttribute('data-original-stroke')
        const originalStrokeWidth = el.getAttribute('data-original-stroke-width')
        
        if (originalFill) el.setAttribute('fill', originalFill)
        if (originalStroke) {
          el.setAttribute('stroke', originalStroke)
        } else {
          el.removeAttribute('stroke')
        }
        if (originalStrokeWidth) {
          el.setAttribute('stroke-width', originalStrokeWidth)
        } else {
          el.removeAttribute('stroke-width')
        }
        el.style.opacity = '1'
        el.style.fill = ''
        el.style.stroke = ''
        el.style.strokeWidth = ''
      })
    }

    // Resaltar el elemento seleccionado
    target.setAttribute('data-selected', 'true')
    target.style.fill = '#10b981'
    target.style.stroke = '#059669'
    target.style.strokeWidth = '3'
    target.style.opacity = '0.8'
    target.style.cursor = 'pointer'

    setSelectedSvgPart({
      svgFile: currentSvg,
      elementId: target.id,
      pathIndex: pathIndex
    })
  }

  const handlePartSelect = (partName: string) => {
    console.log('🎯 handlePartSelect llamado con:', partName)
    console.log('📋 Estado actual selectedSvgPart:', selectedSvgPart)
    
    if (!selectedSvgPart) {
      alert('Primero debes seleccionar una parte en el SVG')
      return
    }

    // Validar que todos los datos estén presentes
    if (!selectedSvgPart.elementId || !selectedSvgPart.svgFile || !partName) {
      alert('Error: Datos incompletos. Por favor, intenta de nuevo.')
      console.error('❌ Datos incompletos:', { 
        selectedSvgPart, 
        partName,
        elementId: selectedSvgPart.elementId,
        svgFile: selectedSvgPart.svgFile
      })
      return
    }

    const randomColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`

    const newMapping: PartMapping = {
      svgId: selectedSvgPart.elementId,
      svgPath: selectedSvgPart.svgFile,
      partName,
      color: randomColor
    }

    console.log('✅ Mapeo creado:', newMapping)

    // Guardar el mapeo
    setMappings(prev => {
      const updated = [...prev, newMapping]
      console.log('📋 Estado de mappings actualizado:', updated)
      console.log('📋 Total mappings:', updated.length)
      return updated
    })
    
    // Aplicar el color del mapeo al elemento SVG (permanente)
    if (svgContainerRef.current) {
      const selectedElement = svgContainerRef.current.querySelector(`[data-selected="true"]`)
      if (selectedElement) {
        selectedElement.removeAttribute('data-selected')
        
        // Aplicar el color del mapeo al elemento
        const el = selectedElement as HTMLElement
        el.style.fill = randomColor
        el.style.stroke = randomColor
        el.style.strokeWidth = '2'
        el.style.opacity = '0.7'
        
        // Marcar como mapeado EN ESTA VISTA (no permanente, sino relativo a vista+elemento)
        el.setAttribute('data-mapped', 'true')
        el.setAttribute('data-mapped-view', currentSvg)  // ← NUEVO: guardar en qué vista se mapeó
        el.setAttribute('data-mapping-color', randomColor)
        
        console.log(`✅ Elemento coloreado con: ${randomColor} en vista: ${currentSvg}`)
      }
    }
    
    // Ahora sí limpiamos el estado
    setSelectedSvgPart(null)
    setShowManualInput(false)
    setManualPartName('')
  }

  const handleManualPartSubmit = () => {
    if (!manualPartName.trim()) {
      alert('Escribe el nombre de la parte')
      return
    }
    handlePartSelect(manualPartName.trim())
  }

  const handleNavigate = (direction: 'prev' | 'next') => {
    const currentIndex = svgFiles.findIndex(s => s.id === currentSvg)
    if (direction === 'prev' && currentIndex > 0) {
      setCurrentSvg(svgFiles[currentIndex - 1].id as any)
    } else if (direction === 'next' && currentIndex < svgFiles.length - 1) {
      setCurrentSvg(svgFiles[currentIndex + 1].id as any)
    }
  }

  const handleDeleteMapping = (index: number) => {
    console.log('🗑️ Eliminando mapeo en índice:', index)
    setMappings(prev => {
      const newMappings = prev.filter((_, i) => i !== index)
      console.log('✅ Mapeos después de eliminar:', newMappings)
      return newMappings
    })
  }

  const handleClearAllMappings = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar TODOS los mapeos?')) {
      console.log('🗑️ Limpiando todos los mapeos')
      setMappings([])
    }
  }

  const handleExportMappings = () => {
    const json = JSON.stringify(mappings, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'svg-mappings.json'
    a.click()
  }

  const handleImportMappings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const importedMappings = JSON.parse(content)
        
        if (Array.isArray(importedMappings)) {
          setMappings(importedMappings)
          alert(`✅ Importado correctamente!\n\n${importedMappings.length} mapeos cargados`)
        } else {
          alert('❌ Archivo JSON no válido')
        }
      } catch (error) {
        console.error('❌ Error al importar:', error)
        alert('❌ Error al leer el archivo')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🎨 SVG Mapper Demo</h1>
          <p className="text-gray-600">Mapea cada parte del SVG con su nombre correcto</p>
          <p className="text-sm text-gray-500 mt-2">
            1️⃣ Selecciona un SVG → 2️⃣ Clic en la parte del SVG → 3️⃣ Clic en el nombre correcto
          </p>
        </div>

        {/* Selector de SVG */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Selecciona el SVG a mapear:</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {svgFiles.map(svg => (
              <button
                key={svg.id}
                onClick={() => setCurrentSvg(svg.id as any)}
                className={`p-3 rounded-lg border-2 font-medium transition-all ${
                  currentSvg === svg.id
                    ? 'bg-blue-500 text-white border-blue-600 shadow-lg'
                    : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {svg.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Izquierda: SVG */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => handleNavigate('prev')}
                disabled={svgFiles.findIndex(s => s.id === currentSvg) === 0}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                title="Vista anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <h2 className="text-xl font-bold text-gray-800 text-center flex-1">
                {svgFiles.find(s => s.id === currentSvg)?.label}
              </h2>
              
              <button
                onClick={() => handleNavigate('next')}
                disabled={svgFiles.findIndex(s => s.id === currentSvg) === svgFiles.length - 1}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                title="Vista siguiente"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            
            {selectedSvgPart && (
              <div className="mb-4 p-3 bg-green-50 border-2 border-green-300 rounded-lg">
                <p className="text-sm font-bold text-green-800">
                  ✅ Parte seleccionada: Path #{selectedSvgPart.pathIndex}
                </p>
                <p className="text-xs text-green-600">Ahora selecciona el nombre correcto en la lista →</p>
              </div>
            )}

            <div className="border-2 border-gray-300 rounded-xl p-4 bg-gray-50 overflow-auto max-h-[600px]">
              {!svgContent ? (
                <div className="text-center p-8">
                  <p className="text-gray-500">Cargando SVG...</p>
                </div>
              ) : svgContent.includes('Error') ? (
                <div dangerouslySetInnerHTML={{ __html: svgContent }} />
              ) : (
                <div 
                  ref={svgContainerRef}
                  onClick={handleSvgClick}
                  className="cursor-pointer"
                />
              )}
            </div>
          </div>

          {/* Derecha: Lista de partes */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Lista de Partes del Vehículo</h2>
            
            <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-300 rounded-lg">
              <p className="text-sm font-bold text-blue-800">
                📋 Mapeos guardados: {mappings.length}
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  onClick={handleExportMappings}
                  disabled={mappings.length === 0}
                  className="w-full"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
                <Button
                  onClick={() => document.getElementById('import-file')?.click()}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importar
                </Button>
                <input
                  id="import-file"
                  type="file"
                  accept=".json"
                  onChange={handleImportMappings}
                  className="hidden"
                />
                <Button
                  onClick={handleClearAllMappings}
                  disabled={mappings.length === 0}
                  variant="destructive"
                  className="w-full"
                  size="sm"
                >
                  🗑️ Limpiar
                </Button>
                <Button
                  onClick={() => setShowManualInput(!showManualInput)}
                  disabled={!selectedSvgPart}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Manual
                </Button>
                <Button
                  onClick={() => setDebugMode(!debugMode)}
                  variant={debugMode ? "destructive" : "secondary"}
                  className="w-full col-span-2"
                  size="sm"
                  title="Activa este modo para ver información de las partes del SVG cuando clicas"
                >
                  🐛 {debugMode ? 'ON' : 'OFF'}
                </Button>
              </div>
            </div>

            {/* Modo Debug Info */}
            {debugMode && (
              <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded-lg">
                <p className="text-xs font-bold text-red-800 mb-1">🐛 MODO DEBUG ACTIVO</p>
                <p className="text-xs text-red-600">Haz clic en cualquier parte del SVG para ver su información</p>
                {lastClickedElement && (
                  <pre className="mt-2 text-xs bg-white p-2 rounded border border-red-200 overflow-auto">
                    {lastClickedElement}
                  </pre>
                )}
              </div>
            )}

            {/* Input manual */}
            {showManualInput && selectedSvgPart && (
              <div className="mb-4 p-4 bg-purple-50 border-2 border-purple-300 rounded-lg">
                <h3 className="text-sm font-bold text-purple-800 mb-2">✍️ Escribir nombre manualmente</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualPartName}
                    onChange={(e) => setManualPartName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualPartSubmit()}
                    placeholder="Escribe el nombre de la parte..."
                    className="flex-1 px-3 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={handleManualPartSubmit}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
                  >
                    Añadir
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {vehicleParts.map((part, idx) => {
                // Ya NO verificamos si la parte está mapeada en la vista actual
                // Permitimos mapear la misma parte múltiples veces (ej: 2 partes del faro)
                
                const isSpecialOption = part.startsWith('❌') || part.startsWith('⬅️')
                const isNoMapear = part.startsWith('❌')
                const isFlecha = part.startsWith('⬅️')
                
                // Contar cuántas veces se ha mapeado esta parte en la vista actual
                const mappedCountInView = mappings.filter(m => 
                  m.partName === part && m.svgPath === currentSvg
                ).length
                
                // Contar cuántas veces se ha mapeado esta parte en TOTAL (todas las vistas)
                const mappedCountTotal = mappings.filter(m => m.partName === part).length
                
                return (
                  <button
                    key={idx}
                    onClick={() => handlePartSelect(part)}
                    disabled={!selectedSvgPart}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      isNoMapear && selectedSvgPart
                        ? 'bg-red-50 border-red-300 hover:bg-red-100 text-red-800 font-bold'
                        : isFlecha && selectedSvgPart
                        ? 'bg-blue-50 border-blue-300 hover:bg-blue-100 text-blue-800 font-bold'
                        : selectedSvgPart
                        ? 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100 text-gray-800'
                        : 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={isSpecialOption ? 'font-bold text-base' : 'font-medium'}>{part}</span>
                        {mappedCountInView > 0 && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                            {mappedCountInView}x aquí
                          </span>
                        )}
                        {mappedCountTotal > mappedCountInView && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">
                            +{mappedCountTotal - mappedCountInView} otras
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Tabla de mapeos */}
        {mappings.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Mapeos Realizados</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left p-3 font-bold text-gray-700">#</th>
                    <th className="text-left p-3 font-bold text-gray-700">SVG</th>
                    <th className="text-left p-3 font-bold text-gray-700">ID Elemento</th>
                    <th className="text-left p-3 font-bold text-gray-700">Parte</th>
                    <th className="text-left p-3 font-bold text-gray-700">Color</th>
                    <th className="text-left p-3 font-bold text-gray-700">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.map((mapping, idx) => {
                    console.log(`🔍 Renderizando fila ${idx}:`, mapping)
                    console.log(`  → #: ${idx + 1}`)
                    console.log(`  → SVG: ${mapping.svgPath}`)
                    console.log(`  → ID: ${mapping.svgId}`)
                    console.log(`  → Parte: ${mapping.partName}`)
                    return (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-3" style={{backgroundColor: 'yellow'}}>{idx + 1}</td>
                      <td className="p-3 font-medium" style={{backgroundColor: 'lightblue'}}>{mapping.svgPath}</td>
                      <td className="p-3 font-mono text-xs" style={{backgroundColor: 'lightgreen'}}>{mapping.svgId}</td>
                      <td className="p-3 font-medium" style={{backgroundColor: 'pink'}}>{mapping.partName}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border-2 border-gray-300"
                            style={{ backgroundColor: mapping.color }}
                          />
                          <span className="font-mono text-xs">{mapping.color}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleDeleteMapping(idx)}
                          className="flex items-center gap-1 text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg font-medium transition-all"
                        >
                          <X className="w-4 h-4" />
                          Eliminar
                        </button>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
