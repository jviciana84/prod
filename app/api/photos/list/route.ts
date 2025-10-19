import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient(await cookies())

    // Consulta de fotos
    const { data: fotos, error: fotosError } = await supabase
      .from("fotos")
      .select("*")
      .order("created_at", { ascending: false })

    if (fotosError) {
      console.error("Error fetching fotos:", fotosError)
      return NextResponse.json({ error: fotosError.message }, { status: 500 })
    }

    // Consulta de vehículos vendidos relacionados
    const { data: salesVehicles, error: salesError } = await supabase
      .from("sales_vehicles")
      .select("*")

    if (salesError) {
      console.error("Error fetching sales_vehicles:", salesError)
      return NextResponse.json({ error: salesError.message }, { status: 500 })
    }

    // Consulta de fotógrafos
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name")

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError)
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    // Consulta de asignaciones de fotógrafos
    const { data: fotosAsignadas, error: asignadasError } = await supabase
      .from("fotos_asignadas")
      .select("*")
      .eq("is_active", true)

    if (asignadasError) {
      console.error("Error fetching fotos_asignadas:", asignadasError)
      return NextResponse.json({ error: asignadasError.message }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        fotos: fotos || [],
        salesVehicles: salesVehicles || [],
        profiles: profiles || [],
        fotosAsignadas: fotosAsignadas || [],
      },
    })
  } catch (error) {
    console.error("Unexpected error in photos list API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

