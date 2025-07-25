import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import nodemailer from "nodemailer"
import fs from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log("🔍 === DIAGNÓSTICO EMAIL RECOGIDAS ===")
    console.log("⏰ Inicio del proceso:", new Date().toISOString())
    
    const cookieStore = await cookies()
    console.log("🍪 Cookies obtenidas")
    
    const supabase = await createServerClient()
    console.log("🔗 Cliente Supabase creado")

    // Verificar autenticación
    console.log("🔐 Verificando autenticación...")
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("❌ Error de autenticación:", userError)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("✅ Usuario autenticado:", user.email)

    const body = await request.json()
    const { recogidaIds, testEmail } = body

    if (!recogidaIds || !Array.isArray(recogidaIds) || recogidaIds.length === 0) {
      return NextResponse.json({ error: "Array de IDs de recogidas requerido" }, { status: 400 })
    }

    console.log("📋 IDs de recogidas a procesar:", recogidaIds)
    console.log("📧 Email de prueba:", testEmail || "No especificado")

    // 1. Verificar variables de entorno SMTP
    console.log("🔧 Verificando variables SMTP...")
    const smtpVars = {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASSWORD: process.env.SMTP_PASSWORD,
      SMTP_PORT: process.env.SMTP_PORT || "465"
    }

    console.log("📊 Variables SMTP encontradas:", {
      host: smtpVars.SMTP_HOST ? "✅ Configurado" : "❌ Faltante",
      user: smtpVars.SMTP_USER ? "✅ Configurado" : "❌ Faltante",
      password: smtpVars.SMTP_PASSWORD ? "✅ Configurado" : "❌ Faltante",
      port: smtpVars.SMTP_PORT
    })

    const missingSmtpVars = Object.entries(smtpVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key)

    if (missingSmtpVars.length > 0) {
      console.error("❌ Variables SMTP faltantes:", missingSmtpVars)
      return NextResponse.json({
        error: "Variables SMTP faltantes",
        missingVars: missingSmtpVars,
        smtpConfig: {
          host: smtpVars.SMTP_HOST ? "✅ Configurado" : "❌ Faltante",
          user: smtpVars.SMTP_USER ? "✅ Configurado" : "❌ Faltante",
          password: smtpVars.SMTP_PASSWORD ? "✅ Configurado" : "❌ Faltante",
          port: smtpVars.SMTP_PORT
        }
      }, { status: 500 })
    }

    console.log("✅ Variables SMTP configuradas correctamente")

    // 2. Obtener datos de recogidas
    console.log("📊 Obteniendo datos de recogidas...")
    const recogidasQuery = supabase
      .from("recogidas_historial")
      .select("*")
      .in("id", recogidaIds)
    
    console.log("🔍 Ejecutando query de recogidas...")
    const { data: recogidas, error: recogidasError } = await recogidasQuery
    console.log("📊 Query de recogidas completada")

    if (recogidasError || !recogidas || recogidas.length === 0) {
      console.error("❌ Error obteniendo recogidas:", recogidasError)
      return NextResponse.json({ 
        error: "Recogidas no encontradas", 
        details: recogidasError 
      }, { status: 404 })
    }

    console.log("✅ Recogidas obtenidas:", recogidas.length)

    // 3. Obtener configuración de email
    console.log("⚙️ Obteniendo configuración de email...")
    const configQuery = supabase
      .from("recogidas_email_config")
      .select("*")
      .single()
    
    console.log("🔍 Ejecutando query de configuración...")
    const { data: emailConfig, error: configError } = await configQuery
    console.log("⚙️ Query de configuración completada")

    if (configError || !emailConfig) {
      console.error("❌ Error obteniendo configuración:", configError)
      return NextResponse.json({ 
        error: "Configuración de email no encontrada", 
        details: configError 
      }, { status: 404 })
    }

    if (!emailConfig.enabled) {
      console.log("⚠️ Configuración de email deshabilitada")
      return NextResponse.json({ 
        error: "Configuración de email deshabilitada",
        config: emailConfig
      }, { status: 400 })
    }

    console.log("✅ Configuración de email obtenida:", {
      enabled: emailConfig.enabled,
      email_agencia: emailConfig.email_agencia,
      email_remitente: emailConfig.email_remitente,
      nombre_remitente: emailConfig.nombre_remitente
    })

    // 4. Obtener perfil del usuario
    console.log("👤 Obteniendo perfil del usuario...")
    const profileQuery = supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", recogidas[0].usuario_solicitante_id)
      .single()
    
    console.log("🔍 Ejecutando query de perfil...")
    const { data: userProfile, error: profileError } = await profileQuery
    console.log("👤 Query de perfil completada")

    if (profileError) {
      console.warn("⚠️ Error obteniendo perfil:", profileError)
    }

    console.log("✅ Perfil obtenido:", userProfile)

    // 5. Verificar conexión SMTP
    console.log("🔌 Verificando conexión SMTP...")
    console.log("🔧 Creando transporter...")
    const transporter = nodemailer.createTransport({
      host: smtpVars.SMTP_HOST,
      port: Number.parseInt(smtpVars.SMTP_PORT),
      secure: true,
      auth: {
        user: smtpVars.SMTP_USER,
        pass: smtpVars.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    })

    console.log("🔧 Transporter creado, verificando conexión...")
    try {
      await transporter.verify()
      console.log("✅ Conexión SMTP verificada correctamente")
    } catch (verifyError) {
      console.error("❌ Error verificando conexión SMTP:", verifyError)
      return NextResponse.json({
        error: "Error de conexión SMTP",
        details: verifyError.message,
        smtpConfig: {
          host: smtpVars.SMTP_HOST,
          port: smtpVars.SMTP_PORT,
          user: smtpVars.SMTP_USER,
          secure: true
        }
      }, { status: 500 })
    }

    // 6. Preparar datos del email
    console.log("📝 Preparando datos del email...")
    
    // Determinar centro principal
    const centros = recogidas.map(r => r.centro_recogida || 'Terrassa')
    const centroMasComun = centros.reduce((acc, centro) => {
      acc[centro] = (acc[centro] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const centroPrincipal = Object.entries(centroMasComun)
      .sort(([,a], [,b]) => b - a)[0][0]
    
    const asunto = emailConfig.asunto_template
      .replace('{cantidad}', recogidas.length.toString())
      .replace('{centro}', centroPrincipal)

         // Preparar destinatarios - USAR EMAIL DE PRUEBA SI SE ESPECIFICA
     const to = testEmail ? [testEmail] : [emailConfig.email_agencia]
     const cc = testEmail ? [userProfile?.email].filter(Boolean) : [...(emailConfig.cc_emails || []), userProfile?.email].filter(Boolean)

    console.log("📧 Destinatarios preparados:", {
      to: to,
      cc: cc,
      asunto: asunto,
      isTestEmail: !!testEmail
    })

    // 7. Generar contenido HTML usando la plantilla original
    console.log("🎨 Generando contenido HTML con plantilla original...")
    let emailHTML = ''
    let templateErrorInfo = null
    try {
      // Leer la plantilla HTML original
      const templatePath = path.join(process.cwd(), 'lib', 'email-templates', 'recogidas-template-new.html')
      console.log("📁 Leyendo plantilla desde:", templatePath)
      
      emailHTML = fs.readFileSync(templatePath, 'utf8')
      console.log("✅ Plantilla leída correctamente")
      
      // Generar contenido de recogidas
      let recogidasContent = ''
      recogidas.forEach((recogida, index) => {
        const materialesHtml = recogida.materiales && recogida.materiales.length > 0 
          ? `<div class="materials">${recogida.materiales.map(material => `<span class="material-tag">${material}</span>`).join('')}</div>`
          : '<p>Sin materiales especificados</p>'
        recogidasContent += `
          <div class="recogida-item">
            <div class="recogida-number">${index + 1}</div>
            <div class="recogida-title">Recogida ${index + 1}</div>
            <div class="detail-row"><div class="detail-label">Matrícula:</div><div class="detail-value">${recogida.matricula}</div></div>
            <div class="detail-row"><div class="detail-label">Cliente:</div><div class="detail-value">${recogida.nombre_cliente}</div></div>
            <div class="detail-row"><div class="detail-label">Dirección:</div><div class="detail-value">${recogida.direccion_cliente}, ${recogida.codigo_postal} ${recogida.ciudad}, ${recogida.provincia}</div></div>
            <div class="detail-row"><div class="detail-label">Teléfono:</div><div class="detail-value">${recogida.telefono}</div></div>
            <div class="detail-row"><div class="detail-label">Email:</div><div class="detail-value">${recogida.email}</div></div>
            <div class="detail-row"><div class="detail-label">Mensajería:</div><div class="detail-value">${recogida.mensajeria}</div></div>
            ${materialesHtml}
            ${recogida.observaciones_envio ? `<div class="detail-row"><div class="detail-label">Observaciones:</div><div class="detail-value">${recogida.observaciones_envio}</div></div>` : ''}
          </div>
        `
      })
      // Reemplazar variables en la plantilla
      emailHTML = emailHTML
        .replace('{{solicitante}}', userProfile?.full_name || recogidas[0].usuario_solicitante)
        .replace('{{centro}}', centroPrincipal)
        .replace('{{recogidas_content}}', recogidasContent)
        .replace('{{fecha_solicitud}}', new Date().toLocaleString('es-ES'))
      // Añadir marca de prueba si es necesario
      if (testEmail) {
        emailHTML = emailHTML.replace(
          '<div class="content">',
          `<div class="content">
            <div class="warning-box">
              <p><strong>⚠️ ESTE ES UN EMAIL DE PRUEBA</strong></p>
              <p>Fecha de prueba: ${new Date().toLocaleString('es-ES')}</p>
            </div>`
        )
      }
      console.log("✅ HTML generado correctamente")
    } catch (templateError) {
      templateErrorInfo = {
        message: templateError.message,
        stack: templateError.stack,
        type: 'template',
      }
      console.error("❌ Error generando plantilla:", templateError)
      // Fallback a HTML simple
      emailHTML = `
      <html>
      <body>
          <h2>Solicitud de Recogida - Prueba de Diagnóstico</h2>
          <p><strong>${userProfile?.full_name || recogidas[0].usuario_solicitante}</strong> solicita recogida en <strong>${centroPrincipal}</strong>.</p>
          <p>Total de recogidas: ${recogidas.length}</p>
          <p>Fecha de prueba: ${new Date().toLocaleString('es-ES')}</p>
          ${testEmail ? '<p><strong>⚠️ ESTE ES UN EMAIL DE PRUEBA</strong></p>' : ''}
      </body>
      </html>
      `
    }

    const emailText = `
Hola,

${userProfile?.full_name || recogidas[0].usuario_solicitante} solicita recogida en ${centroPrincipal}.

Total de recogidas: ${recogidas.length}
Fecha de prueba: ${new Date().toLocaleString('es-ES')}
${testEmail ? '\n⚠️ ESTE ES UN EMAIL DE PRUEBA' : ''}

Atentamente,
Sistema de Gestión de Recogidas - CVO
    `.trim()

    // 8. Preparar opciones del email
    console.log("📋 Preparando opciones del email...")
    const mailOptions = {
      from: `${emailConfig.nombre_remitente} <${emailConfig.email_remitente}>`,
      to: to.join(","),
      cc: cc.length > 0 ? cc.join(",") : undefined,
      subject: testEmail ? `[PRUEBA] ${asunto}` : asunto,
      text: emailText,
      html: emailHTML,
    }

    console.log("📤 Enviando email de prueba...")
    console.log("📋 Opciones del email:", {
      from: mailOptions.from,
      to: mailOptions.to,
      cc: mailOptions.cc,
      subject: mailOptions.subject
    })

    // 9. Enviar email con timeout
    console.log("⏱️ Iniciando envío con timeout de 30 segundos...")
    const sendPromise = transporter.sendMail(mailOptions)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout enviando email (30 segundos)")), 30000)
    )

    console.log("🚀 Ejecutando Promise.race...")
    const result = await Promise.race([sendPromise, timeoutPromise]) as any
    console.log("✅ Email enviado exitosamente:", result.messageId)

    // 10. Actualizar fecha de envío SOLO si NO es un email de prueba
    if (!testEmail) {
      console.log("💾 Actualizando fecha de envío...")
      const updateQuery = supabase
        .from("recogidas_historial")
        .update({ fecha_envio: new Date().toISOString() })
        .in("id", recogidaIds)
      
      console.log("🔍 Ejecutando query de actualización...")
      const { error: updateError } = await updateQuery
      console.log("💾 Query de actualización completada")

      if (updateError) {
        console.warn("⚠️ Error actualizando fecha de envío:", updateError)
      } else {
        console.log("✅ Fecha de envío actualizada")
      }
    } else {
      console.log("⚠️ No se actualiza fecha de envío (email de prueba)")
    }

    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log("🎉 === DIAGNÓSTICO COMPLETADO EXITOSAMENTE ===")
    console.log("⏱️ Duración total:", duration, "ms")

    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId,
      message: testEmail 
        ? `Email de prueba enviado correctamente a ${testEmail}`
        : `${recogidas.length} recogida${recogidas.length > 1 ? 's' : ''} enviada${recogidas.length > 1 ? 's' : ''} correctamente`,
      recogidasEnviadas: recogidas.length,
      isTestEmail: !!testEmail,
      duration: duration,
      diagnosticInfo: {
        smtpConfig: {
          host: smtpVars.SMTP_HOST,
          port: smtpVars.SMTP_PORT,
          user: smtpVars.SMTP_USER,
          secure: true
        },
        emailConfig: {
          enabled: emailConfig.enabled,
          email_agencia: emailConfig.email_agencia,
          email_remitente: emailConfig.email_remitente,
          nombre_remitente: emailConfig.nombre_remitente
        },
        recipients: {
          to: to,
          cc: cc
        },
        recogidasCount: recogidas.length,
        templateError: templateErrorInfo
      }
    })

  } catch (error) {
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.error("❌ === ERROR EN DIAGNÓSTICO ===")
    console.error("⏱️ Duración hasta el error:", duration, "ms")
    console.error("Error completo:", error)
    console.error("Stack trace:", error.stack)
    
    return NextResponse.json({ 
      error: "Error en diagnóstico", 
      details: error.message,
      stack: error.stack,
      duration: duration
    }, { status: 500 })
  }
} 