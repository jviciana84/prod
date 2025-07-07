import { createClient } from "@/lib/supabase/client"

/**
 * Verifica el estado de las incidencias para una matrícula específica
 */
export async function checkIncidentStatus(licensePlate: string) {
  const supabase = createClient()

  try {
    // Obtener todas las entregas para esta matrícula
    const { data: entregas, error } = await supabase
      .from("entregas")
      .select("id, tipos_incidencia, incidencia")
      .eq("matricula", licensePlate)

    if (error) {
      console.error("Error al verificar estado de incidencias:", error)
      return { success: false, error: error.message }
    }

    const totalEntregas = entregas?.length || 0
    const entregasConIncidencia =
      entregas?.filter((e) => e.incidencia || (e.tipos_incidencia && e.tipos_incidencia.length > 0)).length || 0

    // Contar tipos de incidencia
    const tiposIncidencia = new Map<string, number>()
    entregas?.forEach((entrega) => {
      if (entrega.tipos_incidencia) {
        entrega.tipos_incidencia.forEach((tipo: string) => {
          tiposIncidencia.set(tipo, (tiposIncidencia.get(tipo) || 0) + 1)
        })
      }
    })

    return {
      success: true,
      data: {
        licensePlate,
        totalEntregas,
        entregasConIncidencia,
        entregasSinIncidencia: totalEntregas - entregasConIncidencia,
        tiposIncidencia: Object.fromEntries(tiposIncidencia),
      },
    }
  } catch (error) {
    console.error("Error inesperado al verificar incidencias:", error)
    return { success: false, error: "Error inesperado" }
  }
}

/**
 * Obtiene el historial completo de incidencias para una matrícula
 */
export async function getIncidentHistory(licensePlate: string) {
  const supabase = createClient()

  try {
    // Buscar en el historial por matrícula
    const { data: historial, error } = await supabase
      .from("incidencias_historial")
      .select("*")
      .eq("matricula", licensePlate)
      .order("fecha", { ascending: false })

    if (error) {
      console.error("Error al obtener historial de incidencias:", error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: historial || [],
    }
  } catch (error) {
    console.error("Error inesperado al obtener historial:", error)
    return { success: false, error: "Error inesperado" }
  }
}
