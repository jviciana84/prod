import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import nodemailer from "nodemailer"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerClient()

    // Verificar autenticación
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const results = {
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email
      },
      smtpConfig: {} as any,
      emailConfig: {} as any,
      tests: {} as any,
      errors: [] as any[]
    }

    // 1. Verificar variables de entorno SMTP
    results.smtpConfig = {
      SMTP_HOST: process.env.SMTP_HOST ? "✅ Configurado" : "❌ No configurado",
      SMTP_PORT: process.env.SMTP_PORT ? `✅ ${process.env.SMTP_PORT}` : "❌ No configurado",
      SMTP_USER: process.env.SMTP_USER ? "✅ Configurado" : "❌ No configurado",
      SMTP_PASSWORD: process.env.SMTP_PASSWORD ? "✅ Configurado" : "❌ No configurado"
    }

    // 2. Obtener configuración de email
    try {
      const { data: emailConfig, error: emailError } = await supabase
        .from("recogidas_email_config")
        .select("*")
        .single()

      if (emailError) {
        results.errors.push({
          operation: "email_config",
          error: emailError.message,
          code: emailError.code
        })
      } else {
        results.emailConfig = {
          enabled: emailConfig.enabled,
          email_agencia: emailConfig.email_agencia,
          email_remitente: emailConfig.email_remitente,
          nombre_remitente: emailConfig.nombre_remitente,
          asunto_template: emailConfig.asunto_template
        }
      }
    } catch (error) {
      results.errors.push({
        operation: "email_config",
        error: "Error obteniendo configuración de email",
        details: error
      })
    }

    // 3. Probar conexión SMTP
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      try {
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

        await transporter.verify()
        results.tests.smtpConnection = "✅ Conexión SMTP exitosa"
      } catch (error) {
        results.tests.smtpConnection = "❌ Error de conexión SMTP"
        results.errors.push({
          operation: "smtp_connection",
          error: "Error de conexión SMTP",
          details: error
        })
      }
    } else {
      results.tests.smtpConnection = "❌ Variables SMTP incompletas"
    }

    // 4. Probar envío de email de prueba
    if (results.tests.smtpConnection === "✅ Conexión SMTP exitosa" && results.emailConfig.email_agencia) {
      try {
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

        const mailOptions = {
          from: `${results.emailConfig.nombre_remitente} <${results.emailConfig.email_remitente}>`,
          to: results.emailConfig.email_agencia,
          subject: "Prueba de configuración SMTP - Sistema CVO",
          text: "Este es un email de prueba para verificar la configuración SMTP del sistema de recogidas.",
          html: "<h1>Prueba de Configuración SMTP</h1><p>Este es un email de prueba para verificar la configuración SMTP del sistema de recogidas.</p>"
        }

        const result = await transporter.sendMail(mailOptions)
        results.tests.emailTest = "✅ Email de prueba enviado correctamente"
        results.tests.messageId = result.messageId
      } catch (error) {
        results.tests.emailTest = "❌ Error enviando email de prueba"
        results.errors.push({
          operation: "email_test",
          error: "Error enviando email de prueba",
          details: error
        })
      }
    } else {
      results.tests.emailTest = "❌ No se puede probar (SMTP o configuración incompleta)"
    }

    return NextResponse.json(results)

  } catch (error) {
    return NextResponse.json({ 
      error: "Error interno del servidor",
      details: error
    }, { status: 500 })
  }
} 