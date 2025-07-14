import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST() {
  try {
    console.log("=== PRUEBA DE PROCESAMIENTO DE EMAIL ===")
    
    // Simular un email de prueba
    const testEmail = {
      from: "test@example.com",
      to: ["material@controlvo.ovh"],
      subject: "Nuevo pedido 8745MBS || 11/1/2024 || GABRIEL CAMPOS HORACIO || JORDIVI",
      textBody: "Solicito clau y fitxa tècnica",
      htmlBody: "<p>Solicito clau y fitxa tècnica</p>",
      date: new Date().toISOString(),
      messageId: "test-123"
    }
    
    console.log("Email de prueba:", testEmail)
    
    // Verificar variables de entorno
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: false,
        message: "Variables de entorno de Supabase no definidas"
      })
    }
    
    // Crear cliente Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    // Extraer datos del asunto
    const subjectPattern = /Nuevo pedido\s+([A-Z0-9]+)\s*\|\|\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*\|\|\s*([^|]+)\s*\|\|\s*([^|]+)/i
    const match = testEmail.subject.match(subjectPattern)
    
    if (!match) {
      return NextResponse.json({
        success: false,
        message: "No se pudieron extraer datos del asunto"
      })
    }
    
    const subjectData = {
      licensePlate: match[1].trim(),
      date: match[2].trim(),
      requester: match[3].trim(),
      source: match[4].trim()
    }
    
    console.log("Datos extraídos del asunto:", subjectData)
    
    // Extraer materiales
    const materials = []
    if (testEmail.textBody.toLowerCase().includes('clau') || testEmail.textBody.toLowerCase().includes('llave')) {
      materials.push({ type: 'second_key', label: '2ª Llave' })
    }
    if (testEmail.textBody.toLowerCase().includes('fitxa') || testEmail.textBody.toLowerCase().includes('ficha')) {
      materials.push({ type: 'technical_sheet', label: 'Ficha Técnica' })
    }
    
    if (materials.length === 0) {
      materials.push(
        { type: 'second_key', label: '2ª Llave' },
        { type: 'technical_sheet', label: 'Ficha Técnica' }
      )
    }
    
    console.log("Materiales extraídos:", materials)
    
    // Convertir fecha
    const dateParts = subjectData.date.split('/')
    const requestDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`
    
    // Insertar solicitud - ACTUALIZADO para coincidir con la estructura real
    const { data: solicitudInsertada, error: errorSolicitud } = await supabase
      .from('docuware_requests')
      .insert({
        email_subject: testEmail.subject,
        email_body: testEmail.textBody,
        license_plate: subjectData.licensePlate,
        requester: subjectData.requester,
        request_date: requestDate,
        status: 'pending',
        observations: `Email de: ${testEmail.from} | Para: ${testEmail.to.join(', ')}`
      })
      .select()
      .single()
    
    if (errorSolicitud) {
      console.error("Error insertando solicitud:", errorSolicitud)
      return NextResponse.json({
        success: false,
        message: "Error insertando solicitud",
        error: errorSolicitud.message
      })
    }
    
    console.log("Solicitud insertada:", solicitudInsertada)
    
    // Insertar materiales
    const materialesInsertados = []
    for (const material of materials) {
      const { data: materialInsertado, error: errorMaterial } = await supabase
        .from('docuware_request_materials')
        .insert({
          docuware_request_id: solicitudInsertada.id,
          material_type: material.type,
          material_label: material.label,
          selected: true,
          observations: ''
        })
        .select()
        .single()
      
      if (errorMaterial) {
        console.error("Error insertando material:", errorMaterial)
        return NextResponse.json({
          success: false,
          message: "Error insertando material",
          error: errorMaterial.message
        })
      }
      
      materialesInsertados.push(materialInsertado)
    }
    
    return NextResponse.json({
      success: true,
      message: "Email de prueba procesado correctamente",
      solicitud: solicitudInsertada,
      materiales: materialesInsertados
    })
    
  } catch (error: any) {
    console.error("Error en la prueba:", error)
    return NextResponse.json({
      success: false,
      message: "Error en la prueba",
      error: error.message
    })
  }
} 