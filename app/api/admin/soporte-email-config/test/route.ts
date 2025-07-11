import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: Request) {
  try {
    const { email, config } = await request.json()

    // Verificar variables SMTP
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return NextResponse.json(
        {
          error: "Faltan variables SMTP. Configura: SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_PORT",
        },
        { status: 500 },
      )
    }

    // Configuración específica para OVH
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    }

    // Configurar transportador SMTP
    const transporter = nodemailer.createTransporter(smtpConfig)

    // Verificar conexión SMTP
    try {
      await transporter.verify()
      console.log("✅ Conexión SMTP verificada correctamente")
    } catch (verifyError) {
      console.error("❌ Error verificando conexión SMTP:", verifyError)
      return NextResponse.json(
        {
          error: `Error de conexión SMTP: ${verifyError instanceof Error ? verifyError.message : "Error desconocido"}`,
        },
        { status: 500 },
      )
    }

    // Formato de fecha español DD/MM/YYYY
    const now = new Date()
    const fechaEspanol = `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()}`

    // Verificar que config existe
    if (!config || !config.subject_template || !config.body_template) {
      return NextResponse.json(
        {
          error: "Configuración de email no válida. Asegúrate de guardar la configuración primero.",
        },
        { status: 400 },
      )
    }

    // Datos de ejemplo para el email de prueba
    const testData = {
      ticket_number: "TKT-20241201-0001",
      license_plate: "1234ABC",
      created_date: fechaEspanol,
      time_since_sale: "1 año 6 meses 4 días",
      client_email: "cliente@ejemplo.com",
      client_phone: "600123456",
    }

    // Preparar contenido del email
    const subject = config.subject_template
      .replace("{ticket_number}", testData.ticket_number)
      .replace("{license_plate}", testData.license_plate)

    const body = config.body_template
      .replace("{ticket_number}", testData.ticket_number)
      .replace("{created_date}", testData.created_date)
      .replace("{time_since_sale}", testData.time_since_sale)
      .replace("{client_email}", testData.client_email)
      .replace("{client_phone}", testData.client_phone)

    // Enviar email de prueba
    const mailOptions = {
      from: `"${config.sender_name}" <${config.sender_email}>`,
      to: email,
      subject: `[PRUEBA] ${subject}`,
      text: body,
      html: body.replace(/\n/g, "<br>"),
    }

    console.log("📧 Enviando email de prueba a:", email)
    const info = await transporter.sendMail(mailOptions)
    console.log("✅ Email de prueba enviado correctamente. Message ID:", info.messageId)

    return NextResponse.json({
      success: true,
      message: "Email de prueba enviado correctamente",
      messageId: info.messageId,
    })
  } catch (error) {
    console.error("❌ Error enviando email de prueba:", error)
    return NextResponse.json(
      {
        error: "Error enviando email de prueba",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
} 