import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient(await cookies())

    // Cargar vehículos para mapear IDs a matrículas
    const { data: vehicles, error: vehiclesError } = await supabase
      .from("sales_vehicles")
      .select("id, license_plate")

    if (vehiclesError) {
      console.error("Error fetching vehicles:", vehiclesError)
      return NextResponse.json({ error: vehiclesError.message }, { status: 500 })
    }

    // Cargar movimientos de llaves
    const { data: keyMovements, error: keyError } = await supabase
      .from("key_movements")
      .select("*")
      .order("created_at", { ascending: false })

    if (keyError) {
      console.error("Error fetching key movements:", keyError)
      return NextResponse.json({ error: keyError.message }, { status: 500 })
    }

    // Cargar movimientos de documentos
    const { data: docMovements, error: docError } = await supabase
      .from("document_movements")
      .select("*")
      .order("created_at", { ascending: false })

    if (docError) {
      console.error("Error fetching document movements:", docError)
      return NextResponse.json({ error: docError.message }, { status: 500 })
    }

    // Cargar perfiles de usuarios
    const userIds = new Set<string>()
    keyMovements?.forEach((m) => {
      if (m.from_user_id) userIds.add(m.from_user_id)
      if (m.to_user_id) userIds.add(m.to_user_id)
    })
    docMovements?.forEach((m) => {
      if (m.from_user_id) userIds.add(m.from_user_id)
      if (m.to_user_id) userIds.add(m.to_user_id)
    })

    let profiles: any[] = []
    if (userIds.size > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, alias, avatar_url")
        .in("id", Array.from(userIds))

      if (!profilesError && profilesData) {
        profiles = profilesData
      }
    }

    return NextResponse.json({
      data: {
        vehicles: vehicles || [],
        keyMovements: keyMovements || [],
        docMovements: docMovements || [],
        profiles: profiles,
      },
    })
  } catch (error) {
    console.error("Unexpected error in llaves movements API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

