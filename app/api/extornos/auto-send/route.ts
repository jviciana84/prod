import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import nodemailer from "nodemailer"
import { generateTramitacionEmailHTML } from "@/lib/email-templates/extorno-email-templates"

export async function POST(request: Request) {
  try {
    const { extorno_id } = await request.json()

    console.log("📧 === AUTO SEND EMAIL EXTORNO ===")
    console.log("📧 Extorno ID:", extorno_id)

    if (!extorno_id) {
      return NextResponse.json({ error: "extorno_id es requerido" }, { status: 400 })
    }

    const supabase = createClient()

    const confirmationToken = crypto.randomUUID()
    console.log(`🔑 Generando nuevo token para extorno ${extorno_id}: ${confirmationToken}`)

    const { data: updatedExtorno, error: updateError } = await supabase
      .from("extornos")
      .update({
        confirmation_token: confirmationToken,
        estado: "tramitando",
      })
      .eq("id", extorno_id)
      .select(`*, solicitado_por ( email, user_metadata )`) // Fetch related user data
      .single()

    if (updateError) {
      console.error(`❌ Error al actualizar el token para extorno ${extorno_id}:`, updateError)
      return NextResponse.json(
        {
          error: `Error de base de datos al actualizar el token: ${updateError.message}`,
        },
        { status: 500 },
      )
    }

    if (!updatedExtorno || updatedExtorno.confirmation_token !== confirmationToken) {
      console.error(`❌ Fallo al guardar o verificar el token para extorno ${extorno_id}.`)
      console.error(`Token esperado: ${confirmationToken}, Token en BD: ${updatedExtorno?.confirmation_token}`)
      return NextResponse.json(
        { error: "Fallo al guardar el token en la base de datos. No se enviará el email." },
        { status: 500 },
      )
    }

    console.log(`✅ Token actualizado y verificado en la base de datos para extorno ${extorno_id}.`)

    const { data: config, error: configError } = await supabase.from("extornos_email_config").select("*").single()

    if (configError || !config) {
      console.error("❌ Error obteniendo configuración:", configError)
      return NextResponse.json({ error: "Configuración de email no encontrada" }, { status: 500 })
    }

    if (!config.enabled) {
      console.log("⚠️ Sistema de emails deshabilitado")
      return NextResponse.json({ success: false, message: "Sistema de emails deshabilitado" })
    }

    const userProfile = updatedExtorno.solicitado_por as any // Type assertion for simplicity
    const usuarioNombre = userProfile?.user_metadata?.full_name || userProfile?.email || "Usuario del Sistema"
    const usuarioEmail = userProfile?.email || null

    console.log("👤 Usuario que registró:", usuarioNombre, `(${usuarioEmail})`)

    if (!process.env.SMTP_HOST || !process.env.EXTORNO_EMAIL || !process.env.EXTORNO_PASSWORD) {
      console.error("❌ Configuración SMTP de extornos incompleta")
      return NextResponse.json({ error: "Configuración SMTP de extornos incompleta" }, { status: 500 })
    }

    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || "465"),
      secure: true,
      auth: { user: process.env.EXTORNO_EMAIL, pass: process.env.EXTORNO_PASSWORD },
      tls: { rejectUnauthorized: false },
    })

    await transporter.verify()
    console.log("✅ Conexión SMTP verificada con extorno@controlvo.ovh")

    const recipients = new Set<string>()
    if (usuarioEmail) recipients.add(usuarioEmail)
    if (config.email_tramitador) recipients.add(config.email_tramitador)

    const toEmails = Array.from(recipients)
    const ccEmails = config.cc_emails || []

    if (toEmails.length === 0 && ccEmails.length === 0) {
      return NextResponse.json({ error: "No hay destinatarios configurados" }, { status: 400 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://controlvo.ovh"

    // Use the verified 'updatedExtorno' data to build the email
    const emailData = {
      ...updatedExtorno,
      solicitado_por_nombre: usuarioNombre,
      solicitado_por_email: usuarioEmail,
      site_url: siteUrl,
    }

    const htmlContent = generateTramitacionEmailHTML(emailData)
    const subject = `EXTORNO EN TRAMITACIÓN - ${updatedExtorno.matricula}${
      updatedExtorno.numero_cliente ? ` - ${updatedExtorno.numero_cliente}` : ""
    } - ${new Date(updatedExtorno.created_at).toLocaleDateString("es-ES")}`

    const mailOptions = {
      from: `"Extorno - Sistema CVO" <${process.env.EXTORNO_EMAIL}>`,
      to: toEmails.join(","),
      cc: ccEmails.join(","),
      subject: subject,
      html: htmlContent,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log("✅ Email enviado exitosamente:", result.messageId)

    return NextResponse.json({
      success: true,
      message: "Email enviado correctamente",
      messageId: result.messageId,
    })
  } catch (error) {
    const err = error as Error
    console.error("❌ Error crítico enviando email:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
