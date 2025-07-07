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
    }[]
  }
}

/**
 * Asigna fotógrafos a vehículos pendientes que no tienen fotógrafo asignado
 */
export async function assignPhotographersToExistingVehicles(): Promise<AssignmentResult> {
  const supabase = createServerActionClient({ cookies })

  try {
    // 1. Obtener todos los fotógrafos activos
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

    const totalVehicles = vehicles?.length || 0

    if (totalVehicles === 0) {
      return {
        success: true,
        message: "No hay vehículos pendientes de asignar fotógrafo.",
        details: {
          totalVehicles: 0,
          assignedVehicles: 0,
          photographerAssignments: [],
        },
      }
    }

    // 3. Preparar contadores para cada fotógrafo
    const photographerAssignments = photographers.map((photographer) => ({
      photographerId: photographer.user_id,
      photographerName: `Usuario ${photographer.user_id.substring(0, 8)}...`, // Placeholder
      assignedCount: 0,
    }))

    // 4. Asignar vehículos a los fotógrafos
    let assignedVehicles = 0

    if (vehicles && vehicles.length > 0) {
      for (let i = 0; i < vehicles.length; i++) {
        const vehicle = vehicles[i]
        // Asignar al fotógrafo usando round-robin simple
        const photographerIndex = i % photographers.length
        const photographerId = photographers[photographerIndex].user_id

        // Actualizar la base de datos con la asignación
        const { error } = await supabase.from("fotos").update({ assigned_to: photographerId }).eq("id", vehicle.id)

        if (error) {
          console.error(`Error al asignar vehículo ${vehicle.id} al fotógrafo ${photographerId}:`, error)
          continue
        }

        // Actualizar el contador de vehículos asignados al fotógrafo
        photographerAssignments[photographerIndex].assignedCount++
        assignedVehicles++
      }
    }

    // 5. Devolver resultados
    revalidatePath("/dashboard/photos")
    revalidatePath("/dashboard/photos/diagnostico-asignacion")

    return {
      success: true,
      message: `Se han asignado ${assignedVehicles} vehículos a los fotógrafos activos.`,
      details: {
        totalVehicles,
        assignedVehicles,
        photographerAssignments,
      },
    }
  } catch (error: any) {
    console.error("Error al asignar vehículos:", error)
    return {
      success: false,
      message: `Error al asignar vehículos: ${error.message}`,
    }
  }
}
