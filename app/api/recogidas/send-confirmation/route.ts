import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import nodemailer from "nodemailer"
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
      email, 
      materiales, 
      nombre_cliente, 
      nombre_recoge, 
      dni_recoge, 
      email_recoge,
      usuario_solicitante 
    } = body

    if (!matricula || !email || !materiales || !nombre_cliente || !nombre_recoge || !email_recoge) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    // Obtener datos del vehículo para completar la información
    const { data: vehiculo, error: vehiculoError } = await supabase
      .from("sales_vehicles")
      .select("brand, model, client_email")
      .eq("license_plate", matricula.toUpperCase())
      .single()

    if (vehiculoError) {
      return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 })
    }

    // Generar token de confirmación (sin caducidad)
    const token = crypto.randomBytes(32).toString('hex')
    const confirmacionUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/confirmar-entrega?token=${token}`

    // Guardar en base de datos para tracking
    const { data: confirmacionGuardada, error: guardadoError } = await supabase
      .from("entregas_en_mano")
      .insert([{
        matricula: matricula,
        email_cliente: vehiculo.client_email || email,
        materiales: materiales,
        nombre_cliente: nombre_cliente,
        usuario_solicitante: usuario_solicitante,
        usuario_solicitante_id: user.id,
        nombre_recoge: nombre_recoge,
        dni_recoge: dni_recoge || null,
        email_recoge: email_recoge,
        token_confirmacion: token,
        estado: "enviado"
      }])
      .select()
      .single()

    if (guardadoError) {
      return NextResponse.json({ error: "Error guardando confirmación" }, { status: 500 })
    }

    // Función para generar HTML del email
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
      
      const fecha_envio = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
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
      template = template.replace('{{fecha_envio}}', fecha_envio)
      
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
    const asunto = `Recogida documentación ${matricula} ${vehiculo.brand || ''} ${vehiculo.model || ''}`.trim()
    
    // Generar contenido del email
    const emailHTML = generateEmailHTML()
    
    // Versión de texto plano
    const emailText = `
Hola ${nombre_cliente},

Hoy ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} se ha entregado:

${materiales.map((m: string) => `- ${m}`).join('\n')}

A: ${nombre_recoge}${dni_recoge ? ` (DNI: ${dni_recoge})` : ''}
Email: ${email_recoge}

Para confirmar la recepción, visita: ${confirmacionUrl}

Atentamente,
Sistema de Gestión de Entregas - CVO
    `.trim()

    // Verificar variables SMTP
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return NextResponse.json({
        error: "Configuración SMTP incompleta",
      }, { status: 500 })
    }

    // Configuración del transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || "465"),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })

    // Preparar destinatarios (enviar a ambos emails)
    const destinatarios = [vehiculo.client_email || email, email_recoge].filter(Boolean)

    // Opciones del email
    const mailOptions = {
      from: `Sistema CVO <${process.env.SMTP_USER}>`,
      to: destinatarios.join(","),
      subject: asunto,
      text: emailText,
      html: emailHTML,
    }

    // Enviar email
    try {
      const result = await transporter.sendMail(mailOptions)
      
      // Actualizar estado en base de datos
      await supabase
        .from("entregas_en_mano")
        .update({ 
          email_enviado: true,
          email_enviado_at: new Date().toISOString(),
          message_id: result.messageId,
          fecha_envio: new Date().toISOString()
        })
        .eq("id", confirmacionGuardada.id)

      return NextResponse.json({ 
        success: true, 
        messageId: result.messageId,
        message: "Confirmación enviada correctamente",
        destinatarios: destinatarios,
        confirmacionUrl: confirmacionUrl
      })
    } catch (emailError) {
      return NextResponse.json({ error: "Error enviando email", details: emailError.message }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
} 