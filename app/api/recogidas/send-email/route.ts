import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

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
    const { recogidaId } = body

    if (!recogidaId) {
      return NextResponse.json({ error: "ID de recogida requerido" }, { status: 400 })
    }

    // Obtener datos de la recogida
    const { data: recogida, error: recogidaError } = await supabase
      .from("recogidas_historial")
      .select("*")
      .eq("id", recogidaId)
      .single()

    if (recogidaError || !recogida) {
      return NextResponse.json({ error: "Recogida no encontrada" }, { status: 404 })
    }

    // Obtener configuración de email para recogidas
    const { data: emailConfig } = await supabase
      .from("recogidas_email_config")
      .select("*")
      .single()

    if (!emailConfig?.enabled) {
      return NextResponse.json({ error: "Configuración de email deshabilitada" }, { status: 400 })
    }

    // Obtener datos del usuario solicitante
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", recogida.usuario_solicitante_id)
      .single()

    // Preparar el contenido del email
    const materialesText = recogida.materiales.join(" + ")
    const asunto = `Recogida Motor Munich ${recogida.centro_recogida} - Sistema CVO`

    const emailContent = `
Estimados compañeros,

${userProfile?.full_name || recogida.usuario_solicitante} solicita recogida en Motor Munich ${recogida.centro_recogida}

Datos de la solicitud:
- Matrícula: ${recogida.matricula}
- Material: ${materialesText}
- Cliente: ${recogida.nombre_cliente || 'No especificado'}
- Dirección: ${recogida.direccion_cliente || 'No especificada'}
- Código Postal: ${recogida.codigo_postal || 'No especificado'}
- Ciudad: ${recogida.ciudad || 'No especificada'}
- Provincia: ${recogida.provincia || 'No especificada'}
- Teléfono: ${recogida.telefono || 'No especificado'}
- Email: ${recogida.email || 'No especificado'}
${recogida.observaciones_envio ? `- Observaciones: ${recogida.observaciones_envio}` : ''}

Puedes responder a todas las solicitudes de recogida con el número de seguimiento en la columna de la tabla que hemos preparado para que lo pongáis.

Saludos cordiales,
Sistema CVO
    `.trim()

    // Preparar destinatarios
    const to = [emailConfig.email_agencia]
    const cc = [...(emailConfig.cc_emails || []), userProfile?.email].filter(Boolean)

    // Enviar email
    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: "recogidas@controlvo.ovh",
      to,
      cc,
      subject: asunto,
      text: emailContent,
    })

    if (emailError) {
      console.error("Error enviando email:", emailError)
      return NextResponse.json({ error: "Error enviando email" }, { status: 500 })
    }

    // Actualizar fecha de envío en la recogida
    await supabase
      .from("recogidas_historial")
      .update({ fecha_envio: new Date().toISOString() })
      .eq("id", recogidaId)

    return NextResponse.json({ 
      success: true, 
      emailId: emailResult?.id,
      message: "Email enviado correctamente" 
    })
  } catch (error) {
    console.error("Error en POST /api/recogidas/send-email:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
} 