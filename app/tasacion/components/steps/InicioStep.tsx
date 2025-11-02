'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Camera, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CarFrontDoubleIcon } from '@/components/ui/icons'

interface InicioStepProps {
  onComplete: (recaptchaToken: string) => void
}

export default function InicioStep({ onComplete }: InicioStepProps) {
  const [permisosAceptados, setPermisosAceptados] = useState(false)
  const [politicaAceptada, setPoliticaAceptada] = useState(false)

  // Scroll mínimo para ocultar barra de direcciones en móvil
  useEffect(() => {
    setTimeout(() => {
      window.scrollTo({ top: 1, behavior: 'auto' })
    }, 100)
  }, [])

  const handleCheckboxChange = (checked: boolean) => {
    setPermisosAceptados(checked)
    
    // Auto-scroll al final cuando se acepta
    if (checked) {
      setTimeout(() => {
        window.scrollTo({ 
          top: document.documentElement.scrollHeight, 
          behavior: 'smooth' 
        })
      }, 300)
    }
  }

  const handleContinue = () => {
    if (permisosAceptados && politicaAceptada) {
      // Generar un token simulado para mantener la compatibilidad
      onComplete('tasacion-token-' + Date.now())
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full"
      >
        {/* Logo/Título */}
        <div className="text-center mb-5">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-block"
          >
            <div className="relative">
              {/* Círculo de fondo con gradiente */}
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl mb-3">
                <CarFrontDoubleIcon className="w-10 h-10 text-white" />
              </div>
              {/* Efecto de brillo */}
              <div className="absolute -inset-2 top-0 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full opacity-30 blur-lg animate-pulse" />
            </div>
          </motion.div>

          <h1 className="text-2xl font-black text-gray-900 mb-1 tracking-wider">
            Portal de Tasaciones
          </h1>
          <p className="text-xs text-gray-600">
            Valora tu vehículo de forma rápida y segura
          </p>
        </div>

        {/* Tarjeta principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-5 mb-4 border border-gray-200"
        >
          {/* Permisos requeridos */}
          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900 mb-2">
              Permisos necesarios
            </h2>
            <p className="text-xs text-gray-600 mb-3">
              Para completar la tasación necesitamos tu consentimiento para:
            </p>

            <div className="space-y-2">
              {/* Cámara */}
              <div className="flex items-start gap-2 p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                <Camera className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-xs text-gray-900">Acceso a la cámara</h3>
                  <p className="text-xs text-gray-600">
                    Capturar fotografías del vehículo y documentación
                  </p>
                </div>
              </div>

              {/* Geolocalización */}
              <div className="flex items-start gap-2 p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                <MapPin className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-xs text-gray-900">Geolocalización</h3>
                  <p className="text-xs text-gray-600">
                    Certificar la ubicación donde se realiza la tasación
                  </p>
                </div>
              </div>
            </div>

            {/* Checkbox de aceptación */}
            <label className="flex items-start gap-2 mt-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-purple-200 cursor-pointer hover:border-purple-400 transition-all group">
              <div className="relative flex items-center justify-center pt-0.5">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={permisosAceptados}
                    onChange={(e) => handleCheckboxChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-6 h-6 rounded-md border-2 border-purple-400 bg-white cursor-pointer peer-checked:bg-gradient-to-br peer-checked:from-blue-500 peer-checked:to-purple-600 peer-checked:border-purple-600 peer-focus:ring-2 peer-focus:ring-purple-500 peer-focus:ring-offset-2 transition-all flex items-center justify-center">
                    {permisosAceptados && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-800 font-medium group-hover:text-purple-900 transition-colors flex-1">
                Acepto proporcionar acceso a la cámara y geolocalización para completar la tasación
              </span>
            </label>

            {/* Checkbox de política de privacidad */}
            <label className="flex items-start gap-2 mt-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-purple-200 cursor-pointer hover:border-purple-400 transition-all group">
              <div className="relative flex items-center justify-center pt-0.5">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={politicaAceptada}
                    onChange={(e) => setPoliticaAceptada(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-6 h-6 rounded-md border-2 border-purple-400 bg-white cursor-pointer peer-checked:bg-gradient-to-br peer-checked:from-blue-500 peer-checked:to-purple-600 peer-checked:border-purple-600 peer-focus:ring-2 peer-focus:ring-purple-500 peer-focus:ring-offset-2 transition-all flex items-center justify-center">
                    {politicaAceptada && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-800 font-medium group-hover:text-purple-900 transition-colors flex-1">
                He leído y acepto la{' '}
                <a 
                  href="/tasacion/politica-privacidad"
                  className="text-purple-600 hover:text-purple-800 underline font-semibold"
                  onClick={(e) => e.stopPropagation()}
                >
                  Política de Privacidad
                </a>
              </span>
            </label>
          </div>

          {/* Verificación de seguridad */}
          <div className="mb-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-900">Verificación de seguridad</p>
                  <p className="text-xs text-gray-600">Tu sesión está protegida</p>
                </div>
              </div>
            </div>
          </div>

          {/* Botón continuar */}
          <Button
            onClick={handleContinue}
            disabled={!permisosAceptados || !politicaAceptada}
            className="w-full h-11 text-sm font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
          >
            Comenzar Tasación
          </Button>
        </motion.div>

        {/* Aviso de privacidad */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-xs text-center text-gray-500 px-4"
        >
          Tus datos están protegidos y solo serán utilizados para la tasación de tu vehículo
        </motion.p>
      </motion.div>
    </div>
  )
}


