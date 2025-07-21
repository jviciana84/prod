import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import nodemailer from "nodemailer"
import { getEmailTemplate } from "@/lib/email-templates/email-styles"
import { generateMovementEmailHTML } from "@/lib/email-templates/movement-email-templates"

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 === INICIO TEST EMAIL DOCUWARE ===")

    const supabase = await createClient()

    // Obtener configuración de email
    console.log("🧪 Obteniendo configuración de email...")
    const configResult = await supabase.from("email_config").select("*").single()

    if (configResult.error) {
      console.error("❌ Error obteniendo configuración:", configResult.error)
      return NextResponse.json({
        success: false,
        message: "Error obteniendo configuración de email",
        error: configResult.error,
      })
    }

    const config = configResult.data
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
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    })

    // Verificar conexión SMTP
    try {
      await transporter.verify()
      console.log("✅ Conexión SMTP verificada correctamente")
    } catch (verifyError) {
      console.error("❌ Error verificando conexión SMTP:", verifyError)
      return NextResponse.json({
        success: false,
        message: "Error de conexión SMTP",
        error: verifyError.message,
      })
    }

    // Datos de prueba (sin usar datos reales)
    const testMovementData = {
      fecha: new Date().toLocaleDateString('es-ES'),
      usuario_entrega: "Sistema de Prueba",
      email_entrega: "test@controlvo.ovh",
      movimientos: [
        {
          usuario_recibe: "Jordi Viciana",
          email_recibe: "jordi.viciana@munichgroup.es",
          items: [
            {
              matricula: "TEST123",
              material: "2ª Llave",
              observaciones: "Email de prueba del sistema Docuware"
            },
            {
              matricula: "TEST456", 
              material: "Ficha Técnica",
              observaciones: "Verificación del sistema de email"
            }
          ]
        }
      ]
    }

    console.log("🧪 Datos de prueba:", JSON.stringify(testMovementData, null, 2))

    // Generar HTML del email
    const emailHTML = generateMovementEmailHTML(testMovementData)
    const fullEmailHTML = getEmailTemplate(emailHTML, "Movimiento de Materiales - TEST")

    // Enviar email de prueba
    const mailOptions = {
      from: `"ControlVO" <${process.env.SMTP_USER}>`,
      to: "jordi.viciana@munichgroup.es",
      subject: "🧪 TEST - Sistema de Email Docuware",
      html: fullEmailHTML,
    }

    console.log("🧪 Enviando email de prueba...")
    const info = await transporter.sendMail(mailOptions)

    console.log("✅ Email de prueba enviado correctamente")
    console.log("🧪 Message ID:", info.messageId)
    console.log("🧪 Destinatario:", mailOptions.to)

    return NextResponse.json({
      success: true,
      message: "Email de prueba enviado correctamente",
      messageId: info.messageId,
      recipient: mailOptions.to,
      testData: testMovementData
    })

  } catch (error: any) {
    console.error("❌ Error en test de email:", error)
    return NextResponse.json({
      success: false,
      message: "Error enviando email de prueba",
      error: error.message,
    })
  }
} 