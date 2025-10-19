import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient(await cookies())

    // Consulta de pedidos validados
    const { data: pedidos, error } = await supabase
      .from("pedidos_validados")
      .select("*")
      .order("validation_date", { ascending: false })

    if (error) {
      console.error("Error fetching pedidos validados:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: pedidos || [],
    })
  } catch (error) {
    console.error("Unexpected error in validados list API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

