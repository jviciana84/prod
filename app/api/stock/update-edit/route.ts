import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { id, updateData, hasInspectionDate } = body

    if (!id || !updateData) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })
    }

    // Si se está marcando status y no hay inspection_date, agregarla
    if (
      !hasInspectionDate &&
      ((updateData.paint_status && updateData.paint_status !== "pendiente") ||
        (updateData.body_status && updateData.body_status !== "pendiente") ||
        (updateData.mechanical_status && updateData.mechanical_status !== "pendiente"))
    ) {
      updateData.inspection_date = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from("stock")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("❌ [API] Error updating stock:", error)
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

