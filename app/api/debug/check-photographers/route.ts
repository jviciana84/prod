import { createRouteHandlerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = await createRouteHandlerClient(cookieStore)
    
    // Consultar fotógrafos asignados
    const { data: photographers, error } = await supabase
      .from("fotos_asignadas")
      .select("*")
      .order("percentage", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calcular estadísticas
    const total = photographers?.length || 0
    const activos = photographers?.filter(p => p.is_active).length || 0
    const inactivos = photographers?.filter(p => !p.is_active).length || 0
    const ocultos = photographers?.filter(p => p.is_hidden).length || 0
    const bloqueados = photographers?.filter(p => p.is_locked).length || 0
    
    const activosVisibles = photographers?.filter(p => p.is_active && !p.is_hidden) || []
    const porcentajeTotalActivo = activosVisibles.reduce((sum, p) => sum + (p.percentage || 0), 0)

    return NextResponse.json({
      success: true,
      data: {
        total,
        activos,
        inactivos,
        ocultos,
        bloqueados,
        porcentajeTotalActivo,
        photographers: photographers || []
      }
    })

  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
} 