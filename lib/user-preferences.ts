import { createClientComponentClient } from "@/lib/supabase/client"
import type { UserPreferences, UserPreferencesInput, PageInfo } from "@/types/user-preferences"

// Páginas disponibles para favoritos
export const availablePages: PageInfo[] = [
  { id: "dashboard", path: "/dashboard", title: "Dashboard", icon: "layout-dashboard" },
  { id: "nuevas-entradas", path: "/dashboard/nuevas-entradas", title: "Nuevas Entradas", icon: "file-plus" },
  { id: "ventas", path: "/dashboard/ventas", title: "Ventas", icon: "shopping-cart" },
  { id: "directory", path: "/dashboard/directory", title: "Directorio", icon: "users" },
  { id: "vehicles", path: "/dashboard/vehicles", title: "Vehículos", icon: "car" },
  { id: "photos", path: "/dashboard/photos", title: "Fotos", icon: "image" },
  { id: "settings", path: "/dashboard/settings", title: "Configuración", icon: "settings" },
  { id: "profile", path: "/dashboard/profile", title: "Perfil", icon: "user" },
  { id: "admin-users", path: "/dashboard/admin/users", title: "Admin Usuarios", icon: "shield" },
  { id: "admin-avatars", path: "/dashboard/admin/avatars", title: "Admin Avatares", icon: "image-plus" },
]

// Función para obtener las preferencias del usuario
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const supabase = createClientComponentClient()

  try {
    // Primero verificamos si existe un registro para este usuario
    const { data, error, count } = await supabase
      .from("user_preferences")
      .select("*", { count: "exact" })
      .eq("user_id", userId)

    // Si hay un error o no hay registros, devolvemos null
    if (error || !count || count === 0) {
      console.log("No se encontraron preferencias para el usuario:", userId)
      return null
    }

    // Si hay exactamente un registro, lo devolvemos
    if (count === 1 && data && data.length === 1) {
      return data[0] as UserPreferences
    }

    // Si hay múltiples registros, usamos el primero y registramos una advertencia
    if (count > 1 && data && data.length > 0) {
      console.warn(`Se encontraron ${count} registros de preferencias para el usuario ${userId}. Usando el primero.`)
      return data[0] as UserPreferences
    }

    return null
  } catch (error) {
    console.error("Error al obtener preferencias:", error)
    return null
  }
}

// Función para guardar las preferencias del usuario
export async function saveUserPreferences(
  userId: string,
  preferences: UserPreferencesInput,
): Promise<UserPreferences | null> {
  const supabase = createClientComponentClient()

  try {
    // Verificar si ya existen preferencias para este usuario
    const { data: existingData, count } = await supabase
      .from("user_preferences")
      .select("id", { count: "exact" })
      .eq("user_id", userId)

    const now = new Date().toISOString()

    // Si hay múltiples registros, eliminamos todos excepto el primero
    if (count && count > 1 && existingData && existingData.length > 1) {
      console.warn(`Se encontraron ${count} registros de preferencias para el usuario ${userId}. Limpiando duplicados.`)

      // Mantener solo el primer registro
      const keepId = existingData[0].id

      // Eliminar los demás registros
      await supabase.from("user_preferences").delete().eq("user_id", userId).neq("id", keepId)
    }

    if (existingData && existingData.length > 0) {
      // Actualizar preferencias existentes
      const { data, error } = await supabase
        .from("user_preferences")
        .update({
          ...preferences,
          updated_at: now,
        })
        .eq("id", existingData[0].id)
        .select("*")
        .single()

      if (error) {
        console.error("Error al actualizar preferencias:", error)
        return null
      }

      return data as UserPreferences
    } else {
      // Crear nuevas preferencias
      const { data, error } = await supabase
        .from("user_preferences")
        .insert({
          user_id: userId,
          theme: preferences.theme || "system",
          main_page: preferences.main_page || null,
          favorite_pages: preferences.favorite_pages || [],
          created_at: now,
          updated_at: now,
        })
        .select("*")
        .single()

      if (error) {
        console.error("Error al crear preferencias:", error)
        return null
      }

      return data as UserPreferences
    }
  } catch (error) {
    console.error("Error al guardar preferencias:", error)
    return null
  }
}

// Función para añadir una página a favoritos
export async function addToFavorites(
  userId: string,
  page: PageInfo,
  isMainPage = false,
): Promise<UserPreferences | null> {
  const prefs = await getUserPreferences(userId)

  if (!prefs) {
    // Crear preferencias nuevas
    return saveUserPreferences(userId, {
      theme: "system",
      main_page: isMainPage ? page : null,
      favorite_pages: isMainPage ? [] : [page],
    })
  }

  const updatedPrefs: UserPreferencesInput = {}

  if (isMainPage) {
    updatedPrefs.main_page = page
  } else {
    // Verificar si ya existe en favoritos
    const existingIndex = prefs.favorite_pages.findIndex((p) => p.id === page.id)

    if (existingIndex >= 0) {
      // Ya existe, no hacer nada
      return prefs
    }

    // Añadir a favoritos, limitando a 4
    const updatedFavorites = [...prefs.favorite_pages]
    if (updatedFavorites.length >= 4) {
      updatedFavorites.pop() // Eliminar el último
    }
    updatedFavorites.unshift(page) // Añadir al principio

    updatedPrefs.favorite_pages = updatedFavorites
  }

  return saveUserPreferences(userId, updatedPrefs)
}

// Función para eliminar una página de favoritos
export async function removeFromFavorites(
  userId: string,
  pageId: string,
  isMainPage = false,
): Promise<UserPreferences | null> {
  const prefs = await getUserPreferences(userId)

  if (!prefs) {
    return null
  }

  const updatedPrefs: UserPreferencesInput = {}

  if (isMainPage && prefs.main_page?.id === pageId) {
    updatedPrefs.main_page = null
  } else {
    updatedPrefs.favorite_pages = prefs.favorite_pages.filter((p) => p.id !== pageId)
  }

  return saveUserPreferences(userId, updatedPrefs)
}

// Función para cambiar el tema
export async function setUserTheme(
  userId: string,
  theme: "light" | "dark" | "system" | "ocre",
): Promise<UserPreferences | null> {
  return saveUserPreferences(userId, { theme })
}

// Función para obtener la página principal del usuario
export async function getUserMainPage(userId: string): Promise<string | null> {
  const prefs = await getUserPreferences(userId)

  if (!prefs || !prefs.main_page) {
    return "/dashboard" // Página por defecto
  }

  return prefs.main_page.path
}
