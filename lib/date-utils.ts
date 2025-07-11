import { format, parse, parseISO, isValid } from "date-fns"
import { es } from "date-fns/locale"

/**
 * Utilidades para manejo consistente de fechas en formato español
 */

// Formato español estándar
export const SPANISH_DATE_FORMAT = "dd/MM/yyyy"
export const ISO_DATE_FORMAT = "yyyy-MM-dd"

/**
 * Convierte una fecha ISO (YYYY-MM-DD) a formato español (DD/MM/AAAA)
 */
export function formatDateToSpanish(isoDate: string | null | undefined): string {
  if (!isoDate || isoDate.trim() === "") return ""

  try {
    // Si ya está en formato español, devolverla tal como está
    if (isoDate.includes("/")) {
      return isoDate
    }

    const date = new Date(isoDate)
    if (!isValid(date)) {
      console.warn("Fecha inválida:", isoDate)
      return isoDate
    }

    return format(date, SPANISH_DATE_FORMAT, { locale: es })
  } catch (error) {
    console.error("Error formateando fecha:", error, isoDate)
    return isoDate
  }
}

/**
 * Convierte una fecha en formato español (DD/MM/AAAA) a formato ISO (YYYY-MM-DD)
 */
export function parseSpanishDateToISO(spanishDate: string | null | undefined): string | null {
  if (!spanishDate || spanishDate.trim() === "") return null

  try {
    // Si ya está en formato ISO, devolverla tal como está
    if (spanishDate.includes("-") && spanishDate.length === 10) {
      return spanishDate
    }

    // Parsear formato español DD/MM/AAAA
    const date = parse(spanishDate, SPANISH_DATE_FORMAT, new Date())
    if (!isValid(date)) {
      console.warn("Fecha española inválida:", spanishDate)
      return null
    }

    return format(date, ISO_DATE_FORMAT)
  } catch (error) {
    console.error("Error parseando fecha española:", error, spanishDate)
    return null
  }
}

/**
 * Valida si una fecha en formato español es válida
 */
export function isValidSpanishDate(spanishDate: string): boolean {
  if (!spanishDate || spanishDate.trim() === "") return false

  try {
    const date = parse(spanishDate, SPANISH_DATE_FORMAT, new Date())
    return isValid(date)
  } catch {
    return false
  }
}



/**
 * Prepara una fecha para enviar a la base de datos (siempre en formato ISO)
 */
export function formatDateForDatabase(dateValue: string | null | undefined): string | null {
  return parseSpanishDateToISO(dateValue)
}

/**
 * Formatea fecha con hora para mostrar
 */
export function formatDateTimeForDisplay(dateString: string | null | undefined): string {
  if (!dateString) return "-"

  try {
    const date = parseISO(dateString)
    if (!isValid(date)) return "-"

    return format(date, "dd/MM/yyyy HH:mm", { locale: es })
  } catch (error) {
    console.error("Error formatting datetime:", error)
    return "-"
  }
}

/**
 * Obtiene la fecha actual en formato español
 */
export function getCurrentSpanishDate(): string {
  return format(new Date(), SPANISH_DATE_FORMAT, { locale: es })
}

/**
 * Obtiene la fecha actual en formato ISO
 */
export function getCurrentISODate(): string {
  return format(new Date(), ISO_DATE_FORMAT)
}

/**
 * Convierte cualquier formato de fecha a español de forma segura
 */
export function safeFormatToSpanish(dateValue: any): string {
  if (!dateValue) return ""

  const stringValue = String(dateValue)

  // Si ya está en formato español
  if (stringValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    return stringValue
  }

  // Si está en formato ISO
  if (stringValue.match(/^\d{4}-\d{2}-\d{2}/)) {
    return formatDateToSpanish(stringValue)
  }

  // Intentar parsear como fecha
  try {
    const date = new Date(stringValue)
    if (isValid(date)) {
      return format(date, SPANISH_DATE_FORMAT, { locale: es })
    }
  } catch {
    // Si no se puede parsear, devolver el valor original
  }

  return stringValue
}

/**
 * Utilidades para manejo de fechas de manera consistente
 * entre desarrollo y producción
 */

/**
 * Obtiene el primer día del mes actual en UTC
 */
export function getFirstDayOfCurrentMonth(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

/**
 * Obtiene el primer día del mes anterior en UTC
 */
export function getFirstDayOfPreviousMonth(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString()
}

/**
 * Obtiene el último día del mes anterior en UTC
 */
export function getLastDayOfPreviousMonth(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999)).toISOString()
}

/**
 * Obtiene el primer día de un mes específico en UTC
 */
export function getFirstDayOfMonth(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toISOString()
}

/**
 * Obtiene el último día de un mes específico en UTC
 */
export function getLastDayOfMonth(year: number, month: number): string {
  return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString()
}

/**
 * Formatea una fecha para mostrar en la interfaz (versión mejorada)
 */
export function formatDateForDisplay(date: string | Date): string {
  if (!date) return "-"
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (!dateObj || isNaN(dateObj.getTime())) return "-"
  return dateObj.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Convierte una fecha DD/MM/YYYY a formato ISO
 */
export function convertDateFormat(dateString: string | null): string | null {
  if (!dateString || dateString.trim() === "") return null

  // Si ya es una fecha válida en formato ISO, retornarla
  try {
    const testDate = new Date(dateString)
    if (!isNaN(testDate.getTime()) && dateString.includes("-")) {
      return dateString // Ya está en formato correcto
    }
  } catch {
    // Continuar con la conversión
  }

  // Buscar patrón DD/MM/YYYY o DD-MM-YYYY
  const datePattern = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
  const match = dateString.match(datePattern)

  if (!match) return null

  const [, day, month, year] = match
  const dayNum = Number.parseInt(day, 10)
  const monthNum = Number.parseInt(month, 10)
  const yearNum = Number.parseInt(year, 10)

  // Validar rangos
  if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) {
    return null
  }

  // Formatear como YYYY-MM-DD
  const formattedDate = `${yearNum}-${monthNum.toString().padStart(2, "0")}-${dayNum.toString().padStart(2, "0")}`

  // Verificar que la fecha sea válida
  const testDate = new Date(formattedDate)
  if (isNaN(testDate.getTime())) return null

  return formattedDate
}

/**
 * Obtiene información de debug sobre fechas
 */
export function getDateDebugInfo() {
  const now = new Date()
  return {
    currentDate: now.toISOString(),
    currentDateLocal: now.toString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    firstDayOfCurrentMonth: getFirstDayOfCurrentMonth(),
    firstDayOfPreviousMonth: getFirstDayOfPreviousMonth(),
    lastDayOfPreviousMonth: getLastDayOfPreviousMonth(),
    environment: process.env.NODE_ENV || "development"
  }
}
