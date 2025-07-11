import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const { license_plate, client_dni, client_email, client_phone, incidencias } = await request.json()

    if (!license_plate || !client_dni || !incidencias || incidencias.length === 0) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Obtener información del vehículo
    const { data: vehicle, error: vehicleError } = await supabase
      .from("sales_vehicles")
      .select(`
        license_plate,
        model,
        sale_date,
        advisor,
        advisor_name,
        client_email,
        client_phone
      `)
      .eq("license_plate", license_plate.toUpperCase())
      .eq("client_dni", client_dni.toUpperCase())
      .single()

    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { error: "Vehículo no encontrado" },
        { status: 404 }
      )
    }

    // Generar número de ticket
    const ticketNumber = await generateTicketNumber(supabase)

    // Calcular tiempo desde la venta
    const saleDate = new Date(vehicle.sale_date)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - saleDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    let timeSinceSale = ""
    if (diffDays < 30) {
      timeSinceSale = `${diffDays} día${diffDays > 1 ? 's' : ''}`
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      const remainingDays = diffDays % 30
      timeSinceSale = `${months} mes${months > 1 ? 'es' : ''}`
      if (remainingDays > 0) {
        timeSinceSale += ` ${remainingDays} día${remainingDays > 1 ? 's' : ''}`
      }
    } else {
      const years = Math.floor(diffDays / 365)
      const remainingDays = diffDays % 365
      const months = Math.floor(remainingDays / 30)
      const finalDays = remainingDays % 30
      
      timeSinceSale = `${years} año${years > 1 ? 's' : ''}`
      if (months > 0) {
        timeSinceSale += ` ${months} mes${months > 1 ? 'es' : ''}`
      }
      if (finalDays > 0) {
        timeSinceSale += ` ${finalDays} día${finalDays > 1 ? 's' : ''}`
      }
    }

    // Crear ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("soporte_tickets")
      .insert({
        ticket_number: ticketNumber,
        license_plate: vehicle.license_plate,
        client_dni: client_dni.toUpperCase(),
        client_email: client_email || vehicle.client_email,
        client_phone: client_phone || vehicle.client_phone,
        sale_date: vehicle.sale_date,
        time_since_sale: timeSinceSale,
        status: "abierto"
      })
      .select()
      .single()

    if (ticketError) {
      console.error("Error creando ticket:", ticketError)
      return NextResponse.json(
        { error: "Error creando ticket" },
        { status: 500 }
      )
    }

    // Crear incidencias
    const incidenciasData = incidencias.map((inc: any) => ({
      ticket_id: ticket.id,
      tipo_incidencia: inc.tipo,
      descripcion: inc.descripcion || "",
      estado: "pendiente"
    }))

    const { error: incidenciasError } = await supabase
      .from("soporte_incidencias")
      .insert(incidenciasData)

    if (incidenciasError) {
      console.error("Error creando incidencias:", incidenciasError)
      // No fallar si las incidencias no se crean, pero logear el error
    }

    // Enviar email de confirmación
    await sendTicketEmail(ticket, vehicle, incidencias)

    return NextResponse.json({
      ticket: {
        ticket_number: ticket.ticket_number,
        created_at: ticket.created_at,
        time_since_sale: ticket.time_since_sale,
        client_email: ticket.client_email,
        client_phone: ticket.client_phone,
        status: ticket.status
      }
    })

  } catch (error) {
    console.error("Error creando ticket:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

async function generateTicketNumber(supabase: any) {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  
  // Obtener el siguiente número de ticket para hoy
  const { data: lastTicket } = await supabase
    .from("soporte_tickets")
    .select("ticket_number")
    .like("ticket_number", `TKT-${dateStr}-%`)
    .order("ticket_number", { ascending: false })
    .limit(1)
    .single()

  let counter = 1
  if (lastTicket) {
    const lastNumber = parseInt(lastTicket.ticket_number.split('-')[2])
    counter = lastNumber + 1
  }

  return `TKT-${dateStr}-${counter.toString().padStart(4, '0')}`
}

async function sendTicketEmail(ticket: any, vehicle: any, incidencias: any[]) {
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
    const bccEmails = [vehicle.advisor] // Asesor en copia oculta

    // Preparar contenido del email
    const subject = config.subject_template
      .replace("{ticket_number}", ticket.ticket_number)
      .replace("{license_plate}", vehicle.license_plate)

    const body = config.body_template
      .replace("{ticket_number}", ticket.ticket_number)
      .replace("{created_date}", new Date(ticket.created_at).toLocaleDateString('es-ES'))
      .replace("{time_since_sale}", ticket.time_since_sale)
      .replace("{client_email}", ticket.client_email)
      .replace("{client_phone}", ticket.client_phone)

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
      email_type: "registro",
      to_emails: toEmails,
      cc_emails: ccEmails,
      bcc_emails: bccEmails,
      subject: subject,
      body: body,
      success: true
    })

    console.log("Email de ticket enviado correctamente")

  } catch (error) {
    console.error("Error enviando email:", error)
    
    // Registrar error en el log
    try {
      const supabase = await createServerClient()
      await supabase.from("soporte_email_logs").insert({
        ticket_id: ticket.id,
        email_type: "registro",
        to_emails: [ticket.client_email],
        subject: "Ticket creado",
        body: "Error enviando email",
        success: false,
        error_message: error instanceof Error ? error.message : "Error desconocido"
      })
    } catch (logError) {
      console.error("Error registrando log de email:", logError)
    }
  }
} 