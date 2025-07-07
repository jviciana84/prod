"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function testAutoAssignment() {
  const supabase = createServerActionClient({ cookies })

  try {
    // Generar una matrícula aleatoria para el vehículo de prueba
    const licensePlate = `TEST-${Math.floor(Math.random() * 10000)}`

    // Insertar un vehículo de prueba
    const { data: vehicle, error: insertError } = await supabase
      .from("fotos")
      .insert({
        license_plate: licensePlate,
        model: "Modelo de Prueba",
        estado_pintura: "apto",
        disponible: new Date().toISOString(),
        paint_status_date: new Date().toISOString(),
        photos_completed: false,
      })
      .select("id, license_plate, assigned_to")
      .single()

    if (insertError) {
      throw new Error(`Error al insertar vehículo de prueba: ${insertError.message}`)
    }

    // Verificar si se asignó automáticamente un fotógrafo
    if (!vehicle.assigned_to) {
      return {
        success: false,
        message: "El trigger de asignación automática no funcionó. El vehículo no tiene un fotógrafo asignado.",
        vehicle,
      }
    }

    // Obtener información del fotógrafo asignado
    const { data: photographer, error: photographerError } = await supabase
      .from("fotos_asignadas")
      .select("id, user_id, percentage, user:user_id(email)")
      .eq("user_id", vehicle.assigned_to)
      .single()

    if (photographerError) {
      console.error("Error al obtener información del fotógrafo:", photographerError)
    }

    return {
      success: true,
      message: "El trigger de asignación automática funcionó correctamente. Se asignó un fotógrafo al vehículo.",
      vehicle,
      photographer: photographer
        ? {
            id: photographer.id,
            email: photographer.user?.email || `Usuario ${photographer.user_id.substring(0, 8)}...`,
            percentage: photographer.percentage,
          }
        : undefined,
    }
  } catch (error) {
    console.error("Error al probar la asignación automática:", error)
    return {
      success: false,
      message: `Error al probar la asignación automática: ${error instanceof Error ? error.message : "Error desconocido"}`,
    }
  }
}

export async function getAssignmentStats() {
  const supabase = createServerActionClient({ cookies })

  try {
    // Obtener el total de vehículos
    const { count: totalVehicles, error: countError } = await supabase
      .from("fotos")
      .select("*", { count: "exact", head: true })

    if (countError) {
      throw new Error(`Error al obtener el total de vehículos: ${countError.message}`)
    }

    // Obtener el total de vehículos asignados
    const { count: totalAssigned, error: assignedError } = await supabase
      .from("fotos")
      .select("*", { count: "exact", head: true })
      .not("assigned_to", "is", null)

    if (assignedError) {
      throw new Error(`Error al obtener el total de vehículos asignados: ${assignedError.message}`)
    }

    // Obtener fotógrafos y sus estadísticas
    const { data: photographers, error: photographersError } = await supabase
      .from("fotos_asignadas")
      .select(`
        id,
        user_id,
        percentage,
        is_active,
        user:user_id(email)
      `)
      .order("percentage", { ascending: false })

    if (photographersError) {
      throw new Error(`Error al obtener fotógrafos: ${photographersError.message}`)
    }

    // Obtener asignaciones actuales por fotógrafo
    const { data: assignments, error: assignmentsError } = await supabase
      .from("fotos")
      .select("assigned_to")
      .not("assigned_to", "is", null)

    if (assignmentsError) {
      throw new Error(`Error al obtener asignaciones: ${assignmentsError.message}`)
    }

    // Contar asignaciones por fotógrafo
    const assignmentCounts: Record<string, number> = {}
    assignments.forEach((assignment) => {
      const photographerId = assignment.assigned_to
      if (photographerId) {
        assignmentCounts[photographerId] = (assignmentCounts[photographerId] || 0) + 1
      }
    })

    // Calcular estadísticas por fotógrafo
    const photographerStats = photographers.map((photographer) => {
      const assignedVehicles = assignmentCounts[photographer.user_id] || 0
      const actualPercentage = totalAssigned > 0 ? (assignedVehicles / totalAssigned) * 100 : 0
      const targetVehicles = totalAssigned > 0 ? (totalAssigned * photographer.percentage) / 100 : 0
      const deficit = targetVehicles - assignedVehicles

      return {
        user_id: photographer.user_id,
        email: photographer.user?.email,
        percentage: photographer.percentage,
        assigned_vehicles: assignedVehicles,
        total_vehicles: totalVehicles || 0,
        actual_percentage: actualPercentage,
        deficit,
        is_active: photographer.is_active,
      }
    })

    return {
      photographers: photographerStats,
      total_vehicles: totalVehicles || 0,
      total_assigned: totalAssigned || 0,
      total_unassigned: (totalVehicles || 0) - (totalAssigned || 0),
    }
  } catch (error) {
    console.error("Error al obtener estadísticas:", error)
    throw error
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
