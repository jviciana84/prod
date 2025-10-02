import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🧪 === VERIFICANDO CONFIGURACIÓN DE EMAIL ===")
    
    // Verificar variables de entorno SMTP
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD ? "✅ Definida" : "❌ No definida",
      fromEmail: process.env.SMTP_FROM_EMAIL,
      fromName: process.env.SMTP_FROM_NAME,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL
    }
    
    console.log("📧 Configuración SMTP:", smtpConfig)
    
    // Verificar que todas las variables necesarias estén definidas
    const missingVars = []
    if (!process.env.SMTP_HOST) missingVars.push("SMTP_HOST")
    if (!process.env.SMTP_PORT) missingVars.push("SMTP_PORT")
    if (!process.env.SMTP_USER) missingVars.push("SMTP_USER")
    if (!process.env.SMTP_PASSWORD) missingVars.push("SMTP_PASSWORD")
    if (!process.env.SMTP_FROM_EMAIL) missingVars.push("SMTP_FROM_EMAIL")
    
    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        message: "Variables de entorno faltantes",
        missing: missingVars,
        config: smtpConfig
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: "Configuración de email completa",
      config: smtpConfig
    })
    
  } catch (error: any) {
    console.error("❌ Error verificando configuración:", error)
    return NextResponse.json({
      success: false,
      message: "Error verificando configuración",
      error: error.message
    }, { status: 500 })
  }
}
