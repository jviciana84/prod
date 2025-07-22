import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import fs from "fs"
import path from "path"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerClient()

    // Verificar autenticación
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      matricula, 
      email_cliente, 
      materiales, 
      nombre_cliente, 
      nombre_recoge, 
      dni_recoge, 
      email_recoge,
      usuario_solicitante 
    } = body

    if (!matricula || !email_cliente || !materiales || !nombre_cliente || !nombre_recoge || !email_recoge) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    // Obtener datos del vehículo para completar la información
    const { data: vehiculo, error: vehiculoError } = await supabase
      .from("sales_vehicles")
      .select("brand, model, client_email")
      .eq("license_plate", matricula.toUpperCase())
      .single()

    // Si no encuentra el vehículo, usar datos por defecto (modo prueba)
    let vehiculoData = {
      brand: "Marca Test",
      model: "Modelo Test", 
      client_email: email_cliente
    }
    
    if (!vehiculoError && vehiculo) {
      vehiculoData = vehiculo
    }

    // Generar token de confirmación (sin caducidad)
    const token = crypto.randomBytes(32).toString('hex')
    const confirmacionUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/confirmar-entrega?token=${token}`

    // Guardar en base de datos para tracking (MODO PRUEBA)
    const { data: confirmacionGuardada, error: guardadoError } = await supabase
      .from("entregas_en_mano")
      .insert([{
        matricula: matricula,
        email_cliente: vehiculoData.client_email || email_cliente,
        materiales: materiales,
        nombre_cliente: nombre_cliente,
        usuario_solicitante: usuario_solicitante,
        usuario_solicitante_id: user.id,
        nombre_recoge: nombre_recoge,
        dni_recoge: dni_recoge || null,
        email_recoge: email_recoge,
        token_confirmacion: token,
        estado: "enviado",
        email_enviado: true, // Marcar como enviado en modo prueba
        email_enviado_at: new Date().toISOString(),
        message_id: "TEST_MODE_" + Date.now()
      }])
      .select()
      .single()

    if (guardadoError) {
      return NextResponse.json({ error: "Error guardando confirmación" }, { status: 500 })
    }

    // Función para generar HTML del email (MODO PRUEBA)
    const generateEmailHTML = () => {
      const templatePath = path.join(process.cwd(), 'lib', 'email-templates', 'entrega-en-mano-template.html')
      let template = fs.readFileSync(templatePath, 'utf8')
      
      const fecha_entrega = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      
      const hora_entrega = new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })
      
      // Generar HTML para materiales
      let materialesHTML = ''
      materiales.forEach((material: string) => {
        materialesHTML += `
        <div class="material-item">
            <div class="material-bullet"></div>
            <div>${material}</div>
        </div>
        `
      })
      
      // Reemplazar variables
      template = template.replace('{{nombre_cliente}}', nombre_cliente)
      template = template.replace('{{fecha_entrega}}', fecha_entrega)
      template = template.replace('{{hora_entrega}}', hora_entrega)
      template = template.replace('{{materiales_content}}', materialesHTML)
      template = template.replace('{{nombre_recoge}}', nombre_recoge)
      template = template.replace('{{email_recoge}}', email_recoge)
      template = template.replace('{{confirmacion_url}}', confirmacionUrl)
      
      // Manejar DNI condicional
      if (dni_recoge) {
        template = template.replace('{{#dni_recoge}}', '')
        template = template.replace('{{/dni_recoge}}', '')
        template = template.replace('{{dni_recoge}}', dni_recoge)
      } else {
        template = template.replace(/{{#dni_recoge}}.*?{{\/dni_recoge}}/gs, '')
      }
      
      return template
    }

    // Generar asunto del email
    const asunto = `[PRUEBA] Recogida documentación ${matricula} ${vehiculoData.brand || ''} ${vehiculoData.model || ''}`.trim()
    
    // Generar contenido del email
    const emailHTML = generateEmailHTML()
    
    // Versión de texto plano
    const emailText = `
[PRUEBA - NO ES UN EMAIL REAL]

Hola ${nombre_cliente},

Hoy ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} se ha entregado:

${materiales.map((m: string) => `- ${m}`).join('\n')}

A: ${nombre_recoge}${dni_recoge ? ` (DNI: ${dni_recoge})` : ''}
Email: ${email_recoge}

Para confirmar la recepción, visita: ${confirmacionUrl}

[ESTE ES UN EMAIL DE PRUEBA - NO SE ENVIÓ REALMENTE]

Atentamente,
Sistema de Gestión de Entregas - CVO (MODO PRUEBA)
    `.trim()

    // Preparar destinatarios (MODO PRUEBA - solo para mostrar)
    const destinatarios = [vehiculoData.client_email || email_cliente, email_recoge].filter(Boolean)

    return NextResponse.json({ 
      success: true, 
      message: "✅ PRUEBA EXITOSA - Email simulado correctamente",
      modo: "PRUEBA",
      destinatarios: destinatarios,
      asunto: asunto,
      confirmacionUrl: confirmacionUrl,
      emailHTML: emailHTML,
      emailText: emailText,
      entrega: confirmacionGuardada,
      mensaje: "El email NO se envió realmente. Esta es solo una simulación."
    })

  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
} 