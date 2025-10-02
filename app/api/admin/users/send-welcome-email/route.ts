import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import nodemailer from "nodemailer"
import fs from "fs/promises"
import path from "path"
import { APP_CONFIG, ASSETS } from "@/lib/config"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function sendCustomWelcomeEmail({
  email,
  actionLink,
  requestOrigin,
}: {
  email: string
  actionLink: string
  requestOrigin: string
}) {
  console.log(`[Email Sender] Attempting to send welcome email to: ${email}`)
  console.log(`[Email Sender] Action Link: ${actionLink}`)
  console.log(`[Email Sender] Request Origin: ${requestOrigin}`)

  try {
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
      connectionTimeout: 10000, // 10 segundos
      greetingTimeout: 10000,
      socketTimeout: 10000,
    })

    console.log("[Email Sender] Nodemailer transporter configured.")
    
    // Verificar conexión SMTP
    console.log("[Email Sender] Verificando conexión SMTP...")
    try {
      await transporter.verify()
      console.log("[Email Sender] Conexión SMTP verificada exitosamente.")
    } catch (verifyError) {
      console.error("[Email Sender] Error verificando conexión SMTP:", verifyError)
      throw new Error(`Error de conexión SMTP: ${verifyError}`)
    }

    const templatePath = path.resolve(process.cwd(), "lib/email-templates/invitation-template.html")
    console.log(`[Email Sender] Reading email template from: ${templatePath}`)
    let htmlTemplate = await fs.readFile(templatePath, "utf-8")
    console.log("[Email Sender] Email template read successfully.")

    htmlTemplate = htmlTemplate.replace(/{{APP_NAME}}/g, APP_CONFIG.name)
    htmlTemplate = htmlTemplate.replace(/{{APP_LOGO_URL}}/g, ASSETS.LOGO)
    htmlTemplate = htmlTemplate.replace(/{{ACTION_URL}}/g, actionLink)
    htmlTemplate = htmlTemplate.replace(/{{CURRENT_YEAR}}/g, new Date().getFullYear().toString())
    htmlTemplate = htmlTemplate.replace(/{{COMPANY_ADDRESS}}/g, APP_CONFIG.companyAddress || "Dirección no configurada")
    htmlTemplate = htmlTemplate.replace(/{{APP_URL}}/g, requestOrigin)
    console.log("[Email Sender] Placeholders replaced in template.")

    // Usar el mismo formato FROM que los otros emails del sistema
    const fromEmail = process.env.SMTP_USER || "material@controlvo.ovh"
    const fromName = "Sistema CVO - Usuarios"
    
    console.log(`[Email Sender] Using FROM email: ${fromEmail}`)
    console.log(`[Email Sender] Using FROM name: ${fromName}`)
    
    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: `Invitación para unirte a ${APP_CONFIG.name}`,
      html: htmlTemplate,
    }

    console.log("[Email Sender] Sending email with options:", mailOptions)
    const info = await transporter.sendMail(mailOptions)
    console.log("[Email Sender] Email sent successfully. Message ID:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("[Email Sender] Error sending custom email:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function POST(request: NextRequest) {
  console.log("[API Send Welcome Email] Received POST request.")
  try {
    const cookieStore = await cookies()
    const supabase = await createServerClient(cookieStore)
    const requestOrigin = request.nextUrl.origin

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.warn("[API Send Welcome Email] Unauthorized access attempt.")
      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }
    console.log("[API Send Welcome Email] Session validated for user:", session.user.id)

    const body = await request.json()
    const { userId, email } = body
    console.log("[API Send Welcome Email] Request body:", body)

    if (!userId || !email) {
      console.warn("[API Send Welcome Email] Missing userId or email in request.")
      return NextResponse.json({ message: "Se requiere el ID de usuario y el email" }, { status: 400 })
    }

    console.log(`[API Send Welcome Email] Generating link for user ID: ${userId}, email: ${email}`)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: `${requestOrigin}/auth/reset-password`,
      },
    })

    if (linkError || !linkData?.properties?.action_link) {
      console.error("[API Send Welcome Email] Error generating Supabase link:", linkError)
      return NextResponse.json(
        { message: linkError?.message || "Error al generar enlace de invitación" },
        { status: 500 },
      )
    }

    const actionLink = linkData.properties.action_link
    console.log(`[API Send Welcome Email] Supabase action link generated: ${actionLink}`)

    const emailResult = await sendCustomWelcomeEmail({ email, actionLink, requestOrigin })

    if (!emailResult.success) {
      console.warn(`[API Send Welcome Email] Failed to send custom email to ${email}. Error: ${emailResult.error}`)
      // Even if email sending fails, we might still want to mark it as attempted or log the failure.
      // For now, we return an error if the email sending itself failed.
      return NextResponse.json(
        { message: `Error al enviar correo de bienvenida: ${emailResult.error}` },
        { status: 500 },
      )
    }

    console.log(`[API Send Welcome Email] Email process completed for ${email}. Attempting to update profile.`)
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        welcome_email_sent: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      console.error("[API Send Welcome Email] Error updating 'welcome_email_sent' in profiles table:", updateError)
      // This is not ideal, but the email was sent. Log and continue.
    } else {
      console.log(`[API Send Welcome Email] Profile updated for user ID: ${userId}, welcome_email_sent set to true.`)
    }

    return NextResponse.json({
      message: "Proceso de invitación completado. Correo de bienvenida enviado.",
      messageId: emailResult.messageId,
    })
  } catch (error: any) {
    console.error("[API Send Welcome Email] Unhandled error in POST handler:", error)
    return NextResponse.json({ message: error.message || "Error en el proceso de invitación" }, { status: 500 })
  }
}
