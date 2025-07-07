import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function GET() {
  try {
    console.log("🔍 === DEBUG CONFIGURACIÓN SMTP ===")
    
    // Verificar variables de entorno
    const config = {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASSWORD: process.env.SMTP_PASSWORD ? "***CONFIGURADO***" : "NO CONFIGURADO",
      EXTORNO_EMAIL: process.env.EXTORNO_EMAIL,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    }
    
    console.log("📧 Configuración SMTP:", config)
    
    // Verificar si faltan variables
    const missingVars = []
    if (!process.env.SMTP_HOST) missingVars.push("SMTP_HOST")
    if (!process.env.SMTP_USER) missingVars.push("SMTP_USER")
    if (!process.env.SMTP_PASSWORD) missingVars.push("SMTP_PASSWORD")
    if (!process.env.EXTORNO_EMAIL) missingVars.push("EXTORNO_EMAIL")
    
    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        message: "Variables de entorno faltantes",
        missing: missingVars,
        config: config,
      }, { status: 400 })
    }
    
    // Intentar crear transporter
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
    
    // Verificar conexión
    try {
      await transporter.verify()
      console.log("✅ Conexión SMTP verificada correctamente")
      
      return NextResponse.json({
        success: true,
        message: "Configuración SMTP correcta",
        config: config,
        connection: "OK",
      })
      
    } catch (verifyError) {
      console.error("❌ Error verificando conexión SMTP:", verifyError)
      
      return NextResponse.json({
        success: false,
        message: "Error de conexión SMTP",
        error: verifyError.message,
        config: config,
        connection: "FAILED",
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error("❌ Error crítico en debug-smtp-config:", error)
    return NextResponse.json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    }, { status: 500 })
  }
} 