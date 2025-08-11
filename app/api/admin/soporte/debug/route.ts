import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Verificar autenticación
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const debugInfo = {
      tables: {},
      errors: []
    }

    // Verificar tabla soporte_tickets
    try {
      const { data: soporteTickets, error } = await supabase
        .from("soporte_tickets")
        .select("count", { count: "exact", head: true })
      
      debugInfo.tables.soporte_tickets = {
        exists: !error,
        count: soporteTickets?.length || 0,
        error: error?.message
      }
    } catch (err) {
      debugInfo.tables.soporte_tickets = {
        exists: false,
        count: 0,
        error: err.message
      }
      debugInfo.errors.push(`soporte_tickets: ${err.message}`)
    }

    // Verificar tabla soporte_incidencias
    try {
      const { data: soporteIncidencias, error } = await supabase
        .from("soporte_incidencias")
        .select("count", { count: "exact", head: true })
      
      debugInfo.tables.soporte_incidencias = {
        exists: !error,
        count: soporteIncidencias?.length || 0,
        error: error?.message
      }
    } catch (err) {
      debugInfo.tables.soporte_incidencias = {
        exists: false,
        count: 0,
        error: err.message
      }
      debugInfo.errors.push(`soporte_incidencias: ${err.message}`)
    }

    // Verificar tabla entregas
    try {
      const { data: entregas, error } = await supabase
        .from("entregas")
        .select("count", { count: "exact", head: true })
      
      debugInfo.tables.entregas = {
        exists: !error,
        count: entregas?.length || 0,
        error: error?.message
      }
    } catch (err) {
      debugInfo.tables.entregas = {
        exists: false,
        count: 0,
        error: err.message
      }
      debugInfo.errors.push(`entregas: ${err.message}`)
    }

    // Verificar tabla incidencias_historial
    try {
      const { data: incidenciasHistorial, error } = await supabase
        .from("incidencias_historial")
        .select("count", { count: "exact", head: true })
      
      debugInfo.tables.incidencias_historial = {
        exists: !error,
        count: incidenciasHistorial?.length || 0,
        error: error?.message
      }
    } catch (err) {
      debugInfo.tables.incidencias_historial = {
        exists: false,
        count: 0,
        error: err.message
      }
      debugInfo.errors.push(`incidencias_historial: ${err.message}`)
    }

    // Obtener algunos registros de ejemplo
    try {
      const { data: entregasSample, error } = await supabase
        .from("entregas")
        .select("id, matricula, incidencias")
        .limit(3)
      
      debugInfo.sample_entregas = entregasSample || []
    } catch (err) {
      debugInfo.sample_entregas = []
    }

    try {
      const { data: historialSample, error } = await supabase
        .from("incidencias_historial")
        .select("id, matricula, tipo_incidencia")
        .limit(3)
      
      debugInfo.sample_historial = historialSample || []
    } catch (err) {
      debugInfo.sample_historial = []
    }

    return NextResponse.json(debugInfo)

  } catch (error) {
    console.error("Error en debug endpoint:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    )
  }
}
