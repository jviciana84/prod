"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { PhotoVehicle, PhotosStatistics, TimeMetrics, PhotographerPerformance } from "../types/photos"
import { differenceInDays } from "date-fns"

// Obtener todos los vehículos de la tabla fotos
export async function getPhotoVehicles(): Promise<PhotoVehicle[]> {
  const supabase = createServerActionClient({ cookies })

  // Obtener vehículos sin usar relaciones implícitas
  const { data, error } = await supabase.from("fotos").select("*").order("disponible", { ascending: false })

  if (error) {
    console.error("Error al obtener vehículos para fotografía:", error)
    throw error
  }

  // Si necesitamos información de usuarios asignados, podríamos obtenerla en consultas separadas
  // y luego combinar los resultados

  return data || []
}

// Obtener estadísticas detalladas
export async function getDetailedStatistics(): Promise<PhotosStatistics & { timeMetrics: TimeMetrics }> {
  const supabase = createServerActionClient({ cookies })

  // Obtener todos los vehículos para calcular métricas de tiempo
  const { data: vehicles, error } = await supabase.from("fotos").select("*")

  if (error) {
    console.error("Error al obtener datos para estadísticas:", error)
    throw error
  }

  // Contadores básicos
  const total = vehicles.length
  const pending = vehicles.filter((v) => !v.photos_completed).length
  const completed = vehicles.filter((v) => v.photos_completed).length
  const totalErrors = vehicles.reduce((sum, v) => sum + (v.error_count || 0), 0)

  // Contadores de estado de pintura
  const paintStatus = {
    pendiente: vehicles.filter((v) => v.estado_pintura === "pendiente").length,
    apto: vehicles.filter((v) => v.estado_pintura === "apto").length,
    no_apto: vehicles.filter((v) => v.estado_pintura === "no_apto").length,
  }

  // Cálculo de métricas de tiempo
  const timeMetrics: TimeMetrics = {
    registrationToApto: [],
    aptoToPhotographed: [],
    totalProcess: [],
  }

  vehicles.forEach((vehicle) => {
    // Días desde registro hasta apto
    if (vehicle.disponible && vehicle.paint_apto_date) {
      const days = differenceInDays(new Date(vehicle.paint_apto_date), new Date(vehicle.disponible))
      if (days >= 0) timeMetrics.registrationToApto.push(days)
    }

    // Días desde apto hasta fotografiado
    if (vehicle.paint_apto_date && vehicle.photos_completed && vehicle.photos_completed_date) {
      const days = differenceInDays(new Date(vehicle.photos_completed_date), new Date(vehicle.paint_apto_date))
      if (days >= 0) timeMetrics.aptoToPhotographed.push(days)
    }

    // Días totales del proceso
    if (vehicle.disponible && vehicle.photos_completed && vehicle.photos_completed_date) {
      const days = differenceInDays(new Date(vehicle.photos_completed_date), new Date(vehicle.disponible))
      if (days >= 0) timeMetrics.totalProcess.push(days)
    }
  })

  // Calcular promedios
  const averageTimeToApto =
    timeMetrics.registrationToApto.length > 0
      ? timeMetrics.registrationToApto.reduce((sum, days) => sum + days, 0) / timeMetrics.registrationToApto.length
      : 0

  const averageTimeToComplete =
    timeMetrics.aptoToPhotographed.length > 0
      ? timeMetrics.aptoToPhotographed.reduce((sum, days) => sum + days, 0) / timeMetrics.aptoToPhotographed.length
      : 0

  const errorRate = total > 0 ? (totalErrors / total) * 100 : 0

  return {
    total,
    pending,
    completed,
    paintStatus,
    averageTimeToApto,
    averageTimeToComplete,
    totalErrors,
    errorRate,
    timeMetrics,
  }
}

// Obtener rendimiento de fotógrafos
export async function getPhotographerPerformance(): Promise<PhotographerPerformance[]> {
  const supabase = createServerActionClient({ cookies })

  // Obtener usuarios con rol de fotógrafo sin usar relaciones implícitas
  const { data: photographers, error: userError } = await supabase.from("fotos_asignadas").select("*")

  if (userError) {
    console.error("Error al obtener fotógrafos:", userError)
    throw userError
  }

  // Obtener información de usuarios para los fotógrafos
  const userIds = photographers.map((p) => p.user_id)

  // Solo hacer la consulta si hay IDs de usuario
  let usersData = []
  if (userIds.length > 0) {
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, user_metadata")
      .in("id", userIds)

    if (usersError) throw usersError
    usersData = users || []
  }

  // Obtener vehículos asignados a cada fotógrafo
  const performanceData: PhotographerPerformance[] = []

  for (const photographer of photographers) {
    const user = usersData.find((u) => u.id === photographer.user_id)

    const { data: assignedVehicles, error } = await supabase
      .from("fotos")
      .select("*")
      .eq("assigned_to", photographer.user_id)

    if (error) {
      console.error(`Error al obtener vehículos asignados a ${photographer.user_id}:`, error)
      continue
    }

    const totalAssigned = assignedVehicles.length
    const totalCompleted = assignedVehicles.filter((v) => v.photos_completed).length
    const errorCount = assignedVehicles.reduce((sum, v) => sum + (v.error_count || 0), 0)

    // Calcular tiempo promedio para completar
    const completionTimes = assignedVehicles
      .filter((v) => v.photos_completed && v.paint_apto_date && v.photos_completed_date)
      .map((v) => differenceInDays(new Date(v.photos_completed_date!), new Date(v.paint_apto_date!)))
      .filter((days) => days >= 0)

    const averageTime =
      completionTimes.length > 0 ? completionTimes.reduce((sum, days) => sum + days, 0) / completionTimes.length : 0

    const completionRate = totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 0
    const errorRate = totalAssigned > 0 ? (errorCount / totalAssigned) * 100 : 0

    performanceData.push({
      id: photographer.user_id,
      name: user?.user_metadata?.name || user?.email || "Sin nombre",
      email: user?.email || "",
      avatar_url: user?.user_metadata?.avatar_url,
      assignment_percentage: photographer.percentage || 0,
      is_active: photographer.is_active || false,
      total_assigned: totalAssigned,
      total_completed: totalCompleted,
      error_count: errorCount,
      average_completion_time: averageTime,
      completionRate,
      errorRate,
      averageTime,
    })
  }

  return performanceData
}
