import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import fs from "fs/promises"
import path from "path"
import { APP_CONFIG, ASSETS } from "@/lib/config"

export async function POST(request: Request) {
  try {
    console.log("🧪 === PROBANDO EMAIL DE BIENVENIDA ===")
    
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        message: "Email es requerido" 
      }, { status: 400 })
    }
    
    console.log("📧 Enviando email de prueba a:", email)
    
    // Verificar configuración SMTP
    console.log("🔧 Configuración SMTP:")
    console.log("- SMTP_HOST:", process.env.SMTP_HOST)
    console.log("- SMTP_PORT:", process.env.SMTP_PORT)
    console.log("- SMTP_USER:", process.env.SMTP_USER)
    console.log("- SMTP_PASSWORD:", process.env.SMTP_PASSWORD ? "✅ Definida" : "❌ No definida")
    console.log("- SMTP_FROM_EMAIL:", process.env.SMTP_FROM_EMAIL)
    console.log("- SMTP_FROM_NAME:", process.env.SMTP_FROM_NAME)
    
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return NextResponse.json({
        success: false,
        message: "Configuración SMTP incompleta",
        missing: {
          host: !process.env.SMTP_HOST,
          user: !process.env.SMTP_USER,
          password: !process.env.SMTP_PASSWORD
        }
      }, { status: 500 })
    }
    
    // Configurar transporter (misma configuración que material/llaves)
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
    
    console.log("🔗 Verificando conexión SMTP...")
    await transporter.verify()
    console.log("✅ Conexión SMTP verificada")
    
    // Leer plantilla
    const templatePath = path.resolve(process.cwd(), "lib/email-templates/invitation-template.html")
    console.log("📄 Leyendo plantilla desde:", templatePath)
    let htmlTemplate = await fs.readFile(templatePath, "utf-8")
    
    // Reemplazar placeholders
    htmlTemplate = htmlTemplate.replace(/{{APP_NAME}}/g, APP_CONFIG.name)
    htmlTemplate = htmlTemplate.replace(/{{APP_LOGO_URL}}/g, ASSETS.LOGO)
    htmlTemplate = htmlTemplate.replace(/{{ACTION_URL}}/g, "https://www.controlvo.ovh/auth/reset-password?token=test")
    htmlTemplate = htmlTemplate.replace(/{{CURRENT_YEAR}}/g, new Date().getFullYear().toString())
    htmlTemplate = htmlTemplate.replace(/{{COMPANY_ADDRESS}}/g, APP_CONFIG.companyAddress || "Dirección no configurada")
    htmlTemplate = htmlTemplate.replace(/{{APP_URL}}/g, "https://www.controlvo.ovh")
    
    // Configurar email FROM (mismo formato que material/llaves)
    const fromEmail = process.env.SMTP_USER || "material@controlvo.ovh"
    const fromName = "Sistema CVO - Usuarios"
    
    console.log("📤 Configurando email FROM:")
    console.log("- Email:", fromEmail)
    console.log("- Name:", fromName)
    
    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: `[PRUEBA] Invitación para unirte a ${APP_CONFIG.name}`,
      html: htmlTemplate,
    }
    
    console.log("📧 Enviando email...")
    const info = await transporter.sendMail(mailOptions)
    console.log("✅ Email enviado exitosamente. Message ID:", info.messageId)
    
    return NextResponse.json({
      success: true,
      message: "Email de prueba enviado exitosamente",
      messageId: info.messageId,
      from: fromEmail,
      to: email
    })
    
  } catch (error: any) {
    console.error("❌ Error enviando email de prueba:", error)
    return NextResponse.json({
      success: false,
      message: "Error enviando email de prueba",
      error: error.message,
      details: {
        name: error.name,
        code: error.code,
        command: error.command
      }
    }, { status: 500 })
  }
}
