// Este archivo asegura que solo haya una instancia del cliente de Supabase en toda la aplicación

import { createBrowserClient } from "@supabase/ssr"

// Declaramos una variable para almacenar la instancia del cliente
let supabaseClient: ReturnType<typeof createBrowserClient> | undefined

export function getSupabaseClient() {
  if (typeof window === "undefined") {
    // En el servidor, siempre creamos una nueva instancia
    return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  }

  // En el cliente, reutilizamos la instancia existente o creamos una nueva
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }

  return supabaseClient
}

// Función para limpiar el cliente (útil para cerrar sesión)
export function clearSupabaseClient() {
  if (typeof window !== "undefined") {
    supabaseClient = undefined
  }
}
