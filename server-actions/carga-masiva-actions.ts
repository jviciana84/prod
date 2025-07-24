"use server"

import { createClient } from "@supabase/supabase-js"

interface CargaMasivaParams {
  tipoTabla: string
  mapeoColumnas: Record<string, string>
  headers: string[]
  rows: string[][]
}

export async function procesarDatosMasivos(params: CargaMasivaParams) {
  const { tipoTabla, mapeoColumnas, headers, rows } = params

  // Usar el service role client para operaciones de servidor
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  let insertados = 0
  let errores = 0
  const detalles: string[] = []

  // Procesar cada fila
  for (const row of rows) {
    try {
      // Crear objeto con los datos mapeados
      const datos: Record<string, any> = {}

      // Para cada columna en la base de datos, buscar el valor correspondiente en la fila
      for (const [columnaDB, columnaExcel] of Object.entries(mapeoColumnas)) {
        const indiceColumna = headers.indexOf(columnaExcel)
        if (indiceColumna !== -1) {
          let valor = row[indiceColumna]

          // Convertir tipos según la columna
          if (columnaDB.includes("_id") && !isNaN(Number(valor))) {
            valor = Number(valor)
          } else if (columnaDB.includes("date")) {
            // Intentar convertir a formato ISO si es una fecha
            try {
              // Verificar si es una fecha en formato DD/MM/YYYY
              if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(valor)) {
                const [day, month, year] = valor.split("/").map(Number)
                // CORREGIDO: Usar mediodía para evitar problemas de zona horaria
                valor = new Date(year, month - 1, day, 12, 0, 0, 0).toISOString()
              }
              // Si es una fecha en formato Excel (número de días desde 1900)
              else if (!isNaN(Number(valor))) {
                const excelDate = Number(valor)
                // Convertir fecha de Excel a JavaScript Date
                const date = new Date((excelDate - 25569) * 86400 * 1000)
                valor = date.toISOString()
              }
            } catch (e) {
              // Si falla la conversión, dejar el valor original
            }
          }

          datos[columnaDB] = valor
        }
      }

      // Añadir campos adicionales según la tabla
      if (tipoTabla === "nuevas_entradas") {
        datos.created_at = new Date().toISOString()
        datos.updated_at = new Date().toISOString()
      } else if (tipoTabla === "fotos") {
        datos.photos_completed = false
      } else if (tipoTabla === "stock") {
        datos.created_at = new Date().toISOString()
        datos.updated_at = new Date().toISOString()
      }

      // Insertar en la tabla correspondiente
      const { error } = await supabase.from(tipoTabla).insert(datos)

      if (error) {
        errores++
        detalles.push(`Error en fila ${insertados + errores}: ${error.message}`)
      } else {
        insertados++
      }
    } catch (error: any) {
      errores++
      detalles.push(`Error en fila ${insertados + errores}: ${error.message || "Error desconocido"}`)
    }
  }

  return {
    insertados,
    errores,
    detalles,
  }
}
