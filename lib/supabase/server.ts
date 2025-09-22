import { cookies } from "next/headers"
import { createServerClient as createServerClientOriginal, type CookieOptions } from "@supabase/ssr"

/**
 * Función para obtener cookie de forma segura con parsing automático
 */
function safeGetCookie(cookieStore: any, name: string): string | undefined {
  try {
    const cookie = cookieStore.get(name)
    if (!cookie?.value) return undefined
    
    // Si es base64, mantener el valor original para que Supabase lo maneje
    // Solo loggear para debugging
    if (cookie.value.startsWith("base64-")) {
      console.log(`🔍 Cookie base64 detectada: ${name}`)
    }
    
    return cookie.value
  } catch (error) {
    console.error(`Error obteniendo cookie ${name}:`, error)
    return undefined
  }
}

export async function createServerClient(cookieStore?: any) {
  // Variables de entorno con valores por defecto
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wpjmimbscfsdzcwuwctk.supabase.co"
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDIyNTksImV4cCI6MjA2MjIxODI1OX0.ZqP4FGG3_ZBOauHb3l_qhz5ULY2i9Dtwn3JX_hzqUuM"
  
  // Verificar que las variables de entorno estén configuradas
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('⚠️ Variables de entorno de Supabase no configuradas, usando valores por defecto')
  }
  
  // Si no se proporciona cookieStore, obtenerlo
  if (!cookieStore) {
    cookieStore = await cookies()
  }
  
  return createServerClientOriginal(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return safeGetCookie(cookieStore, name)
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Ignorar errores de cookies que ya han sido enviadas
          // console.error("Error al establecer cookie:", error)
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 })
        } catch (error) {
          // Ignorar errores de cookies que ya han sido enviadas
          // console.error("Error al eliminar cookie:", error)
        }
      },
    },
    auth: {
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  })
}

// Añadir la función createClient como alias de createServerClient
export const createClient = createServerClient

// Añadir la función createServerComponentClient
export async function createServerComponentClient() {
  return createServerClient(await cookies())
}

export const createServerActionClient = createServerClientOriginal
