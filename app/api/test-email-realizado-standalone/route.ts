import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import nodemailer from "nodemailer"
import { generateRealizadoEmailHTML } from "@/lib/email-templates/extorno-email-templates"

export async function POST(request: NextRequest) {
  try {
    const { extorno_id } = await request.json()

    if (!extorno_id) {
      return NextResponse.json({
        success: false,
        message: "extorno_id requerido",
      }, { status: 400 })
    }

    console.log("🧪 === PRUEBA EMAIL REALIZADO STANDALONE ===")
    console.log("📧 ID de extorno:", extorno_id)

    const supabase = await createClient()

    // Obtener datos del extorno
    const { data: extorno, error: extornoError } = await supabase
      .from("extornos")
      .select("*")
      .eq("id", extorno_id)
      .single()

    if (extornoError || !extorno) {
      console.error("❌ Error obteniendo extorno:", extornoError)
      return NextResponse.json({
        success: false,
        message: "Extorno no encontrado",
      }, { status: 404 })
    }

    console.log("📦 Datos de extorno:", {
      id: extorno.id,
      matricula: extorno.matricula,
      estado: extorno.estado,
      justificante_url: extorno.justificante_url,
      justificante_nombre: extorno.justificante_nombre,
    })

    // Verificar configuración SMTP
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD || !process.env.EXTORNO_EMAIL) {
      console.error("❌ Configuración SMTP incompleta")
      return NextResponse.json({
        success: false,
        message: "Configuración SMTP incompleta",
        error: "Faltan variables de entorno SMTP",
      }, { status: 500 })
    }

    // Configurar transporter
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

    // Obtener configuración de email de extornos
    let config = null
    const { data: configs, error: configError } = await supabase.from("extornos_email_config").select("*").limit(1)

    if (configError) {
      console.error("❌ Error obteniendo configuración de extornos:", configError)
      return NextResponse.json({ error: "Error obteniendo configuración de email" }, { status: 500 })
    }

    if (configs && configs.length > 0) {
      config = configs[0]
      console.log("✅ Configuración de extornos obtenida:", config)
    } else {
      console.log("📧 Usando configuración por defecto")
      config = {
        enabled: true,
        email_tramitador: process.env.EXTORNO_EMAIL,
        email_pagador: process.env.EXTORNO_EMAIL,
        cc_emails: [],
      }
    }

    if (!config.enabled) {
      console.log("⚠️ Envío de emails de extornos deshabilitado")
      return NextResponse.json({ error: "Envío de emails deshabilitado" }, { status: 400 })
    }

    // Preparar destinatarios
    const toRecipients = new Set<string>()
    const ccRecipients = new Set<string>(config.cc_emails || [])

    // Agregar destinatarios según configuración
    if (config.email_tramitador) toRecipients.add(config.email_tramitador)
    if (config.email_pagador) toRecipients.add(config.email_pagador)

    const finalTo = Array.from(toRecipients).join(",")
    const finalCc = Array.from(ccRecipients).join(",")

    if (!finalTo && !finalCc) {
      console.error("❌ No hay destinatarios configurados")
      return NextResponse.json({ error: "No hay destinatarios configurados" }, { status: 400 })
    }

    // Obtener datos del usuario que registró el extorno
    let registrado_por_nombre = "Usuario desconocido"
    let registrado_por_id = extorno.solicitado_por || "-"
    if (extorno.solicitado_por) {
      const { data: userProfile, error: userProfileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", extorno.solicitado_por)
        .single()
      if (!userProfileError && userProfile && userProfile.full_name) {
        registrado_por_nombre = userProfile.full_name
      }
    }

    // Preparar datos para la plantilla
    const datosRegistro = {
      id: extorno.solicitado_por || "-",
      matricula: extorno.matricula,
      cliente: extorno.cliente,
      asesor: extorno.solicitado_por || "-",
      importe: extorno.importe,
      motivo: extorno.concepto,
      observaciones: extorno.motivo_rechazo,
      fecha_solicitud: extorno.fecha_solicitud,
      estado: extorno.estado,
      confirmation_token: extorno.confirmation_token,
      numero_cliente: extorno.numero_cliente,
      concesion: extorno.concesion,
      numero_cuenta: extorno.numero_cuenta,
      registrado_por_nombre,
      registrado_por_id,
      created_at: extorno.created_at,
    }

    // Generar contenido del email
    const htmlContent = generateRealizadoEmailHTML(datosRegistro, extorno.justificante_url, extorno.justificante_nombre)
    const subject = `✅ Extorno #${extorno.id} Realizado - ${extorno.matricula}`

    // Preparar adjuntos
    const attachments = extorno.justificante_url ? [{
      filename: extorno.justificante_nombre || "Justificante de Pago",
      path: extorno.justificante_url
    }] : []

    // Enviar email
    const mailOptions = {
      from: `"Sistema de Extornos CVO - PRUEBA" <${process.env.EXTORNO_EMAIL}>`,
      to: finalTo,
      cc: finalCc || undefined,
      subject: subject,
      html: htmlContent,
      attachments: attachments,
    }

    console.log("📧 Enviando email de realizado:")
    console.log("  - From:", mailOptions.from)
    console.log("  - To:", mailOptions.to)
    console.log("  - CC:", mailOptions.cc)
    console.log("  - Subject:", mailOptions.subject)
    console.log("  - Adjuntos:", attachments.length)

    const result = await transporter.sendMail(mailOptions)
    
    console.log("✅ Email de realizado enviado exitosamente:", result.messageId)

    return NextResponse.json({
      success: true,
      message: "Email de realizado enviado correctamente",
      messageId: result.messageId,
      recipients: { to: finalTo, cc: finalCc },
      attachmentsCount: attachments.length,
      debug: {
        extorno_id: extorno.id,
        has_justificante: !!extorno.justificante_url,
        justificante_nombre: extorno.justificante_nombre,
      }
    })

  } catch (error) {
    console.error("❌ Error crítico en test-email-realizado-standalone:", error)
    return NextResponse.json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    }, { status: 500 })
  }
} 