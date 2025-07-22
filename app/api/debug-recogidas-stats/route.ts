import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET() {
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

    // Obtener estadísticas
    const [
      { count: recogidasPendientes },
      { count: recogidasHistorial },
      { count: totalVehiculos }
    ] = await Promise.all([
      supabase
        .from("recogidas_pendientes")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("recogidas_historial")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("vehiculos")
        .select("*", { count: "exact", head: true })
    ])

    return NextResponse.json({
      recogidas_pendientes: recogidasPendientes || 0,
      recogidas_historial: recogidasHistorial || 0,
      total_vehiculos: totalVehiculos || 0
    })

  } catch (error) {
    console.error("Error en debug-recogidas-stats:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 