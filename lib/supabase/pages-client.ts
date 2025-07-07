import { createClient } from "@supabase/supabase-js"

// Cliente de Supabase específico para el Pages Router
export const pagesSupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)
