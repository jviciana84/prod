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

    // Verificar estructura de tablas
    const tables = [
      "recogidas_pendientes",
      "recogidas_historial", 
      "recogidas_email_config"
    ]

    const tableInfo = {}

    for (const tableName of tables) {
      try {
        // Verificar si la tabla existe
        const { data: columns, error: columnsError } = await supabase
          .rpc('get_table_structure', { table_name: tableName })

        if (columnsError) {
          tableInfo[tableName] = {
            exists: false,
            error: columnsError.message
          }
        } else {
          // Contar registros
          const { count, error: countError } = await supabase
            .from(tableName)
            .select("*", { count: "exact", head: true })

          tableInfo[tableName] = {
            exists: true,
            columns: columns,
            recordCount: count || 0,
            countError: countError?.message
          }
        }
      } catch (error) {
        tableInfo[tableName] = {
          exists: false,
          error: error instanceof Error ? error.message : String(error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      tables: tableInfo,
      user: {
        id: user.id,
        email: user.email
      }
    })

  } catch (error) {
    console.error("Error en debug-recogidas-tables:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 