import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST() {
  try {
    console.log("🚀 Iniciando migración de fechas...")

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Función para convertir fecha DD/MM/YYYY a YYYY-MM-DD
    const convertDateFormat = (dateString: string | null): string | null => {
      if (!dateString || dateString.trim() === "") return null

      // Si ya es una fecha válida en formato ISO, retornarla
      try {
        const testDate = new Date(dateString)
        if (!isNaN(testDate.getTime()) && dateString.includes("-")) {
          return dateString // Ya está en formato correcto
        }
      } catch {
        // Continuar con la conversión
      }

      // Buscar patrón DD/MM/YYYY o DD-MM-YYYY
      const datePattern = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
      const match = dateString.match(datePattern)

      if (!match) return null

      const [, day, month, year] = match
      const dayNum = Number.parseInt(day, 10)
      const monthNum = Number.parseInt(month, 10)
      const yearNum = Number.parseInt(year, 10)

      // Validar rangos
      if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) {
        return null
      }

      // Formatear como YYYY-MM-DD
      const formattedDate = `${yearNum}-${monthNum.toString().padStart(2, "0")}-${dayNum.toString().padStart(2, "0")}`

      // Verificar que la fecha sea válida
      const testDate = new Date(formattedDate)
      if (isNaN(testDate.getTime())) return null

      return formattedDate
    }

    let totalUpdated = 0
    const errors: string[] = []

    // ===== MIGRAR pdf_extracted_data =====
    console.log("📊 Migrando pdf_extracted_data...")

    const { data: pdfData, error: pdfError } = await supabase
      .from("pdf_extracted_data")
      .select("id, fecha_pedido, primera_fecha_matriculacion")

    if (pdfError) {
      throw new Error(`Error obteniendo pdf_extracted_data: ${pdfError.message}`)
    }

    for (const record of pdfData || []) {
      try {
        const updates: any = {}
        let hasUpdates = false

        // Convertir fecha_pedido
        if (record.fecha_pedido) {
          const converted = convertDateFormat(record.fecha_pedido)
          if (converted && converted !== record.fecha_pedido) {
            updates.fecha_pedido = converted
            hasUpdates = true
            console.log(`✅ PDF ID ${record.id} - fecha_pedido: ${record.fecha_pedido} → ${converted}`)
          }
        }

        // Convertir primera_fecha_matriculacion
        if (record.primera_fecha_matriculacion) {
          const converted = convertDateFormat(record.primera_fecha_matriculacion)
          if (converted && converted !== record.primera_fecha_matriculacion) {
            updates.primera_fecha_matriculacion = converted
            hasUpdates = true
            console.log(
              `✅ PDF ID ${record.id} - primera_fecha_matriculacion: ${record.primera_fecha_matriculacion} → ${converted}`,
            )
          }
        }

        // Actualizar si hay cambios
        if (hasUpdates) {
          const { error: updateError } = await supabase.from("pdf_extracted_data").update(updates).eq("id", record.id)

          if (updateError) {
            errors.push(`Error actualizando PDF ID ${record.id}: ${updateError.message}`)
          } else {
            totalUpdated++
          }
        }
      } catch (error) {
        errors.push(`Error procesando PDF ID ${record.id}: ${error}`)
      }
    }

    // ===== MIGRAR sales_vehicles =====
    console.log("🚗 Migrando sales_vehicles...")

    const { data: salesData, error: salesError } = await supabase
      .from("sales_vehicles")
      .select("id, sale_date, order_date, registration_date")

    if (salesError) {
      throw new Error(`Error obteniendo sales_vehicles: ${salesError.message}`)
    }

    for (const record of salesData || []) {
      try {
        const updates: any = {}
        let hasUpdates = false

        // Convertir sale_date
        if (record.sale_date) {
          const converted = convertDateFormat(record.sale_date)
          if (converted && converted !== record.sale_date) {
            updates.sale_date = converted
            hasUpdates = true
            console.log(`✅ Sales ID ${record.id} - sale_date: ${record.sale_date} → ${converted}`)
          }
        }

        // Convertir order_date
        if (record.order_date) {
          const converted = convertDateFormat(record.order_date)
          if (converted && converted !== record.order_date) {
            updates.order_date = converted
            hasUpdates = true
            console.log(`✅ Sales ID ${record.id} - order_date: ${record.order_date} → ${converted}`)
          }
        }

        // Convertir registration_date
        if (record.registration_date) {
          const converted = convertDateFormat(record.registration_date)
          if (converted && converted !== record.registration_date) {
            updates.registration_date = converted
            hasUpdates = true
            console.log(`✅ Sales ID ${record.id} - registration_date: ${record.registration_date} → ${converted}`)
          }
        }

        // Actualizar si hay cambios
        if (hasUpdates) {
          const { error: updateError } = await supabase.from("sales_vehicles").update(updates).eq("id", record.id)

          if (updateError) {
            errors.push(`Error actualizando Sales ID ${record.id}: ${updateError.message}`)
          } else {
            totalUpdated++
          }
        }
      } catch (error) {
        errors.push(`Error procesando Sales ID ${record.id}: ${error}`)
      }
    }

    console.log("🎉 Migración completada!")
    console.log(`✅ Total de registros actualizados: ${totalUpdated}`)
    console.log(`❌ Total de errores: ${errors.length}`)

    return NextResponse.json({
      success: true,
      message: "Migración de fechas completada",
      stats: {
        totalUpdated,
        errorsCount: errors.length,
        errors: errors.slice(0, 10), // Solo los primeros 10 errores
      },
    })
  } catch (error) {
    console.error("❌ Error en migración:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error en la migración",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
