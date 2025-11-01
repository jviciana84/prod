'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { TasacionFormData } from '@/types/tasacion'

export default function TestFlujoCompletoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleTest = async () => {
    setLoading(true)
    
    try {
      // Datos de prueba completos
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
        segundaLlave: false, // Para ver el color rojo
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
        
        testigosEncendidos: ['abs', 'aceite'], // Para ver testigos en página 1
        
        origenVehiculo: 'importacion', // Para ver ámbar
        documentosKm: ['libro_revisiones', 'facturas_taller', 'itv'], // Múltiples documentos
        comproNuevo: true,
        color: 'blanco',
        movilidad: 'total',
        servicioPublico: 'taxi', // Para ver ámbar
        etiquetaMedioambiental: 'eco',
        itvEnVigor: true,
        proximaITV: '15/03/2025',
        observaciones: 'Vehículo en buen estado general. Mantenimiento al día. Único propietario. Revisiones en concesionario oficial.',
        
        // Fotos de prueba con URLs de placeholder
        fotosVehiculo: {
          frontal: 'https://placehold.co/800x600/3b82f6/white?text=Frontal',
          lateralDelanteroIzq: 'https://placehold.co/800x600/a855f7/white?text=Lateral+Izq',
          lateralTraseroIzq: 'https://placehold.co/800x600/ec4899/white?text=Trasero+Izq',
          trasera: 'https://placehold.co/800x600/10b981/white?text=Trasera',
          lateralTraseroDer: 'https://placehold.co/800x600/f59e0b/white?text=Trasero+Der',
          lateralDelanteroDer: 'https://placehold.co/800x600/ef4444/white?text=Delantero+Der',
          interiorDelantero: 'https://placehold.co/800x600/06b6d4/white?text=Interior+Del',
          interiorTrasero: 'https://placehold.co/800x600/84cc16/white?text=Interior+Tras',
        },
        fotosCuentakm: 'https://placehold.co/800x600/64748b/white?text=Cuentakilometros',
        fotosInteriorDelantero: 'https://placehold.co/800x600/14b8a6/white?text=Interior+Delantero',
        fotosInteriorTrasero: 'https://placehold.co/800x600/22c55e/white?text=Interior+Trasero',
        fotosDocumentacion: {
          permisoCirculacionFrente: 'https://placehold.co/800x600/78716c/white?text=Permiso+Frente',
          permisoCirculacionDorso: 'https://placehold.co/800x600/9ca3af/white?text=Permiso+Dorso',
          fichaTecnicaFrente: 'https://placehold.co/800x600/5865f2/white?text=Ficha+Frente',
          fichaTecnicaDorso: 'https://placehold.co/800x600/7c3aed/white?text=Ficha+Dorso',
        },
        fotosOtras: [
          'https://placehold.co/800x600/f43f5e/white?text=Foto+Adicional+1',
          'https://placehold.co/800x600/374151/white?text=Foto+Adicional+2',
        ],
        
        metadata: {
          dispositivo: {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            platform: 'Win32',
            idioma: 'es-ES',
          },
          timestamp: new Date().toISOString(),
          ip: '81.60.143.49',
          geolocalizacion: {
            latitude: 41.558470,
            longitude: 1.982249,
            accuracy: 10
          }
        }
      }

      console.log('📤 Guardando tasación de prueba en Supabase...')
      
      // Guardar fotos temporalmente
      const fotosData = {
        fotosVehiculo: datosPrueba.fotosVehiculo,
        fotosCuentakm: datosPrueba.fotosCuentakm,
        fotosInteriorDelantero: datosPrueba.fotosInteriorDelantero,
        fotosInteriorTrasero: datosPrueba.fotosInteriorTrasero,
        fotosDocumentacion: datosPrueba.fotosDocumentacion,
        fotosOtras: datosPrueba.fotosOtras,
      }
      
      // Limpiar fotos para saveTasacion (no acepta URLs, solo base64)
      const datosSinFotos = {
        ...datosPrueba,
        fotosVehiculo: {},
        fotosCuentakm: undefined,
        fotosInteriorDelantero: undefined,
        fotosInteriorTrasero: undefined,
        fotosDocumentacion: {},
        fotosOtras: [],
      }
      
      // Guardar en Supabase
      const { saveTasacion } = await import('@/server-actions/saveTasacion')
      const result = await saveTasacion(datosSinFotos, 'test-advisor')
      
      if (result.success) {
        console.log('✅ Tasación guardada con ID:', result.tasacionId)
        
        // Ahora insertar las URLs de fotos directamente
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()
        
        const fotosToInsert = []
        
        // Fotos del vehículo
        if (fotosData.fotosVehiculo) {
          Object.entries(fotosData.fotosVehiculo).forEach(([key, url]) => {
            if (url) {
              fotosToInsert.push({
                tasacion_id: result.tasacionId,
                categoria: 'vehiculo',
                foto_key: key,
                url: url as string,
                sftp_path: `${result.tasacionId}/vehiculo/${key}`,
                mime_type: 'image/jpeg'
              })
            }
          })
        }
        
        // Cuentakm
        if (fotosData.fotosCuentakm) {
          fotosToInsert.push({
            tasacion_id: result.tasacionId,
            categoria: 'cuentakm',
            foto_key: 'cuentakm',
            url: fotosData.fotosCuentakm,
            sftp_path: `${result.tasacionId}/cuentakm/cuentakm`,
            mime_type: 'image/jpeg'
          })
        }
        
        // Interior delantero
        if (fotosData.fotosInteriorDelantero) {
          fotosToInsert.push({
            tasacion_id: result.tasacionId,
            categoria: 'interior_delantero',
            foto_key: 'interior_delantero',
            url: fotosData.fotosInteriorDelantero,
            sftp_path: `${result.tasacionId}/interior_delantero/interior_delantero`,
            mime_type: 'image/jpeg'
          })
        }
        
        // Interior trasero
        if (fotosData.fotosInteriorTrasero) {
          fotosToInsert.push({
            tasacion_id: result.tasacionId,
            categoria: 'interior_trasero',
            foto_key: 'interior_trasero',
            url: fotosData.fotosInteriorTrasero,
            sftp_path: `${result.tasacionId}/interior_trasero/interior_trasero`,
            mime_type: 'image/jpeg'
          })
        }
        
        // Documentación
        if (fotosData.fotosDocumentacion) {
          Object.entries(fotosData.fotosDocumentacion).forEach(([key, url]) => {
            if (url) {
              fotosToInsert.push({
                tasacion_id: result.tasacionId,
                categoria: 'documentacion',
                foto_key: key,
                url: url as string,
                sftp_path: `${result.tasacionId}/documentacion/${key}`,
                mime_type: 'image/jpeg'
              })
            }
          })
        }
        
        // Otras
        if (fotosData.fotosOtras && fotosData.fotosOtras.length > 0) {
          fotosData.fotosOtras.forEach((url, index) => {
            fotosToInsert.push({
              tasacion_id: result.tasacionId,
              categoria: 'otras',
              foto_key: `otra_${index + 1}`,
              url,
              sftp_path: `${result.tasacionId}/otras/otra_${index + 1}`,
              mime_type: 'image/jpeg'
            })
          })
        }
        
        if (fotosToInsert.length > 0) {
          const { error: fotosError } = await supabase
            .from('tasacion_fotos')
            .insert(fotosToInsert)
          
          if (fotosError) {
            console.error('Error al insertar fotos:', fotosError)
          } else {
            console.log(`✅ ${fotosToInsert.length} fotos insertadas`)
          }
        }
        
        // Guardar ID en localStorage
        localStorage.setItem('lastTasacionId', result.tasacionId)
        
        // Guardar metadata
        localStorage.setItem('tasacionMetadata', JSON.stringify(datosPrueba.metadata))
        
        console.log('✅ Redirigiendo a página completada...')
        router.push('/tasacion/completada')
      } else {
        alert('Error al guardar: ' + result.error)
        console.error(result)
      }
      
    } catch (error) {
      console.error('Error:', error)
      alert('Error: ' + error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Test Flujo Completo Tasación
        </h1>
        <p className="text-gray-600 mb-6">
          Este test guardará datos de prueba en Supabase y te redirigirá a la página completada 
          para verificar que el PDF se genera correctamente con:
        </p>
        <ul className="text-left text-sm text-gray-700 mb-8 space-y-2">
          <li>✅ Múltiples documentos KM</li>
          <li>✅ Testigos encendidos en página 1</li>
          <li>✅ Colores de alerta (rojo/ámbar)</li>
          <li>✅ Daños con SVG coloreados</li>
          <li>✅ Certificado completo</li>
          <li>✅ Scroll automático (2s)</li>
          <li>✅ ID de tasación real</li>
        </ul>
        
        <Button 
          onClick={handleTest}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? 'Guardando en Supabase...' : 'Ejecutar Test Completo'}
        </Button>
      </div>
    </div>
  )
}

