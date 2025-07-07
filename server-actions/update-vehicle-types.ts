"use server"

import { createServerClient } from "@/lib/supabase/server"
import { detectVehicleType } from "@/utils/vehicle-type-detector"

/**
 * Actualiza los tipos de vehículos en la base de datos basado en sus modelos
 * @returns Resultado de la operación
 */
export async function updateAllVehicleTypes() {
  try {
    const supabase = createServerClient()

    // Obtener todos los vehículos
    const { data: vehicles, error } = await supabase.from("sales_vehicles").select("id, model, vehicle_type")

    if (error) {
      throw new Error(`Error al obtener vehículos: ${error.message}`)
    }

    let updated = 0
    let unchanged = 0
    let errors = 0

    // Procesar cada vehículo
    for (const vehicle of vehicles) {
      const detectedType = detectVehicleType(vehicle.model)

      // Solo actualizar si el tipo detectado es diferente al actual
      if (vehicle.vehicle_type !== detectedType) {
        const { error: updateError } = await supabase
          .from("sales_vehicles")
          .update({ vehicle_type: detectedType })
          .eq("id", vehicle.id)

        if (updateError) {
          console.error(`Error al actualizar vehículo ${vehicle.id}: ${updateError.message}`)
          errors++
        } else {
          updated++
        }
      } else {
        unchanged++
      }
    }

    return {
      success: true,
      message: `Actualización completada: ${updated} actualizados, ${unchanged} sin cambios, ${errors} errores`,
      updated,
      unchanged,
      errors,
    }
  } catch (error) {
    console.error("Error al actualizar tipos de vehículos:", error)
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
      updated: 0,
      unchanged: 0,
      errors: 1,
    }
  }
}
