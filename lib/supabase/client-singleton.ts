import { createClient } from "@supabase/supabase-js"

// Creamos una instancia singleton del cliente de Supabase para el lado del cliente
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  }
  return supabaseClient
}

// Exportamos createClientComponentClient para compatibilidad
export function createClientComponentClient() {
  return getSupabaseClient()
}
