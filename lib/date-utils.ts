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
 * Formatea una fecha para mostrar en la UI (siempre en formato español)
 */
export function formatDateForDisplay(dateString: string | null | undefined): string {
  if (!dateString) return "-"

  try {
    const date = parseISO(dateString)
    if (!isValid(date)) return "-"

    return format(date, "dd/MM/yyyy", { locale: es })
  } catch (error) {
    console.error("Error formatting date:", error)
    return "-"
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
