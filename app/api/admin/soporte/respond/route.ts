import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const { incidencia_id, ticket_id, respuesta } = await request.json()

    if (!incidencia_id || !ticket_id || !respuesta) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Verificar autenticación
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener información del ticket y la incidencia
    const { data: ticket, error: ticketError } = await supabase
      .from("soporte_tickets")
      .select(`
        id,
        ticket_number,
        license_plate,
        client_email,
        client_phone,
        status
      `)
      .eq("id", ticket_id)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: "Ticket no encontrado" },
        { status: 404 }
      )
    }

    const { data: incidencia, error: incidenciaError } = await supabase
      .from("soporte_incidencias")
      .select(`
        id,
        tipo_incidencia,
        descripcion,
        estado
      `)
      .eq("id", incidencia_id)
      .single()

    if (incidenciaError || !incidencia) {
      return NextResponse.json(
        { error: "Incidencia no encontrada" },
        { status: 404 }
      )
    }

    // Obtener perfil del usuario que responde
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()

    // Actualizar la incidencia con la respuesta
    const { error: updateError } = await supabase
      .from("soporte_incidencias")
      .update({
        respuesta_admin: respuesta,
        respondido_at: new Date().toISOString(),
        respondido_por: user.id,
        estado: "en_tramite" // Cambiar estado a en trámite
      })
      .eq("id", incidencia_id)

    if (updateError) {
      console.error("Error actualizando incidencia:", updateError)
      return NextResponse.json(
        { error: "Error actualizando incidencia" },
        { status: 500 }
      )
    }

    // Verificar si todas las incidencias del ticket están resueltas
    const { data: allIncidencias } = await supabase
      .from("soporte_incidencias")
      .select("estado")
      .eq("ticket_id", ticket_id)

    const allResueltas = allIncidencias?.every(inc => inc.estado === "resuelto")
    const allEnTramite = allIncidencias?.every(inc => inc.estado === "en_tramite" || inc.estado === "resuelto")

    // Actualizar estado del ticket
    let newTicketStatus = "en_tramite"
    if (allResueltas) {
      newTicketStatus = "cerrado"
    } else if (allEnTramite) {
      newTicketStatus = "en_tramite"
    }

    await supabase
      .from("soporte_tickets")
      .update({ status: newTicketStatus })
      .eq("id", ticket_id)

    // Enviar email de respuesta
    await sendResponseEmail(ticket, incidencia, respuesta, profile?.full_name || user.email || "Equipo de Soporte")

    return NextResponse.json({ 
      success: true,
      message: "Respuesta enviada correctamente"
    })

  } catch (error) {
    console.error("Error respondiendo incidencia:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

async function sendResponseEmail(ticket: any, incidencia: any, respuesta: string, responderName: string) {
  try {
    // Obtener configuración de email
    const supabase = await createServerClient()
    const { data: config } = await supabase
      .from("soporte_email_config")
      .select("*")
      .single()

    if (!config || !config.enabled) {
      console.log("Email deshabilitado o configuración no encontrada")
      return
    }

    // Verificar variables SMTP
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log("Configuración SMTP incompleta")
      return
    }

    const transporter = nodemailer.createTransporter({
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

    // Preparar destinatarios
    const toEmails = [ticket.client_email]
    const ccEmails = config.cc_emails || []
    const bccEmails = [] // Asesor en copia oculta si es necesario

    // Preparar contenido del email
    const subject = `Respuesta a su ticket ${ticket.ticket_number} - ${incidencia.tipo_incidencia}`

    const body = `Estimado cliente,

Hemos recibido su consulta sobre ${incidencia.tipo_incidencia} en el vehículo ${ticket.license_plate}.

Respuesta del equipo de soporte:
${respuesta}

Si tiene alguna pregunta adicional, no dude en contactarnos.

Saludos cordiales,
${responderName}
Equipo de Soporte CVO

---
Ticket: ${ticket.ticket_number}
Fecha: ${new Date().toLocaleDateString('es-ES')}`

    // Enviar email
    const mailOptions = {
      from: `"${config.sender_name}" <${config.sender_email}>`,
      to: toEmails.join(", "),
      cc: ccEmails.length > 0 ? ccEmails.join(", ") : undefined,
      bcc: bccEmails.join(", "),
      subject: subject,
      text: body,
      html: body.replace(/\n/g, "<br>")
    }

    await transporter.sendMail(mailOptions)

    // Registrar en el log
    await supabase.from("soporte_email_logs").insert({
      ticket_id: ticket.id,
      email_type: "respuesta",
      to_emails: toEmails,
      cc_emails: ccEmails,
      bcc_emails: bccEmails,
      subject: subject,
      body: body,
      success: true
    })

    console.log("Email de respuesta enviado correctamente")

  } catch (error) {
    console.error("Error enviando email de respuesta:", error)
    
    // Registrar error en el log
    try {
      const supabase = await createServerClient()
      await supabase.from("soporte_email_logs").insert({
        ticket_id: ticket.id,
        email_type: "respuesta",
        to_emails: [ticket.client_email],
        subject: "Respuesta a ticket",
        body: "Error enviando email",
        success: false,
        error_message: error instanceof Error ? error.message : "Error desconocido"
      })
    } catch (logError) {
      console.error("Error registrando log de email:", logError)
    }
  }
} 