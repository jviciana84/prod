import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateMovementEmailHTML } from "@/lib/email-templates/movement-email-templates"
import { generateEntregaEmailHTML } from "@/lib/email-templates/entrega-email-templates"
import {
  generateRegistroEmailHTML,
  generateTramitacionEmailHTML,
  generateConfirmacionEmailHTML,
  generateRechazoEmailHTML,
} from "@/lib/email-templates/extorno-email-templates"
import { getEmailStyles } from "@/lib/email-templates/email-styles"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, extornoId, entregaId } = body

    // Verificar que las variables de entorno estén configuradas
    if (!process.env.EXTORNO_EMAIL || !process.env.EXTORNO_PASSWORD) {
      return NextResponse.json({ 
        error: "Configuración de email no encontrada. Por favor, configura EXTORNO_EMAIL y EXTORNO_PASSWORD en el archivo .env.local",
        details: "Variables requeridas: EXTORNO_EMAIL, EXTORNO_PASSWORD"
      }, { status: 400 })
    }

    const supabase = await createClient()
    let emailContent = ""
    let subject = ""

    // Configurar el transportador de email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.EXTORNO_EMAIL,
        pass: process.env.EXTORNO_PASSWORD,
      },
    })

    if (type === "movimiento") {
      // Generar email de movimiento con datos de ejemplo
      const movementData = {
        fecha: "15/01/2025",
        usuario_entrega: "Usuario de Prueba",
        email_entrega: "prueba@ejemplo.com",
        movimientos: [
          {
            usuario_recibe: "Jordi Viciana",
            email_recibe: "jordi.viciana@munichgroup.es",
            items: [
              {
                matricula: "TEST123",
                material: "Llaves del vehículo",
                observaciones: "Email de prueba",
              },
            ],
          },
        ],
      }
      emailContent = generateMovementEmailHTML(movementData)
      subject = "🔧 Prueba - Notificación de Entrega de Material"
    } else if (type === "entrega") {
      // Buscar la entrega por ID
      const { data: entrega, error } = await supabase.from("entregas").select("*").eq("id", entregaId).single()

      if (error || !entrega) {
        return NextResponse.json({ error: `No se encontró entrega con ID ${entregaId}` }, { status: 404 })
      }

      emailContent = generateEntregaEmailHTML(entrega, "Usuario de Prueba")
      subject = "🚗 Prueba - Notificación de Entrega de Vehículo"
    } else if (type.startsWith("extorno-")) {
      // Buscar el extorno por ID
      const { data: extorno, error } = await supabase.from("extornos").select("*").eq("id", extornoId).single()

      if (error || !extorno) {
        return NextResponse.json({ error: `No se encontró extorno con ID ${extornoId}` }, { status: 404 })
      }

      const extornoType = type.replace("extorno-", "")

      switch (extornoType) {
        case "registro":
          emailContent = generateRegistroEmailHTML(extorno)
          subject = "💰 Prueba - Nueva Solicitud de Extorno Registrada"
          break
        case "tramitacion":
          emailContent = generateTramitacionEmailHTML(extorno, "https://ejemplo.com/confirmar")
          subject = "💰 Prueba - Extorno en Tramitación"
          break
        case "confirmacion":
          emailContent = generateConfirmacionEmailHTML(extorno)
          subject = "✅ Prueba - Extorno Confirmado y Completado"
          break
        case "rechazo":
          emailContent = generateRechazoEmailHTML(extorno)
          subject = "❌ Prueba - Solicitud de Extorno Rechazada"
          break
        default:
          return NextResponse.json({ error: "Tipo de extorno no válido" }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: "Tipo de email no válido" }, { status: 400 })
    }

    // Generar el HTML completo con estilos
    const styles = getEmailStyles()
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>${styles}</style>
        </head>
        <body>
          ${emailContent}
        </body>
      </html>
    `

    // Enviar el email
    await transporter.sendMail({
      from: process.env.EXTORNO_EMAIL,
      to: "jordi.viciana@munichgroup.es",
      subject: subject,
      html: fullHtml,
    })

    return NextResponse.json({
      success: true,
      message: "Email de prueba enviado correctamente a jordi.viciana@munichgroup.es",
    })
  } catch (error) {
    console.error("Error enviando email de prueba:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
