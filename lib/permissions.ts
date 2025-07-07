import { createClient } from "@/utils/supabase/server"

// Tipos para los roles de usuario
export type UserRole = "admin" | "supervisor" | "vendedor" | "user"

// Interfaz para el usuario con su rol
export interface User {
  id: string
  email: string
  role: UserRole
}

/**
 * Verifica si el usuario puede editar un vehículo específico
 * - Admins y supervisores pueden editar cualquier vehículo
 * - Vendedores solo pueden editar vehículos que ellos vendieron
 */
export async function canEditVehicle(userId: string, vehicleId: string): Promise<boolean> {
  const supabase = createClient()

  // Primero verificamos el rol del usuario
  const { data: userData, error: userError } = await supabase.from("profiles").select("role").eq("id", userId).single()

  if (userError || !userData) {
    console.error("Error al verificar el rol del usuario:", userError)
    return false
  }

  // Si es admin o supervisor, tiene permiso
  if (userData.role === "admin" || userData.role === "supervisor") {
    return true
  }

  // Si es vendedor, verificamos si vendió este vehículo
  if (userData.role === "vendedor") {
    const { data: vehicleData, error: vehicleError } = await supabase
      .from("stock")
      .select("vendedor_id")
      .eq("id", vehicleId)
      .single()

    if (vehicleError || !vehicleData) {
      console.error("Error al verificar el vehículo:", vehicleError)
      return false
    }

    // El vendedor solo puede editar si él vendió el vehículo
    return vehicleData.vendedor_id === userId
  }

  // Por defecto, no tiene permiso
  return false
}

/**
 * Verifica si el usuario puede registrar incidencias para un vehículo
 * - Sigue la misma lógica que canEditVehicle
 */
export async function canRegisterIncident(userId: string, vehicleId: string): Promise<boolean> {
  // Reutilizamos la misma lógica que para editar vehículos
  return canEditVehicle(userId, vehicleId)
}

/**
 * Verifica si el usuario puede marcar un vehículo como entregado
 * - Sigue la misma lógica que canEditVehicle
 */
export async function canMarkAsDelivered(userId: string, vehicleId: string): Promise<boolean> {
  // Reutilizamos la misma lógica que para editar vehículos
  return canEditVehicle(userId, vehicleId)
}

/**
 * Obtiene el rol del usuario actual
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  const supabase = createClient()

  const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).single()

  if (error || !data) {
    console.error("Error al obtener el rol del usuario:", error)
    return null
  }

  return data.role as UserRole
}
