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
        { parte: 'Parachoques delantero', tipo: 'arañazo', vista: 'frontal' },
        { parte: 'Puerta delantera izquierda', tipo: 'abolladura', vista: 'lateral_izquierda' },
        { parte: 'Faro delantero izquierdo', tipo: 'sustituir', vista: 'frontal' },
        { parte: 'Aleta trasera derecha', tipo: 'golpe', vista: 'laterial_derecha' },
      ],
      
      danosInteriores: [
        { parte: 'Asiento conductor', tipo: 'pulir', vista: 'interior_salpicadero' },
        { parte: 'Volante', tipo: 'rayado', vista: 'interior_salpicadero' },
        { parte: 'Tapizado puerta trasera', tipo: 'arañazo', vista: 'interior_trasera_izquierda' },
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
      
      // Fotos con imágenes de placeholder
      fotosVehiculo: {
        frontal: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzNiODJmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Rm90byBGcm9udGFsPC90ZXh0Pjwvc3ZnPg==',
        lateralDelanteroIzq: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2E4NTVmNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+TGF0ZXJhbCBJenF1aWVyZGE8L3RleHQ+PC9zdmc+',
        lateralTraseroIzq: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2VjNDg5OSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+TGF0ZXJhbCBUcmFzZXJvIEl6cTwvdGV4dD48L3N2Zz4=',
        trasera: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzEwYjk4MSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Rm90byBUcmFzZXJhPC90ZXh0Pjwvc3ZnPg==',
        lateralTraseroDer: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2Y1OWUwYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+TGF0ZXJhbCBEZXJlY2hvPC90ZXh0Pjwvc3ZnPg==',
        lateralDelanteroDer: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2VmNDQ0NCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+TGF0ZXJhbCBEZWwuIERlcjwvdGV4dD48L3N2Zz4=',
        interiorDelantero: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzA2YjZkNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW50ZXJpb3IgRGVsYW50ZXJvPC90ZXh0Pjwvc3ZnPg==',
        interiorTrasero: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzg0Y2MxNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW50ZXJpb3IgVHJhc2VybzwvdGV4dD48L3N2Zz4=',
      },
      
      fotosCuentakm: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzY0NzQ4YiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Q3VlbnRha2lsw7NtZXRyb3M8L3RleHQ+PC9zdmc+',
      
      fotosInteriorDelantero: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzE0YjhjcyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW50ZXJpb3IgRGVsYW50ZXJvPC90ZXh0Pjwvc3ZnPg==',
      
      fotosInteriorTrasero: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzIyYzU1ZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW50ZXJpb3IgVHJhc2VybzwvdGV4dD48L3N2Zz4=',
      
      fotosDocumentacion: {
        permisoCirculacionFrente: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzc5N2Q4MiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjIwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+UGVybWlzbyBGcmVudGU8L3RleHQ+PC9zdmc+',
        permisoCirculacionDorso: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzliOTc5ZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjIwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+UGVybWlzbyBEb3JzbzwvdGV4dD48L3N2Zz4=',
        fichaTecnicaFrente: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzU4NjVmMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjIwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+RmljaGEgVMOpY25pY2EgRnJlbnRlPC90ZXh0Pjwvc3ZnPg==',
        fichaTecnicaDorso: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzdjM2FlZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjIwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+RmljaGEgVMOpY25pY2EgRG9yc288L3RleHQ+PC9zdmc+',
      },
      
      fotosOtras: [
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2Y0M2Y1ZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Rm90byBBZGljaW9uYWwgMTwvdGV4dD48L3N2Zz4=',
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzM3Mzc2ZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Rm90byBBZGljaW9uYWwgMjwvdGV4dD48L3N2Zz4=',
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

