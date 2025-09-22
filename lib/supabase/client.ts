import { createBrowserClient } from "@supabase/ssr"

// Singleton más robusto para evitar múltiples instancias de Supabase
let supabaseClientInstance: any = null
let isInitializing = false

export function createClientComponentClient() {
  // Variables de entorno con valores por defecto
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wpjmimbscfsdzcwuwctk.supabase.co"
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDIyNTksImV4cCI6MjA2MjIxODI1OX0.ZqP4FGG3_ZBOauHb3l_qhz5ULY2i9Dtwn3JX_hzqUuM"
  
  // Si estamos en el servidor, siempre creamos una nueva instancia
  if (typeof window === "undefined") {
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  }

  // En el cliente, usar singleton más robusto
  if (!supabaseClientInstance && !isInitializing) {
    isInitializing = true
    console.log("🔧 Creando nueva instancia de Supabase client (singleton)")
    
    try {
      supabaseClientInstance = createBrowserClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          auth: {
            detectSessionInUrl: true,
            flowType: "pkce",
            persistSession: true,
            autoRefreshToken: true,
            refreshTokenThreshold: 300, // Refrescar 5 minutos antes de expirar
            storage: undefined, // Usar cookies por defecto
            debug: process.env.NODE_ENV === 'development',
            onError: (event, session) => {
              console.error('Supabase Auth Error:', event, session)
              if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
                console.log('🔄 Sesión actualizada, recargando datos...')
              }
            }
          }
        }
      )
      
      // Marcar la instancia como inicializada
      if (supabaseClientInstance) {
        console.log("✅ Instancia de Supabase client creada exitosamente")
      }
    } catch (error) {
      console.error("❌ Error creando instancia de Supabase client:", error)
      supabaseClientInstance = null
    } finally {
      isInitializing = false
    }
  }

  // Si ya existe una instancia, devolverla
  if (supabaseClientInstance) {
    return supabaseClientInstance
  }

  // Fallback: crear una instancia básica si el singleton falla
  console.warn("⚠️ Fallback: creando instancia básica de Supabase client")
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
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
