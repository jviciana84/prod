"use server"

import { createClient } from "@/utils/supabase/server"
import { canRegisterIncident } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

interface IncidentData {
  vehicleId: string
  description: string
  incidentType: string
}

export async function registerIncident(data: IncidentData) {
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
    const hasPermission = await canRegisterIncident(userId, data.vehicleId)

    if (!hasPermission) {
      return {
        success: false,
        message: "No tienes permiso para registrar incidencias para este vehículo",
      }
    }

    // Obtener información del usuario para el registro
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("nombre, email")
      .eq("id", userId)
      .single()

    if (userError || !userData) {
      console.error("Error al obtener datos del usuario para el historial:", userError)
      // Decide if this is a critical error. For now, we'll proceed but log it.
      // Depending on requirements, you might want to return an error here.
      // return { success: false, message: "No se pudieron obtener los datos del usuario." };
    }

    const userName = userData?.nombre || session.user.email || "Usuario desconocido"

    // Registrar la incidencia
    // Nota: Ahora usuario_id y usuario_nombre son opcionales, así que no causarán error si faltan
    const { error } = await supabase.from("incidencias_historial").insert({
      entrega_id: data.vehicleId, // Assuming data.vehicleId is entrega.id and FK is entrega_id
      descripcion: data.description,
      tipo_incidencia: data.incidentType,
      fecha_registro: new Date().toISOString(),
      usuario_id: userId,
      usuario_nombre: userName, // Use the derived userName
    })

    if (error) {
      console.error("Error al registrar incidencia:", error)
      return {
        success: false,
        message: "Error al registrar la incidencia",
      }
    }

    // Revalidar la página para actualizar los datos
    revalidatePath(`/vehicles/${data.vehicleId}`)

    return {
      success: true,
      message: "Incidencia registrada correctamente",
    }
  } catch (error) {
    console.error("Error al registrar incidencia:", error)
    return {
      success: false,
      message: "Error al procesar la solicitud",
    }
  }
}
