import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient(await cookies())

    // Obtener usuario actual
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Consultar ventas profesionales reales de la base de datos
    const { data: sales, error: salesError } = await supabase
      .from("professional_sales")
      .select("*")
      .order("created_at", { ascending: false })

    if (salesError) {
      console.error("Error al cargar ventas profesionales:", salesError)
      // Si la tabla no existe, retornar vacío
      if (salesError.message.includes("does not exist")) {
        console.log("Tabla professional_sales no existe aún. Retornando vacío.")
        return NextResponse.json({
          data: {
            sales: [],
          },
        })
      }
      return NextResponse.json({ error: salesError.message }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        sales: sales || [],
      },
    })
  } catch (error) {
    console.error("Unexpected error in ventas profesionales list API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

