"use server"

import { createServerActionClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

interface AssignmentResult {
  success: boolean
  message: string
  details?: {
    totalVehicles: number
    assignedVehicles: number
    photographerAssignments: {
      photographerId: string
      photographerName: string
      assignedCount: number
      percentage: number
    }[]
  }
}

/**
 * Asigna vehículos pendientes a fotógrafos según los porcentajes configurados
 */
export async function assignVehiclesToPhotographers(): Promise<AssignmentResult> {
  const supabase = createServerActionClient({ cookies })

  try {
    // 1. Obtener todos los fotógrafos activos con sus porcentajes
    const { data: photographers, error: photographersError } = await supabase
      .from("fotos_asignadas")
      .select("user_id, percentage")
      .eq("is_active", true)

    if (photographersError) {
      throw new Error(`Error al obtener fotógrafos: ${photographersError.message}`)
    }

    if (!photographers || photographers.length === 0) {
      return {
        success: false,
        message: "No hay fotógrafos activos para asignar vehículos.",
      }
    }

    // 2. Obtener todos los vehículos pendientes de asignar
    const { data: vehicles, error: vehiclesError } = await supabase
      .from("fotos")
      .select("id")
      .is("assigned_to", null)
      .eq("photos_completed", false)

    if (vehiclesError) {
      throw new Error(`Error al obtener vehículos pendientes: ${vehiclesError.message}`)
    }

    const totalVehicles = vehicles.length

    // 3. Calcular cuántos vehículos debe recibir cada fotógrafo
    const photographerAssignments = photographers.map((photographer) => ({
      photographerId: photographer.user_id,
      photographerName: `Usuario ${photographer.user_id.substring(0, 8)}...`, // Placeholder
      assignedCount: 0, // Inicializar
      percentage: photographer.percentage,
    }))

    // 4. Asignar vehículos a los fotógrafos
    let assignedVehicles = 0
    vehicles.forEach((vehicle, index) => {
      // Calcular el índice del fotógrafo al que se debe asignar este vehículo
      const photographerIndex = index % photographers.length
      const photographerId = photographers[photographerIndex].user_id

      // Actualizar la base de datos con la asignación
      supabase
        .from("fotos")
        .update({ assigned_to: photographerId })
        .eq("id", vehicle.id)
        .then(({ error }) => {
          if (error) {
            console.error(`Error al asignar vehículo ${vehicle.id} al fotógrafo ${photographerId}:`, error)
          }
        })

      // Actualizar el contador de vehículos asignados al fotógrafo
      photographerAssignments[photographerIndex].assignedCount++
      assignedVehicles++
    })

    // 5. Devolver resultados
    return {
      success: true,
      message: `Se han asignado ${assignedVehicles} vehículos a los fotógrafos activos.`,
      details: {
        totalVehicles,
        assignedVehicles,
        photographerAssignments: photographerAssignments.map((assignment) => ({
          photographerId: assignment.photographerId,
          photographerName: assignment.photographerName,
          assignedCount: assignment.assignedCount,
          percentage: assignment.percentage,
        })),
      },
    }
  } catch (error: any) {
    console.error("Error al asignar vehículos:", error)
    return {
      success: false,
      message: `Error al asignar vehículos: ${error.message}`,
    }
  } finally {
    revalidatePath("/dashboard/photos")
  }
}

export async function testAutoAssignment() {
  return {
    success: false,
    message: "Función no implementada",
  }
}

export async function getAssignmentStats() {
  return {
    success: false,
    message: "Función no implementada",
  }
}

export async function simplifyAutoAssignmentTrigger() {
  const supabase = createServerActionClient({ cookies })

  try {
    // Ejecutar la función para simplificar el trigger
    const { data, error } = await supabase.rpc("simplify_auto_assignment_trigger")

    if (error) {
      throw new Error(`Error al simplificar el trigger: ${error.message}`)
    }

    // Revalidar las rutas relevantes
    revalidatePath("/dashboard/photos/test")
    revalidatePath("/dashboard/photos")

    return {
      success: true,
      message: "El trigger de asignación automática ha sido simplificado correctamente.",
    }
  } catch (error) {
    console.error("Error al simplificar el trigger:", error)
    return {
      success: false,
      message: `Error al simplificar el trigger: ${error instanceof Error ? error.message : "Error desconocido"}`,
    }
  }
}
