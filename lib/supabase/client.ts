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

  // Limpiar cookies base64 corruptas ANTES de cualquier operación
  // PERO solo las que sabemos que son corruptas, no todas las cookies base64
  if (typeof window !== "undefined") {
    const cookies = document.cookie.split(';')
    let cleanedCount = 0
    cookies.forEach(cookie => {
      const [name, value] = cookie.trim().split('=')
      if (value && value.startsWith('base64-')) {
        // Solo limpiar cookies base64 que sabemos que causan problemas
        // No limpiar todas las cookies base64 automáticamente
        console.log(`🔍 Cookie base64 detectada: ${name} - manteniendo para que Supabase la maneje`)
      }
    })
  }

  // Si ya existe una instancia, devolverla
  if (supabaseClientInstance) {
    return supabaseClientInstance
  }

  // Si ya se está inicializando, esperar y devolver fallback
  if (isInitializing) {
    console.warn("⚠️ Cliente Supabase ya se está inicializando, usando fallback...")
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  }

  // Crear nueva instancia
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
          // Interceptar el storage para manejar cookies base64
          storage: {
            getItem: (key: string) => {
              try {
                const value = document.cookie
                  .split('; ')
                  .find(row => row.startsWith(`${key}=`))
                  ?.split('=')[1]
                
                if (!value) return null
                
                // Intentar parsear como JSON primero
                try {
                  const parsed = JSON.parse(value)
                  console.log(`✅ Cookie JSON parseada correctamente: ${key}`)
                  return value
                } catch (jsonError) {
                  // Si falla el JSON, podría ser base64
                  if (value.startsWith('base64-')) {
                    try {
                      // Intentar decodificar la cookie base64
                      const decoded = atob(value.substring(6)) // Remover 'base64-' prefix
                      const parsed = JSON.parse(decoded)
                      console.log(`✅ Cookie base64 decodificada correctamente: ${key}`)
                      return decoded
                    } catch (parseError) {
                      // Solo si falla el parsing, limpiar la cookie corrupta
                      console.log(`🧹 Cookie base64 corrupta, limpiando: ${key}`)
                      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
                      return null
                    }
                  } else {
                    // Si no es base64, intentar decodificar como base64 directo
                    try {
                      const decoded = atob(value)
                      const parsed = JSON.parse(decoded)
                      console.log(`✅ Cookie base64 directa decodificada: ${key}`)
                      return decoded
                    } catch (base64Error) {
                      console.log(`⚠️ Cookie no parseable, devolviendo valor original: ${key}`)
                      return value
                    }
                  }
                }
                
                return value
              } catch (error) {
                console.error(`Error obteniendo cookie ${key}:`, error)
                return null
              }
            },
            setItem: (key: string, value: string) => {
              // No hacer nada - dejar que Supabase maneje las cookies
            },
            removeItem: (key: string) => {
              document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
            }
          },
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
