'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import type { TasacionFormData } from '@/types/tasacion'

export default function TestPDFCompletoPage() {
  const router = useRouter()

  const handleSimularTasacion = () => {
    // Datos completos de prueba con TODAS las fotos
    const datosPrueba: TasacionFormData = {
      recaptchaToken: 'test-token',
      permisosAceptados: true,
      matricula: '7188MBH',
      kmActuales: 125000,
      procedencia: 'particular',
      fechaMatriculacion: '15/03/2016',
      fechaMatriculacionConfirmada: true,
      marca: 'SEAT',
      modelo: 'LEON',
      version: '1.6 TDI 105cv Reference',
      combustible: 'diesel',
      transmision: 'manual',
      segundaLlave: true,
      elementosDestacables: 'Navegador GPS, sensores aparcamiento traseros, llantas de aleación 17"',
      
      danosExteriores: [
        { parte: 'Paragolpes delantero', tipo: 'pulir', vista: 'frontal' },
        { parte: 'Puerta delantera izquierda', tipo: 'golpe', vista: 'lateral_izquierda' },
        { parte: 'Faro izquierda', tipo: 'sustituir', vista: 'frontal' },
        { parte: 'Aleta trasera derecha', tipo: 'rayado', vista: 'laterial_derecha' },
      ],
      
      danosInteriores: [
        { parte: 'Asiento conductor', tipo: 'pulir', vista: 'interior_salpicadero' },
        { parte: 'Volante', tipo: 'rayado', vista: 'interior_salpicadero' },
        { parte: 'Tapizado puerta trasera', tipo: 'golpe', vista: 'interior_trasera_izquierda' },
      ],
      
      estadoMotor: 'bueno',
      estadoDireccion: 'bueno',
      estadoFrenos: 'regular',
      estadoCajaCambios: 'bueno',
      estadoTransmision: 'bueno',
      estadoEmbrague: 'regular',
      estadoGeneral: 'bueno',
      danoEstructural: false,
      testigosEncendidos: ['ninguno'],
      
      origenVehiculo: 'nacional',
      documentosKm: 'libro_revisiones',
      comproNuevo: true,
      color: 'blanco',
      movilidad: 'total',
      servicioPublico: 'ninguno',
      etiquetaMedioambiental: 'eco',
      itvEnVigor: true,
      proximaITV: '15/03/2025',
      observaciones: 'Vehículo en buen estado general. Mantenimiento al día. Único propietario. Revisiones en concesionario oficial.',
      
      // Fotos con imágenes PNG válidas (placeholder 1x1 pixel)
      fotosVehiculo: {
        frontal: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        lateralDelanteroIzq: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        lateralTraseroIzq: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        trasera: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        lateralTraseroDer: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        lateralDelanteroDer: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        interiorDelantero: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        interiorTrasero: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      },
      
      fotosCuentakm: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      
      fotosInteriorDelantero: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      
      fotosInteriorTrasero: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      
      fotosDocumentacion: {
        permisoCirculacionFrente: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        permisoCirculacionDorso: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        fichaTecnicaFrente: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        fichaTecnicaDorso: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      },
      
      fotosOtras: [
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      ],
      
      metadata: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        platform: 'Win32',
        idioma: 'es-ES',
        timestamp: new Date().toISOString(),
        ip: '192.168.1.100',
        geolocalizacion: {
          latitude: 40.4168,
          longitude: -3.7038,
          accuracy: 10
        }
      }
    }

    // Guardar en localStorage
    localStorage.setItem('lastTasacion', JSON.stringify(datosPrueba))
    localStorage.setItem('tasacionMetadata', JSON.stringify(datosPrueba.metadata))
    localStorage.setItem('lastTasacionId', 'test-' + Date.now())
    
    console.log('✅ Datos de prueba guardados en localStorage')
    
    // Redirigir a página completada
    router.push('/tasacion/completada')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full mb-6 shadow-lg">
          <FileText className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🧪 Simular Tasación Completa</h2>
        <p className="text-gray-600 mb-8">
          Esta página cargará datos de prueba completos (con fotos) y te llevará
          directamente a la página de descarga del PDF.
        </p>
        
        <Button
          onClick={handleSimularTasacion}
          className="w-full h-14 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold shadow-lg text-lg"
        >
          📄 Ir a Descargar PDF de Prueba
        </Button>
        
        <p className="text-xs text-gray-500 mt-6">
          Incluye: Datos completos + 13 fotos de ejemplo + Daños marcados
        </p>
      </div>
    </div>
  )
}

