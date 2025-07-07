import { createClient } from "@/lib/supabase/client"

// Mapeo de tipos de llave/documento a tipos de incidencia
const MOVEMENT_TO_INCIDENT_MAP = {
  first_key: "2ª llave",
  second_key: "2ª llave",
  card_key: "CardKey",
  technical_sheet: "Ficha técnica",
  circulation_permit: "Permiso circulación",
} as const

type MovementType = keyof typeof MOVEMENT_TO_INCIDENT_MAP

/**
 * Función de diagnóstico para verificar el proceso de resolución automática
 */
export async function debugAutoResolve(vehicleIdOrLicensePlate: string, movementType: MovementType) {
  const supabase = createClient()

  console.log("🔍 === DIAGNÓSTICO DE RESOLUCIÓN AUTOMÁTICA ===")
  console.log("Matrícula:", vehicleIdOrLicensePlate)
  console.log("Tipo de movimiento:", movementType)

  try {
    // PASO 1: Determinar si es ID o matrícula
    let licensePlate: string
    let vehicleData: any

    // Asumir que es una matrícula directamente
    licensePlate = vehicleIdOrLicensePlate.toUpperCase()
    vehicleData = {
      id: vehicleIdOrLicensePlate,
      license_plate: licensePlate,
      brand: "Desconocido",
      model: "Desconocido",
    }

    console.log("✅ Usando matrícula directamente:")
    console.log("  - Matrícula:", licensePlate)

    // PASO 2: Mapear el tipo de movimiento a tipo de incidencia
    console.log("\n🔄 PASO 2: Mapeo de incidencia...")
    console.log("  - Tipo de movimiento:", movementType)

    const incidentType = MOVEMENT_TO_INCIDENT_MAP[movementType]
    console.log("  - Tipo de incidencia que debe resolver:", incidentType)

    // PASO 3: Buscar todas las entregas para esta matrícula
    console.log("\n🔍 PASO 3: Buscando TODAS las entregas para esta matrícula...")
    console.log("  - Matrícula a buscar:", licensePlate)

    const { data: todasLasEntregas, error: entregasError } = await supabase
      .from("entregas")
      .select("*")
      .eq("matricula", licensePlate)

    if (entregasError) {
      console.error("❌ Error al buscar entregas:", entregasError)
      return {
        success: false,
        error: `Error al buscar entregas: ${entregasError.message}`,
        step: 3,
      }
    }

    // Mostrar información de debug sobre la estructura
    if (todasLasEntregas && todasLasEntregas.length > 0) {
      const firstEntrega = todasLasEntregas[0]
      const availableFields = Object.keys(firstEntrega)
      console.log("📋 Campos disponibles en entregas:", availableFields)
    }

    console.log(`📊 Se encontraron ${todasLasEntregas?.length || 0} entregas para esta matrícula:`)

    if (todasLasEntregas && todasLasEntregas.length > 0) {
      todasLasEntregas.forEach((entrega, index) => {
        console.log(`  ${index + 1}. Entrega ID: ${entrega.id}`)
        console.log(`     Tiene incidencia: ${entrega.incidencia}`)
        console.log(`     Tipos de incidencia:`, entrega.tipos_incidencia)
      })
    }

    // PASO 4: Filtrar entregas que tengan la incidencia específica
    console.log(`\n🎯 PASO 4: Filtrando entregas que tengan incidencia "${incidentType}"...`)

    const entregasConIncidencia =
      todasLasEntregas?.filter((entrega) => {
        const tieneIncidencia = entrega.tipos_incidencia && entrega.tipos_incidencia.includes(incidentType)
        console.log(`  - Entrega ${entrega.id}: ${tieneIncidencia ? "✅ SÍ" : "❌ NO"} tiene "${incidentType}"`)
        return tieneIncidencia
      }) || []

    console.log(`\n📈 RESULTADO:`)
    if (entregasConIncidencia.length > 0) {
      console.log(`✅ Se encontraron ${entregasConIncidencia.length} entregas con incidencia "${incidentType}"`)
      entregasConIncidencia.forEach((entrega) => {
        console.log(`   - Entrega ${entrega.id}`)
      })
    } else {
      console.log(`ℹ️ No se encontraron entregas con incidencia "${incidentType}"`)
    }

    return {
      success: true,
      step: 4,
      message:
        entregasConIncidencia.length > 0
          ? `Se encontraron ${entregasConIncidencia.length} entregas con incidencia "${incidentType}"`
          : `No se encontraron entregas con incidencia "${incidentType}"`,
      details: {
        vehicleData,
        incidentType,
        todasLasEntregas: todasLasEntregas || [],
        entregasConIncidencia,
      },
    }
  } catch (error) {
    console.error("💥 Error inesperado en debugAutoResolve:", error)
    return {
      success: false,
      error: `Error inesperado: ${error instanceof Error ? error.message : "Error desconocido"}`,
      step: 0,
    }
  }
}
