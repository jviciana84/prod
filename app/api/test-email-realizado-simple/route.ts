import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const { extorno_id } = await request.json()

    if (!extorno_id) {
      return NextResponse.json({
        success: false,
        message: "extorno_id requerido",
      }, { status: 400 })
    }

    console.log("🧪 === PRUEBA EMAIL REALIZADO SIMPLE ===")
    console.log("📧 ID de extorno:", extorno_id)

    const supabase = await createClient()

    // Obtener datos del extorno
    const { data: extorno, error: extornoError } = await supabase
      .from("extornos")
      .select("*")
      .eq("id", extorno_id)
      .single()

    if (extornoError || !extorno) {
      console.error("❌ Error obteniendo extorno:", extornoError)
      return NextResponse.json({
        success: false,
        message: "Extorno no encontrado",
      }, { status: 404 })
    }

    console.log("📦 Datos de extorno:", {
      id: extorno.id,
      matricula: extorno.matricula,
      justificante_url: extorno.justificante_url,
      justificante_nombre: extorno.justificante_nombre,
    })

    // Verificar configuración SMTP
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD || !process.env.EXTORNO_EMAIL) {
      console.error("❌ Configuración SMTP incompleta")
      return NextResponse.json({
        success: false,
        message: "Configuración SMTP incompleta",
        error: "Faltan variables de entorno SMTP",
      }, { status: 500 })
    }

    // Configurar transporter
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
      console.log("✅ Conexión SMTP verificada")
    } catch (verifyError) {
      console.error("❌ Error verificando conexión SMTP:", verifyError)
      return NextResponse.json({
        success: false,
        message: "Error de conexión SMTP",
        error: verifyError.message,
      }, { status: 500 })
    }

    // Preparar destinatarios de prueba (enviar a múltiples emails para debug)
    const toEmails = [
      process.env.EXTORNO_EMAIL || "test@example.com",
      // Agregar tu email personal aquí para debug
      "tu-email-personal@gmail.com" // CAMBIA ESTO POR TU EMAIL
    ].filter(Boolean)
    
    const toEmail = toEmails.join(",")
    
    // Crear email simple de prueba
    const subject = `🧪 PRUEBA - Extorno #${extorno.id} Realizado - ${extorno.matricula}`
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">🧪 PRUEBA - Email de Extorno Realizado</h2>
        <p>Este es un email de prueba para verificar el envío de emails de extornos realizados.</p>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Datos del Extorno:</h3>
          <p><strong>ID:</strong> ${extorno.id}</p>
          <p><strong>Matrícula:</strong> ${extorno.matricula}</p>
          <p><strong>Cliente:</strong> ${extorno.cliente}</p>
          <p><strong>Importe:</strong> ${extorno.importe} €</p>
          <p><strong>Estado:</strong> ${extorno.estado}</p>
          ${extorno.justificante_url ? `<p><strong>Justificante:</strong> <a href="${extorno.justificante_url}">${extorno.justificante_nombre}</a></p>` : '<p><strong>Justificante:</strong> No adjunto</p>'}
        </div>
        
        <p style="color: #6b7280; font-size: 12px;">
          Este email fue enviado como prueba desde el endpoint /api/test-email-realizado-simple
        </p>
      </div>
    `

    // Preparar adjuntos si existe justificante
    const attachments = extorno.justificante_url ? [{
      filename: extorno.justificante_nombre || "justificante.pdf",
      path: extorno.justificante_url
    }] : []

    // Enviar email
    const mailOptions = {
      from: `"Sistema de Extornos CVO - PRUEBA" <${process.env.EXTORNO_EMAIL}>`,
      to: toEmail,
      subject: subject,
      html: htmlContent,
      attachments: attachments,
    }

    console.log("📧 Enviando email de prueba a:", toEmail)
    console.log("📧 Adjuntos:", attachments.length)

    const result = await transporter.sendMail(mailOptions)
    
    console.log("✅ Email de prueba enviado exitosamente:", result.messageId)

    return NextResponse.json({
      success: true,
      message: "Email de prueba enviado correctamente",
      messageId: result.messageId,
      recipient: toEmail,
      attachmentsCount: attachments.length,
    })

  } catch (error) {
    console.error("❌ Error crítico en test-email-realizado-simple:", error)
    return NextResponse.json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    }, { status: 500 })
  }
} 