'use server'

import { createClient } from '@/utils/supabase/server'
import type { TasacionFormData } from '@/types/tasacion'

export async function getTasacionById(tasacionId: string) {
  try {
    const supabase = await createClient()

    // Obtener datos de la tasación
    const { data: tasacion, error: tasacionError } = await supabase
      .from('tasaciones')
      .select('*')
      .eq('id', tasacionId)
      .single()

    if (tasacionError) {
      console.error('Error al obtener tasación:', tasacionError)
      return { success: false, error: tasacionError.message }
    }

    // Obtener URLs de fotos
    const { data: fotos, error: fotosError } = await supabase
      .from('tasacion_fotos')
      .select('*')
      .eq('tasacion_id', tasacionId)

    if (fotosError) {
      console.error('Error al obtener fotos:', fotosError)
      // Continuamos sin fotos
    }

    // Reconstruir el objeto TasacionFormData con las URLs de fotos
    const tasacionData: TasacionFormData = {
      recaptchaToken: tasacion.recaptcha_token || '',
      permisosAceptados: true,
      matricula: tasacion.matricula,
      kmActuales: tasacion.km_actuales,
      procedencia: tasacion.procedencia,
      fechaMatriculacion: tasacion.fecha_matriculacion,
      fechaMatriculacionConfirmada: true,
      marca: tasacion.marca,
      modelo: tasacion.modelo,
      version: tasacion.version,
      combustible: tasacion.combustible,
      transmision: tasacion.transmision,
      segundaLlave: tasacion.segunda_llave,
      elementosDestacables: tasacion.elementos_destacables,
      danosExteriores: tasacion.danos_exteriores || [],
      danosInteriores: tasacion.danos_interiores || [],
      estadoMotor: tasacion.estado_motor,
      estadoDireccion: tasacion.estado_direccion,
      estadoFrenos: tasacion.estado_frenos,
      estadoCajaCambios: tasacion.estado_caja_cambios,
      estadoTransmision: tasacion.estado_transmision,
      estadoEmbrague: tasacion.estado_embrague,
      estadoGeneral: tasacion.estado_general,
      danoEstructural: tasacion.dano_estructural,
      danoEstructuralDetalle: tasacion.dano_estructural_detalle,
      testigosEncendidos: tasacion.testigos_encendidos || ['ninguno'],
      origenVehiculo: tasacion.origen_vehiculo,
      documentosKm: Array.isArray(tasacion.documentos_km) 
        ? tasacion.documentos_km 
        : (typeof tasacion.documentos_km === 'string' 
          ? (() => {
              try {
                const parsed = JSON.parse(tasacion.documentos_km)
                return Array.isArray(parsed) ? parsed : ['ninguno']
              } catch {
                return ['ninguno']
              }
            })()
          : ['ninguno']),
      comproNuevo: tasacion.compro_nuevo,
      color: tasacion.color,
      movilidad: tasacion.movilidad,
      servicioPublico: tasacion.servicio_publico,
      etiquetaMedioambiental: tasacion.etiqueta_medioambiental,
      itvEnVigor: tasacion.itv_en_vigor,
      proximaITV: tasacion.proxima_itv,
      observaciones: tasacion.observaciones,
      
      // Reconstruir fotos desde las URLs
      fotosVehiculo: {},
      fotosCuentakm: undefined,
      fotosInteriorDelantero: undefined,
      fotosInteriorTrasero: undefined,
      fotosDocumentacion: {},
      fotosOtras: [],
      
      metadata: tasacion.metadata || undefined
    }

    // Mapear fotos
    if (fotos && fotos.length > 0) {
      fotos.forEach(foto => {
        if (foto.categoria === 'vehiculo') {
          tasacionData.fotosVehiculo[foto.foto_key] = foto.url
        } else if (foto.categoria === 'cuentakm') {
          tasacionData.fotosCuentakm = foto.url
        } else if (foto.categoria === 'interior_delantero') {
          tasacionData.fotosInteriorDelantero = foto.url
        } else if (foto.categoria === 'interior_trasero') {
          tasacionData.fotosInteriorTrasero = foto.url
        } else if (foto.categoria === 'documentacion') {
          tasacionData.fotosDocumentacion[foto.foto_key] = foto.url
        } else if (foto.categoria === 'otras') {
          tasacionData.fotosOtras.push(foto.url)
        }
      })
    }

    return {
      success: true,
      data: tasacionData,
      metadata: tasacion.metadata
    }

  } catch (error) {
    console.error('Error en getTasacionById:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

