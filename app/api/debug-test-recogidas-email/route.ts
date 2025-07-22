import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  const results = {
    timestamp: new Date().toISOString(),
    steps: [] as any[],
    errors: [] as any[],
    success: false,
    emailSent: false
  }

  const addStep = (step: string, data?: any) => {
    results.steps.push({ step, data, timestamp: new Date().toISOString() })
  }

  const addError = (error: string, details?: any) => {
    results.errors.push({ error, details, timestamp: new Date().toISOString() })
  }

  try {
    addStep("Iniciando prueba de email de recogidas")

    // 1. Verificar conexión a Supabase
    addStep("Verificando conexión a Supabase")
    const cookieStore = await cookies()
    const supabase = await createServerClient()

    // 2. Verificar autenticación
    addStep("Verificando autenticación")
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      addError("Error de autenticación", userError)
      return NextResponse.json(results, { status: 401 })
    }
    addStep("Usuario autenticado", { userId: user.id, email: user.email })

    // 3. Verificar configuración de email
    addStep("Verificando configuración de email")
    const { data: emailConfig, error: configError } = await supabase
      .from("recogidas_email_config")
      .select("*")
      .single()

    if (configError) {
      addError("Error obteniendo configuración", configError)
      return NextResponse.json(results, { status: 500 })
    }

    if (!emailConfig) {
      addError("No se encontró configuración de email")
      return NextResponse.json(results, { status: 404 })
    }

    addStep("Configuración encontrada", {
      enabled: emailConfig.enabled,
      email_agencia: emailConfig.email_agencia,
      email_remitente: emailConfig.email_remitente,
      nombre_remitente: emailConfig.nombre_remitente,
      asunto_template: emailConfig.asunto_template
    })

    if (!emailConfig.enabled) {
      addError("Configuración de email deshabilitada")
      return NextResponse.json(results, { status: 400 })
    }

    // 4. Verificar variables de entorno SMTP
    addStep("Verificando variables SMTP")
    const smtpVars = {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASSWORD: process.env.SMTP_PASSWORD ? "***CONFIGURADO***" : "NO CONFIGURADO"
    }

    addStep("Variables SMTP", smtpVars)

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      addError("Variables SMTP incompletas", smtpVars)
      return NextResponse.json(results, { status: 500 })
    }

    // 5. Verificar recogidas pendientes
    addStep("Verificando recogidas pendientes")
    const { data: recogidasPendientes, error: pendientesError } = await supabase
      .from("recogidas_pendientes")
      .select("count")
      .single()

    if (pendientesError) {
      addError("Error contando recogidas pendientes", pendientesError)
    } else {
      addStep("Recogidas pendientes", { count: recogidasPendientes?.count || 0 })
    }

    // 6. Verificar recogidas en historial
    addStep("Verificando recogidas en historial")
    const { data: recogidasHistorial, error: historialError } = await supabase
      .from("recogidas_historial")
      .select("count")
      .single()

    if (historialError) {
      addError("Error contando recogidas en historial", historialError)
    } else {
      addStep("Recogidas en historial", { count: recogidasHistorial?.count || 0 })
    }

    // 7. Probar conexión SMTP
    addStep("Probando conexión SMTP")
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

    try {
      await transporter.verify()
      addStep("Conexión SMTP exitosa")
    } catch (verifyError) {
      addError("Error de conexión SMTP", verifyError.message)
      return NextResponse.json(results, { status: 500 })
    }

    // 8. Enviar email de prueba
    addStep("Enviando email de prueba")
    const testMailOptions = {
      from: `${emailConfig.nombre_remitente} <${emailConfig.email_remitente}>`,
      to: emailConfig.email_agencia,
      subject: "PRUEBA - Sistema de Recogidas CVO",
      text: `Este es un email de prueba del sistema de recogidas.
      
Fecha: ${new Date().toLocaleString('es-ES')}
Usuario: ${user.email}
Configuración: ${emailConfig.enabled ? 'Habilitada' : 'Deshabilitada'}

Si recibes este email, el sistema de envío funciona correctamente.`,
      html: `
        <h2>PRUEBA - Sistema de Recogidas CVO</h2>
        <p>Este es un email de prueba del sistema de recogidas.</p>
        <ul>
          <li><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</li>
          <li><strong>Usuario:</strong> ${user.email}</li>
          <li><strong>Configuración:</strong> ${emailConfig.enabled ? 'Habilitada' : 'Deshabilitada'}</li>
        </ul>
        <p>Si recibes este email, el sistema de envío funciona correctamente.</p>
      `
    }

    try {
      const result = await transporter.sendMail(testMailOptions)
      addStep("Email de prueba enviado exitosamente", { messageId: result.messageId })
      results.emailSent = true
      results.success = true
    } catch (emailError) {
      addError("Error enviando email de prueba", emailError.message)
      return NextResponse.json(results, { status: 500 })
    }

    return NextResponse.json(results)

  } catch (error) {
    addError("Error general", error.message)
    return NextResponse.json(results, { status: 500 })
  }
} 