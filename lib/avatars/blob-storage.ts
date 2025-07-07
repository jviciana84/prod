// Eliminar la importación de next/headers que causa el error
// import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

// Caché en memoria para mapeos de avatares
let avatarMappingsCache: Map<string, string> | null = null
let lastCacheUpdate = 0
const CACHE_TTL = 1000 * 60 * 60 // 1 hora

// Cliente de Supabase para operaciones de lectura
const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

/**
 * Obtiene la URL de Blob para una ruta local de avatar
 */
export async function getBlobUrlForLocalPath(localPath: string): Promise<string | null> {
  try {
    // Intentar obtener de la caché primero
    const cachedUrl = await getFromCache(localPath)
    if (cachedUrl) return cachedUrl

    // Si no está en caché, consultar la base de datos
    const { data, error } = await supabaseClient
      .from("avatar_mappings")
      .select("blob_url")
      .eq("local_path", localPath)
      .single()

    if (error || !data) {
      return null
    }

    // Actualizar la caché
    updateCache(localPath, data.blob_url)

    return data.blob_url
  } catch (error) {
    console.error("Error al obtener URL de Blob:", error)
    return null
  }
}

/**
 * Obtiene todos los mapeos de avatares
 */
export async function getAllAvatarMappings(): Promise<Record<string, string>> {
  try {
    // Verificar si la caché está actualizada
    if (avatarMappingsCache && Date.now() - lastCacheUpdate < CACHE_TTL) {
      return Object.fromEntries(avatarMappingsCache.entries())
    }

    // Si no, obtener todos los mapeos de la base de datos
    const { data, error } = await supabaseClient.from("avatar_mappings").select("local_path, blob_url")

    if (error || !data) {
      return {}
    }

    // Actualizar la caché completa
    avatarMappingsCache = new Map()
    data.forEach((mapping) => {
      avatarMappingsCache!.set(mapping.local_path, mapping.blob_url)
    })
    lastCacheUpdate = Date.now()

    return Object.fromEntries(avatarMappingsCache.entries())
  } catch (error) {
    console.error("Error al obtener mapeos de avatares:", error)
    return {}
  }
}

/**
 * Obtiene un valor de la caché
 */
async function getFromCache(localPath: string): Promise<string | null> {
  // Si la caché no existe o está expirada, actualizarla
  if (!avatarMappingsCache || Date.now() - lastCacheUpdate > CACHE_TTL) {
    await getAllAvatarMappings()
  }

  return avatarMappingsCache?.get(localPath) || null
}

/**
 * Actualiza un valor en la caché
 */
function updateCache(localPath: string, blobUrl: string): void {
  if (!avatarMappingsCache) {
    avatarMappingsCache = new Map()
  }
  avatarMappingsCache.set(localPath, blobUrl)
  lastCacheUpdate = Date.now()
}

/**
 * Limpia la caché de avatares
 */
export function clearAvatarCache(): void {
  avatarMappingsCache = null
  lastCacheUpdate = 0
}
