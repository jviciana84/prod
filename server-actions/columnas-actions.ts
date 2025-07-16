"use server"

import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export interface NewColumnMapping {
  table: string
  columnName: string
  dataType: string
  isRequired: boolean
  defaultValue: string
}

export interface ColumnMapping {
  excelColumn: string
  mapping: string // "existing:column_name" o "new:table:column_name"
  newColumnConfig?: NewColumnMapping
}

export async function createNewColumns(mappings: ColumnMapping[]) {
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)

  try {
    // Filtrar solo las nuevas columnas
    const newColumns = mappings.filter(m => m.mapping.startsWith('new:'))
    
    if (newColumns.length === 0) {
      return { success: false, error: "No hay nuevas columnas para crear" }
    }

    // Crear las nuevas columnas
    for (const mapping of newColumns) {
      if (!mapping.newColumnConfig) {
        continue
      }

      const { table, columnName, dataType, isRequired, defaultValue } = mapping.newColumnConfig
      
      // Construir la consulta SQL para agregar la columna
      let sql = `ALTER TABLE ${table} ADD COLUMN ${columnName} `
      
      // Mapear tipos de datos
      switch (dataType) {
        case 'text':
          sql += 'VARCHAR(255)'
          break
        case 'integer':
          sql += 'INTEGER'
          break
        case 'decimal':
          sql += 'NUMERIC(10,2)'
          break
        case 'boolean':
          sql += 'BOOLEAN'
          break
        case 'date':
          sql += 'DATE'
          break
        default:
          sql += 'VARCHAR(255)'
      }
      
      // Agregar restricciones
      if (isRequired) {
        sql += ' NOT NULL'
      }
      
      if (defaultValue) {
        sql += ` DEFAULT '${defaultValue}'`
      }
      
      // Ejecutar la consulta
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
      
      if (error) {
        console.error(`Error al crear columna ${columnName} en tabla ${table}:`, error)
        return { 
          success: false, 
          error: `Error al crear columna ${columnName}: ${error.message}` 
        }
      }
    }

    revalidatePath('/dashboard/columnas')
    
    return { 
      success: true, 
      message: `Se crearon ${newColumns.length} nuevas columnas correctamente` 
    }

  } catch (error) {
    console.error("Error al crear columnas:", error)
    return { 
      success: false, 
      error: "Error interno del servidor al crear las columnas" 
    }
  }
}

export async function getTableStructure(tableName: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)

  try {
    const { data, error } = await supabase.rpc('get_table_structure', { 
      table_name: tableName 
    })

    if (error) {
      console.error(`Error al obtener estructura de tabla ${tableName}:`, error)
      return { success: false, error: error.message }
    }

    return { success: true, data }

  } catch (error) {
    console.error("Error al obtener estructura de tabla:", error)
    return { 
      success: false, 
      error: "Error interno del servidor al obtener la estructura de la tabla" 
    }
  }
}

export async function updateExistingData(
  tableName: string, 
  excelData: any[], 
  mappings: {[key: string]: string}
) {
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)

  try {
    // Filtrar solo mapeos a columnas existentes
    const existingMappings = Object.entries(mappings).filter(([_, mapping]) => !mapping.startsWith('new:'))
    
    if (existingMappings.length === 0) {
      return { success: true, message: "No hay datos existentes para actualizar" }
    }

    let updatedCount = 0

    // Actualizar cada fila de datos
    for (const row of excelData) {
      const updateData: any = {}
      
      // Preparar datos para actualización
      for (const [excelColumn, dbColumn] of existingMappings) {
        if (row[excelColumn] !== undefined && row[excelColumn] !== null) {
          updateData[dbColumn] = row[excelColumn]
        }
      }
      
      if (Object.keys(updateData).length > 0) {
        // Aquí necesitarías una lógica para identificar qué fila actualizar
        // Por ejemplo, usando un ID o una combinación de campos únicos
        // Por ahora, solo contamos las filas que se procesarían
        updatedCount++
      }
    }

    revalidatePath('/dashboard/columnas')
    
    return { 
      success: true, 
      message: `Se procesaron ${updatedCount} filas de datos` 
    }

  } catch (error) {
    console.error("Error al actualizar datos existentes:", error)
    return { 
      success: false, 
      error: "Error interno del servidor al actualizar los datos" 
    }
  }
} 