'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Download, Home, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { generateAndDownloadPDF } from '../utils/generatePDF'
import type { TasacionFormData } from '@/types/tasacion'

export default function TasacionCompletadaPage() {
  const router = useRouter()
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [tasacionData, setTasacionData] = useState<TasacionFormData | null>(null)

  useEffect(() => {
    // Recuperar datos de localStorage
    const savedData = localStorage.getItem('lastTasacion')
    if (savedData) {
      try {
        setTasacionData(JSON.parse(savedData))
      } catch (error) {
        console.error('Error al recuperar datos de tasación:', error)
      }
    }
  }, [])

  const handleDescargarPDF = async () => {
    if (!tasacionData) {
      alert('No se encontraron datos de la tasación')
      return
    }

    setIsGeneratingPDF(true)
    
    try {
      // Recuperar metadata si existe
      const savedMetadata = localStorage.getItem('tasacionMetadata')
      const metadata = savedMetadata ? JSON.parse(savedMetadata) : undefined

      const result = await generateAndDownloadPDF({
        data: tasacionData,
        metadata,
        filename: `tasacion_${tasacionData.matricula || 'vehiculo'}_${Date.now()}.pdf`
      })

      if (!result.success) {
        alert('Error al generar el PDF. Por favor, inténtelo de nuevo.')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al generar el PDF')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleVolver = () => {
    // Limpiar localStorage
    localStorage.removeItem('lastTasacion')
    localStorage.removeItem('tasacionMetadata')
    localStorage.removeItem('lastTasacionId')
    
    // Volver a la página de inicio de tasaciones
    router.push('/tasacion/test-advisor')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-8 shadow-2xl">
              <CheckCircle2 className="w-24 h-24 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            ¡Tasación Completada!
          </h1>
          <p className="text-xl text-gray-700 mb-2">
            Tu solicitud ha sido registrada correctamente
          </p>
          <p className="text-gray-600">
            Nuestro equipo revisará la información y te contactará pronto
          </p>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-purple-100 mb-8"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Datos registrados</h3>
                <p className="text-gray-600 text-sm">
                  Toda la información del vehículo ha sido guardada con éxito
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Fotografías cargadas</h3>
                <p className="text-gray-600 text-sm">
                  Las imágenes del vehículo y documentación están disponibles
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Certificado generado</h3>
                <p className="text-gray-600 text-sm">
                  Se ha creado un certificado con tus datos de verificación
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Button
            onClick={handleDescargarPDF}
            disabled={isGeneratingPDF || !tasacionData}
            size="lg"
            className="flex-1 h-14 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generando PDF...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Descargar PDF
              </>
            )}
          </Button>
          <Button
            onClick={handleVolver}
            variant="outline"
            size="lg"
            className="flex-1 h-14 text-lg border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50"
          >
            <Home className="w-5 h-5 mr-2" />
            Volver al inicio
          </Button>
        </motion.div>

        {/* Additional Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-sm text-gray-500 mt-8"
        >
          Recibirás un correo electrónico con los detalles de tu tasación
        </motion.p>
      </motion.div>
    </div>
  )
}

