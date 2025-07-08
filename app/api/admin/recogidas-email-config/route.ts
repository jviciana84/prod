import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET() {
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

    // Obtener configuración existente
    const { data: config, error } = await supabase
      .from("recogidas_email_config")
      .select("*")
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error obteniendo configuración:", error)
      return NextResponse.json({ error: "Error obteniendo configuración" }, { status: 500 })
    }

    // Si no existe configuración, crear una por defecto
    if (!config) {
      const { data: defaultConfig, error: createError } = await supabase
        .from("recogidas_email_config")
        .insert({
          enabled: true,
          email_agencia: "recogidas@mrw.es",
          cc_emails: [],
        })
        .select()
        .single()

      if (createError) {
        console.error("Error creando configuración por defecto:", createError)
        return NextResponse.json({ error: "Error creando configuración" }, { status: 500 })
      }

      return NextResponse.json(defaultConfig)
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error("Error en GET /api/admin/recogidas-email-config:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

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
    const { enabled, email_agencia, cc_emails } = body

    // Validar campos
    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "Campo 'enabled' debe ser booleano" }, { status: 400 })
    }

    if (!email_agencia || !email_agencia.includes("@")) {
      return NextResponse.json({ error: "Email de agencia inválido" }, { status: 400 })
    }

    if (!Array.isArray(cc_emails)) {
      return NextResponse.json({ error: "Campo 'cc_emails' debe ser un array" }, { status: 400 })
    }

    // Verificar si existe configuración
    const { data: existingConfig } = await supabase
      .from("recogidas_email_config")
      .select("id")
      .single()

    let result
    if (existingConfig) {
      // Actualizar configuración existente
      const { data, error } = await supabase
        .from("recogidas_email_config")
        .update({
          enabled,
          email_agencia,
          cc_emails,
        })
        .eq("id", existingConfig.id)
        .select()
        .single()

      if (error) {
        console.error("Error actualizando configuración:", error)
        return NextResponse.json({ error: "Error actualizando configuración" }, { status: 500 })
      }

      result = data
    } else {
      // Crear nueva configuración
      const { data, error } = await supabase
        .from("recogidas_email_config")
        .insert({
          enabled,
          email_agencia,
          cc_emails,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creando configuración:", error)
        return NextResponse.json({ error: "Error creando configuración" }, { status: 500 })
      }

      result = data
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error en POST /api/admin/recogidas-email-config:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
} 