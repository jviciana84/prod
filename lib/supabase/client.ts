import { createBrowserClient } from "@supabase/ssr"

// Singleton para evitar múltiples instancias de Supabase
let supabaseClientInstance: any = null

export function createClientComponentClient() {
  // Variables de entorno con valores por defecto
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wpjmimbscfsdzcwuwctk.supabase.co"
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDIyNTksImV4cCI6MjA2MjIxODI1OX0.ZqP4FGG3_ZBOauHb3l_qhz5ULY2i9Dtwn3JX_hzqUuM"
  
  // Si estamos en el servidor, siempre creamos una nueva instancia
  if (typeof window === "undefined") {
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  }

  // En el cliente, usar singleton para evitar múltiples instancias
  if (!supabaseClientInstance) {
    console.log("🔧 Creando nueva instancia de Supabase client")
    supabaseClientInstance = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        detectSessionInUrl: true,
        flowType: "pkce",
        // Permitir múltiples sesiones
        persistSession: true,
        autoRefreshToken: true,
        // Configuración de refresh más agresiva
        refreshTokenThreshold: 300, // Refrescar 5 minutos antes de expirar
        // Usar cookies para estar sincronizado con el middleware
        storage: undefined, // Usar cookies por defecto
        // Configuración adicional para producción
        debug: process.env.NODE_ENV === 'development',
        // Manejo de errores más robusto
        onError: (event, session) => {
          console.error('Supabase Auth Error:', event, session)
          // Si hay error de sesión, intentar recuperar
          if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
            console.log('🔄 Sesión actualizada, recargando datos...')
          }
        }
      }
    }
    )
  }

  return supabaseClientInstance
}


// Función para limpiar la instancia (útil para logout)
export function clearSupabaseClient() {
  if (typeof window !== "undefined") {
    console.log("🗑️ Limpiando instancia de Supabase client")
    supabaseClientInstance = null
  }
}

// Exportación adicional para compatibilidad
export const createClient = createClientComponentClient
