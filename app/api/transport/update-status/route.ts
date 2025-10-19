import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { id, isReceived } = body

    if (!id || isReceived === undefined) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })
    }

    const receptionDate = isReceived ? new Date().toISOString() : null

    const { data, error } = await supabase
      .from("nuevas_entradas")
      .update({
        is_received: isReceived,
        reception_date: receptionDate,
      })
      .eq("id", id)
      .select()

    if (error) {
      console.error("❌ [API] Error updating transport status:", error)
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

