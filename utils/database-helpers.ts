import { createClientComponentClient } from "@/lib/supabase/client"

// Función para verificar si un vehículo ya existe en la tabla fotos
export async function checkVehicleInPhotos(licensePlate: string) {
  const supabase = createClientComponentClient()

  const { data, error } = await supabase
    .from("fotos")
    .select("id, license_plate, model, disponible, estado_pintura")
    .eq("license_plate", licensePlate)
    .single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 es el código para "no se encontraron resultados"
    console.error("Error al verificar vehículo en fotos:", error)
    throw error
  }

  return { exists: !!data, data }
}

// Función para obtener estadísticas de la tabla fotos
export async function getPhotosStatistics() {
  const supabase = createClientComponentClient()

  // Total de vehículos
  const { count: total, error: totalError } = await supabase.from("fotos").select("*", { count: "exact", head: true })

  // Vehículos pendientes (no fotografiados)
  const { count: pending, error: pendingError } = await supabase
    .from("fotos")
    .select("*", { count: "exact", head: true })
    .eq("photos_completed", false)

  // Vehículos completados (fotografiados)
  const { count: completed, error: completedError } = await supabase
    .from("fotos")
    .select("*", { count: "exact", head: true })
    .eq("photos_completed", true)

  // Estadísticas de estado de pintura
  const { data: paintStats, error: paintError } = await supabase
    .from("fotos")
    .select("estado_pintura, count")
    .select("estado_pintura")
    .select("count(*)")
    .group("estado_pintura")

  if (totalError || pendingError || completedError || paintError) {
    console.error("Error al obtener estadísticas:", { totalError, pendingError, completedError, paintError })
    throw new Error("Error al obtener estadísticas")
  }

  // Procesar estadísticas de estado de pintura
  const paintStatusStats = {
    pendiente: 0,
    apto: 0,
    no_apto: 0,
  }

  if (paintStats) {
    paintStats.forEach((stat) => {
      if (stat.estado_pintura in paintStatusStats) {
        paintStatusStats[stat.estado_pintura] = Number.parseInt(stat.count)
      }
    })
  }

  return {
    total: total || 0,
    pending: pending || 0,
    completed: completed || 0,
    paintStatus: paintStatusStats,
  }
}

// Función para actualizar el estado de pintura de un vehículo
export async function updateVehiclePaintStatus(id: string, status: "pendiente" | "apto" | "no_apto") {
  const supabase = createClientComponentClient()

  const updates = {
    estado_pintura: status,
    paint_status_date: new Date().toISOString(),
    // Si el estado es 'apto', actualizamos también paint_apto_date
    ...(status === "apto" ? { paint_apto_date: new Date().toISOString() } : {}),
  }

  const { data, error } = await supabase.from("fotos").update(updates).eq("id", id).select()

  if (error) {
    console.error("Error al actualizar estado de pintura:", error)
    throw error
  }

  return data
}

// Función para marcar un vehículo como fotografiado
export async function markVehicleAsPhotographed(id: string, completed: boolean) {
  const supabase = createClientComponentClient()

  const updates = {
    photos_completed: completed,
    photos_completed_date: completed ? new Date().toISOString() : null,
  }

  const { data, error } = await supabase.from("fotos").update(updates).eq("id", id).select()

  if (error) {
    console.error("Error al marcar vehículo como fotografiado:", error)
    throw error
  }

  return data
}

// Función para registrar un error de fotografía
export async function registerPhotoError(id: string, userId: string) {
  const supabase = createClientComponentClient()

  // Primero obtenemos el registro actual para incrementar el contador de errores
  const { data: currentData, error: fetchError } = await supabase
    .from("fotos")
    .select("error_count, assigned_to")
    .eq("id", id)
    .single()

  if (fetchError) {
    console.error("Error al obtener datos del vehículo:", fetchError)
    throw fetchError
  }

  const updates = {
    photos_completed: false,
    photos_completed_date: null,
    error_count: (currentData?.error_count || 0) + 1,
    last_error_by: userId,
    // Guardamos el fotógrafo original si es la primera vez que se marca como error
    original_assigned_to: currentData?.original_assigned_to || currentData?.assigned_to,
  }

  const { data, error } = await supabase.from("fotos").update(updates).eq("id", id).select()

  if (error) {
    console.error("Error al registrar error de fotografía:", error)
    throw error
  }

  return data
}
