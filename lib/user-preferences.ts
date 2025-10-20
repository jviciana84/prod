import type { UserPreferences, UserPreferencesInput, PageInfo } from "@/types/user-preferences"
import { createClientComponentClient } from "@/lib/supabase/client"

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
// ✅ CONSULTA: usa cliente directo (sin API Route)
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    const supabase = createClientComponentClient()
    
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    if (error) {
      console.error("Error al obtener preferencias:", error)
      return null
    }

    return data as UserPreferences | null
  } catch (error) {
    console.error("Error al obtener preferencias:", error)
    return null
  }
}

// Función para guardar las preferencias del usuario
// ✅ MUTACIÓN: usa API Route obligatoria
export async function saveUserPreferences(
  userId: string,
  preferences: UserPreferencesInput,
): Promise<UserPreferences | null> {
  try {
    const response = await fetch("/api/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferences),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data as UserPreferences
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
      theme: "dark",
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
