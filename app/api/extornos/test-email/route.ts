import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import nodemailer from "nodemailer"
import crypto from "crypto" // For generating dummy token

// Re-import the email generation functions from send-notification route
// This is a workaround to avoid circular dependencies or duplicating logic.
// In a larger app, these would be in a shared utility file.
import {
  generateRegistroEmailHTML,
  generateRechazoEmailHTML,
  generateTramitacionEmailHTML,
  generateConfirmacionEmailHTML, // New import
} from "@/app/api/extornos/send-notification/route" // Adjust path if necessary

export async function POST(request: NextRequest) {
  try {
    const { targetEmail, type } = await request.json()

    if (!targetEmail || !type) {
      return NextResponse.json({ success: false, error: "targetEmail y type son requeridos" }, { status: 400 })
    }

    console.log(`📧 Iniciando test de email tipo '${type}' a: ${targetEmail}`)

    const supabase = createClient()

    // Obtener configuración de extornos (para SMTP y CC)
    const { data: config, error: configError } = await supabase.from("extornos_email_config").select("*").single()

    if (configError) {
      console.error("❌ Error obteniendo configuración:", configError)
      return NextResponse.json({
        success: false,
        message: "Error obteniendo configuración de extornos",
        error: configError,
      })
    }

    if (!process.env.SMTP_HOST || !process.env.EXTORNO_EMAIL || !process.env.EXTORNO_PASSWORD) {
      console.error("❌ Configuración SMTP de extornos incompleta")
      return NextResponse.json({
        success: false,
        message: "Configuración SMTP de extornos incompleta",
      })
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || "465"),
      secure: true,
      auth: {
        user: process.env.EXTORNO_EMAIL,
        pass: process.env.EXTORNO_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })

    try {
      await transporter.verify()
      console.log("✅ Conexión SMTP verificada correctamente.")
    } catch (verifyError) {
      console.error("❌ Error verificando conexión SMTP:", verifyError)
      return NextResponse.json({
        success: false,
        message: "Error de conexión SMTP",
        error: verifyError.message,
      })
    }

    // Generate dummy extorno data
    const dummyExtorno = {
      id: crypto.randomUUID(),
      matricula: "1234ABC",
      cliente: "Cliente de Prueba",
      numero_cliente: "98765",
      concepto: "Concepto de Prueba",
      importe: 150.75,
      numero_cuenta: "ES1234567890123456789012",
      concesion: 1,
      observaciones: "Observaciones de prueba para el extorno simulado.",
      created_at: new Date().toISOString(),
      pago_confirmado_at: type === "confirmacion" ? new Date().toISOString() : null,
      pago_confirmado_por: type === "confirmacion" ? "dummy-user-id" : null,
      confirmation_token: type === "tramitacion" ? crypto.randomUUID() : null,
      solicitante_nombre: "Usuario Solicitante Test",
      solicitante_email: "solicitante.test@example.com",
      created_by: "dummy-user-id-solicitante",
    }

    const dummyNotificationData = {
      extorno_id: dummyExtorno.id,
      tipo: type,
      usuario_registra_email: "registrador.test@example.com",
      usuario_registra_nombre: "Usuario Registrador Test",
      usuario_tramita_email: "tramitador.test@example.com",
      usuario_tramita_nombre: "Usuario Tramitador Test",
      usuario_rechaza_email: "rechazador.test@example.com",
      usuario_rechaza_nombre: "Usuario Rechazador Test",
      motivo_rechazo: type === "rechazo" ? "Motivo de rechazo de prueba: Datos incompletos." : undefined,
      usuario_confirma_email: "pagador.test@example.com",
      usuario_confirma_nombre: "Usuario Pagador Test",
    }

    let htmlContent = ""
    let subjectPrefix = ""

    switch (type) {
      case "registro":
        htmlContent = generateRegistroEmailHTML(
          dummyExtorno,
          dummyNotificationData,
          dummyExtorno.solicitante_nombre,
          dummyExtorno.solicitante_email,
        )
        subjectPrefix = "SIMULADO - Extorno Registrado"
        break
      case "tramitacion":
        htmlContent = generateTramitacionEmailHTML(
          dummyExtorno,
          dummyNotificationData,
          dummyExtorno.solicitante_nombre,
          dummyExtorno.solicitante_email,
        )
        subjectPrefix = "SIMULADO - Extorno Revisado"
        break
      case "rechazo":
        htmlContent = generateRechazoEmailHTML(
          dummyExtorno,
          dummyNotificationData,
          dummyExtorno.solicitante_nombre,
          dummyExtorno.solicitante_email,
        )
        subjectPrefix = "SIMULADO - Extorno Rechazado"
        break
      case "confirmacion":
        htmlContent = generateConfirmacionEmailHTML(
          dummyExtorno,
          dummyNotificationData,
          dummyExtorno.solicitante_nombre,
          dummyExtorno.solicitante_email,
        )
        subjectPrefix = "SIMULADO - Extorno Confirmado"
        break
      default:
        return NextResponse.json({ success: false, error: "Tipo de email de prueba no válido" }, { status: 400 })
    }

    const mailOptions = {
      from: `"Test Extorno CVO" <${process.env.EXTORNO_EMAIL}>`,
      to: targetEmail,
      subject: `${subjectPrefix} ${dummyExtorno.matricula} ${dummyExtorno.cliente} ${new Date().toLocaleDateString("es-ES")}`,
      html: htmlContent,
      text: `Test de email tipo ${type} para extorno ${dummyExtorno.matricula}`,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log("✅ Email de prueba enviado exitosamente:", result.messageId)

    return NextResponse.json({
      success: true,
      message: "Email de prueba enviado exitosamente",
      messageId: result.messageId,
    })
  } catch (error) {
    console.error("❌ Error en test de email:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
