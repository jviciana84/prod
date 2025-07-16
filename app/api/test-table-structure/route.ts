import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(cookieStore)

    // Verificar que la función existe
    const { data: nuevasEntradasColumns, error: nuevasEntradasError } = await supabase
      .rpc('get_table_structure', { table_name: 'nuevas_entradas' })

    const { data: stockColumns, error: stockError } = await supabase
      .rpc('get_table_structure', { table_name: 'stock' })

    if (nuevasEntradasError) {
      return NextResponse.json({
        success: false,
        error: 'Error al obtener estructura de nuevas_entradas',
        details: nuevasEntradasError
      }, { status: 500 })
    }

    if (stockError) {
      return NextResponse.json({
        success: false,
        error: 'Error al obtener estructura de stock',
        details: stockError
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Función SQL funciona correctamente',
      data: {
        nuevas_entradas: {
          columns: nuevasEntradasColumns?.length || 0,
          sample: nuevasEntradasColumns?.slice(0, 3) || []
        },
        stock: {
          columns: stockColumns?.length || 0,
          sample: stockColumns?.slice(0, 3) || []
        }
      }
    })

  } catch (error) {
    console.error('Error en test-table-structure:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error
    }, { status: 500 })
  }
} 