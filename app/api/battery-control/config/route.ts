import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

/**
 * API Route para gestionar configuración de control de baterías
 * Solo accesible para administradores
 */

/**
 * GET: Obtener configuración actual
 */
export async function GET() {
  try {
    const supabase = await createServerClient(await cookies())

    // Verificar autenticación
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar rol de administrador
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })
    }

    const isAdmin = profile.role === "admin" || profile.role === "administrador"
    if (!isAdmin) {
      return NextResponse.json({ error: "Acceso denegado. Solo administradores" }, { status: 403 })
    }

    // Obtener configuración
    const { data: config, error: configError } = await supabase
      .from("battery_control_config")
      .select("*")
      .limit(1)
      .single()

    if (configError) {
      console.error("❌ Error obteniendo configuración:", configError)
      return NextResponse.json({ error: configError.message }, { status: 500 })
    }

    return NextResponse.json({
      data: config,
    })
  } catch (error) {
    console.error("❌ Error inesperado en battery-control/config GET:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * POST: Actualizar configuración
 * Body: { config object }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient(await cookies())

    // Verificar autenticación
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar rol de administrador
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })
    }

    const isAdmin = profile.role === "admin" || profile.role === "administrador"
    if (!isAdmin) {
      return NextResponse.json({ error: "Acceso denegado. Solo administradores" }, { status: 403 })
    }

    // Obtener datos del body
    const body = await request.json()

    // Validaciones
    if (body.days_to_reset && (body.days_to_reset <= 0 || isNaN(body.days_to_reset))) {
      return NextResponse.json({ error: "days_to_reset debe ser mayor a 0" }, { status: 400 })
    }

    if (body.days_alert_1 && (body.days_alert_1 <= 0 || isNaN(body.days_alert_1))) {
      return NextResponse.json({ error: "days_alert_1 debe ser mayor a 0" }, { status: 400 })
    }

    // Validar porcentajes (0-100)
    const percentageFields = [
      "xev_charge_ok",
      "xev_charge_sufficient",
      "xev_charge_insufficient",
      "phev_charge_ok",
      "phev_charge_sufficient",
      "phev_charge_insufficient",
    ]

    for (const field of percentageFields) {
      if (body[field] !== undefined) {
        const value = parseInt(body[field])
        if (isNaN(value) || value < 0 || value > 100) {
          return NextResponse.json(
            { error: `${field} debe estar entre 0 y 100` },
            { status: 400 }
          )
        }
      }
    }

    // Obtener ID de la configuración existente
    const { data: existingConfig, error: fetchError } = await supabase
      .from("battery_control_config")
      .select("id")
      .limit(1)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: "No se encontró configuración" }, { status: 404 })
    }

    // Actualizar configuración
    const { data: updatedConfig, error: updateError } = await supabase
      .from("battery_control_config")
      .update(body)
      .eq("id", existingConfig.id)
      .select()
      .single()

    if (updateError) {
      console.error("❌ Error actualizando configuración:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log("✅ Configuración actualizada por admin:", user.id)

    return NextResponse.json({
      success: true,
      data: updatedConfig,
    })
  } catch (error) {
    console.error("❌ Error inesperado en battery-control/config POST:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

