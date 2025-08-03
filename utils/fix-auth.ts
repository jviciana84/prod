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
 * SOLO se ejecuta cuando hay errores de parsing de cookies
 */
export function clearCorruptedSession() {
  if (typeof window === "undefined") return

  try {
    console.log("🔧 Iniciando limpieza de sesión corrupta...")
    
    // 1. Limpiar TODAS las cookies de Supabase (no solo las corruptas)
    const cookies = document.cookie.split(";")
    let cleanedCookies = 0
    
    cookies.forEach((cookie) => {
      const [name, value] = cookie.trim().split("=")
      if (name && name.trim().startsWith("sb-")) {
        // Eliminar todas las cookies de Supabase
        document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;`
        document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost;`
        console.log("Cookie de Supabase eliminada:", name.trim())
        cleanedCookies++
      }
    })

    // 2. Limpiar localStorage de Supabase
    let cleanedStorage = 0
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("sb-")) {
        localStorage.removeItem(key)
        console.log("LocalStorage de Supabase eliminado:", key)
        cleanedStorage++
      }
    })

    // 3. Limpiar sessionStorage de Supabase
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith("sb-")) {
        sessionStorage.removeItem(key)
        console.log("SessionStorage de Supabase eliminado:", key)
        cleanedStorage++
      }
    })

    // 4. Forzar recarga de caché del navegador
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          if (cacheName.includes('supabase') || cacheName.includes('auth')) {
            caches.delete(cacheName)
            console.log("Cache eliminado:", cacheName)
          }
        })
      })
    }

    console.log(`✅ Limpieza completada: ${cleanedCookies} cookies, ${cleanedStorage} items de storage`)
    
    if (cleanedCookies > 0 || cleanedStorage > 0) {
      console.log("🔄 Se requiere nuevo login después de la limpieza")
      // Forzar recarga después de un breve delay
      setTimeout(() => {
        window.location.reload()
      }, 100)
    }
  } catch (error) {
    console.error("❌ Error al limpiar sesión corrupta:", error)
  }
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
