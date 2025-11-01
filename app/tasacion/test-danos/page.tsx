'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Car } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { VehicleDamage } from '@/types/tasacion'
import MappedCarSilhouette from '../components/damage-assessment/MappedCarSilhouette'

type Vista = 
  | 'frontal' 
  | 'lateral_izquierda' 
  | 'trasera' 
  | 'laterial_derecha'
  | 'interior_salpicadero'
  | 'interior_delantero_izquierda'
  | 'interior_trasera_izquierda'
  | 'interior_maletero'

export default function TestDanosPage() {
  const [vistaActual, setVistaActual] = useState<Vista>('frontal')
  const [danos, setDanos] = useState<VehicleDamage[]>([])
  const [tipoVista, setTipoVista] = useState<'exterior' | 'interior'>('exterior')

  const vistasExteriores: { id: Vista; label: string }[] = [
    { id: 'frontal', label: 'Frontal' },
    { id: 'lateral_izquierda', label: 'Lateral Izq.' },
    { id: 'trasera', label: 'Trasera' },
    { id: 'laterial_derecha', label: 'Lateral Der.' },
  ]

  const vistasInteriores: { id: Vista; label: string }[] = [
    { id: 'interior_salpicadero', label: 'Salpicadero' },
    { id: 'interior_delantero_izquierda', label: 'Delant. Izq.' },
    { id: 'interior_trasera_izquierda', label: 'Tras. Izq.' },
    { id: 'interior_maletero', label: 'Maletero' },
  ]

  const vistas = tipoVista === 'exterior' ? vistasExteriores : vistasInteriores

  const handleDamageAdd = (damage: VehicleDamage) => {
    setDanos(prev => [...prev, damage])
    console.log('✅ Daño añadido:', damage)
  }

  const handleNavigateToView = (viewName: string) => {
    console.log('🔄 Navegando a vista:', viewName)
    setVistaActual(viewName as Vista)
  }

  const getVistaLabel = () => {
    const vista = vistas.find(v => v.id === vistaActual)
    return vista?.label || 'Vista'
  }

  const getProgressText = () => {
    if (tipoVista === 'exterior') {
      const indices = { 'frontal': 1, 'lateral_izquierda': 2, 'trasera': 3, 'laterial_derecha': 4 }
      const current = indices[vistaActual as keyof typeof indices] || 1
      return `Vista ${current} de 4`
    } else {
      const indices = { 
        'interior_salpicadero': 1, 
        'interior_delantero_izquierda': 2, 
        'interior_trasera_izquierda': 3, 
        'interior_maletero': 4 
      }
      const current = indices[vistaActual as keyof typeof indices] || 1
      return `Vista ${current} de 4`
    }
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🧪 TEST - {tipoVista === 'exterior' ? 'Exterior' : 'Interior'}
          </h2>
          <p className="text-sm text-gray-600">{getVistaLabel()} - {getProgressText()}</p>
        </div>

        {/* Selector Exterior/Interior */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-3 mb-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setTipoVista('exterior')
                setVistaActual('frontal')
              }}
              className={`py-3 px-4 rounded-lg font-bold transition-all ${
                tipoVista === 'exterior'
                  ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🚗 Exterior
            </button>
            <button
              onClick={() => {
                setTipoVista('interior')
                setVistaActual('interior_salpicadero')
              }}
              className={`py-3 px-4 rounded-lg font-bold transition-all ${
                tipoVista === 'interior'
                  ? 'bg-gradient-to-r from-teal-500 via-blue-500 to-indigo-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🪑 Interior
            </button>
          </div>
        </div>

        {/* Indicador de progreso de vistas */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-3 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-600">Progreso de vistas:</span>
            <span className="text-xs font-bold text-purple-600">{getProgressText()}</span>
          </div>
          <div className={`grid gap-2 ${tipoVista === 'exterior' ? 'grid-cols-4' : 'grid-cols-2'}`}>
            {vistas.map((vista) => (
              <button
                key={vista.id}
                onClick={() => setVistaActual(vista.id)}
                className={`py-2 px-1 rounded-lg text-xs font-semibold text-center transition-all ${
                  vistaActual === vista.id
                    ? tipoVista === 'exterior'
                      ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md'
                      : 'bg-gradient-to-r from-teal-500 via-blue-500 to-indigo-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {vista.label}
              </button>
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

        {/* Instrucción */}
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600 font-medium">
            Toca el coche para marcar daños o usa las flechas del SVG para cambiar de vista
          </p>
        </div>

        {/* Resumen compacto de daños totales */}
        {danos.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-3 mb-4">
            <p className="text-sm font-bold text-gray-800 text-center">
              📊 Total: {danos.length} daño(s) marcado(s)
            </p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-3">
          <Button
            onClick={() => {
              setDanos([])
              console.log('🗑️ Todos los daños eliminados')
            }}
            variant="outline"
            className="flex-1"
            disabled={danos.length === 0}
          >
            Limpiar Todo
          </Button>
          <Button
            onClick={() => {
              console.log('📋 DAÑOS FINALES:', danos)
              alert(`✅ ${danos.length} daños marcados\n\nRevisa la consola (F12)`)
            }}
            className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
            disabled={danos.length === 0}
          >
            Ver JSON
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

