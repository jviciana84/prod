"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function markVehicleAsSold(vehicleId: string, licensePlate?: string, model?: string) {
  try {
    console.log("🚗 Marcando vehículo como vendido:", vehicleId)
    
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

    // Marcar vehículo como vendido
    const { error: updateError } = await supabase
      .from("stock")
      .update({
        is_sold: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vehicleId)

    if (updateError) {
      console.error("Error al marcar vehículo como vendido:", updateError)
      return {
        success: false,
        message: "Error al marcar el vehículo como vendido",
      }
    }

    console.log("✅ Vehículo marcado como vendido")

    // Activar limpieza automática
    try {
      const cleanupResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auto-cleanup-sold-vehicle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId,
          licensePlate,
          model
        })
      })

      const cleanupData = await cleanupResponse.json()

      if (cleanupData.success) {
        console.log("✅ Limpieza automática exitosa")
      } else {
        console.warn("⚠️ Limpieza automática falló:", cleanupData.message)
      }
    } catch (cleanupError) {
      console.warn("⚠️ Error en limpieza automática:", cleanupError)
      // No fallar la operación principal por un error en la limpieza automática
    }

    // Revalidar la página para actualizar los datos
    revalidatePath("/vehicles")
    revalidatePath("/dashboard/vehicles")

    return {
      success: true,
      message: "Vehículo marcado como vendido y procesado automáticamente",
    }
  } catch (error) {
    console.error("Error al marcar vehículo como vendido:", error)
    return {
      success: false,
      message: "Error al procesar la solicitud",
    }
  }
}
