import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 === DEBUG CONFIGURACIÓN EMAIL EXTORNOS ===")

    const supabase = createClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Usuario no autenticado",
        },
        { status: 401 },
      )
    }

    // Obtener configuración de extornos
    const { data: config, error: configError } = await supabase.from("extornos_email_config").select("*").single()

    if (configError) {
      console.error("❌ Error obteniendo configuración:", configError)
      return NextResponse.json({
        success: false,
        error: "Error obteniendo configuración de extornos",
        details: configError,
      })
    }

    // Verificar variables de entorno
    const envVars = {
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_PORT: !!process.env.SMTP_PORT,
      EXTORNO_EMAIL: !!process.env.EXTORNO_EMAIL,
      EXTORNO_PASSWORD: !!process.env.EXTORNO_PASSWORD,
      NEXT_PUBLIC_SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL,
    }

    const missingVars = Object.entries(envVars)
      .filter(([key, exists]) => !exists)
      .map(([key]) => key)

    console.log("✅ Configuración verificada:", {
      config_exists: !!config,
      config_enabled: config?.enabled,
      env_vars_ok: missingVars.length === 0,
      missing_vars: missingVars,
    })

    return NextResponse.json({
      success: true,
      config: {
        enabled: config.enabled,
        email_tramitador: config.email_tramitador,
        email_pagador: config.email_pagador,
        cc_emails: config.cc_emails,
        created_at: config.created_at,
        updated_at: config.updated_at,
      },
      environment: {
        variables_ok: missingVars.length === 0,
        missing_variables: missingVars,
        smtp_configured: envVars.SMTP_HOST && envVars.EXTORNO_EMAIL && envVars.EXTORNO_PASSWORD,
      },
      diagnostics: {
        timestamp: new Date().toISOString(),
        user_id: user.id,
        user_email: user.email,
      },
    })
  } catch (error: any) {
    console.error("❌ Error en debug de configuración:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
