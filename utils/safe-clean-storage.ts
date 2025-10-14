/**
 * 🧹 LIMPIEZA SEGURA DE STORAGE
 * 
 * Limpia SOLO cookies y localStorage de Supabase corruptos
 * PRESERVA todas las preferencias y datos del usuario
 * 
 * Fecha: 14 Oct 2025
 * Problema: Cookies de Supabase corruptas causan que tablas no carguen
 * Solución: Limpiar selectivamente solo lo necesario
 */

/**
 * Claves de localStorage que NUNCA deben eliminarse
 */
const PROTECTED_KEYS = [
  // Preferencias de usuario
  'theme',
  'auto-refresh-preferences',
  
  // Datos de tasaciones
  'lastTasacion',
  'tasacionMetadata',
  'lastTasacionId',
  
  // Chat AI
  'edelweiss_conversation_count',
  'edelweiss_has_opened',
  
  // Versión de limpieza (para no repetir)
  'storage_clean_version',
]

/**
 * Versión actual de limpieza
 * Incrementar si necesitas forzar una nueva limpieza en todos los usuarios
 */
const CURRENT_CLEAN_VERSION = '2025-10-14-v1'

/**
 * Verifica si es necesario limpiar el storage
 */
export function needsStorageClean(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const lastCleanVersion = localStorage.getItem('storage_clean_version')
    return lastCleanVersion !== CURRENT_CLEAN_VERSION
  } catch (error) {
    console.error('Error al verificar versión de limpieza:', error)
    return false
  }
}

/**
 * Limpia SOLO las cookies y localStorage de Supabase
 * PRESERVA todas las preferencias de usuario
 */
export function safeCleanStorage(): {
  success: boolean
  itemsCleaned: number
  itemsPreserved: number
  errors: string[]
} {
  if (typeof window === 'undefined') {
    return { success: false, itemsCleaned: 0, itemsPreserved: 0, errors: ['No disponible en servidor'] }
  }

  console.log('🧹 Iniciando limpieza segura de storage...')
  
  let itemsCleaned = 0
  let itemsPreserved = 0
  const errors: string[] = []

  try {
    // 1. LIMPIAR COOKIES DE SUPABASE
    console.log('🔧 Limpiando cookies de Supabase...')
    const cookies = document.cookie.split(';')
    
    cookies.forEach((cookie) => {
      const [name] = cookie.trim().split('=')
      if (name && name.startsWith('sb-')) {
        try {
          // Eliminar cookie en todos los paths y dominios posibles
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`
          console.log(`  ✓ Cookie eliminada: ${name}`)
          itemsCleaned++
        } catch (error) {
          console.error(`  ✗ Error eliminando cookie ${name}:`, error)
          errors.push(`Cookie ${name}: ${error}`)
        }
      }
    })

    // 2. LIMPIAR LOCALSTORAGE DE SUPABASE (preservando datos protegidos)
    console.log('🔧 Limpiando localStorage de Supabase...')
    const keysToRemove: string[] = []
    
    // Identificar qué eliminar
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        if (key.startsWith('sb-')) {
          keysToRemove.push(key)
        } else if (PROTECTED_KEYS.includes(key)) {
          console.log(`  ✓ Preservado: ${key}`)
          itemsPreserved++
        }
      }
    }
    
    // Eliminar lo identificado
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key)
        console.log(`  ✓ LocalStorage eliminado: ${key}`)
        itemsCleaned++
      } catch (error) {
        console.error(`  ✗ Error eliminando localStorage ${key}:`, error)
        errors.push(`LocalStorage ${key}: ${error}`)
      }
    })

    // 3. LIMPIAR SESSIONSTORAGE DE SUPABASE
    console.log('🔧 Limpiando sessionStorage de Supabase...')
    const sessionKeysToRemove: string[] = []
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith('sb-')) {
        sessionKeysToRemove.push(key)
      }
    }
    
    sessionKeysToRemove.forEach(key => {
      try {
        sessionStorage.removeItem(key)
        console.log(`  ✓ SessionStorage eliminado: ${key}`)
        itemsCleaned++
      } catch (error) {
        console.error(`  ✗ Error eliminando sessionStorage ${key}:`, error)
        errors.push(`SessionStorage ${key}: ${error}`)
      }
    })

    // 4. MARCAR COMO LIMPIADO
    try {
      localStorage.setItem('storage_clean_version', CURRENT_CLEAN_VERSION)
      console.log(`✅ Limpieza completada. Versión: ${CURRENT_CLEAN_VERSION}`)
    } catch (error) {
      console.error('Error al guardar versión de limpieza:', error)
      errors.push(`Versión: ${error}`)
    }

    return {
      success: errors.length === 0,
      itemsCleaned,
      itemsPreserved,
      errors,
    }

  } catch (error) {
    console.error('❌ Error durante limpieza de storage:', error)
    return {
      success: false,
      itemsCleaned,
      itemsPreserved,
      errors: [...errors, `Error general: ${error}`],
    }
  }
}

/**
 * Ejecuta limpieza automática si es necesario
 * Retorna true si se ejecutó limpieza
 */
export function autoCleanStorageIfNeeded(): boolean {
  if (!needsStorageClean()) {
    console.log('✅ Storage ya está limpio (versión actual)')
    return false
  }

  console.log('🔄 Limpieza automática necesaria...')
  const result = safeCleanStorage()
  
  if (result.success) {
    console.log(`✅ Limpieza automática exitosa: ${result.itemsCleaned} items limpiados, ${result.itemsPreserved} preservados`)
    return true
  } else {
    console.error('❌ Limpieza automática falló:', result.errors)
    return false
  }
}

/**
 * Fuerza una limpieza completa (para uso manual)
 */
export function forceCleanStorage() {
  // Temporalmente quitar la marca de versión para forzar limpieza
  localStorage.removeItem('storage_clean_version')
  return safeCleanStorage()
}

/**
 * Obtiene información sobre el estado del storage
 */
export function getStorageInfo(): {
  needsCleaning: boolean
  currentVersion: string | null
  targetVersion: string
  supabaseItems: string[]
  protectedItems: string[]
} {
  if (typeof window === 'undefined') {
    return {
      needsCleaning: false,
      currentVersion: null,
      targetVersion: CURRENT_CLEAN_VERSION,
      supabaseItems: [],
      protectedItems: [],
    }
  }

  const supabaseItems: string[] = []
  const protectedItems: string[] = []

  // Revisar localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      if (key.startsWith('sb-')) {
        supabaseItems.push(key)
      } else if (PROTECTED_KEYS.includes(key)) {
        protectedItems.push(key)
      }
    }
  }

  return {
    needsCleaning: needsStorageClean(),
    currentVersion: localStorage.getItem('storage_clean_version'),
    targetVersion: CURRENT_CLEAN_VERSION,
    supabaseItems,
    protectedItems,
  }
}

