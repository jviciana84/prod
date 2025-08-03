"use server"

import { createClient } from "@supabase/supabase-js"

interface CargaMasivaParams {
  tipoTabla: string
  mapeoColumnas: Record<string, string>
  headers: string[]
  rows: string[][]
}

interface MapeoDatosParams {
  columnaExcel: string
  columnaDestino: string
  tablaDestino: "nuevas_entradas" | "stock" | "ambas"
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

export async function mapearDatosPorMatricula(params: MapeoDatosParams) {
  const { columnaExcel, columnaDestino, tablaDestino, headers, rows } = params

  // Usar el service role client para operaciones de servidor
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  let actualizados = 0
  let errores = 0
  let noEncontrados = 0
  const detalles: string[] = []

  // Buscar la columna de matrícula con diferentes variaciones
  const posiblesNombresMatricula = [
    "Matrícula", "MATRICULA", "Matricula", "matricula", 
    "License Plate", "LICENSE_PLATE", "license_plate",
    "Placa", "PLACA", "placa",
    "Matrícula", "MATRICULA", "Matricula", "matricula"
  ]
  
  const indiceMatricula = headers.findIndex(header => 
    posiblesNombresMatricula.includes(header?.toString() || "")
  )
  
  const indiceColumnaExcel = headers.indexOf(columnaExcel)

  if (indiceMatricula === -1) {
    return {
      actualizados: 0,
      errores: 0,
      noEncontrados: 0,
      detalles: [`Error: No se encontró una columna de matrícula. Buscando: ${posiblesNombresMatricula.join(", ")}. Columnas disponibles: ${headers.join(", ")}`],
    }
  }

  if (indiceColumnaExcel === -1) {
    return {
      actualizados: 0,
      errores: 0,
      noEncontrados: 0,
      detalles: [`Error: No se encontró la columna '${columnaExcel}' en el archivo Excel. Columnas disponibles: ${headers.join(", ")}`],
    }
  }

  try {
    // Extraer todas las matrículas y valores únicos
    const matriculaValorMap = new Map<string, string>()
    const matriculasUnicas = new Set<string>()
    
    for (const row of rows) {
      const matricula = row[indiceMatricula]?.toString()?.trim()
      const valorNuevo = row[indiceColumnaExcel]?.toString()
      
      if (matricula && valorNuevo) {
        matriculaValorMap.set(matricula, valorNuevo)
        matriculasUnicas.add(matricula)
      }
    }

    const matriculasArray = Array.from(matriculasUnicas)
    console.log(`Procesando ${matriculasArray.length} matrículas únicas de ${rows.length} filas`)

    // Función para procesar en lotes pequeños (máximo 50 matrículas por consulta)
    const procesarEnLotes = async (matriculas: string[], tabla: string) => {
      const resultados: any[] = []
      const loteSize = 50 // Lotes más pequeños para evitar error 414
      
      for (let i = 0; i < matriculas.length; i += loteSize) {
        const lote = matriculas.slice(i, i + loteSize)
        console.log(`Consultando lote ${Math.floor(i/loteSize) + 1}/${Math.ceil(matriculas.length/loteSize)} para ${tabla}`)
        
        const { data, error } = await supabase
          .from(tabla)
          .select("id, license_plate")
          .in("license_plate", lote)

        if (error) {
          errores += lote.length
          detalles.push(`Error consultando ${tabla} lote ${Math.floor(i/loteSize) + 1}: ${error.message}`)
        } else {
          resultados.push(...(data || []))
        }
      }
      
      return resultados
    }

    // Función para verificar si una columna existe en la tabla
    const verificarColumna = async (tabla: string, columna: string) => {
      try {
        const { data, error } = await supabase
          .from(tabla)
          .select(columna)
          .limit(1)
        
        return !error
      } catch {
        return false
      }
    }

    // Procesar nuevas_entradas por lotes
    if (tablaDestino === "nuevas_entradas" || tablaDestino === "ambas") {
      const nuevasEntradas = await procesarEnLotes(matriculasArray, "nuevas_entradas")
      
      if (nuevasEntradas.length > 0) {
        // Verificar si la columna existe
        const columnaExiste = await verificarColumna("nuevas_entradas", columnaDestino)
        
        if (!columnaExiste) {
          errores += nuevasEntradas.length
          detalles.push(`Error: La columna '${columnaDestino}' no existe en la tabla nuevas_entradas`)
        } else {
          // Crear map para búsqueda rápida
          const nuevasEntradasMap = new Map()
          nuevasEntradas.forEach(item => {
            nuevasEntradasMap.set(item.license_plate, item.id)
          })

          // Actualizar en lotes de 50
          const lotes = []
          for (const matricula of matriculasArray) {
            const id = nuevasEntradasMap.get(matricula)
            const valor = matriculaValorMap.get(matricula)
            
            if (id && valor) {
              lotes.push({
                id,
                [columnaDestino]: valor,
                updated_at: new Date().toISOString()
              })
            }
          }

          // Procesar lotes de 50 registros - Actualizar uno por uno para evitar duplicados
          for (let i = 0; i < lotes.length; i += 50) {
            const lote = lotes.slice(i, i + 50)
            console.log(`Actualizando lote ${Math.floor(i/50) + 1}/${Math.ceil(lotes.length/50)} nuevas_entradas`)
            
            // Actualizar uno por uno para evitar errores de clave duplicada
            for (const item of lote) {
              const { error: updateError } = await supabase
                .from("nuevas_entradas")
                .update({
                  [columnaDestino]: item[columnaDestino],
                  updated_at: item.updated_at
                })
                .eq('id', item.id)

              if (updateError) {
                errores++
                detalles.push(`Error actualizando nuevas_entradas ID ${item.id}: ${updateError.message}`)
              } else {
                actualizados++
              }
            }
          }

          noEncontrados += matriculasArray.length - nuevasEntradas.length
        }
      } else {
        noEncontrados += matriculasArray.length
      }
    }

    // Procesar stock por lotes
    if (tablaDestino === "stock" || tablaDestino === "ambas") {
      const stockData = await procesarEnLotes(matriculasArray, "stock")
      
      if (stockData.length > 0) {
        // Verificar si la columna existe
        const columnaExiste = await verificarColumna("stock", columnaDestino)
        
        if (!columnaExiste) {
          errores += stockData.length
          detalles.push(`Error: La columna '${columnaDestino}' no existe en la tabla stock`)
        } else {
          // Crear map para búsqueda rápida
          const stockMap = new Map()
          stockData.forEach(item => {
            stockMap.set(item.license_plate, item.id)
          })

          // Actualizar en lotes de 50
          const lotes = []
          for (const matricula of matriculasArray) {
            const id = stockMap.get(matricula)
            const valor = matriculaValorMap.get(matricula)
            
            if (id && valor) {
              lotes.push({
                id,
                [columnaDestino]: valor,
                updated_at: new Date().toISOString()
              })
            }
          }

          // Procesar lotes de 50 registros - Actualizar uno por uno para evitar duplicados
          for (let i = 0; i < lotes.length; i += 50) {
            const lote = lotes.slice(i, i + 50)
            console.log(`Actualizando lote ${Math.floor(i/50) + 1}/${Math.ceil(lotes.length/50)} stock`)
            
            // Actualizar uno por uno para evitar errores de clave duplicada
            for (const item of lote) {
              const { error: updateError } = await supabase
                .from("stock")
                .update({
                  [columnaDestino]: item[columnaDestino],
                  updated_at: item.updated_at
                })
                .eq('id', item.id)

              if (updateError) {
                errores++
                detalles.push(`Error actualizando stock ID ${item.id}: ${updateError.message}`)
              } else {
                actualizados++
              }
            }
          }

          noEncontrados += matriculasArray.length - stockData.length
        }
      } else {
        noEncontrados += matriculasArray.length
      }
    }

  } catch (error: any) {
    errores += rows.length
    detalles.push(`Error general: ${error.message || "Error desconocido"}`)
  }

  return {
    actualizados,
    errores,
    noEncontrados,
    detalles,
  }
}
