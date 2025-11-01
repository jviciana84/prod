'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProgressBar from '../components/ProgressBar'
import InicioStep from '../components/steps/InicioStep'
import DatosBasicosStep from '../components/steps/DatosBasicosStep'
import MarcaModeloStep from '../components/steps/MarcaModeloStep'
import EstadoEsteticoStep from '../components/steps/EstadoEsteticoStep'
import EstadoInteriorStep from '../components/steps/EstadoInteriorStep'
import EstadoMecanicoStep from '../components/steps/EstadoMecanicoStep'
import DatosAdicionalesStep from '../components/steps/DatosAdicionalesStep'
import FotografiasStep from '../components/steps/FotografiasStep'
import type { TasacionFormData, TasacionMetadata } from '@/types/tasacion'

export default function TasacionPage() {
  const params = useParams()
  const router = useRouter()
  const advisorSlug = params.advisorSlug as string
  
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Partial<TasacionFormData>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const totalSteps = 8 // Ahora son 8 pasos (añadido Estado Interior)

  useEffect(() => {
    // Capturar metadata del cliente
    const captureMetadata = async () => {
      const metadata: Partial<TasacionMetadata> = {
        dispositivo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          idioma: navigator.language,
        },
        timestamp: new Date().toISOString(),
      }

      // Capturar IP (esto requeriría un endpoint externo)
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json')
        const ipData = await ipResponse.json()
        metadata.ip = ipData.ip
      } catch (error) {
        console.error('Error capturando IP:', error)
        metadata.ip = 'unknown'
      }

      // Capturar geolocalización
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            metadata.geolocalizacion = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            }
          },
          (error) => {
            console.error('Error capturando geolocalización:', error)
          }
        )
      }

      setFormData(prev => ({ ...prev, metadata: metadata as TasacionMetadata }))
    }

    captureMetadata()
  }, [])

  const handleStepComplete = (stepData: any) => {
    setFormData(prev => ({ ...prev, ...stepData }))
    setCurrentStep(prev => prev + 1)
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1))
  }

  const handleFinish = async (finalData: any) => {
    console.log('handleFinish llamado con:', finalData)
    console.log('formData actual:', formData)
    
    setIsProcessing(true)
    
    const completedData: TasacionFormData = {
      ...formData,
      ...finalData,
    } as TasacionFormData

    console.log('Tasación completada:', completedData)
    
    try {
      // Guardar en localStorage como respaldo
      localStorage.setItem('lastTasacion', JSON.stringify(completedData))
      console.log('Datos guardados en localStorage')
      
      // Guardar metadata separadamente para el PDF
      if (completedData.metadata) {
        localStorage.setItem('tasacionMetadata', JSON.stringify(completedData.metadata))
        console.log('Metadata guardada en localStorage')
      }
      
      // Guardar en Supabase + Subir fotos a OVH
      console.log('🚀 Guardando en Supabase y subiendo fotos a OVH...')
      
      const { saveTasacion } = await import('@/server-actions/saveTasacion')
      const result = await saveTasacion(completedData, advisorSlug)
      
      if (result.success) {
        console.log('✅ Tasación guardada con ID:', result.tasacionId)
        localStorage.setItem('lastTasacionId', result.tasacionId)
      } else {
        console.error('❌ Error al guardar:', result.error)
        // Continuamos de todas formas, los datos están en localStorage
      }
      
      // Redirigir a la página de confirmación
      console.log('Redirigiendo a /tasacion/completada')
      router.push('/tasacion/completada')
    } catch (error) {
      console.error('Error al guardar o redirigir:', error)
      // En caso de error, al menos redirigimos con los datos en localStorage
      router.push('/tasacion/completada')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      {/* Overlay de carga */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Procesando tasación...</h3>
            <p className="text-sm text-gray-600 mb-1">📸 Subiendo fotografías</p>
            <p className="text-sm text-gray-600 mb-1">💾 Guardando datos</p>
            <p className="text-sm text-gray-600">📄 Generando informe</p>
            <p className="text-xs text-gray-500 mt-4">Por favor, espera...</p>
          </div>
        </div>
      )}

      {/* Barra de progreso siempre visible */}
      <ProgressBar currentStep={currentStep + 1} totalSteps={totalSteps} />

      {/* Pasos del formulario */}
      {currentStep === 0 && (
        <InicioStep
          onComplete={(recaptchaToken) => {
            handleStepComplete({
              recaptchaToken,
              permisosAceptados: true,
            })
          }}
        />
      )}

      {currentStep === 1 && (
        <DatosBasicosStep
          onComplete={handleStepComplete}
          onBack={handleBack}
        />
      )}

      {currentStep === 2 && (
        <MarcaModeloStep
          onComplete={handleStepComplete}
          onBack={handleBack}
        />
      )}

      {currentStep === 3 && (
        <EstadoEsteticoStep
          onComplete={(danos) => {
            handleStepComplete({ danosExteriores: danos })
          }}
          onBack={handleBack}
        />
      )}

      {currentStep === 4 && (
        <EstadoInteriorStep
          onComplete={(danos) => {
            handleStepComplete({ danosInteriores: danos })
          }}
          onBack={handleBack}
        />
      )}

      {currentStep === 5 && (
        <EstadoMecanicoStep
          onComplete={handleStepComplete}
          onBack={handleBack}
        />
      )}

      {currentStep === 6 && (
        <DatosAdicionalesStep
          onComplete={handleStepComplete}
          onBack={handleBack}
        />
      )}

      {currentStep === 7 && (
        <FotografiasStep
          onComplete={handleFinish}
          onBack={handleBack}
        />
      )}
    </>
  )
}


