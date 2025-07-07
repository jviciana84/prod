"use server"

import { createClient } from "@/utils/supabase/server"
import { canMarkAsDelivered } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function markVehicleAsDelivered(vehicleId: string) {
  try {
    const supabase = createClient()

    // Obtener el usuario actual
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return {
        success: false,
        message: "No se ha iniciado sesión",
      }
    }

    const userId = session.user.id

    // Verificar permisos
    const hasPermission = await canMarkAsDelivered(userId, vehicleId)

    if (!hasPermission) {
      return {
        success: false,
        message: "No tienes permiso para marcar este vehículo como entregado",
      }
    }

    // Actualizar el estado del vehículo
    const { error } = await supabase
      .from("stock")
      .update({
        estado: "entregado",
        fecha_entrega: new Date().toISOString(),
      })
      .eq("id", vehicleId)

    if (error) {
      console.error("Error al marcar vehículo como entregado:", error)
      return {
        success: false,
        message: "Error al marcar el vehículo como entregado",
      }
    }

    // Registrar la entrega en la tabla entregas
    const { error: entregaError } = await supabase.from("entregas").insert({
      stock_id: vehicleId,
      usuario_id: userId,
      fecha_entrega: new Date().toISOString(),
    })

    if (entregaError) {
      console.error("Error al registrar la entrega:", entregaError)
      // No devolvemos error porque el cambio principal ya se realizó
    }

    // Revalidar la página para actualizar los datos
    revalidatePath(`/vehicles/${vehicleId}`)
    revalidatePath("/vehicles")

    return {
      success: true,
      message: "Vehículo marcado como entregado correctamente",
    }
  } catch (error) {
    console.error("Error al marcar vehículo como entregado:", error)
    return {
      success: false,
      message: "Error al procesar la solicitud",
    }
  }
}
