import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

/**
 * API Route para listar datos de control de baterías
 * Método: GET
 * Retorna: vehículos BEV/PHEV, datos de baterías, vehículos vendidos, configuración
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

    // 1. Consultar vehículos BEV/PHEV desde duc_scraper
    const { data: ducVehicles, error: ducError } = await supabase
      .from("duc_scraper")
      .select(
        `"Chasis", "e-code", "Matrícula", "Marca", "Modelo", "Color Carrocería", "Carrocería", "Tipo motor", "Combustible", "Disponibilidad"`
      )
      .or('"Tipo motor".ilike.%BEV%,"Tipo motor".ilike.%PHEV%,"Tipo motor".ilike.%eléctric%,"Tipo motor".ilike.%electric%,"Combustible".ilike.%eléctric%,"Combustible".ilike.%electric%')

    if (ducError) {
      console.error("❌ Error fetching duc_scraper:", ducError)
      return NextResponse.json({ error: ducError.message }, { status: 500 })
    }

    // 2. Consultar datos existentes de battery_control
    const { data: batteryData, error: batteryError } = await supabase
      .from("battery_control")
      .select("*")
      .order("updated_at", { ascending: false })

    if (batteryError) {
      console.error("❌ Error fetching battery_control:", batteryError)
      return NextResponse.json({ error: batteryError.message }, { status: 500 })
    }

    // 3. Consultar vehículos vendidos
    const { data: soldVehicles, error: soldError } = await supabase
      .from("sales_vehicles")
      .select("license_plate")

    if (soldError) {
      console.error("❌ Error fetching sales_vehicles:", soldError)
      return NextResponse.json({ error: soldError.message }, { status: 500 })
    }

    // 4. Consultar configuración (solo para admin)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    let config = null
    if (profile && (profile.role === "admin" || profile.role === "administrador")) {
      const { data: configData, error: configError } = await supabase
        .from("battery_control_config")
        .select("*")
        .single()

      if (!configError) {
        config = configData
      }
    }

    console.log("✅ Datos de baterías cargados:", {
      ducVehicles: ducVehicles?.length || 0,
      batteryData: batteryData?.length || 0,
      soldVehicles: soldVehicles?.length || 0,
      hasConfig: !!config,
    })

    return NextResponse.json({
      data: {
        ducVehicles: ducVehicles || [],
        batteryData: batteryData || [],
        soldVehicles: soldVehicles || [],
        config: config,
        userRole: profile?.role || null,
      },
    })
  } catch (error) {
    console.error("❌ Error inesperado en battery-control/list:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}


