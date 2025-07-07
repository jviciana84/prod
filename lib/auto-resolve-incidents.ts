import { createClient } from "@/lib/supabase/client"
import { debugAutoResolve } from "./debug-auto-resolve"

// Mapeo de tipos de movimiento a tipos de incidencia
const MOVEMENT_TO_INCIDENT_MAP = {
  first_key: "2ª llave",
  second_key: "2ª llave",
  card_key: "CardKey",
  technical_sheet: "Ficha técnica",
  circulation_permit: "Permiso circulación",
} as const

type MovementType = keyof typeof MOVEMENT_TO_INCIDENT_MAP
type IncidentType = (typeof MOVEMENT_TO_INCIDENT_MAP)[MovementType]

/**
 * Resuelve automáticamente las incidencias cuando se entrega una llave o documento
 */
export async function autoResolveIncident(
  vehicleIdOrLicensePlate: string,
  movementType: MovementType,
  toUserId: string,
  reason: string,
) {
  const supabase = createClient()

  console.log("🚀 Iniciando resolución automática de incidencias...")
  console.log("Parámetros:", { vehicleIdOrLicensePlate, movementType, toUserId, reason })

  try {
    // Ejecutar diagnóstico primero para obtener toda la información
    const debugResult = await debugAutoResolve(vehicleIdOrLicensePlate, movementType)
    console.log("🔍 Resultado del diagnóstico:", debugResult)

    if (!debugResult.success) {
      return { success: false, error: `Error en diagnóstico: ${debugResult.error}` }
    }

    // Verificar si hay entregas con incidencia
    if (!debugResult.details?.entregasConIncidencia || debugResult.details.entregasConIncidencia.length === 0) {
      return {
        success: true,
        message: "No había incidencias pendientes de este tipo",
        resolvedCount: 0,
      }
    }

    // Obtener datos del usuario para el historial
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", toUserId)
      .single()

    const userName = userData?.full_name || "Usuario desconocido"

    // Procesar cada entrega con incidencia
    const incidentType = debugResult.details.incidentType
    const entregasConIncidencia = debugResult.details.entregasConIncidencia
    const licensePlate = debugResult.details.vehicleData.license_plate

    console.log(`\n🔧 Procesando ${entregasConIncidencia.length} entregas...`)

    let resolvedCount = 0

    for (let index = 0; index < entregasConIncidencia.length; index++) {
      const entrega = entregasConIncidencia[index]
      console.log(`\n📝 Procesando entrega ${index + 1}/${entregasConIncidencia.length}: ${entrega.id}`)

      try {
        const tiposActuales = entrega.tipos_incidencia || []
        console.log("Tipos actuales:", tiposActuales)

        // Remover la incidencia específica
        const nuevosTipos = tiposActuales.filter((tipo: string) => tipo !== incidentType)
        console.log("Nuevos tipos después de filtrar:", nuevosTipos)

        // 1. Actualizar la entrega en la tabla entregas
        const { error: updateError } = await supabase
          .from("entregas")
          .update({
            tipos_incidencia: nuevosTipos,
            incidencia: nuevosTipos.length > 0,
          })
          .eq("id", entrega.id)

        if (updateError) {
          console.error(`❌ Error al actualizar entrega ${entrega.id}:`, updateError)
          continue
        }

        console.log(`✅ Entrega ${entrega.id} actualizada correctamente`)

        // 2. Registrar en el historial como "resuelta"
        const { error: historialError } = await supabase.from("incidencias_historial").insert({
          entrega_id: entrega.id,
          matricula: licensePlate,
          tipo_incidencia: incidentType,
          accion: "resuelta",
          usuario_id: toUserId,
          usuario_nombre: userName,
          fecha: new Date().toISOString(),
          comentario: `Incidencia resuelta automáticamente por entrega de ${movementType}: ${reason}`,
          resuelta: true,
        })

        if (historialError) {
          console.error("⚠️ Error al registrar en historial:", historialError)
          // No fallar por esto, pero logear
        } else {
          console.log(`📋 Historial registrado para entrega ${entrega.id}`)
        }

        // 3. Marcar como resueltas las incidencias existentes en el historial
        const { error: updateHistorialError } = await supabase
          .from("incidencias_historial")
          .update({
            resuelta: true,
            fecha_resolucion: new Date().toISOString(),
            usuario_resolucion: toUserId,
          })
          .eq("matricula", licensePlate)
          .eq("tipo_incidencia", incidentType)
          .eq("resuelta", false)

        if (updateHistorialError) {
          console.error("⚠️ Error al actualizar historial existente:", updateHistorialError)
        } else {
          console.log(`📋 Historial existente actualizado para ${licensePlate}`)
        }

        resolvedCount++
      } catch (error) {
        console.error(`💥 Error procesando entrega ${entrega.id}:`, error)
      }
    }

    console.log(
      `\n🎉 Proceso completado: ${resolvedCount}/${entregasConIncidencia.length} entregas procesadas exitosamente`,
    )

    return {
      success: true,
      message: `Se resolvieron automáticamente ${resolvedCount} incidencias de tipo "${incidentType}"`,
      resolvedCount,
    }
  } catch (error) {
    console.error("💥 Error inesperado en autoResolveIncident:", error)
    return { success: false, error: "Error inesperado al resolver incidencias" }
  }
}
