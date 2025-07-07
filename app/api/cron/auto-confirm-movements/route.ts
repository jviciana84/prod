import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { isAfter } from "date-fns"

// Función para calcular si han pasado 24 horas laborables (replicada de la lógica de la app)
const isAutoAccepted = (createdAt: string, confirmationDeadline: string | null): boolean => {
  if (!confirmationDeadline) return false
  const now = new Date()
  const deadline = new Date(confirmationDeadline)
  return isAfter(now, deadline)
}

export async function GET(request: NextRequest) {
  // Asegúrate de que esta ruta solo sea accesible por Vercel Cron Jobs o un token secreto
  const authHeader = request.headers.get("authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  console.log("🚀 Iniciando Cron Job: Auto-confirmación de movimientos pendientes...")

  const supabase = createServerClient()
  let updatedCount = 0
  let errorCount = 0

  try {
    // 1. Procesar movimientos de llaves
    console.log("🔍 Buscando movimientos de llaves pendientes...")
    const { data: keyMovements, error: keyError } = await supabase
      .from("key_movements")
      .select("id, created_at, confirmation_deadline, confirmed, confirmation_status, auto_confirmed")
      .eq("confirmation_status", "pending")
      .eq("confirmed", false) // Asegurarse de que no estén ya confirmados manualmente
      .eq("rejected", false) // Asegurarse de que no estén rechazados

    if (keyError) {
      console.error("❌ Error al obtener movimientos de llaves:", keyError)
      throw new Error(`Error al obtener movimientos de llaves: ${keyError.message}`)
    }

    console.log(`✅ Encontrados ${keyMovements.length} movimientos de llaves pendientes.`)

    for (const movement of keyMovements) {
      if (movement.confirmation_deadline && isAutoAccepted(movement.created_at, movement.confirmation_deadline)) {
        console.log(`🔄 Auto-confirmando movimiento de llave ID: ${movement.id}`)
        const { error: updateError } = await supabase
          .from("key_movements")
          .update({
            confirmed: true,
            confirmed_at: new Date().toISOString(),
            confirmation_status: "confirmed",
            auto_confirmed: true, // Asumiendo que esta columna existe en tu DB
          })
          .eq("id", movement.id)

        if (updateError) {
          console.error(`❌ Error al auto-confirmar llave ${movement.id}:`, updateError)
          errorCount++
        } else {
          updatedCount++
        }
      }
    }

    // 2. Procesar movimientos de documentos
    console.log("🔍 Buscando movimientos de documentos pendientes...")
    const { data: docMovements, error: docError } = await supabase
      .from("document_movements")
      .select("id, created_at, confirmation_deadline, confirmed, confirmation_status, auto_confirmed")
      .eq("confirmation_status", "pending")
      .eq("confirmed", false) // Asegurarse de que no estén ya confirmados manualmente
      .eq("rejected", false) // Asegurarse de que no estén rechazados

    if (docError) {
      console.error("❌ Error al obtener movimientos de documentos:", docError)
      throw new Error(`Error al obtener movimientos de documentos: ${docError.message}`)
    }

    console.log(`✅ Encontrados ${docMovements.length} movimientos de documentos pendientes.`)

    for (const movement of docMovements) {
      if (movement.confirmation_deadline && isAutoAccepted(movement.created_at, movement.confirmation_deadline)) {
        console.log(`🔄 Auto-confirmando movimiento de documento ID: ${movement.id}`)
        const { error: updateError } = await supabase
          .from("document_movements")
          .update({
            confirmed: true,
            confirmed_at: new Date().toISOString(),
            confirmation_status: "confirmed",
            auto_confirmed: true, // Asumiendo que esta columna existe en tu DB
          })
          .eq("id", movement.id)

        if (updateError) {
          console.error(`❌ Error al auto-confirmar documento ${movement.id}:`, updateError)
          errorCount++
        } else {
          updatedCount++
        }
      }
    }

    console.log(`🎉 Cron Job finalizado. Movimientos actualizados: ${updatedCount}, Errores: ${errorCount}`)
    return NextResponse.json({
      success: true,
      message: "Auto-confirmación de movimientos completada",
      updatedCount,
      errorCount,
    })
  } catch (error: any) {
    console.error("💥 Error general en el Cron Job:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error en el Cron Job de auto-confirmación",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
