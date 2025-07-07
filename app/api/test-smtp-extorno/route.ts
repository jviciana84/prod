import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 === PRUEBA SMTP EXTORNO ===")
    
    // Verificar variables de entorno
    const requiredVars = {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASSWORD: process.env.SMTP_PASSWORD,
      EXTORNO_EMAIL: process.env.EXTORNO_EMAIL,
    }

    console.log("📋 Variables de entorno:", {
      SMTP_HOST: requiredVars.SMTP_HOST ? "✅ Configurado" : "❌ Faltante",
      SMTP_USER: requiredVars.SMTP_USER ? "✅ Configurado" : "❌ Faltante",
      SMTP_PASSWORD: requiredVars.SMTP_PASSWORD ? "✅ Configurado" : "❌ Faltante",
      EXTORNO_EMAIL: requiredVars.EXTORNO_EMAIL ? "✅ Configurado" : "❌ Faltante",
    })

    // Verificar que todas las variables estén configuradas
    const missingVars = Object.entries(requiredVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key)

    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Variables de entorno faltantes: ${missingVars.join(", ")}`,
        missingVars,
      }, { status: 400 })
    }

    // Configurar transporter
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

    console.log("🔧 Transporter configurado")

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

    // Enviar email de prueba
    const testEmail = {
      from: `"Sistema de Extornos CVO" <${process.env.EXTORNO_EMAIL}>`,
      to: process.env.EXTORNO_EMAIL, // Enviar a sí mismo para prueba
      subject: "🧪 Prueba SMTP - Sistema de Extornos",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10B981;">✅ Prueba SMTP Exitosa</h2>
          <p>El sistema de emails de extornos está funcionando correctamente.</p>
          <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Configuración Verificada:</h3>
            <ul>
              <li><strong>Servidor SMTP:</strong> ${process.env.SMTP_HOST}</li>
              <li><strong>Puerto:</strong> ${process.env.SMTP_PORT || "465"}</li>
              <li><strong>Usuario:</strong> ${process.env.SMTP_USER}</li>
              <li><strong>Email de extornos:</strong> ${process.env.EXTORNO_EMAIL}</li>
            </ul>
          </div>
          <p><strong>Fecha de prueba:</strong> ${new Date().toLocaleString("es-ES")}</p>
        </div>
      `,
      text: "Prueba SMTP exitosa - Sistema de Extornos CVO",
    }

    console.log("📧 Enviando email de prueba...")
    const result = await transporter.sendMail(testEmail)
    
    console.log("✅ Email de prueba enviado exitosamente:", result.messageId)

    return NextResponse.json({
      success: true,
      message: "Prueba SMTP exitosa",
      messageId: result.messageId,
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || "465",
        user: process.env.SMTP_USER,
        from: process.env.EXTORNO_EMAIL,
      },
    })

  } catch (error) {
    console.error("❌ Error en prueba SMTP:", error)
    return NextResponse.json({
      success: false,
      message: "Error en prueba SMTP",
      error: error.message,
    }, { status: 500 })
  }
} 