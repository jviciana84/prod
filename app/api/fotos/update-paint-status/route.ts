import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { licensePlate, estado, date } = body

    if (!licensePlate || !estado || !date) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("fotos")
      .update({
        estado_pintura: estado,
        paint_status_date: date,
        paint_apto_date: estado === "apto" ? date : null,
      })
      .eq("license_plate", licensePlate)
      .select()

    if (error) {
      console.error("❌ [API] Error updating fotos:", error)
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

