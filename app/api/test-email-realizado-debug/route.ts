import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { extorno_id } = await request.json()

    if (!extorno_id) {
      return NextResponse.json({
        success: false,
        message: "extorno_id requerido",
      }, { status: 400 })
    }

    console.log("🧪 === PRUEBA EMAIL REALIZADO DEBUG ===")
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

    // Preparar datos para el endpoint real
    const emailBody: any = {
      extorno_id: extorno.id,
      tipo: "realizado",
    }
    
    if (extorno.justificante_url) {
      emailBody.justificante_url = extorno.justificante_url
      emailBody.justificante_nombre = extorno.justificante_nombre
      console.log("📎 Enviando con justificante:", extorno.justificante_nombre)
    } else {
      console.log("📎 Enviando sin justificante")
    }
    
    console.log("📧 Body completo:", emailBody)

    // Llamar al endpoint real usando fetch interno (sin autenticación)
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/extornos/send-notification-with-attachments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Agregar header para indicar que es una llamada interna
        "X-Internal-Call": "true",
      },
      body: JSON.stringify(emailBody),
    })

    const emailResult = await emailResponse.json()
    console.log("📧 Respuesta del endpoint real:", emailResult)

    if (emailResponse.ok && emailResult.success) {
      console.log("✅ Email de realizado enviado correctamente")
      return NextResponse.json({
        success: true,
        message: "Email de realizado enviado correctamente",
        result: emailResult,
        debug: {
          extorno_id: extorno.id,
          has_justificante: !!extorno.justificante_url,
          justificante_nombre: extorno.justificante_nombre,
          email_body: emailBody,
        }
      })
    } else {
      console.error("❌ Error enviando email de realizado:", emailResult)
      return NextResponse.json({
        success: false,
        message: "Error enviando email de realizado",
        error: emailResult.error || emailResult.message || "Error desconocido",
        debug: {
          extorno_id: extorno.id,
          has_justificante: !!extorno.justificante_url,
          justificante_nombre: extorno.justificante_nombre,
          email_body: emailBody,
          response_status: emailResponse.status,
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error("❌ Error crítico en test-email-realizado-debug:", error)
    return NextResponse.json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    }, { status: 500 })
  }
} 