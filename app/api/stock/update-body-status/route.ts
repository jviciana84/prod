import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { id, newStatus, hasInspectionDate } = body

    if (!id || !newStatus) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })
    }

    const now = new Date().toISOString()
    const updateData: any = {
      body_status: newStatus,
    }

    // Si es la primera vez que se marca como no pendiente, actualizar inspection_date
    if (!hasInspectionDate && newStatus !== "pendiente") {
      updateData.inspection_date = now
    }

    const { data, error } = await supabase
      .from("stock")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("❌ [API] Error updating body status:", error)
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

