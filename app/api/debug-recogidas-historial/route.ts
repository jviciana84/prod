import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerClient()

    // Verificar autenticación
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Contar total de recogidas
    const { count, error: countError } = await supabase
      .from("recogidas_historial")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("Error contando recogidas:", countError)
      return NextResponse.json({ error: "Error contando recogidas" }, { status: 500 })
    }

    // Obtener algunas recogidas de ejemplo
    const { data: recogidas, error } = await supabase
      .from("recogidas_historial")
      .select("*")
      .order("fecha_solicitud", { ascending: false })
      .limit(5)

    if (error) {
      console.error("Error obteniendo recogidas:", error)
      return NextResponse.json({ error: "Error obteniendo recogidas" }, { status: 500 })
    }

    return NextResponse.json({
      total: count || 0,
      recogidas: recogidas || [],
      message: count === 0 ? "No hay recogidas en el historial" : `Hay ${count} recogidas en el historial`
    })

  } catch (error) {
    console.error("Error en debug-recogidas-historial:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
} 