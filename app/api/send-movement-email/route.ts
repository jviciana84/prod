import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import nodemailer from "nodemailer"
import { getEmailTemplate } from "@/lib/email-templates/email-styles"
import { generateMovementEmailHTML } from "@/lib/email-templates/movement-email-templates"

interface MovementData {
  fecha: string
  usuario_entrega: string
  email_entrega: string | null
  movimientos: Array<{
    usuario_recibe: string
    email_recibe: string | null
    items: Array<{
      matricula: string
      material: string
      observaciones?: string
    }>
  }>
}

export async function POST(request: NextRequest) {
  try {
    const movementData: MovementData = await request.json()

    console.log("📧 === INICIO ENVÍO EMAIL MOVIMIENTO ===")
    console.log("📧 Datos recibidos:", JSON.stringify(movementData, null, 2))

    const supabase = await createClient()

    // Obtener configuración de email con timeout
    console.log("📧 Obteniendo configuración de email...")
    const configPromise = supabase.from("email_config").select("*").single()
    
    const configResult = await Promise.race([
      configPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout obteniendo configuración")), 5000)
      )
    ]) as any;

    if (configResult.error) {
      console.error("❌ Error obteniendo configuración:", configResult.error)
      return NextResponse.json({
        success: false,
        message: "Error obteniendo configuración de email",
        error: configResult.error,
      })
    }

    const config = configResult.data;
    if (!config.enabled) {
      console.log("⚠️ Envío de emails deshabilitado en configuración")
      return NextResponse.json({
        success: false,
        message: "Envío de emails deshabilitado",
      })
    }

    // Verificar variables SMTP
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error("❌ Configuración SMTP incompleta")
      return NextResponse.json({
        success: false,
        message: "Configuración SMTP incompleta",
      })
    }

    // Configuración del transporter con timeout
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
      connectionTimeout: 10000, // 10 segundos
      greetingTimeout: 10000,
      socketTimeout: 10000,
    })

    // Verificar conexión SMTP con timeout
    try {
      await Promise.race([
        transporter.verify(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout verificando SMTP")), 10000)
        )
      ]);
      console.log("✅ Conexión SMTP verificada correctamente")
    } catch (verifyError) {
      console.error("❌ Error verificando conexión SMTP:", verifyError)
      return NextResponse.json({
        success: false,
        message: "Error de conexión SMTP",
        error: verifyError.message,
      })
    }

    // Preparar destinatarios
    const recipients = new Set<string>()

    // Añadir email del usuario que entrega
    if (movementData.email_entrega) {
      recipients.add(movementData.email_entrega)
    }

    // Añadir emails de usuarios que reciben
    movementData.movimientos.forEach((mov) => {
      if (mov.email_recibe) {
        recipients.add(mov.email_recibe)
      }
    })

    const recipientsList = Array.from(recipients)
    const ccEmails = config.cc_emails || []

    if (recipientsList.length === 0 && ccEmails.length === 0) {
      console.error("❌ No hay destinatarios válidos")
      return NextResponse.json({
        success: false,
        message: "No hay destinatarios válidos",
      })
    }

    // Generar contenido del email
    const htmlContent = generateMovementEmailHTML(movementData)

    // Preparar asunto
    const subject = `Entrega de llaves / documentación - ${movementData.fecha}`

    // Preparar opciones del email
    const mailOptions = {
      from: `Material - Sistema CVO <material@controlvo.ovh>`,
      to: recipientsList.length > 0 ? recipientsList.join(",") : undefined,
      cc: ccEmails.length > 0 ? ccEmails.join(",") : undefined,
      subject: subject,
      html: getEmailTemplate(htmlContent),
      text: `Registro de entrega de material - ${movementData.fecha}`,
    }

    console.log("📧 Opciones finales del email:", {
      from: mailOptions.from,
      to: mailOptions.to,
      cc: mailOptions.cc,
      subject: mailOptions.subject,
    })

    // Enviar email con timeout
    console.log("📧 Enviando email...")
    const sendPromise = transporter.sendMail(mailOptions);
    
    const result = await Promise.race([
      sendPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout enviando email")), 15000)
      )
    ]) as any;
    
    console.log("✅ Email enviado exitosamente:", result.messageId)

    return NextResponse.json({
      success: true,
      message: "Email enviado exitosamente",
      messageId: result.messageId,
      recipients: {
        to: mailOptions.to,
        cc: mailOptions.cc,
      },
    })
  } catch (error) {
    console.error("❌ Error crítico enviando email:", error)
    return NextResponse.json({
      success: false,
      message: "Error crítico enviando email",
      error: error.message,
    })
  }
}
