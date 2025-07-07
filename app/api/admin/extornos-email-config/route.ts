import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function checkUserIsAdmin(supabase: any, user: any) {
  console.log("🔍 Verificando permisos de administrador para extornos:", {
    userId: user.id,
    email: user.email,
  })

  const { data: roleData, error: roleError } = await supabase
    .from("user_roles")
    .select(`
      roles (
        name,
        description
      )
    `)
    .eq("user_id", user.id)

  if (roleError) {
    console.error("❌ Error verificando roles:", roleError)
    return { isAdmin: false, error: roleError.message }
  }

  if (!roleData || roleData.length === 0) {
    return { isAdmin: false, error: "No roles assigned" }
  }

  for (const userRole of roleData) {
    const roleName = userRole.roles?.name
    if (roleName && ["admin", "administrador"].includes(roleName.toLowerCase())) {
      return { isAdmin: true, role: roleName }
    }
  }

  return { isAdmin: false, error: "Not admin" }
}

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const adminCheck = await checkUserIsAdmin(supabase, user)
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const { data, error } = await supabase.from("extornos_email_config").select("*").limit(1).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No existe configuración, crear una por defecto
        const defaultConfig = {
          id: 1,
          enabled: true,
          email_tramitador: "",
          email_pagador: "",
          cc_emails: [],
        }

        const { data: newConfig, error: insertError } = await supabase
          .from("extornos_email_config")
          .insert(defaultConfig)
          .select()
          .single()

        if (insertError) {
          return NextResponse.json(defaultConfig)
        }

        return NextResponse.json(newConfig)
      }

      return NextResponse.json({ error: "Error obteniendo configuración" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("❌ Error crítico:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const config = await request.json()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const adminCheck = await checkUserIsAdmin(supabase, user)
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const configToSave = {
      id: 1,
      enabled: Boolean(config.enabled),
      email_tramitador: config.email_tramitador || "",
      email_pagador: config.email_pagador || "",
      cc_emails: Array.isArray(config.cc_emails) ? config.cc_emails : [],
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("extornos_email_config").upsert(configToSave).select().single()

    if (error) {
      return NextResponse.json({ error: "Error guardando configuración" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("❌ Error crítico:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
