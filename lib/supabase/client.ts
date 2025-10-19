import { createBrowserClient } from "@supabase/ssr"

// ✅ SIN SINGLETON - Cada llamada crea un cliente completamente FRESCO
export function createClientComponentClient() {
  // Variables de entorno con valores por defecto
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wpjmimbscfsdzcwuwctk.supabase.co"
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDIyNTksImV4cCI6MjA2MjIxODI1OX0.ZqP4FGG3_ZBOauHb3l_qhz5ULY2i9Dtwn3JX_hzqUuM"
  
  // SIEMPRE crear nuevo cliente (sin cache/singleton)
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// clearSupabaseClient ya no es necesario (no hay singleton que limpiar)
export function clearSupabaseClient() {
  // No-op: sin singleton, no hay nada que limpiar
}

// Exportación adicional para compatibilidad
export const createClient = createClientComponentClient
