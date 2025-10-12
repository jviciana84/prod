'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Car, Calendar, Building2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface DatosBasicosStepProps {
  onComplete: (data: {
    matricula: string
    kmActuales: number
    procedencia: 'particular' | 'empresa'
    fechaMatriculacion: string
    fechaMatriculacionConfirmada: boolean
  }) => void
  onBack: () => void
}

export default function DatosBasicosStep({ onComplete, onBack }: DatosBasicosStepProps) {
  const [matricula, setMatricula] = useState('')
  const [kmActuales, setKmActuales] = useState('')
  const [procedencia, setProcedencia] = useState<'particular' | 'empresa' | null>(null)
  const [fechaMatriculacion, setFechaMatriculacion] = useState('')
  const [fechaIncorrecta, setFechaIncorrecta] = useState(false)
  const [fechaManual, setFechaManual] = useState('')
  const [motivoFechaIncorrecta, setMotivoFechaIncorrecta] = useState('')
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  
  // Refs para auto-scroll
  const kmRef = useRef<HTMLDivElement>(null)
  const procedenciaRef = useRef<HTMLDivElement>(null)
  const fechaRef = useRef<HTMLDivElement>(null)
  
  // Scroll al inicio cuando se monta el componente
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Simular obtención de fecha desde matrícula
  const obtenerFechaDesdeMatricula = (mat: string) => {
    // Aquí iría la lógica real de obtener la fecha
    // Por ahora retornamos una fecha simulada
    if (mat.length >= 4) {
      return '15/03/2018'
    }
    return ''
  }

  const handleMatriculaChange = (value: string) => {
    const upperValue = value.toUpperCase()
    setMatricula(upperValue)
    if (upperValue.length >= 4) {
      const fecha = obtenerFechaDesdeMatricula(upperValue)
      setFechaMatriculacion(fecha)
    }
  }
  
  // Auto-scroll solo cuando se selecciona procedencia (aparece nuevo contenido)
  useEffect(() => {
    if (procedencia) {
      setTimeout(() => {
        window.scrollTo({ 
          top: document.documentElement.scrollHeight, 
          behavior: 'smooth' 
        })
      }, 300)
    }
  }, [procedencia])
  
  useEffect(() => {
    if (showDisclaimer) {
      setTimeout(() => {
        window.scrollTo({ 
          top: document.documentElement.scrollHeight, 
          behavior: 'smooth' 
        })
      }, 300)
    }
  }, [showDisclaimer])
  
  // Auto-scroll cuando se marca "Fecha incorrecta"
  useEffect(() => {
    if (fechaIncorrecta) {
      setTimeout(() => {
        window.scrollTo({ 
          top: document.documentElement.scrollHeight, 
          behavior: 'smooth' 
        })
      }, 300)
    }
  }, [fechaIncorrecta])

  const handleProcedenciaChange = (tipo: 'particular' | 'empresa') => {
    setProcedencia(tipo)
    if (tipo === 'empresa') {
      setShowDisclaimer(true)
    } else {
      setShowDisclaimer(false)
    }
  }

  const handleFechaManualChange = (value: string) => {
    // Remover todo lo que no sea número
    const numbers = value.replace(/\D/g, '')
    
    // Formatear con barras automáticamente
    let formatted = ''
    if (numbers.length > 0) {
      // DD
      formatted = numbers.substring(0, 2)
      
      // Agregar barra después de 2 dígitos
      if (numbers.length >= 2) {
        formatted += '/'
      }
      
      // MM
      if (numbers.length >= 3) {
        formatted += numbers.substring(2, 4)
      }
      
      // Agregar barra después de 4 dígitos (DD/MM)
      if (numbers.length >= 4) {
        formatted += '/'
      }
      
      // AAAA
      if (numbers.length >= 5) {
        formatted += numbers.substring(4, 8)
      }
    }
    
    setFechaManual(formatted)
  }

  const handleContinue = () => {
    if (matricula && kmActuales && procedencia && fechaMatriculacion) {
      // Si no marcó como incorrecta, la fecha es correcta
      const fechaFinal = fechaIncorrecta ? fechaManual : fechaMatriculacion
      onComplete({
        matricula,
        kmActuales: parseInt(kmActuales),
        procedencia,
        fechaMatriculacion: fechaFinal,
        fechaMatriculacionConfirmada: !fechaIncorrecta,
      })
    }
  }

  const isValid = matricula && kmActuales && procedencia && fechaMatriculacion && 
    (!fechaIncorrecta || (fechaManual && motivoFechaIncorrecta))

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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Datos del Vehículo</h2>
          <p className="text-sm text-gray-600">Información básica para comenzar</p>
        </div>

        {/* Formulario */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 space-y-6">
          {/* Matrícula */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Label htmlFor="matricula" className="text-sm font-semibold text-gray-700 mb-2 block">
              Matrícula del vehículo
            </Label>
            <Input
              id="matricula"
              type="text"
              inputMode="text"
              placeholder="Ej: 1234ABC"
              value={matricula}
              onChange={(e) => handleMatriculaChange(e.target.value)}
              className="h-12 text-lg font-mono uppercase text-center border-2 focus:border-purple-500 bg-white text-gray-900"
              maxLength={10}
            />
          </motion.div>

          {/* Kilómetros */}
          <motion.div
            ref={kmRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Label htmlFor="km" className="text-sm font-semibold text-gray-700 mb-2 block">
              Kilómetros actuales
            </Label>
            <Input
              id="km"
              type="number"
              inputMode="numeric"
              placeholder="150000"
              value={kmActuales}
              onChange={(e) => setKmActuales(e.target.value)}
              className="h-12 text-lg text-center border-2 focus:border-purple-500 bg-white text-gray-900"
            />
          </motion.div>

          {/* Procedencia */}
          <motion.div
            ref={procedenciaRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Label className="text-sm font-semibold text-gray-700 mb-3 block">
              Procedencia
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleProcedenciaChange('particular')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  procedencia === 'particular'
                    ? 'border-purple-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                }`}
                title="Particular"
              >
                <User className={`w-6 h-6 mx-auto mb-2 ${
                  procedencia === 'particular' ? 'text-purple-600' : 'text-gray-500'
                }`} />
                <span className={`text-sm font-semibold overflow-hidden text-ellipsis whitespace-nowrap ${
                  procedencia === 'particular' ? 'text-purple-900' : 'text-gray-700'
                }`}>
                  Particular
                </span>
              </button>

              <button
                onClick={() => handleProcedenciaChange('empresa')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  procedencia === 'empresa'
                    ? 'border-purple-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                }`}
                title="Empresa"
              >
                <Building2 className={`w-6 h-6 mx-auto mb-2 ${
                  procedencia === 'empresa' ? 'text-purple-600' : 'text-gray-500'
                }`} />
                <span className={`text-sm font-semibold overflow-hidden text-ellipsis whitespace-nowrap ${
                  procedencia === 'empresa' ? 'text-purple-900' : 'text-gray-700'
                }`}>
                  Empresa
                </span>
              </button>
            </div>
          </motion.div>

          {/* Disclaimer empresa */}
          {showDisclaimer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg"
            >
              <p className="text-sm text-amber-800">
                ⚠️ <strong>Importante:</strong> Para vehículos de empresa será necesario realizar una factura de venta con el 21% de IVA incluido.
              </p>
            </motion.div>
          )}

          {/* Fecha de matriculación */}
          {fechaMatriculacion && (
            <motion.div
              ref={fechaRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Fecha de matriculación
              </Label>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-purple-200 mb-3">
                <p className="text-sm text-gray-600 mb-2">Según la matrícula, la fecha es:</p>
                <p className="text-xl font-bold text-purple-900 text-center">{fechaMatriculacion}</p>
              </div>

              {!fechaIncorrecta ? (
                <button
                  onClick={() => setFechaIncorrecta(true)}
                  className="w-full p-3 rounded-lg border-2 border-gray-300 bg-white hover:border-red-400 hover:bg-red-50 text-gray-700 hover:text-red-700 transition-all duration-300 font-semibold"
                >
                  ✗ La fecha es incorrecta
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  <div>
                    <Label htmlFor="fecha-manual" className="text-sm font-medium text-gray-700 mb-2 block">
                      Fecha correcta (DD/MM/AAAA)
                    </Label>
                    <Input
                      id="fecha-manual"
                      type="text"
                      placeholder="15/03/2018"
                      value={fechaManual}
                      onChange={(e) => handleFechaManualChange(e.target.value)}
                      maxLength={10}
                      className="h-12 text-center border-2 focus:border-red-500 bg-white text-gray-900"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="motivo-fecha" className="text-sm font-medium text-gray-700 mb-2 block">
                      Motivo de la fecha incorrecta
                    </Label>
                    <Textarea
                      id="motivo-fecha"
                      placeholder="Ej: Error en los datos del registro, matrícula transferida..."
                      value={motivoFechaIncorrecta}
                      onChange={(e) => setMotivoFechaIncorrecta(e.target.value)}
                      className="min-h-20 resize-none bg-white text-gray-900"
                    />
                  </div>
                  
                  <button
                    onClick={() => {
                      setFechaIncorrecta(false)
                      setFechaManual('')
                      setMotivoFechaIncorrecta('')
                    }}
                    className="w-full p-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    ← Cancelar, la fecha es correcta
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>

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


