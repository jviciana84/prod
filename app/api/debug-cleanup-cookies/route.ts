import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    console.log("🧹 === LIMPIEZA DE COOKIES ===")
    
    const cookieStore = await cookies()
    
    // Obtener todas las cookies
    const allCookies = cookieStore.getAll()
    console.log("📋 Cookies encontradas:", allCookies.length)
    
    // Buscar cookies problemáticas de Supabase
    const supabaseCookies = allCookies.filter(cookie => 
      cookie.name.includes('supabase') || 
      cookie.name.includes('sb-') ||
      cookie.value.startsWith('base64-')
    )
    
    console.log("🔍 Cookies de Supabase encontradas:", supabaseCookies.length)
    
    // Crear respuesta con headers para limpiar cookies
    const response = NextResponse.json({ 
      success: true, 
      message: "Cookies limpiadas",
      cookiesFound: allCookies.length,
      supabaseCookies: supabaseCookies.length,
      cleanupInstructions: [
        "1. Cierra todas las pestañas del navegador",
        "2. Limpia el caché del navegador",
        "3. Vuelve a abrir la aplicación",
        "4. Inicia sesión nuevamente"
      ]
    })
    
    // Limpiar cookies problemáticas
    supabaseCookies.forEach(cookie => {
      console.log("🗑️ Limpiando cookie:", cookie.name)
      response.cookies.delete(cookie.name)
    })
    
    // También limpiar cookies comunes de Supabase
    const commonSupabaseCookies = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'supabase-auth-refresh-token'
    ]
    
    commonSupabaseCookies.forEach(cookieName => {
      response.cookies.delete(cookieName)
    })
    
    console.log("✅ Limpieza de cookies completada")
    
    return response
    
  } catch (error) {
    console.error("❌ Error limpiando cookies:", error)
    return NextResponse.json({ 
      error: "Error limpiando cookies", 
      details: error.message 
    }, { status: 500 })
  }
} 