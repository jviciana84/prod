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

    console.log("🧪 === PRUEBA EMAIL REALIZADO ===")
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
      justificante_url: extorno.justificante_url,
      justificante_nombre: extorno.justificante_nombre,
    })

    // Simular envío de email de realizado
    const emailBody: any = {
      extorno_id: extorno.id,
      tipo: "realizado",
    }
    
    if (extorno.justificante_url) {
      emailBody.justificante_url = extorno.justificante_url
      emailBody.justificante_nombre = extorno.justificante_nombre
    }
    
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/extornos/send-notification-with-attachments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailBody),
    })

    const emailResult = await emailResponse.json()

    if (emailResponse.ok && emailResult.success) {
      console.log("✅ Email de realizado enviado correctamente")
      return NextResponse.json({
        success: true,
        message: "Email de realizado enviado correctamente",
        result: emailResult,
      })
    } else {
      console.error("❌ Error enviando email de realizado:", emailResult)
      return NextResponse.json({
        success: false,
        message: "Error enviando email de realizado",
        error: emailResult.error || emailResult.message || "Error desconocido",
      }, { status: 500 })
    }

  } catch (error) {
    console.error("❌ Error crítico en test-email-realizado:", error)
    return NextResponse.json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    }, { status: 500 })
  }
} 