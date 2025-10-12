'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wrench, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { EstadoMecanico, TestigoEncendido } from '@/types/tasacion'

interface EstadoMecanicoStepProps {
  onComplete: (data: {
    estadoMotor: EstadoMecanico
    estadoDireccion: EstadoMecanico
    estadoFrenos: EstadoMecanico
    estadoCajaCambios: EstadoMecanico
    estadoTransmision: EstadoMecanico
    estadoEmbrague: EstadoMecanico
    estadoGeneral: EstadoMecanico
    danoEstructural: boolean
    danoEstructuralDetalle?: string
    testigosEncendidos: TestigoEncendido[]
  }) => void
  onBack: () => void
}

export default function EstadoMecanicoStep({ onComplete, onBack }: EstadoMecanicoStepProps) {
  // Scroll al inicio cuando se monta el componente
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])
  
  const [estadoMotor, setEstadoMotor] = useState<EstadoMecanico | null>(null)
  const [estadoDireccion, setEstadoDireccion] = useState<EstadoMecanico | null>(null)
  const [estadoFrenos, setEstadoFrenos] = useState<EstadoMecanico | null>(null)
  const [estadoCajaCambios, setEstadoCajaCambios] = useState<EstadoMecanico | null>(null)
  const [estadoTransmision, setEstadoTransmision] = useState<EstadoMecanico | null>(null)
  const [estadoEmbrague, setEstadoEmbrague] = useState<EstadoMecanico | null>(null)
  const [estadoGeneral, setEstadoGeneral] = useState<EstadoMecanico | null>(null)
  const [danoEstructural, setDanoEstructural] = useState<boolean | null>(null)
  const [danoEstructuralDetalle, setDanoEstructuralDetalle] = useState('')
  const [testigosEncendidos, setTestigosEncendidos] = useState<TestigoEncendido[]>([])

  const estadoOptions: { value: EstadoMecanico; label: string; color: string }[] = [
    { value: 'bueno', label: 'Bueno', color: 'border-green-500 bg-green-50 text-green-700' },
    { value: 'regular', label: 'Regular', color: 'border-orange-500 bg-orange-50 text-orange-700' },
    { value: 'malo', label: 'Malo', color: 'border-red-500 bg-red-50 text-red-700' },
  ]

  const testigos: { value: TestigoEncendido; label: string }[] = [
    { value: 'ninguno', label: 'Ninguno' },
    { value: 'abs', label: 'ABS' },
    { value: 'aceite', label: 'Aceite' },
    { value: 'filtro_particulas', label: 'Filtro partículas' },
    { value: 'calentadores', label: 'Calentadores' },
    { value: 'gestion_motor', label: 'Gestión motor' },
    { value: 'control_traccion', label: 'Control tracción' },
    { value: '4x4', label: '4x4' },
    { value: 'alternador_bateria', label: 'Alternador/Batería' },
    { value: 'frenos', label: 'Frenos' },
    { value: 'control_estabilidad', label: 'Control estabilidad' },
  ]

  const handleTestigoToggle = (testigo: TestigoEncendido) => {
    if (testigo === 'ninguno') {
      setTestigosEncendidos(['ninguno'])
    } else {
      const newTestigos = testigosEncendidos.filter(t => t !== 'ninguno')
      if (newTestigos.includes(testigo)) {
        const filtered = newTestigos.filter(t => t !== testigo)
        setTestigosEncendidos(filtered.length === 0 ? ['ninguno'] : filtered)
      } else {
        setTestigosEncendidos([...newTestigos, testigo])
      }
    }
  }

  const handleContinue = () => {
    if (
      estadoMotor && estadoDireccion && estadoFrenos && estadoCajaCambios &&
      estadoTransmision && estadoEmbrague && estadoGeneral && danoEstructural !== null &&
      testigosEncendidos.length > 0
    ) {
      onComplete({
        estadoMotor,
        estadoDireccion,
        estadoFrenos,
        estadoCajaCambios,
        estadoTransmision,
        estadoEmbrague,
        estadoGeneral,
        danoEstructural,
        danoEstructuralDetalle: danoEstructural ? danoEstructuralDetalle : undefined,
        testigosEncendidos,
      })
    }
  }

  const isValid = estadoMotor && estadoDireccion && estadoFrenos && estadoCajaCambios &&
    estadoTransmision && estadoEmbrague && estadoGeneral && danoEstructural !== null &&
    testigosEncendidos.length > 0 && (!danoEstructural || danoEstructuralDetalle.trim())

  // Auto-scroll cuando se marca el estado de frenos
  useEffect(() => {
    if (estadoFrenos) {
      setTimeout(() => {
        window.scrollTo({ 
          top: document.documentElement.scrollHeight, 
          behavior: 'smooth' 
        })
      }, 300)
    }
  }, [estadoFrenos])
  
  // Auto-scroll cuando se marca el estado general
  useEffect(() => {
    if (estadoGeneral) {
      setTimeout(() => {
        window.scrollTo({ 
          top: document.documentElement.scrollHeight, 
          behavior: 'smooth' 
        })
      }, 300)
    }
  }, [estadoGeneral])
  
  // Auto-scroll cuando se marca daño estructural
  useEffect(() => {
    if (danoEstructural !== null) {
      setTimeout(() => {
        window.scrollTo({ 
          top: document.documentElement.scrollHeight, 
          behavior: 'smooth' 
        })
      }, 300)
    }
  }, [danoEstructural])
  
  const EstadoSelector = ({ 
    label, 
    value, 
    onChange
  }: { 
    label: string
    value: EstadoMecanico | null
    onChange: (v: EstadoMecanico) => void
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <Label className="text-sm font-semibold text-gray-700 mb-2 block">{label}</Label>
      <div className="grid grid-cols-3 gap-2">
        {estadoOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              onChange(option.value)
            }}
            className={`p-3 rounded-lg border-2 transition-all font-semibold text-sm ${
              value === option.value ? option.color : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </motion.div>
  )

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
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Estado Mecánico</h2>
          <p className="text-sm text-gray-600">Evalúa el estado de los componentes</p>
        </div>

        {/* Estados mecánicos */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-4 space-y-2">
          <EstadoSelector label="Estado del motor" value={estadoMotor} onChange={setEstadoMotor} />
          <EstadoSelector label="Estado de la dirección" value={estadoDireccion} onChange={setEstadoDireccion} />
          <EstadoSelector label="Estado de frenos" value={estadoFrenos} onChange={setEstadoFrenos} />
          <EstadoSelector label="Estado caja de cambios" value={estadoCajaCambios} onChange={setEstadoCajaCambios} />
          <EstadoSelector label="Estado transmisión" value={estadoTransmision} onChange={setEstadoTransmision} />
          <EstadoSelector label="Estado del embrague" value={estadoEmbrague} onChange={setEstadoEmbrague} />
          <EstadoSelector label="Estado general" value={estadoGeneral} onChange={setEstadoGeneral} />
        </div>

        {/* Daño estructural */}
        {estadoGeneral && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-4"
            id="dano-estructural"
          >
            <Label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              ¿Daño estructural?
            </Label>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg mb-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-800">
                Daño estructural es si ha sufrido un impacto que afecta al chasis del vehículo
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                onClick={() => setDanoEstructural(false)}
                className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                  danoEstructural === false
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                ✓ No
              </button>
              <button
                onClick={() => setDanoEstructural(true)}
                className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                  danoEstructural === true
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                ✗ Sí
              </button>
            </div>

            {danoEstructural === true && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <Label htmlFor="detalle-estructural" className="text-sm font-medium text-gray-700 mb-2 block">
                  Describe el daño estructural
                </Label>
                  <Textarea
                    id="detalle-estructural"
                    placeholder="Especifica la ubicación y naturaleza del daño..."
                    value={danoEstructuralDetalle}
                    onChange={(e) => setDanoEstructuralDetalle(e.target.value)}
                    className="min-h-20 resize-none bg-white text-gray-900"
                  />
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Testigos encendidos */}
        {danoEstructural !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-4"
            id="testigos-encendidos"
          >
            <Label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Testigos encendidos
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {testigos.map((testigo) => {
                const isSelected = testigosEncendidos.includes(testigo.value)
                const isNinguno = testigo.value === 'ninguno'
                return (
                  <button
                    key={testigo.value}
                    onClick={() => handleTestigoToggle(testigo.value)}
                    className={`p-3 rounded-lg border-2 transition-all text-sm font-semibold ${
                      isSelected
                        ? isNinguno
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {testigo.label}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Botones de navegación */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex-1 h-12 border-2"
          >
            Atrás
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!isValid}
            className="flex-1 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold shadow-lg disabled:opacity-50"
          >
            Continuar
          </Button>
        </div>
      </motion.div>
    </div>
  )
}


