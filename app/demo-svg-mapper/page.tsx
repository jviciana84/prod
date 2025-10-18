'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Download } from 'lucide-react'

interface PartMapping {
  svgId: string
  svgPath: string
  partName: string
  color: string
}

export default function SvgMapperDemo() {
  const [selectedSvgPart, setSelectedSvgPart] = useState<{ svgFile: string; elementId: string; x: number; y: number } | null>(null)
  const [mappings, setMappings] = useState<PartMapping[]>([])
  const [currentSvg, setCurrentSvg] = useState<'frontal' | 'lateral_izquierda' | 'laterial_derecha' | 'trasera' | 'interior_salpicadero' | 'interior_delantero_izquierda' | 'interior_delatero_derecha' | 'interior_trasera_izquierda' | 'interior_trasero' | 'interior_maletero'>('frontal')

  // Lista completa de partes del vehículo
  const vehicleParts = [
    // Exterior
    'Capó', 'Parachoques delantero', 'Faro delantero izquierdo', 'Faro delantero derecho',
    'Parrilla', 'Guardabarros delantero izquierdo', 'Guardabarros delantero derecho',
    'Puerta delantera izquierda', 'Puerta delantera derecha', 'Puerta trasera izquierda', 'Puerta trasera derecha',
    'Retrovisor izquierdo', 'Retrovisor derecho', 'Ventanilla delantera izquierda', 'Ventanilla delantera derecha',
    'Ventanilla trasera izquierda', 'Ventanilla trasera derecha', 'Parabrisas delantero', 'Parabrisas trasero',
    'Pilar A izquierdo', 'Pilar A derecho', 'Pilar B izquierdo', 'Pilar B derecho', 'Pilar C izquierdo', 'Pilar C derecho',
    'Techo', 'Aleta delantera izquierda', 'Aleta delantera derecha', 'Aleta trasera izquierda', 'Aleta trasera derecha',
    'Guardabarros trasero izquierdo', 'Guardabarros trasero derecho', 'Portón trasero', 'Maletero',
    'Parachoques trasero', 'Faro trasero izquierdo', 'Faro trasero derecho', 'Escape',
    'Llanta delantera izquierda', 'Llanta delantera derecha', 'Llanta trasera izquierda', 'Llanta trasera derecha',
    'Neumático delantero izquierdo', 'Neumático delantero derecho', 'Neumático trasero izquierdo', 'Neumático trasero derecho',
    
    // Interior
    'Volante', 'Salpicadero', 'Consola central', 'Palanca de cambios',
    'Asiento delantero izquierdo', 'Asiento delantero derecho', 'Asiento trasero izquierdo', 'Asiento trasero derecho',
    'Asientos traseros (banco completo)', 'Reposacabezas delantero izquierdo', 'Reposacabezas delantero derecho',
    'Reposacabezas trasero izquierdo', 'Reposacabezas trasero derecho', 'Cinturón delantero izquierdo',
    'Cinturón delantero derecho', 'Cinturón trasero izquierdo', 'Cinturón trasero derecho',
    'Panel puerta delantera izquierda', 'Panel puerta delantera derecha', 'Panel puerta trasera izquierda', 'Panel puerta trasera derecha',
    'Alfombrilla delantera izquierda', 'Alfombrilla delantera derecha', 'Alfombrilla trasera izquierda', 'Alfombrilla trasera derecha',
    'Tapicería techo', 'Parasol conductor', 'Parasol copiloto', 'Espejo retrovisor interior',
    'Airbag conductor', 'Airbag copiloto', 'Cuadro instrumentos', 'Sistema multimedia/Radio',
    'Climatizador/Aire acondicionado', 'Guantera', 'Apoyabrazos central delantero', 'Apoyabrazos central trasero',
    'Reposapiés', 'Pedales', 'Suelo maletero', 'Bandeja maletero', 'Rueda de repuesto/Kit reparación',
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

  const handleSvgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as SVGElement
    
    // Si es un path, g, circle, rect, polygon, etc dentro del SVG
    if (target.tagName !== 'DIV' && target.tagName !== 'IMG') {
      const elementId = target.id || target.getAttribute('data-name') || `element-${Date.now()}`
      
      // Asignar ID si no tiene
      if (!target.id && !target.getAttribute('data-name')) {
        target.setAttribute('data-name', elementId)
      }

      // Resaltar visualmente
      target.setAttribute('data-selected', 'true')
      target.style.fill = '#10b981'
      target.style.opacity = '0.7'
      target.style.cursor = 'pointer'

      setSelectedSvgPart({
        svgFile: currentSvg,
        elementId,
        x: e.clientX,
        y: e.clientY
      })
    }
  }

  const handlePartSelect = (partName: string) => {
    if (!selectedSvgPart) {
      alert('Primero debes seleccionar una parte en el SVG')
      return
    }

    const randomColor = `#${Math.floor(Math.random()*16777215).toString(16)}`

    const newMapping: PartMapping = {
      svgId: selectedSvgPart.elementId,
      svgPath: selectedSvgPart.svgFile,
      partName,
      color: randomColor
    }

    setMappings(prev => [...prev, newMapping])
    setSelectedSvgPart(null)
  }

  const handleDeleteMapping = (index: number) => {
    setMappings(prev => prev.filter((_, i) => i !== index))
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
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              SVG Actual: {svgFiles.find(s => s.id === currentSvg)?.label}
            </h2>
            
            {selectedSvgPart && (
              <div className="mb-4 p-3 bg-green-50 border-2 border-green-300 rounded-lg">
                <p className="text-sm font-bold text-green-800">
                  ✅ Parte seleccionada: {selectedSvgPart.elementId}
                </p>
                <p className="text-xs text-green-600">Ahora selecciona el nombre correcto en la lista →</p>
              </div>
            )}

            <div 
              onClick={handleSvgClick}
              className="border-2 border-gray-300 rounded-xl p-4 bg-gray-50 overflow-auto max-h-[600px] cursor-crosshair"
              dangerouslySetInnerHTML={{
                __html: `
                  <object 
                    data="/svg/new_car_svg/${currentSvg}.svg" 
                    type="image/svg+xml" 
                    style="width: 100%; height: auto; pointer-events: all;"
                  >
                    Tu navegador no soporta SVG
                  </object>
                `
              }}
            />
          </div>

          {/* Derecha: Lista de partes */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Lista de Partes del Vehículo</h2>
            
            <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-300 rounded-lg">
              <p className="text-sm font-bold text-blue-800">
                📋 Mapeos guardados: {mappings.length}
              </p>
              <Button
                onClick={handleExportMappings}
                disabled={mappings.length === 0}
                className="mt-2 w-full"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar JSON
              </Button>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {vehicleParts.map((part, idx) => {
                const isMapped = mappings.some(m => m.partName === part)
                return (
                  <button
                    key={idx}
                    onClick={() => handlePartSelect(part)}
                    disabled={!selectedSvgPart || isMapped}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      isMapped
                        ? 'bg-green-50 border-green-300 text-green-800 cursor-not-allowed'
                        : selectedSvgPart
                        ? 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100 text-gray-800'
                        : 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{part}</span>
                      {isMapped && <CheckCircle2 className="w-5 h-5 text-green-600" />}
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
                  {mappings.map((mapping, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-3">{idx + 1}</td>
                      <td className="p-3 font-medium">{mapping.svgPath}</td>
                      <td className="p-3 font-mono text-xs">{mapping.svgId}</td>
                      <td className="p-3 font-medium">{mapping.partName}</td>
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
                          className="text-red-500 hover:text-red-700 font-medium"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

