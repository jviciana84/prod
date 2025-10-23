import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient(await cookies())

    // 1. Obtener matrículas del CSV DUC (vehículos activos en DUC)
    const { data: ducData, error: ducError } = await supabase
      .from("duc_scraper")
      .select('"Matrícula"')
      .not('"Matrícula"', 'is', null)

    if (ducError) {
      console.error("Error fetching duc_scraper:", ducError)
    }

    const ducMatriculas = new Set(
      (ducData || [])
        .map((v) => v['Matrícula']?.toUpperCase().trim())
        .filter(Boolean)
    )

    // 2. Obtener matrículas vendidas (sales_vehicles)
    const { data: salesData, error: salesError } = await supabase
      .from("sales_vehicles")
      .select("license_plate")

    if (salesError) {
      console.error("Error fetching sales_vehicles:", salesError)
    }

    const salesMatriculas = new Set(
      (salesData || [])
        .map((v) => v.license_plate?.toUpperCase().trim())
        .filter(Boolean)
    )

    // 3. Obtener todo el stock
    const { data: stock, error: stockError } = await supabase
      .from("stock")
      .select("*")
      .order("created_at", { ascending: false })

    if (stockError) {
      console.error("Error fetching stock:", stockError)
      return NextResponse.json({ error: stockError.message }, { status: 500 })
    }

    // 4. Filtrar: SOLO mostrar vehículos que estén en DUC O vendidos
    // 5. Filtrar disponibilidad: SOLO mostrar si is_available = true
    const filteredStock = (stock || []).filter((vehicle) => {
      const matricula = vehicle.license_plate?.toUpperCase().trim()
      if (!matricula) return false

      const enDuc = ducMatriculas.has(matricula)
      const enVentas = salesMatriculas.has(matricula)
      const disponible = vehicle.is_available === true

      // Mostrar si: (está en DUC Y disponible) O (está vendido)
      return (enDuc && disponible) || enVentas
    })

    console.log(`📊 Stock total: ${stock?.length || 0}`)
    console.log(`✅ Stock filtrado (sin ausentes): ${filteredStock.length}`)
    console.log(`🚫 Ausentes excluidos: ${(stock?.length || 0) - filteredStock.length}`)

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
        stock: filteredStock,
        locations: locations || [],
      },
    })
  } catch (error) {
    console.error("Unexpected error in stock list API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

