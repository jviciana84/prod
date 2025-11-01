'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Save, CheckCircle2, XCircle } from 'lucide-react'
import type { TasacionFormData } from '@/types/tasacion'

export default function TestGuardarPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const datosPrueba: TasacionFormData = {
    // Paso 1
    recaptchaToken: 'test-token',
    permisosAceptados: true,

    // Paso 2
    matricula: '7188MBH',
    kmActuales: 125000,
    procedencia: 'particular',
    fechaMatriculacion: '15/03/2016',
    fechaMatriculacionConfirmada: true,

    // Paso 3
    marca: 'SEAT',
    modelo: 'LEON',
    version: '1.6 TDI 105cv Reference',
    combustible: 'diesel',
    transmision: 'manual',
    segundaLlave: true,
    elementosDestacables: 'Navegador GPS, sensores aparcamiento',

    // Paso 4
    danosExteriores: [
      { parte: 'Parachoques delantero', tipo: 'arañazo', vista: 'frontal' },
      { parte: 'Puerta delantera izquierda', tipo: 'abolladura', vista: 'lateral_izquierda' }
    ],

    // Paso 5
    danosInteriores: [
      { parte: 'Asiento conductor', tipo: 'desgaste', vista: 'interior_salpicadero' }
    ],

    // Paso 6
    estadoMotor: 'bueno',
    estadoDireccion: 'bueno',
    estadoFrenos: 'regular',
    estadoCajaCambios: 'bueno',
    estadoTransmision: 'bueno',
    estadoEmbrague: 'regular',
    estadoGeneral: 'bueno',
    danoEstructural: false,
    testigosEncendidos: ['ninguno'],

    // Paso 7
    origenVehiculo: 'compra_nueva',
    documentosKm: ['libro_revisiones', 'itv'],
    comproNuevo: true,
    color: 'blanco',
    movilidad: 'particular',
    servicioPublico: 'no',
    etiquetaMedioambiental: 'eco',
    itvEnVigor: true,
    proximaITV: '15/03/2025',
    observaciones: 'Vehículo en buen estado general',

    // Paso 8
    fotosVehiculo: {},
    fotosDocumentacion: {},
    fotosOtras: [],

    // Metadata
    metadata: {
      userAgent: 'TEST',
      screenResolution: '1920x1080',
      timestamp: '2024-01-01T12:00:00.000Z',
      ip: '127.0.0.1'
    }
  }

  const handleTestSave = async () => {
    setLoading(true)
    setResult(null)

    try {
      const { saveTasacion } = await import('@/server-actions/saveTasacion')
      const response = await saveTasacion(datosPrueba, 'test-advisor')
      
      console.log('📦 Respuesta completa:', response)
      setResult(response)
    } catch (error) {
      console.error('💥 Error en la llamada:', error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        details: error instanceof Error ? error.stack : ''
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 pt-6 pb-24 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full mb-3 shadow-lg">
            <Save className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🧪 TEST - Guardar Tasación</h2>
          <p className="text-sm text-gray-600">Prueba directa de guardado en Supabase</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
          <h3 className="font-bold text-lg mb-4 text-gray-900">Datos de prueba:</h3>
          <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-96 text-gray-800">
            {JSON.stringify(datosPrueba, null, 2)}
          </pre>
        </div>

        <Button
          onClick={handleTestSave}
          disabled={loading}
          className="w-full h-14 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold shadow-lg disabled:opacity-50"
        >
          {loading ? 'Guardando...' : '💾 Guardar Tasación de Prueba'}
        </Button>

        {result && (
          <div className={`mt-6 rounded-2xl shadow-xl p-6 ${
            result.success ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              {result.success ? (
                <>
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                  <h3 className="font-bold text-xl text-green-900">✅ Guardado exitoso</h3>
                </>
              ) : (
                <>
                  <XCircle className="w-8 h-8 text-red-600" />
                  <h3 className="font-bold text-xl text-red-900">❌ Error al guardar</h3>
                </>
              )}
            </div>

            <div className="bg-white rounded-lg p-4">
              <pre className="text-xs overflow-auto max-h-96 text-gray-800">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>

            {result.success && (
              <p className="mt-4 text-sm font-bold text-green-800">
                ID de tasación: {result.tasacionId}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

