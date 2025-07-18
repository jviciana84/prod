import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import nodemailer from "nodemailer"
import { generateEntregaEmailHTML } from "@/lib/email-templates/entrega-email-templates" // Importar desde el nuevo archivo
import { formatDateForDisplay } from "@/lib/date-utils"
import { isUserAdmin } from "@/lib/auth/permissions" // Importar la función para verificar si es admin

export async function POST(request: NextRequest) {
  try {
    const { entregaId } = await request.json()

    console.log("📧 === INICIO ENVÍO EMAIL ENTREGA ===")
    console.log("📧 ID de entrega:", entregaId)

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
    console.log("👤 ID del usuario que envía el email:", user.id)

    // Obtener datos del perfil del usuario desde la tabla 'profiles', incluyendo el alias
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, alias") // ✅ Añadido 'alias'
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("❌ Error obteniendo perfil del usuario:", profileError)
      // No es un error crítico, podemos seguir con el email si no hay perfil
    }
    console.log("📋 Datos del perfil del usuario desde 'profiles':", profile)

    // Determinar el nombre a mostrar y el alias para el asunto y la comparación
    let userName = user.email // fallback
    let userAlias = user.email // fallback para el asunto y la comparación

    if (profile?.alias) {
      // ✅ Priorizar el alias del perfil
      userAlias = profile.alias
      userName = profile.full_name || profile.alias // Usar full_name si existe, sino alias
    } else if (profile?.full_name) {
      // Si no hay alias, usar full_name
      userName = profile.full_name
      userAlias = profile.full_name
    } else {
      // Si no hay full_name ni alias en profiles, intentar con user_roles como fallback secundario
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("user_name, user_alias")
        .eq("user_id", user.id)
        .single()

      if (userRole?.user_name) {
        userName = userRole.user_name
      }
      if (userRole?.user_alias) {
        userAlias = userRole.user_alias
      }
      console.log("📋 Datos del usuario desde user_roles (fallback):", userRole)
    }

    console.log("👤 Nombre del usuario (final):", userName)
    console.log("🏷️ Alias del usuario (final para comparación y asunto):", userAlias)

    // Obtener datos de la entrega
    const { data: entrega, error: entregaError } = await supabase
      .from("entregas")
      .select("*")
      .eq("id", entregaId)
      .single()

    if (entregaError || !entrega) {
      console.error("❌ Error obteniendo entrega:", entregaError)
      return NextResponse.json({ error: "Entrega no encontrada" }, { status: 404 })
    }

    console.log("📦 Datos de entrega:", {
      id: entrega.id,
      matricula: entrega.matricula,
      fecha_entrega: entrega.fecha_entrega,
      email_enviado: entrega.email_enviado,
      observaciones: entrega.observaciones,
      tipos_incidencia: entrega.tipos_incidencia,
      asesor: entrega.asesor, // Añadir asesor a los logs
    })

    // --- Lógica de autorización ---
    let isAdmin = false
    try {
      isAdmin = await isUserAdmin()
      console.log("🛡️ [send-notification] Resultado de isUserAdmin:", isAdmin)
    } catch (adminCheckError) {
      console.error("❌ [send-notification] Error al verificar si el usuario es admin:", adminCheckError)
      return NextResponse.json({ error: "Error interno al verificar permisos." }, { status: 500 })
    }

    const normalizedUserAlias = userAlias.toLowerCase().trim() // ✅ Normalizar y limpiar
    const normalizedEntregaAsesor = (entrega.asesor || "").toLowerCase().trim() // ✅ Normalizar y limpiar

    console.log(`🔍 Comparando alias: '${normalizedUserAlias}' (usuario) vs '${normalizedEntregaAsesor}' (entrega)`)

    if (!isAdmin && normalizedUserAlias !== normalizedEntregaAsesor) {
      // ✅ Usar valores normalizados
      console.warn(
        `🚫 Acceso denegado: Usuario ${user.email} (alias: ${userAlias}) intentó enviar entrega de asesor ${entrega.asesor}`,
      )
      return NextResponse.json(
        { error: "No tienes permisos para enviar esta notificación de entrega." },
        { status: 403 },
      )
    }
    // --- Fin lógica de autorización ---

    if (!entrega.fecha_entrega) {
      console.error("❌ La entrega no tiene fecha de entrega")
      return NextResponse.json({ error: "La entrega debe tener fecha de entrega" }, { status: 400 })
    }

    if (entrega.email_enviado) {
      console.log("⚠️ Email ya enviado para esta entrega")
      return NextResponse.json({ error: "Email ya enviado para esta entrega" }, { status: 400 })
    }

    // Obtener configuración de email
    // ✅ Modificado para manejar 0 o múltiples filas
    let config = null
    const { data: configs, error: configError } = await supabase.from("entregas_email_config").select("*").limit(1)

    if (configError) {
      console.error("❌ Error obteniendo configuración de entregas:", configError)
      return NextResponse.json({ error: "Error obteniendo configuración de email" }, { status: 500 })
    }

    if (configs && configs.length > 0) {
      config = configs[0]
      console.log("✅ Configuración de entregas obtenida exitosamente:", config)
    } else {
      console.log("📧 No se encontró configuración de entregas. Creando una por defecto...")
      const defaultConfig = {
        enabled: true, // Por defecto activado
        cc_emails: [],
        // Puedes añadir más campos por defecto si la tabla los tiene
      }
      const { data: newConfig, error: insertError } = await supabase
        .from("entregas_email_config")
        .insert(defaultConfig)
        .select()
        .single()

      if (insertError) {
        console.error("❌ Error creando configuración de entregas por defecto:", insertError)
        return NextResponse.json({ error: "Error creando configuración de email por defecto" }, { status: 500 })
      }
      config = newConfig
      console.log("✅ Configuración de entregas por defecto creada:", config)
    }

    if (!config.enabled) {
      console.log("⚠️ Envío de emails de entregas deshabilitado")
      return NextResponse.json({ error: "Envío de emails deshabilitado" }, { status: 400 })
    }

    // Verificar variables SMTP generales (que funcionan en Vercel)
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error("❌ Configuración SMTP general incompleta")
      return NextResponse.json({ error: "Configuración SMTP general incompleta" }, { status: 500 })
    }

    // Configuración del transporter usando SMTP general
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
      console.log("✅ Conexión SMTP verificada para entregas")
    } catch (verifyError) {
      console.error("❌ Error verificando conexión SMTP:", verifyError)
      return NextResponse.json({ error: "Error de conexión SMTP" }, { status: 500 })
    }

    // Preparar destinatarios
    const ccEmails = config.cc_emails || []

    if (ccEmails.length === 0) {
      console.error("❌ No hay destinatarios configurados")
      return NextResponse.json({ error: "No hay destinatarios configurados" }, { status: 400 })
    }

    console.log("📧 Destinatarios CC:", ccEmails)

    // Generar contenido del email
    const htmlContent = generateEntregaEmailHTML(entrega, userName)

    // Preparar asunto con userAlias
    const fechaEntrega = formatDateForDisplay(entrega.fecha_entrega)
    const subject = `Entrega ${entrega.matricula} ${fechaEntrega} ${userAlias}`

    // Enviar a todos como TO
    const allRecipients = [user.email, ...ccEmails].filter((email, index, arr) => arr.indexOf(email) === index)

    // Preparar opciones del email
    const mailOptions = {
      from: `Entrega - Sistema CVO <${process.env.SMTP_USER || 'material@controlvo.ovh'}>`,
      to: allRecipients.join(","),
      subject: subject,
      html: htmlContent,
      text: `Notificación de entrega - ${entrega.matricula} - ${fechaEntrega}`,
    }

    console.log("📧 Opciones del email de entrega:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      totalRecipients: allRecipients.length,
    })

    // Enviar email
    console.log("📧 Enviando email de entrega...")
    const result = await transporter.sendMail(mailOptions)
    console.log("✅ Email de entrega enviado exitosamente:", result.messageId)

    // Marcar como enviado
    const { error: updateError } = await supabase
      .from("entregas")
      .update({
        email_enviado: true,
        email_enviado_at: new Date().toISOString(),
      })
      .eq("id", entregaId)

    if (updateError) {
      console.error("❌ Error actualizando estado de envío:", updateError)
    } else {
      console.log("✅ Estado de envío actualizado en BD")
    }

    console.log("📧 === FIN ENVÍO EMAIL ENTREGA ===")

    return NextResponse.json({
      success: true,
      message: "Email de entrega enviado exitosamente",
      messageId: result.messageId,
      recipients: allRecipients,
    })
  } catch (error) {
    console.error("❌ Error crítico enviando email de entrega:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error crítico enviando email",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
