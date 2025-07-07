import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import type { UserPreferences } from "@/types/user-preferences"

// Función para obtener las preferencias del usuario (versión de servidor)
export async function getUserPreferencesServer(userId: string): Promise<UserPreferences | null> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(cookieStore)

    const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", userId).single()

    if (error) {
      console.log("No se encontraron preferencias para el usuario:", userId)
      return null
    }

    return data as UserPreferences
  } catch (error) {
    console.error("Error en getUserPreferencesServer:", error)
    return null
  }
}

// Función para obtener la página principal del usuario (versión de servidor)
export async function getUserMainPageServer(userId: string): Promise<string | null> {
  try {
    const prefs = await getUserPreferencesServer(userId)
    return prefs?.main_page?.path || "/dashboard"
  } catch (error) {
    console.error("Error en getUserMainPageServer:", error)
    return "/dashboard"
  }
}
