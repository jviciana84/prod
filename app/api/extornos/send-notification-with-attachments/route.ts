import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import nodemailer from "nodemailer"
import { getEmailTemplate } from "@/lib/email-templates/email-styles"
import {
  generateRegistroEmailHTML,
  generateTramitacionEmailHTML,
  generateConfirmacionEmailHTML,
  generateRechazoEmailHTML,
} from "@/lib/email-templates/extorno-email-templates"

// Función para generar la tabla HTML de adjuntos
function generateAdjuntosTable(documentos: any[] = []) {
  if (!documentos.length) return ''
  return `
    <h3 style="background:#0097a7;color:#fff;padding:8px 12px;margin:24px 0 0 0;font-size:1.1em;">DOCUMENTOS ADJUNTOS (${documentos.length})</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <thead>
        <tr style="background:#e0e0e0;">
          <th style="padding:6px 10px;text-align:left;">Documento</th>
          <th style="padding:6px 10px;text-align:left;">Tamaño</th>
          <th style="padding:6px 10px;text-align:left;">Fecha</th>
          <th style="padding:6px 10px;text-align:left;">Acción</th>
        </tr>
      </thead>
      <tbody>
        ${documentos.map(doc => `
          <tr>
            <td style="padding:6px 10px;">
              <span style="font-size:1.1em;">📄</span> ${doc.nombre}
            </td>
            <td style="padding:6px 10px;">${(doc.tamaño/1024).toFixed(2)} KB</td>
            <td style="padding:6px 10px;">${doc.subido_en ? new Date(doc.subido_en).toLocaleDateString() : ''}</td>
            <td style="padding:6px 10px;"><a href="${doc.url}" target="_blank">Ver documento</a></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

export async function POST(request: NextRequest) {
  try {
    // Asegúrate de que los nombres de los campos coincidan con lo que envía el frontend
    const { extorno_id, tipo, recipientEmail } = await request.json()

    console.log("📧 === INICIO ENVÍO EMAIL EXTORNO CON ADJUNTOS ===")
    console.log("📧 ID de extorno:", extorno_id)
    console.log("📧 Tipo de email:", tipo)
    console.log("📧 Email del destinatario (opcional):", recipientEmail)

    if (!extorno_id || !tipo) {
      console.error("❌ Faltan campos requeridos: extorno_id, tipo")
      return NextResponse.json({ error: "Missing required fields: extorno_id, tipo" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar usuario autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("❌ Usuario no autenticado:", authError)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    console.log("✅ Usuario autenticado:", user.email)

    // Obtener datos del extorno
    const { data: extorno, error: extornoError } = await supabase
      .from("extornos")
      .select("*")
      .eq("id", extorno_id)
      .single()

    if (extornoError || !extorno) {
      console.error("❌ Error obteniendo extorno:", extornoError)
      return NextResponse.json({ error: "Extorno not found" }, { status: 404 })
    }
    console.log("📦 Datos de extorno:", extorno)

    // Obtener configuración de email de extornos
    let config = null
    const { data: configs, error: configError } = await supabase.from("extornos_email_config").select("*").limit(1)

    if (configError) {
      console.error("❌ Error obteniendo configuración de extornos:", configError)
      return NextResponse.json({ error: "Error obteniendo configuración de email" }, { status: 500 })
    }

    if (configs && configs.length > 0) {
      config = configs[0]
      console.log("✅ Configuración de extornos obtenida exitosamente:", config)
    } else {
      console.log("📧 No se encontró configuración de extornos. Usando valores por defecto.")
      config = {
        enabled: true,
        email_tramitador: process.env.EXTORNO_EMAIL || "tramitador@example.com",
        email_pagador: "pagador@example.com", // Default if not set
        cc_emails: [],
      }
    }

    if (!config.enabled) {
      console.log("⚠️ Envío de emails de extornos deshabilitado")
      return NextResponse.json({ error: "Envío de emails deshabilitado" }, { status: 400 })
    }

    // Verificar variables SMTP para extornos
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD || !process.env.EXTORNO_EMAIL) {
      console.error("❌ Configuración SMTP o de remitente de extornos incompleta")
      return NextResponse.json({ error: "Configuración SMTP o de remitente de extornos incompleta" }, { status: 500 })
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
    })

    // Verificar conexión SMTP
    try {
      await transporter.verify()
      console.log("✅ Conexión SMTP verificada para extornos")
    } catch (verifyError) {
      console.error("❌ Error verificando conexión SMTP:", verifyError)
      return NextResponse.json({ error: "Error de conexión SMTP" }, { status: 500 })
    }

    // Preparar destinatarios
    const toRecipients = new Set<string>()
    const ccRecipients = new Set<string>(config.cc_emails || [])

    // Obtener el email del usuario que creó el extorno
    const { data: creatorProfile, error: creatorError } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", extorno.created_by)
      .single()

    if (creatorError || !creatorProfile) {
      console.warn("⚠️ No se pudo obtener el email del creador del extorno. Usando email del usuario actual.")
      toRecipients.add(user.email || "") // Fallback al email del usuario actual
    } else {
      toRecipients.add(creatorProfile.email || "")
    }

    // Añadir destinatarios según el tipo de email y configuración
    if (tipo === "registro") {
      if (config.email_tramitador) toRecipients.add(config.email_tramitador)
    } else if (tipo === "tramitacion") {
      if (config.email_tramitador) toRecipients.add(config.email_tramitador)
      if (config.email_pagador) toRecipients.add(config.email_pagador)
    } else if (tipo === "confirmacion" || tipo === "rechazo") {
      // Estos emails van a todos los involucrados
      if (config.email_tramitador) toRecipients.add(config.email_tramitador)
      if (config.email_pagador) toRecipients.add(config.email_pagador)
    }

    // Si se especificó un recipientEmail (para pruebas o reenvíos específicos)
    if (recipientEmail) {
      toRecipients.clear() // Limpiar TOs si se especifica uno
      toRecipients.add(recipientEmail)
      ccRecipients.clear() // Limpiar CCs también para un envío de prueba directo
    }

    const finalTo = Array.from(toRecipients).join(",")
    const finalCc = Array.from(ccRecipients).join(",")

    if (!finalTo && !finalCc) {
      console.error("❌ No hay destinatarios configurados para el email de extorno.")
      return NextResponse.json({ error: "No hay destinatarios configurados" }, { status: 400 })
    }

    // Obtener el perfil del usuario que registró el extorno
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

    // Obtener el perfil del usuario que tramitó el extorno
    let tramitado_por_nombre = "Usuario desconocido"
    let tramitado_por_id = extorno.tramitado_por || "-"
    if (extorno.tramitado_por) {
      const { data: tramitadorProfile, error: tramitadorProfileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", extorno.tramitado_por)
        .single()
      if (!tramitadorProfileError && tramitadorProfile && tramitadorProfile.full_name) {
        tramitado_por_nombre = tramitadorProfile.full_name
      }
    }

    // --- Corrección para RECHAZO: obtener nombre y motivo de rechazo ---
    let rechazado_por_nombre = "Usuario desconocido"
    let rechazado_por_id = extorno.rechazado_por || "-"
    let motivo_rechazo = extorno.motivo_rechazo || "Sin comentario"

    // Si el body trae datos explícitos (por ejemplo desde el frontend), usarlos
    const body = await request.json().catch(() => null)
    if (body) {
      if (body.usuario_rechaza_nombre) {
        rechazado_por_nombre = body.usuario_rechaza_nombre
      } else if (rechazado_por_id && rechazado_por_id !== "-") {
        // Buscar en profiles si no viene en el body
        const { data: rechazaProfile, error: rechazaProfileError } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", rechazado_por_id)
          .single()
        if (!rechazaProfileError && rechazaProfile && rechazaProfile.full_name) {
          rechazado_por_nombre = rechazaProfile.full_name
        }
      }
      if (body.motivo_rechazo) {
        motivo_rechazo = body.motivo_rechazo
      }
    } else if (rechazado_por_id && rechazado_por_id !== "-") {
      // Buscar en profiles si no viene en el body
      const { data: rechazaProfile, error: rechazaProfileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", rechazado_por_id)
        .single()
      if (!rechazaProfileError && rechazaProfile && rechazaProfile.full_name) {
        rechazado_por_nombre = rechazaProfile.full_name
      }
    }

    // Preparar los datos para la plantilla de email de registro o rechazo
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
      // Campos específicos para tramitación:
      tramitado_por_nombre,
      tramitado_por_id,
      fecha_tramitacion: extorno.fecha_tramitacion,
      // Campos específicos para rechazo:
      rechazado_por: rechazado_por_id,
      rechazado_por_nombre,
      motivo_rechazo,
    }

    let htmlContent: string
    let subject: string
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
    const confirmationLink = `${siteUrl}/extornos/confirmacion?token=${extorno.confirmation_token}`

    // Recopilar todos los documentos adjuntos
    let documentosAdjuntos: any[] = []
    if (Array.isArray(extorno.documentos_adjuntos)) {
      documentosAdjuntos = documentosAdjuntos.concat(extorno.documentos_adjuntos)
    }
    if (Array.isArray(extorno.documentos_tramitacion)) {
      documentosAdjuntos = documentosAdjuntos.concat(extorno.documentos_tramitacion)
    }
    // Compatibilidad con campos antiguos
    [1,2,3].forEach(n => {
      if (extorno[`documento_${n}_url`] && extorno[`documento_${n}_nombre`]) {
        documentosAdjuntos.push({
          nombre: extorno[`documento_${n}_nombre`],
          url: extorno[`documento_${n}_url`],
          tamaño: extorno[`documento_${n}_tamaño`] || 0,
          subido_en: extorno[`documento_${n}_fecha`] || extorno.created_at
        })
      }
    })
    // Preparar adjuntos para nodemailer
    const attachments = documentosAdjuntos.map(doc => ({
      filename: doc.nombre,
      path: doc.url
    }))

    // Generar la tabla HTML de adjuntos ANTES del switch
    const tablaAdjuntos = generateAdjuntosTable(documentosAdjuntos);

    switch (tipo) {
      case "registro":
        htmlContent = generateRegistroEmailHTML(datosRegistro, tablaAdjuntos)
        subject = `Nueva Solicitud de Extorno #${extorno.id} - ${extorno.matricula}`
        break
      case "tramitacion":
        htmlContent = generateTramitacionEmailHTML(datosRegistro)
        subject = `✅ Extorno #${extorno.id} Tramitado - ${extorno.matricula}`
        break
      case "confirmacion":
        htmlContent = generateConfirmacionEmailHTML(datosRegistro)
        subject = `✅ Extorno #${extorno.id} Confirmado - ${extorno.matricula}`
        break
      case "rechazo":
        htmlContent = generateRechazoEmailHTML(datosRegistro)
        subject = `❌ Extorno #${extorno.id} Rechazado - ${extorno.matricula}`
        break
      default:
        return NextResponse.json({ error: "Invalid email type" }, { status: 400 })
    }

    const mailOptions = {
      from: `"Sistema de Extornos CVO" <${process.env.EXTORNO_EMAIL}>`,
      to: finalTo,
      cc: finalCc || undefined,
      subject: subject,
      html: htmlContent,
      text: `Notificación de Extorno #${extorno.id} - ${extorno.matricula}`,
      attachments: attachments.length > 0 ? attachments : undefined,
    }

    console.log("📧 Opciones del email de extorno con adjuntos:", {
      from: mailOptions.from,
      to: mailOptions.to,
      cc: mailOptions.cc,
      subject: mailOptions.subject,
      attachmentsCount: attachments.length,
    })

    const result = await transporter.sendMail(mailOptions)
    console.log("✅ Email de extorno con adjuntos enviado exitosamente:", result.messageId)

    // Actualizar estado del extorno si es necesario (solo para tramitación y confirmación)
    if (tipo === "tramitacion" && extorno.estado === "pendiente") {
      const { error: updateError } = await supabase.from("extornos").update({ estado: "tramitado" }).eq("id", extorno_id)
      if (updateError) console.error("❌ Error actualizando estado a 'tramitado':", updateError)
    } else if (tipo === "confirmacion" && extorno.estado === "tramitado") {
      const { error: updateError } = await supabase.from("extornos").update({ estado: "realizado" }).eq("id", extorno_id)
      if (updateError) console.error("❌ Error actualizando estado a 'realizado':", updateError)
    } else if (tipo === "rechazo" && extorno.estado !== "rechazado") {
      const { error: updateError } = await supabase.from("extornos").update({ estado: "rechazado" }).eq("id", extorno_id)
      if (updateError) console.error("❌ Error actualizando estado a 'rechazado':", updateError)
    }

    console.log("📧 === FIN ENVÍO EMAIL EXTORNO CON ADJUNTOS ===")

    return NextResponse.json({
      success: true,
      message: "Email de extorno con adjuntos enviado exitosamente",
      messageId: result.messageId,
      recipients: { to: finalTo, cc: finalCc },
    })
  } catch (error) {
    console.error("❌ Error crítico enviando email de extorno con adjuntos:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error crítico enviando email con adjuntos",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
