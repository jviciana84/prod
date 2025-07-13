import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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
    console.log("=== PROCESADOR DE EMAILS DOCUWARE ===")
    
    const body: DocuwareEmailPayload = await request.json()
    
    // Verificar que el email es para material@controlvo.ovh
    if (!body.to.includes('material@controlvo.ovh')) {
      console.log("Email no es para material@controlvo.ovh, ignorando")
      return NextResponse.json({ success: true, message: "Email ignorado - no es para material@controlvo.ovh" })
    }
    
    console.log("Procesando email de Docuware:", {
      from: body.from,
      subject: body.subject,
      date: body.date
    })
    
    const supabase = createClient()
    
    // Extraer datos del asunto
    const subjectData = extractDataFromSubject(body.subject)
    
    if (!subjectData.licensePlate || !subjectData.date || !subjectData.requester) {
      console.log("No se pudieron extraer datos del asunto:", subjectData)
      return NextResponse.json({ 
        success: false, 
        message: "Formato de asunto no válido",
        extractedData: subjectData
      })
    }
    
    // Extraer materiales del cuerpo
    const materials = extractMaterialsFromBody(body.textBody)
    
    if (materials.length === 0) {
      console.log("No se encontraron materiales en el cuerpo del email")
      return NextResponse.json({ 
        success: false, 
        message: "No se encontraron materiales válidos en el email"
      })
    }
    
    // Convertir fecha del formato dd/mm/yyyy a yyyy-mm-dd
    const dateParts = subjectData.date.split('/')
    const requestDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`
    
    // Crear la solicitud principal
    const { data: docuwareRequest, error: requestError } = await supabase
      .from('docuware_requests')
      .insert({
        email_subject: body.subject,
        email_body: body.textBody,
        license_plate: subjectData.licensePlate.toUpperCase(),
        requester: subjectData.source,
        request_date: requestDate,
        status: 'pending',
        observations: ''
      })
      .select()
      .single()
    
    if (requestError) {
      console.error("Error creando solicitud Docuware:", requestError)
      return NextResponse.json({ 
        success: false, 
        message: "Error creando solicitud",
        error: requestError.message
      })
    }
    
    console.log("Solicitud Docuware creada:", docuwareRequest.id)
    
    // Crear los materiales solicitados
    const materialsToInsert = materials.map(material => ({
      docuware_request_id: docuwareRequest.id,
      material_type: material.type,
      material_label: material.label,
      selected: true,
      observations: ''
    }))
    
    const { data: materialsData, error: materialsError } = await supabase
      .from('docuware_request_materials')
      .insert(materialsToInsert)
      .select()
    
    if (materialsError) {
      console.error("Error creando materiales:", materialsError)
      return NextResponse.json({ 
        success: false, 
        message: "Error creando materiales",
        error: materialsError.message
      })
    }
    
    console.log("Materiales creados:", materialsData.length)
    
    return NextResponse.json({
      success: true,
      message: "Email de Docuware procesado correctamente",
      requestId: docuwareRequest.id,
      materialsCount: materialsData.length,
      extractedData: {
        licensePlate: subjectData.licensePlate,
        date: subjectData.date,
        requester: subjectData.requester,
        source: subjectData.source,
        materials: materials
      }
    })
    
  } catch (error: any) {
    console.error("Error procesando email de Docuware:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Error interno del servidor",
      error: error.message
    }, { status: 500 })
  }
} 