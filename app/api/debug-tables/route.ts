import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createRouteHandlerClient(cookieStore)

    // Obtener información sobre las tablas
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')

    if (error) {
      console.error('Error obteniendo tablas:', error)
      return NextResponse.json({ error: 'Error obteniendo tablas' }, { status: 500 })
    }

    // También intentar obtener datos de algunas tablas comunes
    const tableData: any = {}
    
    // Intentar con diferentes nombres de tablas
    const possibleTables = ['sales', 'ventas', 'vehicles', 'vehiculos', 'orders', 'pedidos']
    
    for (const tableName of possibleTables) {
      try {
        const { data, error: tableError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (!tableError && data) {
          tableData[tableName] = {
            exists: true,
            sampleData: data[0] || null,
            columns: data[0] ? Object.keys(data[0]) : []
          }
        } else {
          tableData[tableName] = {
            exists: false,
            error: tableError?.message
          }
        }
      } catch (e) {
        tableData[tableName] = {
          exists: false,
          error: 'Table does not exist'
        }
      }
    }

    return NextResponse.json({
      tables: tables?.map(t => t.table_name) || [],
      tableData
    })

  } catch (error) {
    console.error('Error en debug tables:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 