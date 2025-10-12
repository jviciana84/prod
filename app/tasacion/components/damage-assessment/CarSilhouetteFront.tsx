'use client'

import { VehicleDamage, DamageType } from '@/types/tasacion'
import { useState } from 'react'
import { X } from 'lucide-react'

interface CarSilhouetteFrontProps {
  onPartClick: (part: string) => void
  damages: VehicleDamage[]
  getDamageColor: (damageType: DamageType) => string
}

export default function CarSilhouetteFront({ onPartClick, damages, getDamageColor }: CarSilhouetteFrontProps) {
  const [showDamageSelector, setShowDamageSelector] = useState(false)
  const [clickedPosition, setClickedPosition] = useState<{ x: number; y: number } | null>(null)
  const [damageMarks, setDamageMarks] = useState<Array<{ x: number; y: number; damageType: DamageType }>>([])

  const handleCarClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    setClickedPosition({ x, y })
    setShowDamageSelector(true)
  }

  const handleDamageSelect = (damageType: DamageType) => {
    if (clickedPosition) {
      // Agregar la marca de daño
      setDamageMarks(prev => [...prev, { ...clickedPosition, damageType }])
      
      // Llamar a la función del padre (sin especificar parte)
      onPartClick('daño-marcado')
      
      // Cerrar el selector
      setShowDamageSelector(false)
      setClickedPosition(null)
    }
  }

  const getDamageTextColor = (damageType: DamageType) => {
    switch (damageType) {
      case 'PULIR': return 'text-green-600'
      case 'RAYADO': return 'text-yellow-600'
      case 'GOLPE': return 'text-orange-600'
      case 'SUSTITUIR': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getDamageName = (damageType: DamageType) => {
    switch (damageType) {
      case 'PULIR': return 'Pulir'
      case 'RAYADO': return 'Rayado'
      case 'GOLPE': return 'Golpe'
      case 'SUSTITUIR': return 'Sustituir'
      default: return 'Sin daño'
    }
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Vista Frontal</h3>
      
      {/* TU SVG CON MARCAS DE DAÑO */}
      <div className="relative max-w-lg mx-auto mb-6">
        <div className="bg-white rounded-xl p-4 border-2 border-gray-300 shadow-lg">
          {/* Imagen SVG clicable */}
          <div 
            onClick={handleCarClick}
            className="cursor-pointer relative"
          >
            <img 
              src="/svg/frontal.svg" 
              alt="Coche frontal - Haz clic para marcar daños"
              className="w-full h-auto max-h-80 object-contain"
              style={{ filter: 'brightness(1.2) contrast(1.1)' }}
            />
            
            {/* Marcas de daño (X) exactas donde clicas */}
            {damageMarks.map((mark, index) => (
              <div
                key={index}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: mark.x, top: mark.y }}
              >
                <X className={`w-6 h-6 ${getDamageTextColor(mark.damageType)} drop-shadow-lg`} />
                <div className={`text-xs font-bold mt-1 text-center ${getDamageTextColor(mark.damageType)}`}>
                  {getDamageName(mark.damageType)}
                </div>
              </div>
            ))}
            
            {/* Overlay con instrucciones */}
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-5 transition-all duration-200 rounded-lg flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg opacity-0 hover:opacity-100 transition-opacity duration-200">
                <p className="text-sm font-medium text-gray-700">Haz clic en cualquier parte para marcar</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de daño */}
      {showDamageSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
              Selecciona el tipo de daño
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => handleDamageSelect('PULIR')}
                className="p-4 bg-green-50 border-2 border-green-300 rounded-lg hover:bg-green-100 transition-colors duration-200"
              >
                <div className="text-center">
                  <div className="w-8 h-8 bg-green-400 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">P</span>
                  </div>
                  <span className="font-bold text-green-800">Pulir</span>
                </div>
              </button>
              
              <button
                onClick={() => handleDamageSelect('RAYADO')}
                className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg hover:bg-yellow-100 transition-colors duration-200"
              >
                <div className="text-center">
                  <div className="w-8 h-8 bg-yellow-400 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">R</span>
                  </div>
                  <span className="font-bold text-yellow-800">Rayado</span>
                </div>
              </button>
              
              <button
                onClick={() => handleDamageSelect('GOLPE')}
                className="p-4 bg-orange-50 border-2 border-orange-300 rounded-lg hover:bg-orange-100 transition-colors duration-200"
              >
                <div className="text-center">
                  <div className="w-8 h-8 bg-orange-400 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">G</span>
                  </div>
                  <span className="font-bold text-orange-800">Golpe</span>
                </div>
              </button>
              
              <button
                onClick={() => handleDamageSelect('SUSTITUIR')}
                className="p-4 bg-red-50 border-2 border-red-300 rounded-lg hover:bg-red-100 transition-colors duration-200"
              >
                <div className="text-center">
                  <div className="w-8 h-8 bg-red-400 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <span className="font-bold text-red-800">Sustituir</span>
                </div>
              </button>
            </div>
            
            <button
              onClick={() => {
                setShowDamageSelector(false)
                setClickedPosition(null)
              }}
              className="w-full p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Resumen de daños marcados */}
      {damageMarks.length > 0 && (
        <div className="mt-6 p-4 bg-white/90 rounded-xl border-2 border-gray-200 shadow-lg">
          <div className="text-sm font-bold text-gray-800 mb-3 text-center">Daños Marcados ({damageMarks.length})</div>
          <div className="space-y-2">
            {damageMarks.map((mark, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <X className={`w-4 h-4 ${getDamageTextColor(mark.damageType)}`} />
                  <span className="font-medium text-gray-700 text-sm">
                    Daño #{index + 1}: {getDamageName(mark.damageType)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setDamageMarks(prev => prev.filter((_, i) => i !== index))
                  }}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors duration-200"
                  title="Eliminar daño"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}