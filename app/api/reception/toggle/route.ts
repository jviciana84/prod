import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)
    const { id, nuevoEstado } = await request.json()

    if (!id || !nuevoEstado) {
      return NextResponse.json({ error: "Se requiere ID y nuevo estado" }, { status: 400 })
    }

    // 1. Obtener los datos de la entrada
    const { data: entrada, error: entradaError } = await supabase
      .from("nuevas_entradas")
      .select("*")
      .eq("id", id)
      .single()

    if (entradaError) {
      return NextResponse.json(
        { error: "Error al obtener datos de la entrada", details: entradaError },
        { status: 500 },
      )
    }

    // 2. Actualizar el estado en nuevas_entradas
    const { error: updateError } = await supabase
      .from("nuevas_entradas")
      .update({
        estado_recepcion: nuevoEstado,
        is_received: nuevoEstado === "recibido",
        reception_date: nuevoEstado === "recibido" ? new Date().toISOString() : null,
      })
      .eq("id", id)

    if (updateError) {
      return NextResponse.json({ error: "Error al actualizar estado", details: updateError }, { status: 500 })
    }

    // 3. Si el estado es "recibido", actualizar también el stock
    if (nuevoEstado === "recibido") {
      // Preparar los datos para el stock
      const stockData = {
        vehicle_id: entrada.vehicle_id,
        quantity: entrada.quantity || 1,
        location_id: entrada.origin_location_id || null,
        nuevas_entradas_id: id,
      }

      // Verificar si ya existe un registro en stock para esta entrada
      const { data: existingStock, error: stockCheckError } = await supabase
        .from("stock")
        .select("id")
        .eq("nuevas_entradas_id", id)
        .maybeSingle()

      if (stockCheckError) {
        return NextResponse.json(
          { error: "Error al verificar stock existente", details: stockCheckError },
          { status: 500 },
        )
      }

      // Si ya existe, actualizar; si no, insertar
      if (existingStock) {
        const { error: stockUpdateError } = await supabase.from("stock").update(stockData).eq("id", existingStock.id)

        if (stockUpdateError) {
          return NextResponse.json({ error: "Error al actualizar stock", details: stockUpdateError }, { status: 500 })
        }
      } else {
        const { error: stockInsertError } = await supabase.from("stock").insert(stockData)

        if (stockInsertError) {
          return NextResponse.json({ error: "Error al insertar en stock", details: stockInsertError }, { status: 500 })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Estado de recepción actualizado correctamente",
    })
  } catch (error) {
    console.error("Error en API de recepción:", error)
    return NextResponse.json({ error: "Error interno del servidor", details: error.message }, { status: 500 })
  }
}
