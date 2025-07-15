"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { detectVehicleType } from "@/utils/vehicle-type-detector"

export async function enviarEntregaAIncentivos(
  matricula: string,
  modelo: string,
  asesor: string,
  fechaEntrega: string | null,
  or: string,
) {
  try {
    const supabase = createClient()

    // Verificar si ya existe un incentivo para esta matrícula
    const { data: existingIncentive, error: checkError } = await supabase
      .from("incentivos")
      .select("id")
      .eq("matricula", matricula)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 es "no rows returned", que es lo que esperamos si no existe
      throw checkError
    }

    if (existingIncentive) {
      return {
        success: false,
        message: `Ya existe un incentivo para la matrícula ${matricula}`,
      }
    }

    // Buscar datos del vehículo en sales_vehicles incluyendo registration_date
    const { data: vehicleData, error: vehicleError } = await supabase
      .from("sales_vehicles")
      .select("price, payment_method, registration_date")
      .eq("license_plate", matricula)
      .single()

    if (vehicleError) {
      console.error("Error al obtener la entrega:", vehicleError)
      return {
        success: false,
        message: `Error al obtener datos del vehículo: ${vehicleError.message}`,
      }
    }

    // Obtener configuración de incentivos
    const { data: configData, error: configError } = await supabase.from("incentivos_config").select("*").single()

    if (configError) {
      console.error("Error al obtener configuración:", configError)
      return {
        success: false,
        message: `Error al obtener configuración de incentivos: ${configError.message}`,
      }
    }

    // Determinar si es financiado basado en payment_method
    const financiado = vehicleData.payment_method?.toLowerCase() === "financiado"

    // Calcular garantía automáticamente
    const calculatedWarranty = calculateWarrantyType(fechaEntrega, vehicleData.registration_date, modelo)

    const incentiveData = {
      matricula,
      modelo,
      asesor,
      or,
      fecha_entrega: fechaEntrega,
      precio_venta: vehicleData.price,
      forma_pago: vehicleData.payment_method,
      dias_stock: null, // Set to null, to be calculated later by incentivos table/process
      gastos_estructura: configData.gastos_estructura,
      garantia: calculatedWarranty, // 0 si es garantía de fabricante, null si no
      gastos_360: null, // Establecer explícitamente a null para que aparezca como pendiente
      financiado,
      antiguedad: null, // Set to null, to be calculated later
      importe_minimo: configData.importe_minimo,
      porcentaje_margen_config_usado: configData.porcentaje_margen,
      tramitado: false,
    }

    const { data, error } = await supabase.from("incentivos").insert(incentiveData).select().single()

    if (error) {
      console.error("Error al insertar incentivo:", error)
      return {
        success: false,
        message: `Error al crear incentivo: ${error.message}`,
      }
    }

    // Marcar la entrega como enviada a incentivos
    const { error: updateError } = await supabase
      .from("entregas")
      .update({ enviado_a_incentivos: true })
      .eq("matricula", matricula)

    if (updateError) {
      console.error("Error al actualizar entrega:", updateError)
      // No retornamos error aquí porque el incentivo ya se creó exitosamente
    }

    revalidatePath("/dashboard/incentivos")
    revalidatePath("/dashboard/entregas")

    return {
      success: true,
      message: `Incentivo creado exitosamente para ${matricula}${calculatedWarranty === 0 ? " (Garantía de fabricante detectada)" : ""}`,
    }
  } catch (error: any) {
    console.error("Error inesperado:", error)
    return {
      success: false,
      message: `Error inesperado: ${error.message}`,
    }
  }
}

/**
 * Calcula si la garantía es del fabricante basándose en las fechas y tipo de vehículo
 * @param fechaEntrega - Fecha de entrega del vehículo
 * @param registrationDate - Fecha de matriculación del vehículo
 * @param modelo - Modelo del vehículo para determinar si es coche o moto
 * @returns 0 si es garantía de fabricante, null si no lo es o no se puede calcular
 */
function calculateWarrantyType(
  fechaEntrega: string | null,
  registrationDate: string | null,
  modelo: string,
): number | null {
  if (!fechaEntrega || !registrationDate) {
    return null // No se puede calcular sin las fechas
  }

  try {
    const entregaDate = new Date(fechaEntrega)
    const regDate = new Date(registrationDate)

    // Determinar el tipo de vehículo
    const vehicleType = detectVehicleType(modelo)

    if (vehicleType === "moto") {
      // Para motos: fecha_entrega + 12 meses <= registration_date + 36 meses
      const entregaPlus12 = new Date(entregaDate)
      entregaPlus12.setMonth(entregaPlus12.getMonth() + 12)

      const regPlus36 = new Date(regDate)
      regPlus36.setMonth(regPlus36.getMonth() + 36)

      if (entregaPlus12 <= regPlus36) {
        return 0 // Garantía de fabricante (valor 0, se mostrará como "Fabricante" en UI)
      }
    } else {
      // Para coches: fecha_entrega + 24 meses <= registration_date + 36 meses
      const entregaPlus24 = new Date(entregaDate)
      entregaPlus24.setMonth(entregaPlus24.getMonth() + 24)

      const regPlus36 = new Date(regDate)
      regPlus36.setMonth(regPlus36.getMonth() + 36)

      if (entregaPlus24 <= regPlus36) {
        return 0 // Garantía de fabricante (valor 0, se mostrará como "Fabricante" en UI)
      }
    }

    return null // No es garantía de fabricante, se completará posteriormente
  } catch (error) {
    console.error("Error calculando tipo de garantía:", error)
    return null
  }
}

export async function updateIncentiveDetails(id: number, field: string, value: any) {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from("incentivos")
      .update({ [field]: value })
      .eq("id", id)

    if (error) {
      console.error("Error updating incentive:", error)
      return { success: false, message: "Error al actualizar el incentivo" }
    }

    revalidatePath("/dashboard/incentivos")
    return { success: true }
  } catch (error) {
    console.error("Error in updateIncentiveDetails:", error)
    return { success: false, message: "Error interno del servidor" }
  }
}

// -----------------------------------------------------------
// Cargar archivo CSV con costes de garantía y gastos 360º
// -----------------------------------------------------------
export async function uploadGuaranteeCosts(formData: FormData) {
  const file = formData.get("file") as File

  if (!file) {
    return { success: false, message: "No se ha seleccionado ningún archivo." }
  }

  if (file.type !== "text/csv") {
    return { success: false, message: "Por favor, sube un archivo CSV válido." }
  }

  const reader = file.stream()?.getReader()
  if (!reader) {
    return { success: false, message: "Error al leer el archivo." }
  }

  const decoder = new TextDecoder("utf-8")
  let csvContent = ""
  let done = false

  try {
    while (!done) {
      const { value, done: readerDone } = await reader.read()
      done = readerDone
      csvContent += decoder.decode(value, { stream: true })
    }

    const lines = csvContent.split("\n").filter((line) => line.trim() !== "")
    const headers = lines[0].split(";").map((h) => h.trim().toLowerCase())

    const matriculaIndex = headers.indexOf("matricula")
    const garantiaIndex = headers.indexOf("garantia")
    const gastos360Index = headers.indexOf("gastos_360")

    if (matriculaIndex === -1 || garantiaIndex === -1 || gastos360Index === -1) {
      return {
        success: false,
        message: 'El CSV debe contener las columnas "matricula", "garantia" y "gastos_360".',
      }
    }

    const supabase = createClient()
    let updatedCount = 0
    let errorCount = 0

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(";")
      if (values.length > Math.max(matriculaIndex, garantiaIndex, gastos360Index)) {
        const matricula = values[matriculaIndex]?.trim()
        const garantiaRaw = values[garantiaIndex]?.trim().replace(",", ".") || "0"
        const gastosRaw = values[gastos360Index]?.trim().replace(",", ".") || "0"

        const garantia = Number.parseFloat(garantiaRaw)
        const gastos360 = Number.parseFloat(gastosRaw)

        if (matricula) {
          const { error } = await supabase
            .from("incentivos")
            .update({
              garantia: isNaN(garantia) ? null : garantia,
              gastos_360: isNaN(gastos360) ? null : gastos360,
            })
            .eq("matricula", matricula)

          if (error) {
            console.error(`Error actualizando ${matricula}:`, error)
            errorCount++
          } else {
            updatedCount++
          }
        }
      }
    }

    revalidatePath("/dashboard/incentivos")
    return {
      success: true,
      message: `Procesado: ${updatedCount} actualizados, ${errorCount} errores.`,
    }
  } catch (error: any) {
    console.error("Error procesando CSV:", error)
    return { success: false, message: `Error al procesar el archivo: ${error.message}` }
  }
}

export async function getIncentivesFiltered({
  year,
  month,
  advisor,
  mode = "pending",
  isAdmin = false,
  userAdvisorName,
}: {
  year?: string | null
  month?: string | null
  advisor?: string | null
  mode?: "pending" | "historical"
  isAdmin?: boolean
  userAdvisorName?: string | null
}) {
  try {
    const supabase = createClient()

    let query = supabase.from("incentivos").select("*").order("fecha_entrega", { ascending: false })

    // Filtro por modo
    if (mode === "pending") {
      query = query.or("garantia.is.null,gastos_360.is.null")
    }

    // Filtros de fecha (solo para modo histórico)
    if (mode === "historical") {
      if (year && year !== "all") {
        const startDate = `${year}-01-01`
        const endDate = `${year}-12-31`
        query = query.gte("fecha_entrega", startDate).lte("fecha_entrega", endDate)
      }

      if (month && month !== "all") {
        const [monthName] = month.split(" ")
        const monthNumber = getMonthNumber(monthName)
        if (monthNumber) {
          const currentYear = year && year !== "all" ? year : new Date().getFullYear()
          const startDate = `${currentYear}-${monthNumber.toString().padStart(2, "0")}-01`
          const endDate = `${currentYear}-${monthNumber.toString().padStart(2, "0")}-31`
          query = query.gte("fecha_entrega", startDate).lte("fecha_entrega", endDate)
        }
      }
    }

    // Filtro por asesor
    if (advisor && advisor !== "all") {
      query = query.ilike("asesor", advisor)
    }

    // Filtro por permisos de usuario
    if (!isAdmin && userAdvisorName) {
      query = query.ilike("asesor", userAdvisorName)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching filtered incentives:", error)
      return { data: [], error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error: any) {
    console.error("Unexpected error in getIncentivesFiltered:", error)
    return { data: [], error: error.message }
  }
}

export async function getUniqueYearsAndMonths() {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("incentivos")
      .select("fecha_entrega")
      .not("fecha_entrega", "is", null)
      .order("fecha_entrega", { ascending: false })

    if (error) {
      console.error("Error fetching dates:", error)
      return { years: [], months: [] }
    }

    const years = new Set<string>()
    const months = new Set<string>()

    data.forEach((item) => {
      if (item.fecha_entrega) {
        const date = new Date(item.fecha_entrega)
        years.add(date.getFullYear().toString())
        months.add((date.getMonth() + 1).toString())
      }
    })

    return {
      years: Array.from(years).sort((a, b) => Number(b) - Number(a)),
      months: Array.from(months).sort((a, b) => Number(a) - Number(b)),
    }
  } catch (error) {
    console.error("Error in getUniqueYearsAndMonths:", error)
    return { years: [], months: [] }
  }
}

export async function getUniqueAdvisors() {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("incentivos").select("asesor").not("asesor", "is", null).order("asesor")

    if (error) {
      console.error("Error fetching advisors:", error)
      return []
    }

    // Obtener valores únicos
    const uniqueAdvisors = [...new Set(data.map((item) => item.asesor).filter(Boolean))]
    return uniqueAdvisors
  } catch (error) {
    console.error("Error in getUniqueAdvisors:", error)
    return []
  }
}

function getMonthNumber(monthName: string): number | null {
  const months: { [key: string]: number } = {
    enero: 1,
    febrero: 2,
    marzo: 3,
    abril: 4,
    mayo: 5,
    junio: 6,
    julio: 7,
    agosto: 8,
    septiembre: 9,
    octubre: 10,
    noviembre: 11,
    diciembre: 12,
  }

  return months[monthName.toLowerCase()] || null
}
