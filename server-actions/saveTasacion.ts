'use server'

import { createClient } from '@/utils/supabase/server'
import type { TasacionFormData } from '@/types/tasacion'

interface ImageToUpload {
  key: string
  data: string
  category: string
}

export async function saveTasacion(data: TasacionFormData, advisorSlug: string) {
  try {
    const supabase = createClient()

    // 1. Preparar imágenes para subir
    const imagesToUpload: ImageToUpload[] = []

    // Fotos del vehículo
    if (data.fotosVehiculo) {
      Object.entries(data.fotosVehiculo).forEach(([key, value]) => {
        if (value) {
          imagesToUpload.push({
            key,
            data: value,
            category: 'vehiculo'
          })
        }
      })
    }

    // Cuentakm
    if (data.fotosCuentakm) {
      imagesToUpload.push({
        key: 'cuentakm',
        data: data.fotosCuentakm,
        category: 'cuentakm'
      })
    }

    // Interior delantero
    if (data.fotosInteriorDelantero) {
      imagesToUpload.push({
        key: 'interior_delantero',
        data: data.fotosInteriorDelantero,
        category: 'interior_delantero'
      })
    }

    // Interior trasero
    if (data.fotosInteriorTrasero) {
      imagesToUpload.push({
        key: 'interior_trasero',
        data: data.fotosInteriorTrasero,
        category: 'interior_trasero'
      })
    }

    // Documentación
    if (data.fotosDocumentacion) {
      Object.entries(data.fotosDocumentacion).forEach(([key, value]) => {
        if (value) {
          imagesToUpload.push({
            key,
            data: value,
            category: 'documentacion'
          })
        }
      })
    }

    // Otras fotos
    if (data.fotosOtras && data.fotosOtras.length > 0) {
      data.fotosOtras.forEach((foto, index) => {
        imagesToUpload.push({
          key: `otra_${index + 1}`,
          data: foto,
          category: 'otras'
        })
      })
    }

    // 2. Insertar tasación en Supabase (sin fotos)
    const { data: tasacion, error: tasacionError } = await supabase
      .from('tasaciones')
      .insert({
        advisor_slug: advisorSlug,
        matricula: data.matricula,
        kilometros: data.kilometros,
        procedencia: data.procedencia,
        fecha_matriculacion: data.fechaMatriculacion,
        marca: data.marca,
        modelo: data.modelo,
        version: data.version,
        combustible: data.combustible,
        transmision: data.transmision,
        segunda_llave: data.segundaLlave,
        elementos_destacables: data.elementosDestacables,
        estado_motor: data.estadoMotor,
        estado_direccion: data.estadoDireccion,
        estado_frenos: data.estadoFrenos,
        estado_caja_cambios: data.estadoCajaCambios,
        estado_transmision: data.estadoTransmision,
        estado_embrague: data.estadoEmbrague,
        estado_general: data.estadoGeneral,
        dano_estructural: data.danoEstructural,
        dano_estructural_detalle: data.danoEstructuralDetalle,
        testigos_encendidos: data.testigosEncendidos || [],
        origen_vehiculo: data.origenVehiculo,
        documentos_km: data.documentosKm,
        comprado_nuevo: data.compradoNuevo,
        color: data.color,
        movilidad_transporte: data.movilidadTransporte,
        servicio_publico: data.servicioPublico,
        etiqueta_medioambiental: data.etiquetaMedioambiental,
        itv_vigente: data.itvVigente,
        proxima_itv: data.proximaITV,
        observaciones: data.observaciones,
        danos_exteriores: data.danosExteriores || [],
        metadata: data.metadata || {}
      })
      .select()
      .single()

    if (tasacionError) {
      console.error('Error al guardar tasación:', tasacionError)
      return {
        success: false,
        error: 'Error al guardar tasación en base de datos',
        details: tasacionError.message
      }
    }

    console.log('✅ Tasación guardada en Supabase:', tasacion.id)

    // 3. Subir imágenes a Supabase Storage
    if (imagesToUpload.length > 0) {
      try {
        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/upload-tasacion-images`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            images: imagesToUpload,
            tasacionId: tasacion.id
          })
        })

        const uploadResult = await uploadResponse.json()

        if (uploadResult.success && uploadResult.uploadedUrls) {
          console.log(`✅ Subidas ${uploadResult.totalUploaded} imágenes a Supabase Storage`)

          // 4. Guardar URLs de fotos en tabla tasacion_fotos
          const fotosToInsert = Object.entries(uploadResult.uploadedUrls).map(([key, url]) => {
            const image = imagesToUpload.find(img => img.key === key)
            return {
              tasacion_id: tasacion.id,
              categoria: image?.category || 'otras',
              foto_key: key,
              url: url as string,
              sftp_path: `${tasacion.id}/${image?.category}/${key}`,
              mime_type: 'image/jpeg'
            }
          })

          const { error: fotosError } = await supabase
            .from('tasacion_fotos')
            .insert(fotosToInsert)

          if (fotosError) {
            console.error('Error al guardar URLs de fotos:', fotosError)
            // No es crítico, continuamos
          } else {
            console.log(`✅ URLs de fotos guardadas en Supabase`)
          }
        } else {
          console.warn('⚠️ Algunas imágenes no se pudieron subir:', uploadResult.errors)
        }
      } catch (uploadError) {
        console.error('❌ Error al subir imágenes:', uploadError)
        // No es crítico, la tasación ya está guardada
      }
    }

    return {
      success: true,
      tasacionId: tasacion.id,
      message: 'Tasación guardada correctamente'
    }
  } catch (error) {
    console.error('Error general al guardar tasación:', error)
    return {
      success: false,
      error: 'Error al procesar tasación',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

