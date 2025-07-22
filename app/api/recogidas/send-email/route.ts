import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import nodemailer from "nodemailer"
import fs from "fs"
import path from "path"

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { recogidaIds } = body

    if (!recogidaIds || !Array.isArray(recogidaIds) || recogidaIds.length === 0) {
      return NextResponse.json({ error: "Array de IDs de recogidas requerido" }, { status: 400 })
    }

    // Obtener datos de todas las recogidas
    const { data: recogidas, error: recogidasError } = await supabase
      .from("recogidas_historial")
      .select("*")
      .in("id", recogidaIds)

    if (recogidasError || !recogidas || recogidas.length === 0) {
      return NextResponse.json({ error: "Recogidas no encontradas" }, { status: 404 })
    }

    // Obtener configuración de email para recogidas
    const { data: emailConfig } = await supabase
      .from("recogidas_email_config")
      .select("*")
      .single()

    if (!emailConfig?.enabled) {
      return NextResponse.json({ error: "Configuración de email deshabilitada" }, { status: 400 })
    }

    // Obtener datos del usuario solicitante (usamos el primero como referencia)
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", recogidas[0].usuario_solicitante_id)
      .single()

    // Función para generar HTML del email
    const generateEmailHTML = (recogidas: any[], userProfile: any) => {
      const templatePath = path.join(process.cwd(), 'lib', 'email-templates', 'recogidas-template-new.html')
      let template = fs.readFileSync(templatePath, 'utf8')
      
      const solicitante = userProfile?.full_name || recogidas[0].usuario_solicitante
      const centro = recogidas[0].centro_recogida || 'Terrassa'
      const fecha_solicitud = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      
      // Reemplazar variables principales
      template = template.replace('{{solicitante}}', solicitante)
      template = template.replace('{{centro}}', centro)
      template = template.replace('{{fecha_solicitud}}', fecha_solicitud)
      
      // Generar HTML para cada recogida
      let recogidasHTML = ''
      recogidas.forEach((recogida, index) => {
        const numero = index + 1
        let recogidaHTML = `
        <div class="recogida-item">
            <div class="recogida-number">${numero}</div>
            <div class="recogida-title">Recogida ${numero} - ${recogida.matricula}</div>
            
            <div class="detail-row">
                <div class="detail-label">Matrícula:</div>
                <div class="detail-value">${recogida.matricula}</div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">Centro:</div>
                <div class="detail-value">${recogida.centro_recogida}</div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">Cliente:</div>
                <div class="detail-value">${recogida.nombre_cliente || 'No especificado'}</div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">Dirección:</div>
                <div class="detail-value">${recogida.direccion_cliente || 'No especificada'}</div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">Código Postal:</div>
                <div class="detail-value">${recogida.codigo_postal || 'No especificado'}</div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">Ciudad:</div>
                <div class="detail-value">${recogida.ciudad || 'No especificada'}</div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">Provincia:</div>
                <div class="detail-value">${recogida.provincia || 'No especificada'}</div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">Teléfono:</div>
                <div class="detail-value">${recogida.telefono || 'No especificado'}</div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">Email:</div>
                <div class="detail-value">${recogida.email || 'No especificado'}</div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">Materiales:</div>
                <div class="detail-value">
                    <div class="materials">
                        ${recogida.materiales.map((material: string) => 
                          `<span class="material-tag">${material}</span>`
                        ).join('')}
                    </div>
                </div>
            </div>
            
            ${recogida.observaciones_envio ? `
            <div class="detail-row">
                <div class="detail-label">Observaciones:</div>
                <div class="detail-value">${recogida.observaciones_envio}</div>
            </div>
            ` : ''}
        </div>
        `
        recogidasHTML += recogidaHTML
      })
      
      // Reemplazar el contenido de recogidas
      template = template.replace('{{recogidas_content}}', recogidasHTML)
      
      return template
    }

    // Preparar el contenido del email para múltiples recogidas
    // Determinar el centro más común entre las recogidas
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
    const emailHTML = generateEmailHTML(recogidas, userProfile)
    
    // También generar versión de texto plano para compatibilidad
    let emailContent = `
Hola,

${userProfile?.full_name || recogidas[0].usuario_solicitante} solicita recogida en ${centroPrincipal}.

DETALLE DE LAS RECOGIDAS:
`

    // Añadir cada recogida al email de texto
    recogidas.forEach((recogida, index) => {
      const materialesText = recogida.materiales.join(" + ")
      emailContent += `
${index + 1}. RECOGIDA ${index + 1}:
   - Matrícula: ${recogida.matricula}
   - Centro: ${recogida.centro_recogida}
   - Material: ${materialesText}
   - Cliente: ${recogida.nombre_cliente || 'No especificado'}
   - Dirección: ${recogida.direccion_cliente || 'No especificada'}
   - Código Postal: ${recogida.codigo_postal || 'No especificado'}
   - Ciudad: ${recogida.ciudad || 'No especificada'}
   - Provincia: ${recogida.provincia || 'No especificada'}
   - Teléfono: ${recogida.telefono || 'No especificado'}
   - Email: ${recogida.email || 'No especificado'}
${recogida.observaciones_envio ? `   - Observaciones: ${recogida.observaciones_envio}` : ''}
`
    })

    emailContent += `

Atentamente,
Sistema de Gestión de Recogidas - CVO
    `.trim()

    // Preparar destinatarios
    const to = [emailConfig.email_agencia]
    const cc = [...(emailConfig.cc_emails || []), userProfile?.email].filter(Boolean)

    // Verificar variables SMTP
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return NextResponse.json({
        error: "Configuración SMTP incompleta",
      }, { status: 500 })
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

    // Opciones del email
    const mailOptions = {
      from: `${emailConfig.nombre_remitente} <${emailConfig.email_remitente}>`,
      to: to.join(","),
      cc: cc.length > 0 ? cc.join(",") : undefined,
      subject: asunto,
      text: emailContent,
      html: emailHTML,
    }

    // Enviar email (sin verificación previa para evitar bloqueos)
    try {
      const result = await transporter.sendMail(mailOptions)
      
      // Actualizar fecha de envío en todas las recogidas
      await supabase
        .from("recogidas_historial")
        .update({ fecha_envio: new Date().toISOString() })
        .in("id", recogidaIds)

      return NextResponse.json({ 
        success: true, 
        messageId: result.messageId,
        message: `${recogidas.length} recogida${recogidas.length > 1 ? 's' : ''} enviada${recogidas.length > 1 ? 's' : ''} correctamente`,
        recogidasEnviadas: recogidas.length
      })
    } catch (emailError) {
      return NextResponse.json({ error: "Error enviando email", details: emailError.message }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
} 