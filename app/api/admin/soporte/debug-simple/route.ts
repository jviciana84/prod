import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  console.log("🧪 Debug simple iniciado")
  
  try {
    const supabase = await createServerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const results = {}

    // 1. Probar soporte_tickets
    try {
      console.log("🔍 Probando soporte_tickets...")
      const { data, error, count } = await supabase
        .from("soporte_tickets")
        .select("*", { count: "exact", head: true })
      
      results.soporte_tickets = {
        exists: !error,
        count: count || 0,
        error: error?.message
      }
      console.log("✅ soporte_tickets:", results.soporte_tickets)
    } catch (err) {
      results.soporte_tickets = { exists: false, count: 0, error: err.message }
    }

    // 2. Probar entregas
    try {
      console.log("🔍 Probando entregas...")
      const { data, error, count } = await supabase
        .from("entregas")
        .select("*", { count: "exact", head: true })
      
      results.entregas = {
        exists: !error,
        count: count || 0,
        error: error?.message
      }
      console.log("✅ entregas:", results.entregas)
    } catch (err) {
      results.entregas = { exists: false, count: 0, error: err.message }
    }

    // 3. Probar incidencias_historial
    try {
      console.log("🔍 Probando incidencias_historial...")
      const { data, error, count } = await supabase
        .from("incidencias_historial")
        .select("*", { count: "exact", head: true })
      
      results.incidencias_historial = {
        exists: !error,
        count: count || 0,
        error: error?.message
      }
      console.log("✅ incidencias_historial:", results.incidencias_historial)
    } catch (err) {
      results.incidencias_historial = { exists: false, count: 0, error: err.message }
    }

    // 4. Obtener algunos registros de ejemplo
    try {
      const { data: historialSample } = await supabase
        .from("incidencias_historial")
        .select("id, matricula, tipo_incidencia")
        .limit(3)
      
      results.sample_historial = historialSample || []
      console.log("📋 Muestra de historial:", results.sample_historial)
    } catch (err) {
      results.sample_historial = []
    }

    console.log("🏁 Debug simple completado")
    return NextResponse.json(results)

  } catch (error) {
    console.error("❌ Error en debug simple:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor", 
      details: error.message 
    }, { status: 500 })
  }
}
