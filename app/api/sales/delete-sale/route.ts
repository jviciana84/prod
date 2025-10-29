import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { id, observations, licensePlate } = body

    if (!id) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos" },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    // 1. Marcar como venta caída en pedidos_validados
    const { error: pedidosError } = await supabase
      .from("pedidos_validados")
      .update({
        is_failed_sale: true,
        failed_reason: observations || null,
        failed_date: now
      })
      .eq("vehicle_id", id)

    if (pedidosError) {
      console.error("❌ [API] Error marking as failed sale:", pedidosError)
      // No retornar error, continuar con el delete
    }

    // 2. Eliminar de sales_vehicles
    const { error: salesError } = await supabase
      .from("sales_vehicles")
      .delete()
      .eq("id", id)

    if (salesError) {
      console.error("❌ [API] Error deleting from sales_vehicles:", salesError)
      return NextResponse.json({ error: salesError.message }, { status: 500 })
    }

    // 3. Eliminar de entregas si existe
    if (licensePlate) {
      const { error: entregasError } = await supabase
        .from("entregas")
        .delete()
        .eq("matricula", licensePlate)

      if (entregasError) {
        console.error("❌ [API] Error deleting from entregas:", entregasError)
        // No retornar error si no existe en entregas
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ [API] Exception:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}




