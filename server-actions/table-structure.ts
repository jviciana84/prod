"use server"

import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function getTableStructure(tableName: string) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(cookieStore)

    // Consulta para obtener la estructura de la tabla
    const { data, error } = await supabase.rpc("get_table_structure", { table_name: tableName })

    if (error) {
      console.error(`Error al obtener la estructura de la tabla ${tableName}:`, error)
      return {
        success: false,
        message: `Error al obtener la estructura de la tabla: ${error.message}`,
        error,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    console.error(`Error al obtener la estructura de la tabla ${tableName}:`, error)
    return {
      success: false,
      message: `Error: ${error.message || "Error desconocido"}`,
      error,
    }
  }
}
