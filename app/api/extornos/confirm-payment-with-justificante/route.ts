import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { put } from "@vercel/blob"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const token = formData.get("token") as string
    const extornoId = formData.get("extornoId") as string
    const justificante = formData.get("justificante") as File

    // Verificar que tenemos token O extornoId
    if (!token && !extornoId) {
      return NextResponse.json({
        success: false,
        message: "Token de confirmación o ID de extorno requerido",
      }, { status: 400 })
    }

    // El justificante es opcional - se puede confirmar sin él
    if (!justificante) {
      console.log("⚠️ Confirmando pago sin justificante")
    }

    console.log("🔍 Confirmando pago. Token:", token)
    if (justificante) {
      console.log("📎 Archivo:", justificante.name, "Tamaño:", justificante.size)
    } else {
      console.log("📎 Sin archivo justificante")
    }

    // Obtener la IP del request
    let ip = request.headers.get("x-forwarded-for") || "desconocida"
    if (ip && ip.includes(",")) ip = ip.split(",")[0].trim()

    // Buscar el extorno por token o por ID
    let query = supabase
      .from("extornos")
      .select("*")
      .eq("estado", "tramitado")
    
    if (token) {
      query = query.eq("confirmation_token", token)
    } else if (extornoId) {
      query = query.eq("id", extornoId)
    }
    
    const { data: extorno, error: extornoError } = await query.single()

    if (extornoError || !extorno) {
      console.error("❌ Error obteniendo extorno:", extornoError)
      return NextResponse.json({
        success: false,
        message: token ? "Token no válido o extorno no encontrado" : "Extorno no encontrado o no está en estado tramitado",
      }, { status: 404 })
    }

    console.log("✅ Extorno encontrado:", extorno.id)

    // Subir el justificante a Vercel Blob (si existe)
    let justificanteUrl = null
    let justificanteNombre = null
    
    if (justificante) {
      const blobName = `extornos/${extorno.id}/justificante-${Date.now()}-${justificante.name}`
      
      const { url, error: blobError } = await put(blobName, justificante, {
        access: 'public',
      })

      if (blobError) {
        console.error("❌ Error subiendo justificante:", blobError)
        return NextResponse.json({
          success: false,
          message: "Error al subir el justificante",
        }, { status: 500 })
      }

      justificanteUrl = url
      justificanteNombre = justificante.name
      console.log("✅ Justificante subido:", justificanteUrl)
    } else {
      console.log("✅ Sin justificante para subir")
    }

    // Actualizar el extorno a estado "realizado" y guardar la URL del justificante (si existe)
    const updateData: any = {
      estado: "realizado",
      pago_confirmado_at: new Date().toISOString(),
      confirmation_token: null,
      ultima_ip_confirmacion: ip,
    }
    
    if (justificanteUrl) {
      updateData.justificante_url = justificanteUrl
      updateData.justificante_nombre = justificanteNombre
    }
    
    const { error: updateError } = await supabase
      .from("extornos")
      .update(updateData)
      .eq("id", extorno.id)

    if (updateError) {
      console.error("❌ Error actualizando extorno:", updateError)
      return NextResponse.json({
        success: false,
        message: "Error al actualizar el extorno",
      }, { status: 500 })
    }

    console.log("✅ Extorno actualizado a realizado")

    // Enviar email con justificante (si existe)
    try {
      const emailBody: any = {
        extorno_id: extorno.id,
        tipo: "realizado",
      }
      
      if (justificanteUrl) {
        emailBody.justificante_url = justificanteUrl
        emailBody.justificante_nombre = justificanteNombre
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
        console.log("✅ Email de confirmación enviado correctamente")
      } else {
        console.error("❌ Error enviando email:", emailResult)
        // No fallamos la confirmación si el email falla
      }
    } catch (emailError) {
      console.error("❌ Error crítico enviando email:", emailError)
      // No fallamos la confirmación si el email falla
    }

    return NextResponse.json({
      success: true,
      message: justificanteUrl ? "Pago confirmado exitosamente con justificante" : "Pago confirmado exitosamente sin justificante",
      extorno_id: extorno.id,
      justificante_url: justificanteUrl,
    })

  } catch (error) {
    console.error("❌ Error crítico en confirm-payment-with-justificante:", error)
    return NextResponse.json({
      success: false,
      message: "Error interno del servidor",
    }, { status: 500 })
  }
} 