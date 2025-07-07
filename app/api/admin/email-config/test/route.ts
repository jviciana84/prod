import { NextResponse } from "next/server"

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

    // Importar nodemailer dinámicamente
    const nodemailer = await import("nodemailer")

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
    const transporter = nodemailer.createTransport(smtpConfig)

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

    // Preparar el correo de prueba
    const testSubject = config.subject_template.replace("{fecha}", fechaEspanol)
    const testBody = config.body_template
      .replace("{fecha}", fechaEspanol)
      .replace("{materiales}", "• Llaves del vehículo ABC-1234\n• Documentación completa")

    const mailOptions = {
      from: config.sender_email,
      to: email,
      subject: `[PRUEBA] ${testSubject}`,
      text: `ESTE ES UN CORREO DE PRUEBA\n\n${testBody}`,
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({
      success: true,
      message: "✅ Correo de prueba enviado correctamente via SMTP OVH",
      details: {
        from: mailOptions.from,
        to: mailOptions.to,
        fecha: fechaEspanol,
      },
    })
  } catch (error) {
    console.error("❌ Error sending test email:", error)
    return NextResponse.json(
      {
        error: `Error enviando correo de prueba: ${error instanceof Error ? error.message : "Error desconocido"}`,
      },
      { status: 500 },
    )
  }
}
