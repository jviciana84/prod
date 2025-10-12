'use client'

import { motion } from 'framer-motion'
import { Shield, Mail, FileText, Clock, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function PoliticaPrivacidadPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 mb-4 shadow-lg"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Política de Privacidad
          </h1>
          <p className="text-gray-600">
            Portal de Tasaciones - CVO
          </p>
        </div>

        {/* Contenido */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-6 border border-gray-200 space-y-8">
          {/* Introducción */}
          <section>
            <p className="text-sm text-gray-700 leading-relaxed">
              En cumplimiento del Reglamento General de Protección de Datos (RGPD UE 2016/679) y la LOPDGDD, 
              le informamos sobre el tratamiento de los datos que nos facilita a través de nuestro portal de tasación.
            </p>
          </section>

          {/* 1. Responsable */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">1</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  Responsable del Tratamiento
                </h2>
                <p className="text-sm text-gray-700 mb-3">
                  El responsable del tratamiento de sus datos personales es:
                </p>
                <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm">
                    <span className="font-semibold text-gray-900">Identidad:</span>{' '}
                    <span className="text-gray-700">CVO</span>
                  </p>
                  <p className="text-sm flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-gray-900">Correo Electrónico para el Ejercicio de Derechos:</span>{' '}
                    <a href="mailto:hola@controlvo.ovh" className="text-purple-600 hover:underline">
                      hola@controlvo.ovh
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Datos Tratados y Finalidad */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">2</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  Datos Tratados y Finalidad Exclusiva
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      Datos Tratados:
                    </h3>
                    <p className="text-sm text-gray-700 ml-6">
                      Recogemos su <strong>Nombre completo</strong> y los datos de <strong>identificación y 
                      documentación del vehículo</strong> (fotografías, matrícula, modelo, documentación, etc.).
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-purple-600" />
                      Finalidad del Tratamiento:
                    </h3>
                    <p className="text-sm text-gray-700 ml-6">
                      La única y exclusiva finalidad del tratamiento de estos datos es <strong>gestionar, 
                      realizar y enviarle la valoración o tasación solicitada</strong> de su vehículo.
                    </p>
                  </div>

                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Uso Exclusivo:
                    </h3>
                    <p className="text-sm text-gray-700">
                      CVO garantiza que sus datos y la información del vehículo <strong>solo se utilizarán 
                      para este fin de valoración y tasación</strong>. En ningún caso serán tratados para 
                      fines publicitarios, de marketing o cedidos a terceros sin su consentimiento previo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Base Legal */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">3</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  Base Legal (Legitimación)
                </h2>
                <p className="text-sm text-gray-700">
                  La base legal que nos permite tratar sus datos es el <strong>consentimiento</strong> que 
                  usted otorga al enviarnos el formulario de solicitud y al aceptar esta política, así como 
                  la <strong>ejecución de medidas precontractuales</strong> (la prestación del servicio de 
                  tasación solicitado).
                </p>
              </div>
            </div>
          </section>

          {/* 4. Plazo de Supresión */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">4</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Plazo de Supresión Automática de los Datos
                </h2>
                <p className="text-sm text-gray-700 mb-3">
                  Garantizamos la limitación en el plazo de conservación de sus datos.
                </p>
                
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-3">
                  <p className="text-sm text-gray-700">
                    Los datos personales y la documentación del vehículo serán <strong>borrados y eliminados 
                    automáticamente de forma segura</strong> de nuestros sistemas al cumplirse <strong>tres (3) 
                    meses</strong> desde la entrega del informe de tasación o la finalización de la gestión 
                    de la solicitud.
                  </p>
                </div>

                <p className="text-sm text-gray-700">
                  Posteriormente, los datos solo se conservarán bloqueados para el cumplimiento de posibles 
                  obligaciones legales (p. ej., fiscal o legal).
                </p>
              </div>
            </div>
          </section>

          {/* 5. Derechos */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">5</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  Sus Derechos de Privacidad (Derechos ARSUL)
                </h2>
                <p className="text-sm text-gray-700 mb-4">
                  Usted tiene derecho a <strong>Acceder</strong> a sus datos, solicitar su <strong>Rectificación</strong> si 
                  son inexactos, solicitar su <strong>Supresión</strong> (Cancelación), <strong>Oponerse</strong> al 
                  tratamiento, solicitar la <strong>Limitación</strong> del tratamiento y ejercer 
                  la <strong>Portabilidad</strong> de sus datos.
                </p>

                <div className="space-y-3">
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Ejercicio de Derechos:
                    </h3>
                    <p className="text-sm text-gray-700">
                      Puede ejercer estos derechos enviando una solicitud a la dirección de correo electrónico:{' '}
                      <a href="mailto:hola@controlvo.ovh" className="text-purple-600 hover:underline font-semibold">
                        hola@controlvo.ovh
                      </a>
                    </p>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Reclamación:
                    </h3>
                    <p className="text-sm text-gray-700">
                      Si considera que el tratamiento de datos personales no se ajusta a la normativa, tiene 
                      derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center space-y-4">
          <p className="text-xs text-gray-500">
            Última actualización: Enero 2025
          </p>
          <Button
            onClick={() => {
              // Si viene desde tasaciones, volver ahí
              if (document.referrer.includes('/tasacion/')) {
                window.close()
                // Si no se puede cerrar la pestaña, volver con router
                setTimeout(() => {
                  if (!window.closed) {
                    router.back()
                  }
                }, 100)
              } else {
                router.back()
              }
            }}
            variant="outline"
            className="border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50"
          >
            Volver
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

