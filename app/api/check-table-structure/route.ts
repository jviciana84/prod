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

    // Verificar si la tabla recogidas_historial existe
    const { data: recogidasTable, error: recogidasError } = await supabase
      .from("recogidas_historial")
      .select("id")
      .limit(1)

    // Verificar si la tabla recogidas_email_config existe
    const { data: emailConfigTable, error: emailConfigError } = await supabase
      .from("recogidas_email_config")
      .select("id")
      .limit(1)

    // Obtener estructura de columnas de recogidas_historial
    let columnStructure = null
    if (!recogidasError) {
      try {
        const { data: columns, error: columnsError } = await supabase
          .rpc('get_table_structure', { table_name: 'recogidas_historial' })
        
        if (!columnsError) {
          columnStructure = columns
        }
      } catch (error) {
        console.log("No se pudo obtener estructura de columnas:", error)
      }
    }

    return NextResponse.json({
      recogidas_historial: {
        exists: !recogidasError,
        error: recogidasError?.message || null,
        columnStructure: columnStructure
      },
      recogidas_email_config: {
        exists: !emailConfigError,
        error: emailConfigError?.message || null
      }
    })
  } catch (error) {
    console.error("Error verificando estructura de tablas:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
} 