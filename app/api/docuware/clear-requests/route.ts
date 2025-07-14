import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function DELETE(request: NextRequest) {
  try {
    console.log("🗑️ Limpiando registros Docuware...")
    
    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Eliminar materiales primero (por la foreign key)
    const { error: materialsError } = await supabase
      .from("docuware_request_materials")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000") // Eliminar todos
    
    if (materialsError) {
      console.error("❌ Error eliminando materiales:", materialsError)
      return NextResponse.json({ error: "Error eliminando materiales" }, { status: 500 })
    }
    
    // Eliminar solicitudes
    const { error: requestsError } = await supabase
      .from("docuware_requests")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000") // Eliminar todos
    
    if (requestsError) {
      console.error("❌ Error eliminando solicitudes:", requestsError)
      return NextResponse.json({ error: "Error eliminando solicitudes" }, { status: 500 })
    }
    
    console.log("✅ Registros Docuware eliminados correctamente")
    
    return NextResponse.json({
      success: true,
      message: "Todos los registros Docuware han sido eliminados"
    })
    
  } catch (error) {
    console.error("❌ Error crítico:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
} 