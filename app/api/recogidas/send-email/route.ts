import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import nodemailer from "nodemailer"

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
    const { recogidaId } = body

    if (!recogidaId) {
      return NextResponse.json({ error: "ID de recogida requerido" }, { status: 400 })
    }

    // Obtener datos de la recogida
    const { data: recogida, error: recogidaError } = await supabase
      .from("recogidas_historial")
      .select("*")
      .eq("id", recogidaId)
      .single()

    if (recogidaError || !recogida) {
      return NextResponse.json({ error: "Recogida no encontrada" }, { status: 404 })
    }

    // Obtener configuración de email para recogidas
    const { data: emailConfig } = await supabase
      .from("recogidas_email_config")
      .select("*")
      .single()

    if (!emailConfig?.enabled) {
      return NextResponse.json({ error: "Configuración de email deshabilitada" }, { status: 400 })
    }

    // Obtener datos del usuario solicitante
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", recogida.usuario_solicitante_id)
      .single()

    // Preparar el contenido del email
    const materialesText = recogida.materiales.join(" + ")
    const asunto = `Recogida Motor Munich ${recogida.centro_recogida}`

    const emailContent = `
Estimados compañeros,

${userProfile?.full_name || recogida.usuario_solicitante} solicita recogida en Motor Munich ${recogida.centro_recogida}

Datos de la solicitud:
- Matrícula: ${recogida.matricula}
- Material: ${materialesText}
- Cliente: ${recogida.nombre_cliente || 'No especificado'}
- Dirección: ${recogida.direccion_cliente || 'No especificada'}
- Código Postal: ${recogida.codigo_postal || 'No especificado'}
- Ciudad: ${recogida.ciudad || 'No especificada'}
- Provincia: ${recogida.provincia || 'No especificada'}
- Teléfono: ${recogida.telefono || 'No especificado'}
- Email: ${recogida.email || 'No especificado'}
${recogida.observaciones_envio ? `- Observaciones: ${recogida.observaciones_envio}` : ''}

Puedes responder a todas las solicitudes de recogida con el número de seguimiento en la columna de la tabla que hemos preparado para que lo pongáis.

Saludos cordiales,
Sistema CVO
    `.trim()

    // Preparar destinatarios
    const to = [emailConfig.email_agencia]
    const cc = [...(emailConfig.cc_emails || []), userProfile?.email].filter(Boolean)

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

    // Verificar conexión SMTP
    try {
      await transporter.verify()
    } catch (verifyError) {
      return NextResponse.json({
        error: "Error de conexión SMTP",
        details: verifyError.message,
      }, { status: 500 })
    }

    // Opciones del email
    const mailOptions = {
      from: `Recogidas - Sistema CVO <recogidas@controlvo.ovh>`,
      to: to.join(","),
      cc: cc.length > 0 ? cc.join(",") : undefined,
      subject: asunto,
      text: emailContent,
    }

    // Enviar email
    try {
      const result = await transporter.sendMail(mailOptions)
      // Actualizar fecha de envío en la recogida
      await supabase
        .from("recogidas_historial")
        .update({ fecha_envio: new Date().toISOString() })
        .eq("id", recogidaId)

      return NextResponse.json({ 
        success: true, 
        messageId: result.messageId,
        message: "Email enviado correctamente" 
      })
    } catch (emailError) {
      return NextResponse.json({ error: "Error enviando email", details: emailError.message }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
} 