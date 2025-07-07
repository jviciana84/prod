import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("🧪 === PRUEBA SIMPLE GET ===")

    // Verificar variables de entorno
    const envVars = {
      SMTP_HOST: process.env.SMTP_HOST ? "✅ Configurado" : "❌ Falta",
      SMTP_USER: process.env.SMTP_USER ? "✅ Configurado" : "❌ Falta",
      SMTP_PASSWORD: process.env.SMTP_PASSWORD ? "✅ Configurado" : "❌ Falta",
      EXTORNO_EMAIL: process.env.EXTORNO_EMAIL ? "✅ Configurado" : "❌ Falta",
      EXTORNO_PASSWORD: process.env.EXTORNO_PASSWORD ? "✅ Configurado" : "❌ Falta",
      SMTP_PORT: process.env.SMTP_PORT || "587 (default)",
    }

    console.log("📧 Variables de entorno:", envVars)

    return NextResponse.json({
      success: true,
      message: "Test simple OK",
      diagnostico: {
        variables_entorno: envVars,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("❌ Error en test simple:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 === PRUEBA SIMPLE POST ===")

    const body = await request.json()
    const { test } = body

    console.log(`🧪 Ejecutando test: ${test}`)

    const supabase = createClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: "Usuario no autenticado",
        user: null,
      })
    }

    switch (test) {
      case "email_config":
        return await testEmailConfig(supabase)
      case "database":
        return await testDatabase(supabase)
      case "smtp":
        return await testSMTP()
      default:
        return NextResponse.json({
          success: false,
          error: "Tipo de test no válido",
        })
    }
  } catch (error) {
    console.error("❌ Error en test simple:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    })
  }
}

async function testEmailConfig(supabase: any) {
  try {
    console.log("🧪 Probando configuración de email...")

    // Verificar tabla extornos_email_config
    const { data: config, error: configError } = await supabase.from("extornos_email_config").select("*").single()

    if (configError) {
      console.error("❌ Error obteniendo config:", configError)
      return NextResponse.json({
        success: false,
        error: "Error obteniendo configuración de email",
        details: configError.message,
        config: null,
      })
    }

    // Verificar variables de entorno
    const envVars = {
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_PORT: !!process.env.SMTP_PORT,
      SMTP_USER: !!process.env.SMTP_USER,
      SMTP_PASSWORD: !!process.env.SMTP_PASSWORD,
      EXTORNO_EMAIL: !!process.env.EXTORNO_EMAIL,
      EXTORNO_PASSWORD: !!process.env.EXTORNO_PASSWORD,
    }

    console.log("✅ Configuración de email OK")

    return NextResponse.json({
      success: true,
      message: "Configuración de email correcta",
      config: config,
      envVars: envVars,
    })
  } catch (error) {
    console.error("❌ Error en testEmailConfig:", error)
    return NextResponse.json({
      success: false,
      error: "Error crítico en test de email config",
      details: error.message,
    })
  }
}

async function testDatabase(supabase: any) {
  try {
    console.log("🧪 Probando base de datos...")

    // Verificar que existen las columnas necesarias
    const { data: extornos, error: extornosError } = await supabase
      .from("extornos")
      .select("id, documentos_adjuntos, documentos_tramitacion, created_by")
      .limit(1)

    if (extornosError) {
      console.error("❌ Error verificando tabla extornos:", extornosError)
      return NextResponse.json({
        success: false,
        error: "Error verificando tabla extornos",
        details: extornosError.message,
      })
    }

    // Contar extornos
    const { count, error: countError } = await supabase.from("extornos").select("*", { count: "exact", head: true })

    return NextResponse.json({
      success: true,
      message: "Base de datos OK",
      database: {
        extornos_count: count || 0,
        columns_verified: true,
        count_error: countError?.message,
      },
    })
  } catch (error) {
    console.error("❌ Error en testDatabase:", error)
    return NextResponse.json({
      success: false,
      error: "Error crítico en test de base de datos",
      details: error.message,
    })
  }
}

async function testSMTP() {
  try {
    console.log("🧪 Probando conexión SMTP...")

    const nodemailer = require("nodemailer")

    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.EXTORNO_EMAIL || process.env.SMTP_USER,
        pass: process.env.EXTORNO_PASSWORD || process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })

    // Verificar conexión
    await transporter.verify()

    console.log("✅ Conexión SMTP OK")

    return NextResponse.json({
      success: true,
      message: "Conexión SMTP correcta",
      smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.EXTORNO_EMAIL || process.env.SMTP_USER,
        secure: process.env.SMTP_PORT === "465",
      },
    })
  } catch (error) {
    console.error("❌ Error en testSMTP:", error)
    return NextResponse.json({
      success: false,
      error: "Error de conexión SMTP",
      details: error.message,
    })
  }
}
