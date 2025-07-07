/**
 * Utilidades para diagnosticar y arreglar problemas con las cookies de autenticación de Supabase
 * IMPORTANTE: NO ELIMINAR COOKIES DE AUTENTICACIÓN
 */

// Función eliminada - no es necesaria

/**
 * Inspecciona las cookies de Supabase en el navegador
 * @returns Un objeto con las cookies de Supabase encontradas
 */
export function inspectSupabaseCookies() {
  if (typeof window === "undefined") return {}

  const cookies = {}
  document.cookie.split(";").forEach((cookie) => {
    const [name, value] = cookie.trim().split("=")
    if (name && name.trim().startsWith("sb-")) {
      cookies[name.trim()] = value
      console.log(`Cookie ${name.trim()}:`, value)
    }
  })

  // También inspeccionar localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("sb-")) {
      try {
        const value = localStorage.getItem(key)
        console.log(`LocalStorage ${key}:`, value)
      } catch (error) {
        console.error(`Error al leer localStorage ${key}:`, error)
      }
    }
  })

  return cookies
}

/**
 * Arregla cookies corruptas de Supabase que comienzan con 'base64-'
 * DESACTIVADO: NO ELIMINAR COOKIES DE AUTENTICACIÓN
 */
export function fixCorruptedCookies() {
  if (typeof window === "undefined") return

  // NO ELIMINAR COOKIES DE AUTENTICACIÓN
  return false
}

/**
 * Función para limpiar una sesión corrupta de Supabase
 * DESACTIVADO: NO ELIMINAR COOKIES DE AUTENTICACIÓN
 */
export function clearCorruptedSession() {
  return
}

// Función para simular usuario admin
export function getAdminUser() {
  return {
    id: "admin-user-id",
    email: "admin@empresa.com",
    role: "admin",
  }
}

// Mapeo de aliases a nombres reales
export const USER_ALIASES = {
  SaraMe: "Sara Mendoza",
  // Añadir más aliases según sea necesario
}

export function resolveUserName(alias: string): string {
  return USER_ALIASES[alias as keyof typeof USER_ALIASES] || alias
}

// Función para verificar si hay problemas de sesión
export function checkSessionHealth() {
  if (typeof window === "undefined") return { healthy: true }

  try {
    // Verificar si hay cookies de Supabase
    const hasSupabaseCookies = document.cookie
      .split(";")
      .some((c) => c.trim().startsWith("sb-") || c.includes("supabase"))

    // Verificar localStorage
    let hasLocalStorageItems = false
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
        hasLocalStorageItems = true
        break
      }
    }

    // Si hay inconsistencia entre cookies y localStorage
    if (hasSupabaseCookies !== hasLocalStorageItems) {
      return {
        healthy: false,
        reason: "Inconsistencia entre cookies y localStorage",
      }
    }

    return { healthy: true }
  } catch (error) {
    console.error("Error al verificar salud de la sesión:", error)
    return { healthy: false, reason: "Error al verificar sesión" }
  }
}

// Función para intentar recuperar una sesión problemática
export async function attemptSessionRecovery() {
  // NO ELIMINAR COOKIES DE AUTENTICACIÓN
  return
}

/**
 * Función mejorada que solo elimina cookies que están REALMENTE corruptas
 * DESACTIVADO: NO ELIMINAR COOKIES DE AUTENTICACIÓN
 */
export function smartFixCorruptedCookies() {
  if (typeof window === "undefined") return false

  // NO ELIMINAR COOKIES DE AUTENTICACIÓN
  return false
}
