import { createClient } from "@/lib/supabase/client"

export interface IncentivosConfig {
  importe_minimo: number
  porcentaje_margen: number
  gastos_estructura: number
}

export interface CalculationBreakdown {
  precioVenta: number
  precioCompra: number
  margenBruto: number
  gastosEstructura: number
  garantia: number
  gastos360: number
  margenNeto: number
  porcentajeIncentivo: number
  incentivoPorcentaje: number
  importeBaseMinimo: number
  aplicaMinimo: boolean
  financiado: boolean
  antiguedad: boolean
  otros: number
  otrosObservaciones: string | null
  totalIncentivo: number
  config: IncentivosConfig
}

/**
 * Obtiene la configuración actual de incentivos desde la base de datos
 */
export async function getCurrentIncentivosConfig(): Promise<IncentivosConfig> {
  const supabase = createClient()

  const { data, error } = await supabase.from("incentivos_config").select("*").single()

  if (error) {
    console.error("Error obteniendo configuración de incentivos:", error)
    // Valores por defecto si hay error
    return {
      importe_minimo: 60,
      porcentaje_margen: 5,
      gastos_estructura: 1000,
    }
  }

  return {
    importe_minimo: data.importe_minimo || 60,
    porcentaje_margen: data.porcentaje_margen || 5,
    gastos_estructura: data.gastos_estructura || 1000,
  }
}

/**
 * Calcula el incentivo con la nueva lógica
 */
export async function calculateIncentiveBreakdown(incentivo: any): Promise<CalculationBreakdown> {
  // Obtener configuración actual
  const config = await getCurrentIncentivosConfig()

  const precioVenta = incentivo.precio_venta || 0
  const precioCompra = incentivo.precio_compra || 0
  const gastosEstructura = incentivo.gastos_estructura || config.gastos_estructura
  const garantia = incentivo.garantia || 0
  const gastos360 = incentivo.gastos_360 || 0
  const otros = incentivo.otros || 0
  const financiado = incentivo.financiado || false
  const antiguedad = incentivo.antiguedad || false

  // Cálculos
  const margenBruto = precioVenta - precioCompra
  const margenNeto = margenBruto - gastosEstructura - garantia - gastos360

  // Calcular incentivo por porcentaje
  const incentivoPorcentaje = margenNeto > 0 ? (margenNeto * config.porcentaje_margen) / 100 : 0

  // Determinar si aplica el mínimo
  const aplicaMinimo = incentivoPorcentaje < config.importe_minimo

  // Base del incentivo
  const baseIncentivo = aplicaMinimo ? config.importe_minimo : incentivoPorcentaje

  // Añadir bonificaciones
  let totalIncentivo = baseIncentivo
  if (financiado) totalIncentivo += 50
  if (antiguedad) totalIncentivo += 50
  totalIncentivo += otros

  // Asegurar que no sea negativo
  totalIncentivo = Math.max(0, totalIncentivo)

  return {
    precioVenta,
    precioCompra,
    margenBruto,
    gastosEstructura,
    garantia,
    gastos360,
    margenNeto,
    porcentajeIncentivo: config.porcentaje_margen,
    incentivoPorcentaje,
    importeBaseMinimo: config.importe_minimo,
    aplicaMinimo,
    financiado,
    antiguedad,
    otros,
    otrosObservaciones: incentivo.otros_observaciones,
    totalIncentivo,
    config,
  }
}

/**
 * Función simplificada para usar en la tabla (compatible con el código existente)
 */
export function calculateIncentiveAmount(incentivo: any, config?: IncentivosConfig): number {
  const configToUse = config || {
    importe_minimo: incentivo.importe_minimo || 60,
    porcentaje_margen: incentivo.porcentaje_margen_config_usado || 5,
    gastos_estructura: incentivo.gastos_estructura || 1000,
  }

  const precioVenta = incentivo.precio_venta || 0
  const precioCompra = incentivo.precio_compra || 0
  const gastosEstructura = incentivo.gastos_estructura || configToUse.gastos_estructura
  const garantia = incentivo.garantia || 0
  const gastos360 = incentivo.gastos_360 || 0
  const otros = incentivo.otros || 0
  const financiado = incentivo.financiado || false
  const antiguedad = incentivo.antiguedad || false

  const margenBruto = precioVenta - precioCompra
  const margenNeto = margenBruto - gastosEstructura - garantia - gastos360

  const incentivoPorcentaje = margenNeto > 0 ? (margenNeto * configToUse.porcentaje_margen) / 100 : 0
  const aplicaMinimo = incentivoPorcentaje < configToUse.importe_minimo

  let totalIncentivo = aplicaMinimo ? configToUse.importe_minimo : incentivoPorcentaje
  if (financiado) totalIncentivo += 50
  if (antiguedad) totalIncentivo += 50
  totalIncentivo += otros

  return Math.max(0, totalIncentivo)
}
