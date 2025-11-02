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
    const supabase = await createClient()

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

    console.log(`🔍 DEBUG: Total imágenes preparadas = ${imagesToUpload.length}`)
    if (imagesToUpload.length > 0) {
      console.log(`🔍 DEBUG: Categorías encontradas:`, imagesToUpload.map(i => `${i.category}:${i.key}`).join(', '))
    }

    // 2. Preparar datos para insert (filtrar undefined/null para campos opcionales)
    const datosInsert = {
      advisor_slug: advisorSlug,
      
      // Datos básicos
      matricula: data.matricula,
      kilometros: data.kmActuales,
      procedencia: data.procedencia,
      fecha_matriculacion: data.fechaMatriculacion,
      fecha_matriculacion_confirmada: data.fechaMatriculacionConfirmada || false,
      
      // Marca/Modelo/Versión
      marca: data.marca,
      modelo: data.modelo,
      version: data.version || null,
      combustible: data.combustible,
      transmision: data.transmision,
      segunda_llave: data.segundaLlave,
      elementos_destacables: data.elementosDestacables || null,
      
      // Daños
      danos_exteriores: data.danosExteriores || [],
      danos_interiores: data.danosInteriores || [],
      
      // Estado mecánico
      estado_motor: data.estadoMotor,
      estado_direccion: data.estadoDireccion,
      estado_frenos: data.estadoFrenos,
      estado_caja_cambios: data.estadoCajaCambios,
      estado_transmision: data.estadoTransmision,
      estado_embrague: data.estadoEmbrague,
      estado_general: data.estadoGeneral,
      dano_estructural: data.danoEstructural,
      dano_estructural_detalle: data.danoEstructuralDetalle || null,
      testigos_encendidos: data.testigosEncendidos || [],
      
      // Datos adicionales
      origen_vehiculo: data.origenVehiculo,
      documentos_km: data.documentosKm,
      comprado_nuevo: data.comproNuevo,
      color: data.color,
      movilidad_transporte: data.movilidad,
      servicio_publico: data.servicioPublico,
      etiqueta_medioambiental: data.etiquetaMedioambiental,
      itv_vigente: data.itvEnVigor,
      proxima_itv: data.proximaITV || null,
      observaciones: data.observaciones || null,
      
      // Metadata
      metadata: data.metadata || {}
    }

    // Filtrar valores undefined
    Object.keys(datosInsert).forEach(key => {
      if (datosInsert[key as keyof typeof datosInsert] === undefined) {
        delete datosInsert[key as keyof typeof datosInsert]
      }
    })

    console.log('📦 Datos a insertar:', JSON.stringify(datosInsert, null, 2))

    // Insertar tasación en Supabase (sin fotos)
    const { data: tasacion, error: tasacionError } = await supabase
      .from('tasaciones')
      .insert(datosInsert)
      .select()
      .single()

    if (tasacionError) {
      console.error('❌ Error al guardar tasación en BD:', tasacionError)
      console.error('📋 Código de error:', tasacionError.code)
      console.error('📋 Mensaje:', tasacionError.message)
      console.error('📋 Detalles:', tasacionError.details)
      console.error('📋 Hint:', tasacionError.hint)
      return {
        success: false,
        error: 'Error al guardar tasación en base de datos',
        details: `${tasacionError.code}: ${tasacionError.message} - ${tasacionError.details || ''} - ${tasacionError.hint || ''}`
      }
    }

    console.log('✅ Tasación guardada en Supabase:', tasacion.id)

    // 3. Subir imágenes a OVH vía API endpoint (arreglado)
    if (imagesToUpload.length > 0) {
      try {
        console.log(`📸 Preparando subida de ${imagesToUpload.length} imágenes a OVH...`)
        
        // Construir URL correctamente (localhost en desarrollo, dominio en producción)
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const apiUrl = `${baseUrl}/api/upload-tasacion-images`
        
        console.log(`📸 URL de subida: ${apiUrl}`)
        console.log(`📸 Número de imágenes a subir: ${imagesToUpload.length}`)
        console.log(`📸 Categorías: ${imagesToUpload.map(i => i.category).join(', ')}`)
        
        const uploadResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            images: imagesToUpload,
            tasacionId: tasacion.id
          })
        })

        console.log(`📸 Respuesta HTTP status: ${uploadResponse.status}`)

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text()
          console.error(`❌ Error HTTP ${uploadResponse.status}: ${errorText}`)
          throw new Error(`HTTP error! status: ${uploadResponse.status} - ${errorText}`)
        }

        const uploadResult = await uploadResponse.json()
        console.log('📸 Resultado de subida:', JSON.stringify(uploadResult, null, 2))

        if (uploadResult.success && uploadResult.uploadedUrls) {
          console.log(`✅ Subidas ${uploadResult.totalUploaded} imágenes a OVH`)
          console.log('📸 URLs recibidas:', Object.keys(uploadResult.uploadedUrls))

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

          console.log(`📸 Guardando ${fotosToInsert.length} URLs en tasacion_fotos...`)
          const { error: fotosError } = await supabase
            .from('tasacion_fotos')
            .insert(fotosToInsert)

          if (fotosError) {
            console.error('❌ Error al guardar URLs de fotos:', fotosError)
            console.error('📋 Datos que se intentaron insertar:', fotosToInsert)
            // No es crítico, continuamos
          } else {
            console.log(`✅ ${fotosToInsert.length} URLs de fotos guardadas en Supabase`)
          }
        } else {
          console.warn('⚠️ Algunas imágenes no se pudieron subir:', uploadResult.errors)
        }
      } catch (uploadError) {
        console.error('❌ Error al subir imágenes a OVH:', uploadError)
        console.error('📋 Detalles del error:', uploadError instanceof Error ? uploadError.message : uploadError)
        // No es crítico, la tasación ya está guardada
      }
    }

    return {
      success: true,
      tasacionId: tasacion.id,
      message: 'Tasación guardada correctamente'
    }
  } catch (error) {
    console.error('❌ Error general al guardar tasación:', error)
    console.error('📋 Datos recibidos:', JSON.stringify(data, null, 2))
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    const errorStack = error instanceof Error ? error.stack : ''
    
    return {
      success: false,
      error: `Error al procesar tasación: ${errorMessage}`,
      details: errorStack || 'Sin detalles adicionales'
    }
  }
}

