import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient(await cookies())

    // Consulta principal de vehículos vendidos
    const { data: salesVehicles, error: salesError } = await supabase
      .from("sales_vehicles")
      .select("*")
      .order("sale_date", { ascending: false })

    if (salesError) {
      console.error("Error fetching sales vehicles:", salesError)
      return NextResponse.json({ error: salesError.message }, { status: 500 })
    }

    // Consulta de expense_types
    const { data: expenseTypes, error: expenseError } = await supabase
      .from("expense_types")
      .select("*")

    if (expenseError) {
      console.error("Error fetching expense types:", expenseError)
      return NextResponse.json({ error: expenseError.message }, { status: 500 })
    }

    // Consulta de delivery centers (opcional, puede no existir la tabla)
    let deliveryCenters: any[] = []
    try {
      const { data: centersData, error: centersError } = await supabase
        .from("delivery_centers")
        .select("*")

      if (!centersError && centersData) {
        deliveryCenters = centersData
      } else if (centersError && !centersError.message.includes("does not exist")) {
        // Solo loguear si es un error diferente a tabla no existe
        console.error("Error fetching delivery centers:", centersError)
      }
    } catch (err) {
      console.log("Tabla delivery_centers no existe, continuando sin ella")
    }

    return NextResponse.json({
      data: {
        salesVehicles: salesVehicles || [],
        expenseTypes: expenseTypes || [],
        deliveryCenters: deliveryCenters,
      },
    })
  } catch (error) {
    console.error("Unexpected error in sales list API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

