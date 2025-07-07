"use server"

import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

/**
 * Cambia el estado de recepción de una entrada y actualiza el stock si es necesario
 * @param id ID de la entrada
 * @param nuevoEstado Nuevo estado de recepción ('recibido' o 'pendiente')
 */
export async function cambiarEstadoRecepcion(id: string, nuevoEstado: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)

  try {
    // 1. Obtener los datos de la entrada
    const { data: entrada, error: entradaError } = await supabase
      .from("nuevas_entradas")
      .select("*")
      .eq("id", id)
      .single()

    if (entradaError) throw entradaError

    // 2. Actualizar el estado en nuevas_entradas
    const { error: updateError } = await supabase
      .from("nuevas_entradas")
      .update({
        estado_recepcion: nuevoEstado,
        is_received: nuevoEstado === "recibido",
      })
      .eq("id", id)

    if (updateError) throw updateError

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

      if (stockCheckError) throw stockCheckError

      // Si ya existe, actualizar; si no, insertar
      if (existingStock) {
        const { error: stockUpdateError } = await supabase.from("stock").update(stockData).eq("id", existingStock.id)

        if (stockUpdateError) throw stockUpdateError
      } else {
        const { error: stockInsertError } = await supabase.from("stock").insert(stockData)

        if (stockInsertError) throw stockInsertError
      }
    }

    return { success: true, message: "Estado de recepción actualizado correctamente" }
  } catch (error) {
    console.error("Error al cambiar estado de recepción:", error)
    return {
      success: false,
      message: "Error al actualizar el estado de recepción",
      error: error.message || "Error desconocido",
    }
  }
}
