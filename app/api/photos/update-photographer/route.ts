import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { id, photographerId } = body

    if (!id) {
      return NextResponse.json(
        { error: "Falta ID del vehículo" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("fotos")
      .update({ assigned_to: photographerId })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("❌ [API] Error updating photographer:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("❌ [API] Exception:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}

