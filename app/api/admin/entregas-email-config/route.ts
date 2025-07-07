import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function checkUserIsAdmin(supabase: any, user: any) {
  console.log("🔍 Verificando permisos de administrador para entregas:", {
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
    return { isAdmin: false, method: null, role: null, error: roleError.message }
  }

  if (!roleData || roleData.length === 0) {
    console.log("❌ Usuario no tiene roles asignados")
    return { isAdmin: false, method: "user_roles", role: null, error: "No roles assigned" }
  }

  for (const userRole of roleData) {
    const roleName = userRole.roles?.name
    if (roleName && ["admin", "administrador"].includes(roleName.toLowerCase())) {
      console.log("✅ Admin verificado para entregas:", roleName)
      return { isAdmin: true, method: "user_roles", role: roleName }
    }
  }

  return {
    isAdmin: false,
    method: "user_roles",
    role: null,
    availableRoles: roleData.map((r) => r.roles?.name),
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("❌ Usuario no autenticado:", authError)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const adminCheck = await checkUserIsAdmin(supabase, user)

    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        {
          error: "Acceso denegado - Se requieren permisos de administrador",
          debug: {
            userId: user.id,
            email: user.email,
            method: adminCheck.method,
            availableRoles: adminCheck.availableRoles,
            requiredRoles: ["admin", "administrador"],
            errorDetails: adminCheck.error,
          },
        },
        { status: 403 },
      )
    }

    console.log("✅ Usuario admin verificado para entregas:", {
      userId: user.id,
      email: user.email,
      method: adminCheck.method,
      role: adminCheck.role,
    })

    const { data, error } = await supabase.from("entregas_email_config").select("*").limit(1).single()

    if (error) {
      console.error("❌ Error obteniendo configuración de entregas:", error)

      if (error.code === "PGRST116") {
        console.log("📧 Creando configuración por defecto para entregas...")

        const defaultConfig = {
          id: 1,
          enabled: true,
          cc_emails: [],
        }

        const { data: newConfig, error: insertError } = await supabase
          .from("entregas_email_config")
          .insert(defaultConfig)
          .select()
          .single()

        if (insertError) {
          console.error("❌ Error creando configuración por defecto:", insertError)
          return NextResponse.json(defaultConfig)
        }

        console.log("✅ Configuración por defecto de entregas creada")
        return NextResponse.json(newConfig)
      }

      return NextResponse.json({
        id: 1,
        enabled: true,
        cc_emails: [],
      })
    }

    console.log("✅ Configuración de entregas obtenida exitosamente")
    return NextResponse.json(data)
  } catch (error) {
    console.error("❌ Error crítico en API de entregas:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const config = await request.json()

    console.log("📧 === GUARDANDO CONFIGURACIÓN EMAIL ENTREGAS ===")

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("❌ Usuario no autenticado:", authError)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const adminCheck = await checkUserIsAdmin(supabase, user)

    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        {
          error: "Acceso denegado - Se requieren permisos de administrador",
          debug: {
            userId: user.id,
            email: user.email,
            method: adminCheck.method,
            availableRoles: adminCheck.availableRoles,
            requiredRoles: ["admin", "administrador"],
            errorDetails: adminCheck.error,
          },
        },
        { status: 403 },
      )
    }

    console.log("✅ Usuario admin verificado para guardar entregas:", {
      userId: user.id,
      email: user.email,
      method: adminCheck.method,
      role: adminCheck.role,
    })

    const configToSave = {
      id: 1,
      enabled: Boolean(config.enabled),
      cc_emails: Array.isArray(config.cc_emails) ? config.cc_emails : [],
      updated_at: new Date().toISOString(),
    }

    console.log("📧 Datos preparados para guardar entregas:", configToSave)

    const { data, error } = await supabase.from("entregas_email_config").upsert(configToSave).select().single()

    if (error) {
      console.error("❌ Error guardando configuración de entregas:", error)
      return NextResponse.json(
        {
          error: "Error guardando configuración",
          details: error.message,
          code: error.code,
        },
        { status: 500 },
      )
    }

    console.log("✅ Configuración de entregas guardada exitosamente:", data)
    console.log("📧 === FIN GUARDADO CONFIGURACIÓN ENTREGAS ===")

    return NextResponse.json(data)
  } catch (error) {
    console.error("❌ Error crítico guardando configuración de entregas:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
