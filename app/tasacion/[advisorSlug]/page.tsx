'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProgressBar from '../components/ProgressBar'
import InicioStep from '../components/steps/InicioStep'
import DatosBasicosStep from '../components/steps/DatosBasicosStep'
import MarcaModeloStep from '../components/steps/MarcaModeloStep'
import EstadoEsteticoStep from '../components/steps/EstadoEsteticoStep'
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
  const totalSteps = 7

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

  const handleFinish = (finalData: any) => {
    console.log('handleFinish llamado con:', finalData)
    console.log('formData actual:', formData)
    
    const completedData: TasacionFormData = {
      ...formData,
      ...finalData,
    } as TasacionFormData

    console.log('Tasación completada:', completedData)
    
    try {
      // TODO: Aquí se enviará a Supabase cuando conectemos la BD
      // Guardar en localStorage temporalmente para acceso desde página de confirmación
      localStorage.setItem('lastTasacion', JSON.stringify(completedData))
      console.log('Datos guardados en localStorage')
      
      // Guardar metadata separadamente para el PDF
      if (completedData.metadata) {
        localStorage.setItem('tasacionMetadata', JSON.stringify(completedData.metadata))
        console.log('Metadata guardada en localStorage')
      }
      
      // Redirigir a la página de confirmación
      console.log('Redirigiendo a /tasacion/completada')
      router.push('/tasacion/completada')
    } catch (error) {
      console.error('Error al guardar o redirigir:', error)
    }
  }

  return (
    <>
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
        <EstadoMecanicoStep
          onComplete={handleStepComplete}
          onBack={handleBack}
        />
      )}

      {currentStep === 5 && (
        <DatosAdicionalesStep
          onComplete={handleStepComplete}
          onBack={handleBack}
        />
      )}

      {currentStep === 6 && (
        <FotografiasStep
          onComplete={handleFinish}
          onBack={handleBack}
        />
      )}
    </>
  )
}


