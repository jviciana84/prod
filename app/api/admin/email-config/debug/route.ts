import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar variables de entorno SMTP
    const smtpConfig = {
      SMTP_HOST: process.env.SMTP_HOST ? "✅ Configurado" : "❌ No configurado",
      SMTP_PORT: process.env.SMTP_PORT ? `✅ ${process.env.SMTP_PORT}` : "❌ No configurado",
      SMTP_USER: process.env.SMTP_USER ? "✅ Configurado" : "❌ No configurado",
      SMTP_PASSWORD: process.env.SMTP_PASSWORD ? "✅ Configurado" : "❌ No configurado",
      SMTP_FROM_NAME: process.env.SMTP_FROM_NAME ? `✅ ${process.env.SMTP_FROM_NAME}` : "❌ No configurado",
      SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL ? `✅ ${process.env.SMTP_FROM_EMAIL}` : "❌ No configurado",
    }

    return NextResponse.json({
      message: "Diagnóstico de configuración SMTP",
      config: smtpConfig,
      availableVars: Object.keys(process.env).filter((key) => key.includes("SMTP") || key.includes("MAIL")),
    })
  } catch (error) {
    console.error("Error in SMTP debug:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
