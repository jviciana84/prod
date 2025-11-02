'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FileText, Calendar, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { 
  OrigenVehiculo, 
  DocumentosKm, 
  ColorVehiculo, 
  MovilidadTransporte,
  ServicioPublico,
  EtiquetaMedioambiental
} from '@/types/tasacion'

interface DatosAdicionalesStepProps {
  onComplete: (data: {
    origenVehiculo: OrigenVehiculo
    documentosKm: DocumentosKm[]
    comproNuevo: boolean
    color: ColorVehiculo
    movilidad: MovilidadTransporte
    servicioPublico: ServicioPublico
    etiquetaMedioambiental: EtiquetaMedioambiental
    itvEnVigor: boolean
    proximaITV?: string
    observaciones?: string
  }) => void
  onBack: () => void
}

export default function DatosAdicionalesStep({ onComplete, onBack }: DatosAdicionalesStepProps) {
  // Scroll al inicio
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])
  
  const [origenVehiculo, setOrigenVehiculo] = useState<OrigenVehiculo | null>(null)
  const [documentosKm, setDocumentosKm] = useState<DocumentosKm[]>([])
  const [comproNuevo, setComproNuevo] = useState<boolean | null>(null)
  const [color, setColor] = useState<ColorVehiculo | null>(null)
  const [movilidad, setMovilidad] = useState<MovilidadTransporte | null>(null)
  const [servicioPublico, setServicioPublico] = useState<ServicioPublico | null>(null)
  const [etiquetaMedioambiental, setEtiquetaMedioambiental] = useState<EtiquetaMedioambiental | null>(null)
  const [itvEnVigor, setItvEnVigor] = useState<boolean | null>(null)
  const [proximaITV, setProximaITV] = useState('')
  const [observaciones, setObservaciones] = useState('')
  
  // Refs para navegación
  const proximaITVRef = useRef<HTMLInputElement>(null)
  const observacionesRef = useRef<HTMLTextAreaElement>(null)
  
  // Auto-scroll cuando se marca ITV en vigor
  useEffect(() => {
    if (itvEnVigor !== null) {
      setTimeout(() => {
        window.scrollTo({ 
          top: document.documentElement.scrollHeight, 
          behavior: 'smooth' 
        })
      }, 300)
    }
  }, [itvEnVigor])

  const colores: { value: ColorVehiculo; label: string; hex: string }[] = [
    { value: 'blanco', label: 'Blanco', hex: '#FFFFFF' },
    { value: 'negro', label: 'Negro', hex: '#000000' },
    { value: 'gris', label: 'Gris', hex: '#808080' },
    { value: 'plata', label: 'Plata', hex: '#C0C0C0' },
    { value: 'azul', label: 'Azul', hex: '#0066CC' },
    { value: 'rojo', label: 'Rojo', hex: '#CC0000' },
    { value: 'verde', label: 'Verde', hex: '#00AA00' },
    { value: 'amarillo', label: 'Amarillo', hex: '#FFDD00' },
    { value: 'naranja', label: 'Naranja', hex: '#FF6600' },
    { value: 'marron', label: 'Marrón', hex: '#8B4513' },
    { value: 'beige', label: 'Beige', hex: '#F5F5DC' },
    { value: 'morado', label: 'Morado', hex: '#800080' },
    { value: 'burdeos', label: 'Burdeos', hex: '#800020' },
    { value: 'rosa', label: 'Rosa', hex: '#FFC0CB' },
    { value: 'dorado', label: 'Dorado', hex: '#FFD700' },
  ]

  const documentos: { value: DocumentosKm; label: string }[] = [
    { value: 'ninguno', label: 'Ninguno' },
    { value: 'facturas_taller', label: 'Facturas taller' },
    { value: 'itv', label: 'ITV' },
    { value: 'libro_revisiones', label: 'Libro revisiones' },
    { value: 'otros', label: 'Otros' },
  ]

  const etiquetas: { value: EtiquetaMedioambiental; label: string; color: string; textColor: string }[] = [
    { value: 'sin_etiqueta', label: 'Sin etiqueta', color: 'bg-gray-400', textColor: 'text-white' },
    { value: 'b', label: 'B', color: 'bg-yellow-400', textColor: 'text-black' },
    { value: 'c', label: 'C', color: 'bg-green-500', textColor: 'text-black' },
    { value: 'eco', label: 'ECO', color: 'bg-gradient-to-br from-green-500 to-blue-500', textColor: 'text-black' },
    { value: 'cero', label: '0', color: 'bg-blue-600', textColor: 'text-black' },
  ]

  const servicios: { value: ServicioPublico; label: string }[] = [
    { value: 'ninguno', label: 'Ninguno' },
    { value: 'ambulancia', label: 'Ambulancia' },
    { value: 'autoescuela', label: 'Autoescuela' },
    { value: 'maquinaria', label: 'Maquinaria' },
    { value: 'obra_agricola', label: 'Obra/Agrícola' },
    { value: 'policia', label: 'Policía' },
    { value: 'taxi', label: 'Taxi' },
    { value: 'alquiler_sc', label: 'Alquiler S/C' },
  ]

  const handleContinue = () => {
    if (origenVehiculo && documentosKm.length > 0 && comproNuevo !== null && color && movilidad && 
        servicioPublico && etiquetaMedioambiental && itvEnVigor !== null && proximaITV) {
      onComplete({
        origenVehiculo,
        documentosKm,
        comproNuevo,
        color,
        movilidad,
        servicioPublico,
        etiquetaMedioambiental,
        itvEnVigor,
        proximaITV,
        observaciones: observaciones || undefined,
      })
    }
  }

  const isValid = origenVehiculo && documentosKm.length > 0 && comproNuevo !== null && color && movilidad && 
    servicioPublico && etiquetaMedioambiental && itvEnVigor !== null && proximaITV && proximaITV.length === 10

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
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Datos del Vehículo</h2>
          <p className="text-sm text-gray-600">Información adicional importante</p>
        </div>

        <div className="space-y-4">
          {/* Procedencia */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6"
          >
            <Label className="text-sm font-semibold text-gray-700 mb-3 block">Procedencia</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setOrigenVehiculo('nacional')
                  // Auto-scroll al siguiente elemento
                  setTimeout(() => {
                    const nextElement = document.getElementById('documentos-km')
                    if (nextElement) {
                      nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }
                  }, 300)
                }}
                className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                  origenVehiculo === 'nacional'
                    ? 'border-purple-500 bg-gradient-to-br from-blue-50 to-purple-50 text-purple-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                Nacional
              </button>
              <button
                onClick={() => {
                  setOrigenVehiculo('importacion')
                  // Auto-scroll al siguiente elemento
                  setTimeout(() => {
                    const nextElement = document.getElementById('documentos-km')
                    if (nextElement) {
                      nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }
                  }, 300)
                }}
                className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                  origenVehiculo === 'importacion'
                    ? 'border-purple-500 bg-gradient-to-br from-blue-50 to-purple-50 text-purple-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                Importación
              </button>
            </div>
          </motion.div>

          {/* Documentos KM */}
          {origenVehiculo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6"
              id="documentos-km"
            >
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                Documentos que acreditan los KM
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {documentos.map((doc) => (
                  <button
                    key={doc.value}
                    onClick={() => {
                      // Toggle selección múltiple (excepto 'ninguno')
                      if (doc.value === 'ninguno') {
                        setDocumentosKm(['ninguno'])
                      } else {
                        setDocumentosKm(prev => {
                          // Quitar 'ninguno' si se selecciona otro
                          const withoutNinguno = prev.filter(d => d !== 'ninguno')
                          
                          // Toggle del documento actual
                          if (withoutNinguno.includes(doc.value)) {
                            const filtered = withoutNinguno.filter(d => d !== doc.value)
                            return filtered.length > 0 ? filtered : ['ninguno']
                          } else {
                            return [...withoutNinguno, doc.value]
                          }
                        })
                      }
                      
                      // Auto-scroll al siguiente elemento
                      setTimeout(() => {
                        const nextElement = document.getElementById('compro-nuevo')
                        if (nextElement) {
                          nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        }
                      }, 300)
                    }}
                    className={`p-3 rounded-lg border-2 transition-all text-sm font-semibold ${
                      documentosKm.includes(doc.value)
                        ? 'border-purple-500 bg-gradient-to-br from-blue-50 to-purple-50 text-purple-900'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {doc.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Comprado nuevo */}
          {documentosKm.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6"
              id="compro-nuevo"
            >
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                ¿Compró nuevo el vehículo?
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setComproNuevo(true)
                    // Auto-scroll al siguiente elemento
                    setTimeout(() => {
                      const nextElement = document.getElementById('color-vehiculo')
                      if (nextElement) {
                        nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }
                    }, 300)
                  }}
                  className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                    comproNuevo === true
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  ✓ Sí
                </button>
                <button
                  onClick={() => {
                    setComproNuevo(false)
                    // Auto-scroll al siguiente elemento
                    setTimeout(() => {
                      const nextElement = document.getElementById('color-vehiculo')
                      if (nextElement) {
                        nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }
                    }, 300)
                  }}
                  className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                    comproNuevo === false
                      ? 'border-gray-500 bg-gray-50 text-gray-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  ✗ No
                </button>
              </div>
            </motion.div>
          )}

          {/* Color */}
          {comproNuevo !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6"
              id="color-vehiculo"
            >
              <Label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Color del vehículo
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {colores.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => {
                      setColor(c.value)
                      // Auto-scroll al siguiente elemento
                      setTimeout(() => {
                        const nextElement = document.getElementById('movilidad-transporte')
                        if (nextElement) {
                          nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        }
                      }, 300)
                    }}
                    className={`p-3 rounded-lg border-2 transition-all text-sm font-semibold flex items-center gap-2 ${
                      color === c.value
                        ? 'border-purple-500 bg-gradient-to-br from-blue-50 to-purple-50 text-purple-900'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full border-2 border-gray-400"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-xs">{c.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Movilidad */}
          {color && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6"
              id="movilidad-transporte"
            >
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                Movilidad de transporte
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setMovilidad('total')
                    // Auto-scroll al siguiente elemento
                    setTimeout(() => {
                      const nextElement = document.getElementById('servicio-publico')
                      if (nextElement) {
                        nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }
                    }, 300)
                  }}
                  className={`p-3 rounded-lg border-2 transition-all text-sm font-semibold ${
                    movilidad === 'total'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  Total
                </button>
                <button
                  onClick={() => {
                    setMovilidad('solo_rueda')
                    // Auto-scroll al siguiente elemento
                    setTimeout(() => {
                      const nextElement = document.getElementById('servicio-publico')
                      if (nextElement) {
                        nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }
                    }, 300)
                  }}
                  className={`p-3 rounded-lg border-2 transition-all text-sm font-semibold ${
                    movilidad === 'solo_rueda'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  Sólo rueda
                </button>
                <button
                  onClick={() => {
                    setMovilidad('no_rueda')
                    // Auto-scroll al siguiente elemento
                    setTimeout(() => {
                      const nextElement = document.getElementById('servicio-publico')
                      if (nextElement) {
                        nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }
                    }, 300)
                  }}
                  className={`p-3 rounded-lg border-2 transition-all text-sm font-semibold ${
                    movilidad === 'no_rueda'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  No rueda
                </button>
              </div>
            </motion.div>
          )}

          {/* Servicio público */}
          {movilidad && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6"
              id="servicio-publico"
            >
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                Servicio público
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {servicios.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => {
                      setServicioPublico(s.value)
                      // Auto-scroll al siguiente elemento
                      setTimeout(() => {
                        const nextElement = document.getElementById('etiqueta-medioambiental')
                        if (nextElement) {
                          nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        }
                      }, 300)
                    }}
                    className={`p-3 rounded-lg border-2 transition-all text-sm font-semibold ${
                      servicioPublico === s.value
                        ? 'border-purple-500 bg-gradient-to-br from-blue-50 to-purple-50 text-purple-900'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Etiqueta medioambiental */}
          {servicioPublico && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6"
              id="etiqueta-medioambiental"
            >
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                Etiqueta medioambiental
              </Label>
              <div className="grid grid-cols-2 gap-4">
                {etiquetas.map((e) => (
                  <button
                    key={e.value}
                    onClick={() => {
                      setEtiquetaMedioambiental(e.value)
                      // Auto-scroll al siguiente elemento
                      setTimeout(() => {
                        const nextElement = document.getElementById('itv-vigor')
                        if (nextElement) {
                          nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        }
                      }, 300)
                    }}
                    className={`relative w-full h-20 rounded-full border-2 transition-all ${
                      etiquetaMedioambiental === e.value
                        ? 'border-gray-800 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-gray-300 shadow-sm'
                    }`}
                  >
                    {/* Etiqueta B (Amarilla) */}
                    {e.value === 'b' && (
                      <div className={`w-full h-full ${e.color} rounded-full flex items-center justify-center relative overflow-hidden`}>
                        <div className="text-4xl font-bold text-black">B</div>
                        <div className="absolute bottom-1 right-1 text-xs text-black font-semibold">DGT</div>
                      </div>
                    )}
                    
                    {/* Etiqueta C (Verde) */}
                    {e.value === 'c' && (
                      <div className={`w-full h-full ${e.color} rounded-full flex items-center justify-center relative overflow-hidden`}>
                        <div className="text-4xl font-bold text-black">C</div>
                        <div className="absolute bottom-1 right-1 text-xs text-black font-semibold">DGT</div>
                      </div>
                    )}
                    
                    {/* Etiqueta ECO (Mitad izquierda verde, mitad derecha azul) */}
                    {e.value === 'eco' && (
                      <div className="w-full h-full rounded-full relative overflow-hidden">
                        <div className="absolute inset-0 flex">
                          <div className="w-1/2 h-full bg-green-500"></div>
                          <div className="w-1/2 h-full bg-blue-500"></div>
                        </div>
                        <div className="relative z-10 h-full flex items-center justify-center">
                          <div className="text-2xl font-bold text-black">ECO</div>
                        </div>
                        <div className="absolute bottom-1 right-1 text-xs text-black font-semibold z-10">DGT</div>
                      </div>
                    )}
                    
                    {/* Etiqueta 0 Emisiones (Azul) */}
                    {e.value === 'cero' && (
                      <div className={`w-full h-full ${e.color} rounded-full flex items-center justify-center relative overflow-hidden`}>
                        <div className="text-3xl font-bold text-black">0</div>
                        <div className="absolute bottom-1 right-1 text-xs text-black font-semibold">DGT</div>
                      </div>
                    )}
                    
                    {/* Sin etiqueta */}
                    {e.value === 'sin_etiqueta' && (
                      <div className={`w-full h-full ${e.color} rounded-full flex items-center justify-center`}>
                        <div className="text-lg font-semibold text-white">Sin etiqueta</div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ITV */}
          {etiquetaMedioambiental && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6"
              id="itv-vigor"
            >
              <Label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                ITV en vigor
              </Label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => {
                    setItvEnVigor(true)
                    // Focus al campo de fecha ITV
                    setTimeout(() => {
                      proximaITVRef.current?.focus()
                    }, 300)
                  }}
                  className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                    itvEnVigor === true
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  ✓ Sí
                </button>
                <button
                  onClick={() => {
                    setItvEnVigor(false)
                    // Focus al campo de fecha ITV
                    setTimeout(() => {
                      proximaITVRef.current?.focus()
                    }, 300)
                  }}
                  className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                    itvEnVigor === false
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  ✗ No
                </button>
              </div>

              {/* Campo de próxima ITV siempre visible */}
              <div id="proxima-itv-field">
                <Label htmlFor="proxima-itv" className="text-sm font-medium text-gray-700 mb-2 block">
                  Próxima ITV (DD/MM/AAAA) *
                </Label>
                <form onSubmit={(e) => {
                  e.preventDefault()
                  if (proximaITV.length === 10) {
                    observacionesRef.current?.focus()
                    setTimeout(() => {
                      observacionesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }, 100)
                  }
                }}>
                  <Input
                    ref={proximaITVRef}
                    id="proxima-itv"
                    type="text"
                    inputMode="numeric"
                    enterKeyHint="next"
                    placeholder="15/06/2025"
                    value={proximaITV}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '') // Solo números
                      
                      // Formatear como DD/MM/AAAA
                      if (value.length >= 3) {
                        value = value.substring(0, 2) + '/' + value.substring(2)
                      }
                      if (value.length >= 6) {
                        value = value.substring(0, 5) + '/' + value.substring(5, 9)
                      }
                      
                      setProximaITV(value)
                    }}
                    className="h-12 text-center bg-white text-gray-900"
                    maxLength={10}
                  />
                </form>
              </div>
            </motion.div>
          )}

          {/* Observaciones */}
          {itvEnVigor !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6"
            >
              <Label htmlFor="observaciones" className="text-sm font-semibold text-gray-700 mb-2 block">
                Observaciones (opcional)
              </Label>
              <Textarea
                ref={observacionesRef}
                id="observaciones"
                placeholder="Cualquier información adicional relevante..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="min-h-24 resize-none bg-white text-gray-900"
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


