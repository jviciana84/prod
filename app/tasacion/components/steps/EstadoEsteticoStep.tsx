'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Car } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { VehicleDamage, DamageType } from '@/types/tasacion'
import CarSilhouetteFront from '../damage-assessment/CarSilhouetteFront'
import CarSilhouetteLeft from '../damage-assessment/CarSilhouetteLeft'
import CarSilhouetteRear from '../damage-assessment/CarSilhouetteRear'
import CarSilhouetteRight from '../damage-assessment/CarSilhouetteRight'

interface EstadoEsteticoStepProps {
  onComplete: (danos: VehicleDamage[]) => void
  onBack: () => void
}

type Vista = 'frontal' | 'lateral-izq' | 'trasera' | 'lateral-der'

export default function EstadoEsteticoStep({ onComplete, onBack }: EstadoEsteticoStepProps) {
  // Scroll al inicio cuando se monta el componente
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])
  
  const [vistaActual, setVistaActual] = useState<Vista>('frontal')
  const [danos, setDanos] = useState<VehicleDamage[]>([])

  const vistas: { id: Vista; label: string }[] = [
    { id: 'frontal', label: 'Frontal' },
    { id: 'lateral-izq', label: 'Lateral Izq.' },
    { id: 'trasera', label: 'Trasera' },
    { id: 'lateral-der', label: 'Lateral Der.' },
  ]

  const handlePartClick = (parte: string) => {
    // Los nuevos componentes ya manejan la selección de daños internamente
    // Solo necesitamos actualizar la lista de daños cuando se complete
    console.log('Parte clickeada:', parte)
  }

  const getDanoColor = (tipo: DamageType): string => {
    const colors: Record<DamageType, string> = {
      pulir: '#EAB308',
      rayado: '#F97316',
      golpe: '#EF4444',
      sustituir: '#9333EA',
    }
    return colors[tipo]
  }

  const handleContinue = () => {
    // Cambiar a la siguiente vista o completar si es la última
    if (vistaActual === 'frontal') {
      setVistaActual('lateral-izq')
    } else if (vistaActual === 'lateral-izq') {
      setVistaActual('trasera')
    } else if (vistaActual === 'trasera') {
      setVistaActual('lateral-der')
    } else {
      // Es la última vista, completar
      onComplete(danos)
    }
  }

  const handleBack = () => {
    // Cambiar a la vista anterior o volver al paso anterior
    if (vistaActual === 'lateral-der') {
      setVistaActual('trasera')
    } else if (vistaActual === 'trasera') {
      setVistaActual('lateral-izq')
    } else if (vistaActual === 'lateral-izq') {
      setVistaActual('frontal')
    } else {
      // Es la primera vista, volver al paso anterior
      onBack()
    }
  }

  const getVistaLabel = () => {
    const vista = vistas.find(v => v.id === vistaActual)
    return vista?.label || 'Vista'
  }

  const getProgressText = () => {
    const indices = { 'frontal': 1, 'lateral-izq': 2, 'trasera': 3, 'lateral-der': 4 }
    const current = indices[vistaActual]
    return `Vista ${current} de 4`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 pt-6 pb-24 px-4">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md mx-auto"
      >
        {/* Encabezado */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full mb-3 shadow-lg">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Estado Estético Exterior</h2>
          <p className="text-sm text-gray-600">{getVistaLabel()} - {getProgressText()}</p>
        </div>

        {/* Indicador de progreso de vistas */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-3 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-600">Progreso de vistas:</span>
            <span className="text-xs font-bold text-purple-600">{getProgressText()}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {vistas.map((vista) => (
              <div
                key={vista.id}
                className={`py-2 px-1 rounded-lg text-xs font-semibold text-center ${
                  vistaActual === vista.id
                    ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {vista.label}
              </div>
            ))}
          </div>
        </div>

        {/* Silueta del coche */}
        <div className="mb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={vistaActual}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {vistaActual === 'frontal' && (
                <CarSilhouetteFront
                  onPartClick={handlePartClick}
                  damages={danos}
                  getDamageColor={getDanoColor}
                />
              )}
              {vistaActual === 'lateral-izq' && (
                <CarSilhouetteLeft
                  onPartClick={handlePartClick}
                  damages={danos}
                  getDamageColor={getDanoColor}
                />
              )}
              {vistaActual === 'trasera' && (
                <CarSilhouetteRear
                  onPartClick={handlePartClick}
                  damages={danos}
                  getDamageColor={getDanoColor}
                />
              )}
              {vistaActual === 'lateral-der' && (
                <CarSilhouetteRight
                  onPartClick={handlePartClick}
                  damages={danos}
                  getDamageColor={getDanoColor}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Instrucción simple y dinámica */}
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600 font-medium">
            Toca el coche para marcar daños
          </p>
        </div>

        {/* Botones de navegación */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleBack}
            variant="outline"
            className="flex-1 h-12 border-2"
          >
            {vistaActual === 'frontal' ? 'Atrás' : 'Vista Anterior'}
          </Button>
          <Button
            onClick={handleContinue}
            className="flex-1 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold shadow-lg"
          >
            {vistaActual === 'lateral-der' ? 'Continuar' : 'Siguiente Vista'}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}