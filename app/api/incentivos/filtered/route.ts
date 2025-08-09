import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { year, month, advisor, mode = "pending", isAdmin = false, userAdvisorName } = body

    const supabase = await createClient()

    let query = supabase.from("incentivos").select("*").order("fecha_entrega", { ascending: false })

    // Filtro por modo
    if (mode === "pending") {
      query = query.or("garantia.is.null,gastos_360.is.null")
    } else if (mode === "historical") {
      // Para modo histórico, excluir los incentivos pendientes (que tienen garantia IS NULL o gastos_360 IS NULL)
      query = query.not("garantia", "is", null).not("gastos_360", "is", null)
    }

    // Filtros de fecha (solo para modo histórico)
    if (mode === "historical") {
      if (year && year !== "all") {
        const startDate = `${year}-01-01`
        const endDate = `${year}-12-31`
        query = query.gte("fecha_entrega", startDate).lte("fecha_entrega", endDate)
      }

      if (month && month !== "all") {
        const [monthName] = month.split(" ")
        const monthNumber = getMonthNumber(monthName)
        if (monthNumber) {
          const currentYear = year && year !== "all" ? year : new Date().getFullYear()
          const startDate = `${currentYear}-${monthNumber.toString().padStart(2, "0")}-01`
          const endDate = `${currentYear}-${monthNumber.toString().padStart(2, "0")}-31`
          query = query.gte("fecha_entrega", startDate).lte("fecha_entrega", endDate)
        }
      }
    }

    // Filtro por asesor
    if (advisor && advisor !== "all") {
      query = query.ilike("asesor", advisor)
    }

    // Filtro por permisos de usuario
    if (!isAdmin && userAdvisorName) {
      query = query.ilike("asesor", userAdvisorName)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching filtered incentives:", error)
      return NextResponse.json({ data: [], error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [], error: null })
  } catch (error: any) {
    console.error("Unexpected error in getIncentivesFiltered:", error)
    return NextResponse.json({ data: [], error: error.message }, { status: 500 })
  }
}

function getMonthNumber(monthName: string): number | null {
  const months: { [key: string]: number } = {
    enero: 1,
    febrero: 2,
    marzo: 3,
    abril: 4,
    mayo: 5,
    junio: 6,
    julio: 7,
    agosto: 8,
    septiembre: 9,
    octubre: 10,
    noviembre: 11,
    diciembre: 12,
  }

  return months[monthName.toLowerCase()] || null
} 