import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("incentivos")
      .select("id, matricula, garantia, asesor, or")
      .or("garantia.is.null,gastos_360.is.null")
      .order("matricula")

    if (error) {
      console.error("Error fetching pending warranties:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
