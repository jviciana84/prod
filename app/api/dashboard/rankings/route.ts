import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient(await cookies())

    // Obtener ventas del mes actual
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { data: salesData, error: salesError } = await supabase
      .from("sales_vehicles")
      .select("advisor, payment_method, price")
      .gte("sale_date", firstDayOfMonth)

    if (salesError) {
      console.error("Error fetching sales for rankings:", salesError)
      return NextResponse.json({ error: salesError.message }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        sales: salesData || [],
      },
    })
  } catch (error) {
    console.error("Unexpected error in dashboard rankings API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

