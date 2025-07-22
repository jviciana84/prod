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

    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get('table')

    if (!tableName) {
      return NextResponse.json({ error: "Nombre de tabla requerido" }, { status: 400 })
    }

    const results = {
      table: tableName,
      timestamp: new Date().toISOString(),
      structure: {} as any,
      sampleData: null as any,
      error: null as any
    }

    try {
      // Obtener estructura de la tabla
      const { data: structureData, error: structureError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)

      if (structureError) {
        results.error = {
          message: structureError.message,
          code: structureError.code,
          details: structureError.details
        }
      } else if (structureData && structureData.length > 0) {
        results.structure = {
          columns: Object.keys(structureData[0]),
          sampleRow: structureData[0]
        }
      }

      // Obtener una muestra de datos
      const { data: sampleData, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(3)

      if (!sampleError && sampleData) {
        results.sampleData = sampleData
      }

    } catch (error) {
      results.error = {
        message: "Error consultando tabla",
        details: error
      }
    }

    return NextResponse.json(results)

  } catch (error) {
    return NextResponse.json({ 
      error: "Error interno del servidor",
      details: error
    }, { status: 500 })
  }
} 