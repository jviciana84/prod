import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient(await cookies())

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20

    // Obtener actividades recientes (últimas ventas)
    const { data: recentSales, error: salesError } = await supabase
      .from("sales_vehicles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (salesError) {
      console.error("Error fetching recent sales:", salesError)
      return NextResponse.json({ error: salesError.message }, { status: 500 })
    }

    // Obtener entregas recientes
    const { data: recentEntregas, error: entregasError } = await supabase
      .from("entregas")
      .select("*")
      .order("fecha_entrega", { ascending: false })
      .limit(limit)

    if (entregasError) {
      console.error("Error fetching recent entregas:", entregasError)
      return NextResponse.json({ error: entregasError.message }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        recentSales: recentSales || [],
        recentEntregas: recentEntregas || [],
      },
    })
  } catch (error) {
    console.error("Unexpected error in activity feed API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

