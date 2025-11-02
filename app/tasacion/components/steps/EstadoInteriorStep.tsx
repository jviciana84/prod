'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Car } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { VehicleDamage } from '@/types/tasacion'
import MappedCarSilhouette from '../damage-assessment/MappedCarSilhouette'

interface EstadoInteriorStepProps {
  onComplete: (danos: VehicleDamage[]) => void
  onBack: () => void
}

type VistaInterior = 
  | 'interior_salpicadero' 
  | 'interior_delantero_izquierda' 
  | 'interior_trasera_izquierda'
  | 'interior_maletero'

export default function EstadoInteriorStep({ onComplete, onBack }: EstadoInteriorStepProps) {
  // Scroll al inicio cuando se monta el componente
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
    // Auto-scroll a los 3 segundos para mostrar botones de navegación
    const scrollTimer = setTimeout(() => {
      window.scrollTo({ 
        top: document.documentElement.scrollHeight, 
        behavior: 'smooth' 
      })
    }, 3000)
    
    return () => clearTimeout(scrollTimer)
  }, [])
  
  const [vistaActual, setVistaActual] = useState<VistaInterior>('interior_salpicadero')
  const [danos, setDanos] = useState<VehicleDamage[]>([])

  const vistas: { id: VistaInterior; label: string }[] = [
    { id: 'interior_salpicadero', label: 'Salpicadero' },
    { id: 'interior_delantero_izquierda', label: 'Delant. Izq.' },
    { id: 'interior_trasera_izquierda', label: 'Tras. Izq.' },
    { id: 'interior_maletero', label: 'Maletero' },
  ]

  const handleDamageAdd = (damage: VehicleDamage) => {
    setDanos(prev => [...prev, damage])
    console.log('Daño interior añadido:', damage)
  }

  const handleNavigateToView = (viewName: string) => {
    console.log('🔄 Navegando a vista interior:', viewName)
    setVistaActual(viewName as VistaInterior)
  }

  const handleContinue = () => {
    // Cambiar a la siguiente vista o completar si es la última
    if (vistaActual === 'interior_salpicadero') {
      setVistaActual('interior_delantero_izquierda')
    } else if (vistaActual === 'interior_delantero_izquierda') {
      setVistaActual('interior_trasera_izquierda')
    } else if (vistaActual === 'interior_trasera_izquierda') {
      setVistaActual('interior_maletero')
    } else {
      // Es la última vista, completar
      onComplete(danos)
    }
  }

  const handleBackBtn = () => {
    // Cambiar a la vista anterior o volver al paso anterior
    if (vistaActual === 'interior_maletero') {
      setVistaActual('interior_trasera_izquierda')
    } else if (vistaActual === 'interior_trasera_izquierda') {
      setVistaActual('interior_delantero_izquierda')
    } else if (vistaActual === 'interior_delantero_izquierda') {
      setVistaActual('interior_salpicadero')
    } else {
      // Es la primera vista, volver al paso anterior (exterior)
      onBack()
    }
  }

  const getVistaLabel = () => {
    const vista = vistas.find(v => v.id === vistaActual)
    return vista?.label || 'Vista'
  }

  const getProgressText = () => {
    const indices: Record<VistaInterior, number> = { 
      'interior_salpicadero': 1,
      'interior_delantero_izquierda': 2,
      'interior_trasera_izquierda': 3,
      'interior_maletero': 4,
    }
    const current = indices[vistaActual]
    return `Vista ${current} de 4`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 pt-6 pb-24 px-4">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md mx-auto"
      >
        {/* Encabezado */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-400 via-blue-500 to-indigo-500 rounded-full mb-3 shadow-lg">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Estado Estético Interior</h2>
          <p className="text-sm text-gray-600">{getVistaLabel()} - {getProgressText()}</p>
        </div>

        {/* Indicador de progreso de vistas */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-3 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-600">Progreso de vistas:</span>
            <span className="text-xs font-bold text-teal-600">{getProgressText()}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {vistas.map((vista) => (
              <button
                key={vista.id}
                onClick={() => setVistaActual(vista.id)}
                className={`py-2 px-1 rounded-lg text-xs font-semibold text-center transition-all ${
                  vistaActual === vista.id
                    ? 'bg-gradient-to-r from-teal-500 via-blue-500 to-indigo-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {vista.label}
              </button>
            ))}
          </div>
        </div>

        {/* Silueta del interior */}
        <div className="mb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={vistaActual}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <MappedCarSilhouette
                svgFileName={vistaActual}
                viewTitle={getVistaLabel()}
                onDamageAdd={handleDamageAdd}
                damages={danos}
                onNavigateToView={handleNavigateToView}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Instrucción simple y dinámica */}
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600 font-medium">
            Toca el interior para marcar daños
          </p>
        </div>

        {/* Botones de navegación */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleBackBtn}
            variant="outline"
            className="flex-1 h-12 border-2"
          >
            {vistaActual === 'interior_salpicadero' ? 'Volver a Exterior' : 'Vista Anterior'}
          </Button>
          <Button
            onClick={handleContinue}
            className="flex-1 h-12 bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600 hover:from-teal-700 hover:via-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg"
          >
            {vistaActual === 'interior_maletero' ? 'Continuar' : 'Siguiente Vista'}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

