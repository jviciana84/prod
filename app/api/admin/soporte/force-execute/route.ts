import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  console.log("🚀 FORCE EXECUTE - Iniciando ejecución forzada")
  
  try {
    const supabase = await createServerClient()
    
    // Verificar autenticación
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.log("❌ Usuario no autorizado en force execute")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    
    console.log("✅ Usuario autorizado en force execute:", user.email)
    
    // Solo consultar incidencias_historial para simplificar
    console.log("🔍 Consultando SOLO incidencias_historial...")
    const { data: historialIncidencias, error: historialError } = await supabase
      .from("incidencias_historial")
      .select("id, matricula, tipo_incidencia, fecha, resuelta")
      .limit(10)
    
    if (historialError) {
      console.error("❌ Error en force execute:", historialError)
      return NextResponse.json({ 
        error: "Error consultando historial", 
        details: historialError.message 
      }, { status: 500 })
    }
    
    console.log("✅ Force execute - Incidencias encontradas:", historialIncidencias?.length || 0)
    
    if (historialIncidencias && historialIncidencias.length > 0) {
      console.log("📋 Primera incidencia:", historialIncidencias[0])
    }
    
    const response = NextResponse.json({
      success: true,
      message: "Force execute completado",
      count: historialIncidencias?.length || 0,
      sample: historialIncidencias?.[0] || null,
      timestamp: new Date().toISOString()
    })
    
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
    
  } catch (error) {
    console.error("❌ Error en force execute:", error)
    return NextResponse.json({ 
      error: "Error interno", 
      details: error.message 
    }, { status: 500 })
  }
}
