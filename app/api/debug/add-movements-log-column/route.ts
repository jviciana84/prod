import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log("🔧 Agregando columna movements_log a external_material_vehicles...")

    // Ejecutar el SQL para agregar la columna
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE external_material_vehicles 
        ADD COLUMN IF NOT EXISTS movements_log TEXT DEFAULT '[]';
        
        COMMENT ON COLUMN external_material_vehicles.movements_log IS 'JSON array con el historial de movimientos de materiales para vehículos externos';
      `
    })

    if (error) {
      console.error("❌ Error ejecutando SQL:", error)
      return NextResponse.json({
        success: false,
        error: error.message
      })
    }

    console.log("✅ Columna movements_log agregada correctamente")

    return NextResponse.json({
      success: true,
      message: "Columna movements_log agregada correctamente"
    })

  } catch (error: any) {
    console.error("❌ Error general:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    })
  }
} 