import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function POST(request: Request) {
  try {
    const { updates } = await request.json()

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: "No hay actualizaciones para procesar" 
      }, { status: 400 })
    }

    console.log(`🔄 Procesando ${updates.length} actualizaciones...`)
    const supabase = await createClient()
    let updated = 0
    let errors = 0
    const errorDetails = []

    // Filtrar actualizaciones válidas
    const validUpdates = updates.filter(update => {
      const { matricula, garantia } = update
      if (!matricula || garantia === undefined) {
        console.error("❌ Datos inválidos:", update)
        errors++
        errorDetails.push(`Datos inválidos para: ${matricula}`)
        return false
      }
      return true
    })

    if (validUpdates.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No hay actualizaciones válidas para procesar"
      }, { status: 400 })
    }

    // Actualizar en lotes para mejor rendimiento
    const batchSize = 10
    const batches = []
    
    for (let i = 0; i < validUpdates.length; i += batchSize) {
      batches.push(validUpdates.slice(i, i + batchSize))
    }

    for (const batch of batches) {
      const batchPromises = batch.map(async (update) => {
        try {
          const { error } = await supabase
            .from("incentivos")
            .update({ garantia: update.garantia })
            .eq("matricula", update.matricula)

          if (error) {
            throw error
          }
          return { success: true, matricula: update.matricula }
        } catch (error) {
          return { success: false, matricula: update.matricula, error }
        }
      })

      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          const data = result.value
          if (data.success) {
            updated++
          } else {
            errors++
            errorDetails.push(`Error actualizando ${data.matricula}: ${data.error?.message || 'Error desconocido'}`)
          }
        } else {
          errors++
          errorDetails.push(`Error en lote: ${result.reason?.message || 'Error desconocido'}`)
        }
      })
    }

    console.log(`✅ Proceso completado: ${updated} actualizados, ${errors} errores`)

    revalidatePath("/dashboard/incentivos")

    return NextResponse.json({
      success: true,
      updated,
      errors,
      errorDetails: errors > 0 ? errorDetails : undefined,
      message: `Actualizadas ${updated} garantías. ${errors > 0 ? `${errors} errores.` : ""}`,
    })
  } catch (error) {
    console.error("❌ Error in bulk warranty update:", error)
    return NextResponse.json({ 
      success: false,
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
}
