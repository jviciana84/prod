import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient(await cookies())

    // Consulta de stock
    const { data: stock, error: stockError } = await supabase
      .from("stock")
      .select("*")
      .order("created_at", { ascending: false })

    if (stockError) {
      console.error("Error fetching stock:", stockError)
      return NextResponse.json({ error: stockError.message }, { status: 500 })
    }

    // Consulta de ubicaciones
    const { data: locations, error: locationsError } = await supabase
      .from("locations")
      .select("*")
      .order("name")

    if (locationsError) {
      console.error("Error fetching locations:", locationsError)
      return NextResponse.json({ error: locationsError.message }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        stock: stock || [],
        locations: locations || [],
      },
    })
  } catch (error) {
    console.error("Unexpected error in stock list API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

