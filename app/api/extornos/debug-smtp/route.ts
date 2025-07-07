import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function GET() {
  try {
    // Verificar variables de entorno
    if (!process.env.SMTP_HOST || !process.env.EXTORNO_EMAIL || !process.env.EXTORNO_PASSWORD) {
      console.error(
        "❌ Configuración SMTP incompleta. Variables requeridas: SMTP_HOST, EXTORNO_EMAIL, EXTORNO_PASSWORD",
      )
      return NextResponse.json(
        {
          success: false,
          message:
            "Configuración SMTP incompleta. Por favor, asegúrese de que SMTP_HOST, EXTORNO_EMAIL y EXTORNO_PASSWORD estén configuradas en Vercel.",
        },
        { status: 500 },
      )
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || "465"),
      secure: true, // Usar TLS
      auth: {
        user: process.env.EXTORNO_EMAIL,
        pass: process.env.EXTORNO_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false, // Solo para desarrollo, en producción se recomienda true
      },
    })

    // 1. Verificar la conexión SMTP
    try {
      await transporter.verify()
      console.log("✅ Conexión SMTP verificada correctamente.")
    } catch (verifyError: any) {
      console.error("❌ Error verificando conexión SMTP:", verifyError)
      return NextResponse.json(
        {
          success: false,
          message: "Error de conexión SMTP. Verifique las credenciales y la configuración del servidor.",
          error: verifyError.message,
        },
        { status: 500 },
      )
    }

    // 2. Intentar enviar un email de prueba muy básico
    const testEmailRecipient = process.env.EXTORNO_EMAIL // Envía el email a la misma cuenta de origen para verificar
    if (!testEmailRecipient) {
      return NextResponse.json(
        {
          success: false,
          message: "EXTORNO_EMAIL no está configurado, no se puede enviar email de prueba.",
        },
        { status: 500 },
      )
    }

    const mailOptions = {
      from: `"Debug CVO" <${process.env.EXTORNO_EMAIL}>`,
      to: testEmailRecipient,
      subject: `TEST SMTP CVO - ${new Date().toLocaleString()}`,
      html: `
        <p>Este es un email de prueba enviado desde la ruta de depuración SMTP de CVO.</p>
        <p>Si recibes este email, la configuración SMTP es correcta.</p>
        <p>Fecha: ${new Date().toLocaleString()}</p>
      `,
      text: `Este es un email de prueba enviado desde la ruta de depuración SMTP de CVO. Fecha: ${new Date().toLocaleString()}`,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("✅ Email de depuración enviado:", info.messageId)

    return NextResponse.json({
      success: true,
      message:
        "Conexión SMTP exitosa y email de depuración enviado. Revise la bandeja de entrada de " + testEmailRecipient,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    })
  } catch (error: any) {
    console.error("❌ Error crítico en la ruta de depuración SMTP:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor al depurar SMTP.",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
