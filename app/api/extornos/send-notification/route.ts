import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import nodemailer from "nodemailer"
import { getEmailTemplate } from "@/lib/email-templates/email-styles"
import {
  generateRegistroEmailHTML,
  generateTramitacionEmailHTML,
  generateConfirmacionEmailHTML,
  generateRechazoEmailHTML,
} from "@/lib/email-templates/extorno-email-templates"

export async function POST(request: NextRequest) {
  try {
    const { extornoId, type, confirmationLink } = await request.json()

    if (!extornoId || !type) {
      return NextResponse.json({ error: "extornoId y type son requeridos" }, { status: 400 })
    }

    // Obtener datos del extorno
    const supabase = await createClient()
    const { data: extorno, error: extornoError } = await supabase
      .from("extornos")
      .select("*")
      .eq("id", extornoId)
      .single()

    if (extornoError || !extorno) {
      return NextResponse.json({ error: "Extorno no encontrado" }, { status: 404 })
    }

    // Obtener configuración de email
    const { data: emailConfig } = await supabase.from("extornos_email_config").select("*").single()

    if (!emailConfig?.enabled) {
      return NextResponse.json({ error: "Sistema de emails desactivado" }, { status: 400 })
    }

    // Generar contenido del email según el tipo
    let emailContent = ""
    let subject = ""

    switch (type) {
      case "registro":
        emailContent = generateRegistroEmailHTML(extorno)
        subject = `Nueva Solicitud de Extorno #${extorno.id} - ${extorno.matricula}`
        break
      case "tramitacion":
        emailContent = generateTramitacionEmailHTML(extorno, confirmationLink)
        subject = `Extorno en Tramitación #${extorno.id} - ${extorno.matricula}`
        break
      case "confirmacion":
        emailContent = generateConfirmacionEmailHTML(extorno)
        subject = `Extorno Confirmado #${extorno.id} - ${extorno.matricula}`
        break
      case "rechazo":
        emailContent = generateRechazoEmailHTML(extorno)
        subject = `Extorno Rechazado #${extorno.id} - ${extorno.matricula}`
        break
      default:
        return NextResponse.json({ error: "Tipo de email no válido" }, { status: 400 })
    }

    // Crear el HTML completo del email
    const emailHTML = getEmailTemplate(emailContent)

    // Configurar transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.EXTORNO_EMAIL,
        pass: process.env.EXTORNO_PASSWORD,
      },
    })

    // Determinar destinatarios según el tipo
    let recipients = []

    // Siempre incluir CC emails
    if (emailConfig.cc_emails && emailConfig.cc_emails.length > 0) {
      recipients.push(...emailConfig.cc_emails)
    }

    // Añadir destinatarios específicos según el tipo
    switch (type) {
      case "registro":
        if (extorno.solicitado_por_email) {
          recipients.push(extorno.solicitado_por_email)
        }
        if (emailConfig.email_tramitador) {
          recipients.push(emailConfig.email_tramitador)
        }
        break
      case "tramitacion":
        if (emailConfig.email_tramitador) {
          recipients.push(emailConfig.email_tramitador)
        }
        if (emailConfig.email_pagador) {
          recipients.push(emailConfig.email_pagador)
        }
        break
      case "confirmacion":
      case "rechazo":
        if (extorno.solicitado_por_email) {
          recipients.push(extorno.solicitado_por_email)
        }
        if (emailConfig.email_tramitador) {
          recipients.push(emailConfig.email_tramitador)
        }
        if (emailConfig.email_pagador) {
          recipients.push(emailConfig.email_pagador)
        }
        break
    }

    // Eliminar duplicados
    recipients = [...new Set(recipients)]

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No hay destinatarios configurados" }, { status: 400 })
    }

    // Enviar email
    const mailOptions = {
      from: `Extorno - Sistema CVO <${process.env.EXTORNO_EMAIL}>`,
      to: recipients.join(", "),
      subject: subject,
      html: emailHTML,
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({
      success: true,
      message: `Email de ${type} enviado correctamente`,
      recipients: recipients,
    })
  } catch (error) {
    console.error("Error enviando email de extorno:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// Re-exportar las funciones para compatibilidad
export {
  generateRegistroEmailHTML,
  generateTramitacionEmailHTML,
  generateConfirmacionEmailHTML,
  generateRechazoEmailHTML,
}
