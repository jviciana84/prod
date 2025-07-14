import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

interface DocuwareEmailPayload {
  from: string
  to: string[]
  subject: string
  textBody: string
  htmlBody?: string
  date: string
  messageId: string
}

// Función para extraer datos del asunto del email
function extractDataFromSubject(subject: string): {
  licensePlate: string | null
  date: string | null
  requester: string | null
  source: string | null
} {
  // Formato esperado: "Nuevo pedido 8745MBS || 11/1/2024 || GABRIEL CAMPOS HORACIO || JORDIVI"
  const pattern = /Nuevo pedido\s+([A-Z0-9]+)\s*\|\|\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*\|\|\s*([^|]+)\s*\|\|\s*([^|]+)/i
  
  const match = subject.match(pattern)
  
  if (match) {
    return {
      licensePlate: match[1].trim(),
      date: match[2].trim(),
      requester: match[3].trim(),
      source: match[4].trim()
    }
  }
  
  return {
    licensePlate: null,
    date: null,
    requester: null,
    source: null
  }
}

// Función para extraer materiales del cuerpo del email
function extractMaterialsFromBody(body: string): Array<{
  type: string
  label: string
}> {
  const materials = []
  
  // Buscar solicitudes de clau (2ª llave)
  if (body.toLowerCase().includes('clau') || body.toLowerCase().includes('llave')) {
    materials.push({
      type: 'second_key',
      label: '2ª Llave'
    })
  }
  
  // Buscar solicitudes de fitxa tècnica (ficha técnica)
  if (body.toLowerCase().includes('fitxa') || body.toLowerCase().includes('ficha') || body.toLowerCase().includes('técnica')) {
    materials.push({
      type: 'technical_sheet',
      label: 'Ficha Técnica'
    })
  }
  
  // Si no se encontraron materiales específicos, asumir que se solicitan ambos
  if (materials.length === 0) {
    materials.push(
      { type: 'second_key', label: '2ª Llave' },
      { type: 'technical_sheet', label: 'Ficha Técnica' }
    )
  }
  
  return materials
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== PROCESADOR DOCUWARE INICIADO ===')
    
    const body: DocuwareEmailPayload = await request.json()
    console.log('📧 Email recibido:')
    console.log('   From:', body.from)
    console.log('   To:', body.to)
    console.log('   Subject:', body.subject)
    console.log('   MessageId:', body.messageId)
    console.log('   TextBody length:', body.textBody?.length || 0)
    
    // Verificar que el email es para material@controlvo.ovh
    const isForMaterial = body.to.some(email => 
      email.toLowerCase().includes('material@controlvo.ovh')
    )
    
    console.log('🎯 Verificación de destinatario:')
    console.log('   Emails to:', body.to)
    console.log('   Es para material@controlvo.ovh:', isForMaterial)
    
    if (!isForMaterial) {
      console.log('❌ Email no es para material@controlvo.ovh, ignorando')
      return NextResponse.json({
        success: false,
        message: 'Email no es para material@controlvo.ovh',
        inserted: false,
        reason: 'Destinatario incorrecto'
      })
    }
    
    // Extraer datos del asunto
    const subjectData = extractDataFromSubject(body.subject)
    console.log('📋 Datos extraídos del asunto:')
    console.log('   License Plate:', subjectData.licensePlate)
    console.log('   Date:', subjectData.date)
    console.log('   Requester:', subjectData.requester)
    console.log('   Source:', subjectData.source)
    
    if (!subjectData.licensePlate) {
      console.log('❌ No se pudo extraer matrícula del asunto')
      return NextResponse.json({
        success: false,
        message: 'No se pudo extraer matrícula del asunto',
        inserted: false,
        reason: 'Formato de asunto incorrecto'
      })
    }
    
    // Verificar variables de entorno
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('❌ Variables de entorno de Supabase no definidas')
      return NextResponse.json({
        success: false,
        message: 'Variables de entorno de Supabase no definidas',
        inserted: false,
        reason: 'Configuración faltante'
      })
    }
    
    console.log('✅ Variables de entorno verificadas')
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    console.log('✅ Cliente Supabase creado')
    
    // Verificar si ya existe una solicitud con este messageId
    if (body.messageId) {
      const { data: existingRequest, error: checkError } = await supabase
        .from('docuware_requests')
        .select('id')
        .eq('message_id', body.messageId)
        .single()
      
      if (existingRequest) {
        console.log('❌ Ya existe una solicitud con este messageId:', body.messageId)
        return NextResponse.json({
          success: false,
          message: 'Ya existe una solicitud con este messageId',
          inserted: false,
          reason: 'Duplicado'
        })
      }
    }
    
    console.log('✅ No hay duplicados, procediendo con inserción')
    
    // Convertir fecha
    const requestDate = subjectData.date ? new Date(subjectData.date) : new Date()
    
    // Reconocer materiales en el cuerpo del email
    const materials = extractMaterialsFromBody(body.textBody || '')
    console.log('🔍 Materiales reconocidos:', materials)
    
    // Si no se encontraron materiales, crear materiales por defecto
    if (materials.length === 0) {
      console.log('⚠️ No se encontraron materiales, creando por defecto')
      materials.push(
        { type: 'second_key', label: '2ª Llave' },
        { type: 'technical_sheet', label: 'Ficha Técnica' }
      )
    }
    
    console.log('📝 Insertando solicitud en base de datos...')
    
    // Insertar solicitud
    const { data: solicitudInsertada, error: errorSolicitud } = await supabase
      .from('docuware_requests')
      .insert({
        email_subject: body.subject,
        email_body: body.textBody,
        license_plate: subjectData.licensePlate || '',
        requester: subjectData.requester || '',
        request_date: requestDate,
        status: 'pending',
        observations: '', // Dejar vacío para que se rellene manualmente desde el modal
        message_id: body.messageId || null // Guardar el identificador único del email
      })
      .select()
      .single()
    
    if (errorSolicitud) {
      console.error('❌ Error insertando solicitud:', errorSolicitud)
      return NextResponse.json({
        success: false,
        message: 'Error insertando solicitud en base de datos',
        error: errorSolicitud.message,
        inserted: false,
        reason: 'Error en inserción de solicitud'
      })
    }
    
    console.log('✅ Solicitud insertada correctamente:', solicitudInsertada.id)
    
    // Insertar materiales
    const materiales = []
    for (const material of materials) {
      try {
        const { data: materialInsertado, error: errorMaterial } = await supabase
          .from('docuware_request_materials')
          .insert({
            docuware_request_id: solicitudInsertada.id,
            material_type: material.type,
            material_label: material.label,
            selected: false
          })
          .select()
          .single()
        
        if (errorMaterial) {
          console.error(`❌ Error insertando material ${material.label}:`, errorMaterial)
        } else {
          console.log(`✅ Material insertado: ${material.label}`)
          materiales.push(materialInsertado)
        }
      } catch (error) {
        console.error(`❌ Error procesando material ${material.label}:`, error)
      }
    }
    
    console.log('🎉 PROCESAMIENTO COMPLETADO EXITOSAMENTE')
    
    return NextResponse.json({
      success: true,
      message: `Solicitud procesada correctamente. ${materiales.length} materiales registrados.`,
      solicitud: solicitudInsertada,
      materiales: materiales,
      inserted: true
    })
    
  } catch (error: any) {
    console.error('❌ Error general en procesador Docuware:', error)
    return NextResponse.json({
      success: false,
      message: 'Error procesando email',
      error: error.message,
      inserted: false,
      reason: 'Error general'
    })
  }
} 