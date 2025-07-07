import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function checkUserIsAdmin(supabase: any, user: any) {
  console.log("🔍 Verificando permisos de administrador via user_roles para:", {
    userId: user.id,
    email: user.email,
  })

  // Verificar user_roles
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

  // Verificar si tiene rol de admin
  for (const userRole of roleData) {
    const roleName = userRole.roles?.name
    if (roleName && ["admin", "administrador"].includes(roleName.toLowerCase())) {
      console.log("✅ Admin verificado via user_roles:", roleName)
      return { isAdmin: true, method: "user_roles", role: roleName }
    }
  }

  console.log(
    "❌ Usuario no tiene rol de admin. Roles encontrados:",
    roleData.map((r) => r.roles?.name),
  )
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

    // Verificar que el usuario esté autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("❌ Usuario no autenticado:", authError)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar permisos de admin
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

    console.log("✅ Usuario admin verificado:", {
      userId: user.id,
      email: user.email,
      method: adminCheck.method,
      role: adminCheck.role,
    })

    // Obtener configuración
    const { data, error } = await supabase.from("email_config").select("*").limit(1).single()

    if (error) {
      console.error("❌ Error obteniendo configuración:", error)

      // Si no existe configuración, crear una por defecto
      if (error.code === "PGRST116") {
        console.log("📧 Creando configuración por defecto...")

        const defaultConfig = {
          id: 1,
          enabled: false,
          sender_email: "material@controlvo.ovh",
          sender_name: "Sistema CVO - Material",
          cc_emails: [],
          subject_template: "Entrega de llaves / documentación - {fecha}",
          body_template:
            "Hola,\n\nRegistro de entrega de material.\n\nFecha: {fecha}\n\nMaterial entregado:\n{materiales}\n\nSaludos.",
        }

        const { data: newConfig, error: insertError } = await supabase
          .from("email_config")
          .insert(defaultConfig)
          .select()
          .single()

        if (insertError) {
          console.error("❌ Error creando configuración por defecto:", insertError)
          return NextResponse.json(defaultConfig)
        }

        console.log("✅ Configuración por defecto creada")
        return NextResponse.json(newConfig)
      }

      // Devolver configuración por defecto en caso de otros errores
      return NextResponse.json({
        id: 1,
        enabled: false,
        sender_email: "material@controlvo.ovh",
        sender_name: "Sistema CVO - Material",
        cc_emails: [],
        subject_template: "Entrega de llaves / documentación - {fecha}",
        body_template:
          "Hola,\n\nRegistro de entrega de material.\n\nFecha: {fecha}\n\nMaterial entregado:\n{materiales}\n\nSaludos.",
      })
    }

    console.log("✅ Configuración obtenida exitosamente")
    return NextResponse.json(data)
  } catch (error) {
    console.error("❌ Error crítico en API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const config = await request.json()

    console.log("📧 === GUARDANDO CONFIGURACIÓN EMAIL ===")

    // Verificar que el usuario esté autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("❌ Usuario no autenticado:", authError)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar permisos de admin
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

    console.log("✅ Usuario admin verificado para guardar:", {
      userId: user.id,
      email: user.email,
      method: adminCheck.method,
      role: adminCheck.role,
    })

    // Preparar datos para guardar
    const configToSave = {
      id: 1,
      enabled: Boolean(config.enabled),
      sender_email: config.sender_email || "material@controlvo.ovh",
      sender_name: config.sender_name || "Sistema CVO - Material",
      cc_emails: Array.isArray(config.cc_emails) ? config.cc_emails : [],
      subject_template: config.subject_template || "Entrega de llaves / documentación - {fecha}",
      body_template:
        config.body_template ||
        "Hola,\n\nRegistro de entrega de material.\n\nFecha: {fecha}\n\nMaterial entregado:\n{materiales}\n\nSaludos.",
      updated_at: new Date().toISOString(),
    }

    console.log("📧 Datos preparados para guardar:", configToSave)

    // Intentar upsert
    const { data, error } = await supabase.from("email_config").upsert(configToSave).select().single()

    if (error) {
      console.error("❌ Error guardando configuración:", error)
      return NextResponse.json(
        {
          error: "Error guardando configuración",
          details: error.message,
          code: error.code,
        },
        { status: 500 },
      )
    }

    console.log("✅ Configuración guardada exitosamente:", data)
    console.log("📧 === FIN GUARDADO CONFIGURACIÓN ===")

    return NextResponse.json(data)
  } catch (error) {
    console.error("❌ Error crítico guardando configuración:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
