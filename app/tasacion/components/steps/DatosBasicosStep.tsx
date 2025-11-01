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

  // Obtener fecha desde matrícula española (formato NNNN-XXX)
  const obtenerFechaDesdeMatricula = (mat: string) => {
    if (mat.length < 7) return ''
    
    // Extraer números y letras: 7188MBH -> 7188 y MBH
    const match = mat.match(/(\d{4})\s*-?\s*([A-Z]{3})/)
    if (!match) return ''
    
    const numeros = parseInt(match[1])
    const letras = match[2]
    
    // Las letras van de BBB a ZZZ (sin vocales A,E,I,O,U ni Q)
    // Alfabeto válido: BCDFGHJKLMNPRSTUVWXYZ (20 letras)
    const alfabeto = 'BCDFGHJKLMNPRSTUVWXYZ'
    
    // Convertir letras a número
    let valorLetras = 0
    for (let i = 0; i < 3; i++) {
      const letra = letras[i]
      const posicion = alfabeto.indexOf(letra)
      if (posicion === -1) return '' // Letra inválida
      valorLetras += posicion * Math.pow(20, 2 - i)
    }
    
    // Combinación total: números (0-9999) + letras (0-7999)
    // Total = números * 8000 + letras
    const matriculaTotal = numeros * 8000 + valorLetras
    
    // 0000-BBB = Sep 2000 (matricula 0)
    // Fecha base: Septiembre 2000
    const fechaBase = new Date(2000, 8, 1) // Mes 8 = Septiembre
    
    // Aproximadamente 80,000 matrículas por mes
    const matriculasPorMes = 80000
    const mesesDesdeInicio = Math.floor(matriculaTotal / matriculasPorMes)
    
    // Calcular fecha
    const fechaCalculada = new Date(fechaBase)
    fechaCalculada.setMonth(fechaCalculada.getMonth() + mesesDesdeInicio)
    
    const dia = 15
    const mes = (fechaCalculada.getMonth() + 1).toString().padStart(2, '0')
    const año = fechaCalculada.getFullYear()
    
    return `${dia}/${mes}/${año}`
  }

  const handleMatriculaChange = (value: string) => {
    const upperValue = value.toUpperCase()
    setMatricula(upperValue)
  }
  
  // Auto-scroll cuando se completa KM (para ver procedencia)
  useEffect(() => {
    if (kmActuales && parseInt(kmActuales) > 0) {
      setTimeout(() => {
        window.scrollTo({ 
          top: document.documentElement.scrollHeight, 
          behavior: 'smooth' 
        })
      }, 200)
    }
  }, [kmActuales])

  // Auto-scroll cuando se selecciona procedencia (aparece fecha)
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
      onComplete({
        matricula,
        kmActuales: parseInt(kmActuales),
        procedencia,
        fechaMatriculacion: fechaMatriculacion,
        fechaMatriculacionConfirmada: true,
      })
    }
  }

  const isValid = matricula && kmActuales && procedencia && fechaMatriculacion && fechaMatriculacion.length === 10

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
          {procedencia && (
            <motion.div
              ref={fechaRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Label htmlFor="fecha-matriculacion" className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Fecha de primera matriculación (DD/MM/AAAA) *
              </Label>
              <Input
                id="fecha-matriculacion"
                type="text"
                inputMode="numeric"
                placeholder="15/03/2018"
                value={fechaMatriculacion}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '') // Solo números
                  
                  // Formatear como DD/MM/AAAA
                  if (value.length >= 3) {
                    value = value.substring(0, 2) + '/' + value.substring(2)
                  }
                  if (value.length >= 6) {
                    value = value.substring(0, 5) + '/' + value.substring(5, 9)
                  }
                  
                  setFechaMatriculacion(value)
                }}
                className="h-12 text-center border-2 focus:border-purple-500 bg-white text-gray-900"
                maxLength={10}
              />
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



