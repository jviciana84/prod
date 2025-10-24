import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos" },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    
    // Solo guardar fecha cuando el estado es "completado"
    const updates: any = { photo_360_status: status }
    if (status === "completado") {
      updates.photo_360_date = now
    } else if (status === "pendiente") {
      updates.photo_360_date = null
    }
    
    const { data, error } = await supabase
      .from("sales_vehicles")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("❌ [API] Error updating Photo360 status:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data, timestamp: now })
  } catch (error) {
    console.error("❌ [API] Exception:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}

