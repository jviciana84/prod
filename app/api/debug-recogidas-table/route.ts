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

    const results = {
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email
      },
      tables: {} as any,
      errors: [] as any[]
    }

    // 1. Verificar tabla recogidas_historial
    try {
      const { data: historialData, error: historialError } = await supabase
        .from("recogidas_historial")
        .select("count")
        .single()

      if (historialError) {
        results.errors.push({
          table: "recogidas_historial",
          error: historialError.message,
          code: historialError.code
        })
      } else {
        results.tables.recogidas_historial = {
          exists: true,
          count: historialData?.count || 0
        }
      }
    } catch (error) {
      results.errors.push({
        table: "recogidas_historial",
        error: "Error verificando tabla",
        details: error
      })
    }

    // 2. Verificar tabla recogidas_pendientes
    try {
      const { data: pendientesData, error: pendientesError } = await supabase
        .from("recogidas_pendientes")
        .select("count")
        .single()

      if (pendientesError) {
        results.errors.push({
          table: "recogidas_pendientes",
          error: pendientesError.message,
          code: pendientesError.code
        })
      } else {
        results.tables.recogidas_pendientes = {
          exists: true,
          count: pendientesData?.count || 0
        }
      }
    } catch (error) {
      results.errors.push({
        table: "recogidas_pendientes",
        error: "Error verificando tabla",
        details: error
      })
    }

    // 3. Verificar estructura de recogidas_historial
    try {
      const { data: structureData, error: structureError } = await supabase
        .rpc('get_table_structure', { table_name: 'recogidas_historial' })

      if (structureError) {
        results.errors.push({
          operation: "get_table_structure",
          error: structureError.message,
          code: structureError.code
        })
      } else {
        results.tables.recogidas_historial_structure = structureData
      }
    } catch (error) {
      results.errors.push({
        operation: "get_table_structure",
        error: "Error obteniendo estructura",
        details: error
      })
    }

    // 4. Intentar una inserción de prueba
    try {
      const testData = {
        matricula: "TEST123",
        mensajeria: "MRW",
        centro_recogida: "Terrassa",
        materiales: ["Documentación"],
        nombre_cliente: "Cliente Test",
        usuario_solicitante: user.email || "Usuario Test",
        usuario_solicitante_id: user.id,
        estado: "solicitada"
      }

      const { data: insertData, error: insertError } = await supabase
        .from("recogidas_historial")
        .insert([testData])
        .select()
        .single()

      if (insertError) {
        results.errors.push({
          operation: "test_insert",
          error: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint
        })
      } else {
        results.tables.test_insert = {
          success: true,
          id: insertData.id,
          data: insertData
        }

        // Eliminar el registro de prueba
        await supabase
          .from("recogidas_historial")
          .delete()
          .eq("id", insertData.id)
      }
    } catch (error) {
      results.errors.push({
        operation: "test_insert",
        error: "Error en inserción de prueba",
        details: error
      })
    }

    return NextResponse.json(results)

  } catch (error) {
    return NextResponse.json({ 
      error: "Error interno del servidor",
      details: error
    }, { status: 500 })
  }
} 