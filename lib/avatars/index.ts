import { getBlobUrlForLocalPath } from "./blob-storage"

// Lista de avatares disponibles
const avatarList = [
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

// Caché para avatares ya asignados
const assignedAvatars = new Map<string, string>()

/**
 * Obtiene un avatar aleatorio
 */
export async function getRandomAvatar(): Promise<string> {
  const randomIndex = Math.floor(Math.random() * avatarList.length)
  const localPath = avatarList[randomIndex]

  // Intentar obtener la URL de Blob
  const blobUrl = await getBlobUrlForLocalPath(localPath)

  // Devolver la URL de Blob si existe, o la ruta local como fallback
  return blobUrl || localPath
}

/**
 * Obtiene todos los avatares disponibles
 */
export async function getAllAvatars(): Promise<string[]> {
  // Obtener URLs de Blob para todos los avatares
  const avatarsWithBlob = await Promise.all(
    avatarList.map(async (localPath) => {
      const blobUrl = await getBlobUrlForLocalPath(localPath)
      return blobUrl || localPath
    }),
  )

  return avatarsWithBlob
}

/**
 * Obtiene un avatar único para un usuario
 */
export async function getUniqueAvatar(supabaseAdmin: any): Promise<string> {
  try {
    // Obtener todos los avatares ya asignados
    const { data: profiles, error } = await supabaseAdmin.from("profiles").select("avatar_url")

    if (error) {
      console.error("Error al obtener avatares asignados:", error)
      return await getRandomAvatar() // En caso de error, devolver uno aleatorio
    }

    // Obtener todos los avatares disponibles
    const allAvatars = await getAllAvatars()

    // Extraer los avatares ya utilizados
    const usedAvatars = profiles.filter((profile: any) => profile.avatar_url).map((profile: any) => profile.avatar_url)

    // Filtrar los avatares disponibles (no utilizados)
    const availableAvatars = allAvatars.filter((avatar) => !usedAvatars.includes(avatar))

    // Si todos los avatares están en uso, devolver uno aleatorio
    if (availableAvatars.length === 0) {
      return await getRandomAvatar()
    }

    // Seleccionar aleatoriamente uno de los avatares disponibles
    const randomIndex = Math.floor(Math.random() * availableAvatars.length)
    return availableAvatars[randomIndex]
  } catch (error) {
    console.error("Error en getUniqueAvatar:", error)
    return await getRandomAvatar() // En caso de error, devolver uno aleatorio
  }
}

// Exportar la lista de avatares para compatibilidad con código existente
export const avatars = avatarList
