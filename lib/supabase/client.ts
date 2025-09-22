import { fixCorruptedCookies } from "@/utils/fix-auth"
import { createBrowserClient } from "@supabase/ssr"

// Usamos una variable global para almacenar la instancia del cliente
let supabaseClientInstance: ReturnType<typeof createBrowserClient> | null = null // Renamed to avoid conflict with the other supabaseClient

export function createClientComponentClient() {
  // Variables de entorno con valores por defecto
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wpjmimbscfsdzcwuwctk.supabase.co"
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDIyNTksImV4cCI6MjA2MjIxODI1OX0.ZqP4FGG3_ZBOauHb3l_qhz5ULY2i9Dtwn3JX_hzqUuM"
  
  // Si estamos en el servidor, siempre creamos una nueva instancia
  if (typeof window === "undefined") {
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  }

  // Cookies se manejan automáticamente por Supabase

  // En el cliente, siempre crear una nueva instancia para evitar conflictos de sesión
  // Esto permite múltiples sesiones simultáneas
  return createBrowserClient(
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

export function clearSupabaseClient() {
  if (typeof window !== "undefined") {
    // console.log("Limpiando instancia de Supabase cliente")
    supabaseClientInstance = null
  }
}

// Exportación adicional para compatibilidad
export const createClient = createClientComponentClient
