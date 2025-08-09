import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Consulta simple - solo obtener todos los incentivos
    const { data, error } = await supabase
      .from("incentivos")
      .select("id, matricula, garantia, asesor")
      .order("matricula")

    if (error) {
      console.error("Error fetching incentives:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Filtrar los que tienen garantia o gastos_360 como null
    const filteredData = data?.filter((item) => {
      return item.garantia === null || item.gastos_360 === null
    }) || []

    return NextResponse.json(filteredData)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
