import { createClient } from "@supabase/supabase-js"

// Cliente de Supabase específico para el Pages Router
export const pagesSupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

// Lista de avatares disponibles
export const avatarList = [
  "/avatars/lion.png",
  "/avatars/tiger.png",
  "/avatars/elephant.png",
  "/avatars/monkey.png",
  "/avatars/parrot.png",
  "/avatars/jaguar.png",
  "/avatars/toucan.png",
  "/avatars/sloth.png",
  "/avatars/snake.png",
]

// Funciones específicas para el Pages Router

/**
 * Obtiene la URL de Blob para una ruta local de avatar
 */
export async function getBlobUrlForPath(localPath: string): Promise<string | null> {
  try {
    const { data, error } = await pagesSupabaseClient
      .from("avatar_mappings")
      .select("blob_url")
      .eq("local_path", localPath)
      .single()

    if (error || !data) {
      return null
    }

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
    const { data, error } = await pagesSupabaseClient.from("avatar_mappings").select("local_path, blob_url")

    if (error || !data) {
      return {}
    }

    const mappings: Record<string, string> = {}
    data.forEach((mapping) => {
      mappings[mapping.local_path] = mapping.blob_url
    })

    return mappings
  } catch (error) {
    console.error("Error al obtener mapeos de avatares:", error)
    return {}
  }
}

/**
 * Obtiene un avatar aleatorio
 */
export async function getRandomAvatar(): Promise<string> {
  const randomIndex = Math.floor(Math.random() * avatarList.length)
  const localPath = avatarList[randomIndex]

  const blobUrl = await getBlobUrlForPath(localPath)
  return blobUrl || localPath
}

/**
 * Obtiene todos los avatares disponibles
 */
export async function getAllAvatars(): Promise<string[]> {
  const mappings = await getAllAvatarMappings()

  return avatarList.map((localPath) => {
    return mappings[localPath] || localPath
  })
}
