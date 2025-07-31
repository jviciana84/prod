import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    console.log("🔍 Iniciando test de autenticación...")
    const supabase = await createClient()
    
    // Test 1: Verificar sesión actual
    console.log("👤 Test 1: Verificando sesión actual...")
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error("❌ Error al obtener sesión:", sessionError)
    } else {
      console.log("✅ Sesión obtenida:", session ? "Usuario autenticado" : "Sin sesión")
    }
    
    // Test 2: Intentar consulta sin autenticación
    console.log("📡 Test 2: Consulta sin autenticación...")
    const { data: anonData, error: anonError } = await supabase
      .from('stock')
      .select('id, license_plate')
      .limit(1)
    
    if (anonError) {
      console.error("❌ Error en consulta anónima:", anonError)
    } else {
      console.log("✅ Consulta anónima exitosa:", anonData?.length || 0, "registros")
    }
    
    // Test 3: Intentar consulta con autenticación
    console.log("🔐 Test 3: Consulta con autenticación...")
    const { data: authData, error: authError } = await supabase
      .from('stock')
      .select('id, license_plate')
      .limit(1)
    
    if (authError) {
      console.error("❌ Error en consulta autenticada:", authError)
    } else {
      console.log("✅ Consulta autenticada exitosa:", authData?.length || 0, "registros")
    }
    
    // Test 4: Verificar configuración de Supabase
    console.log("⚙️ Test 4: Verificando configuración...")
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    return NextResponse.json(
      { 
        status: 'ok', 
        message: 'Authentication tests completed',
        session: session ? "authenticated" : "anonymous",
        anonQuery: anonError ? { error: anonError.message } : { success: true, count: anonData?.length || 0 },
        authQuery: authError ? { error: authError.message } : { success: true, count: authData?.length || 0 },
        config: {
          hasUrl: !!supabaseUrl,
          hasAnonKey: !!supabaseAnonKey,
          urlLength: supabaseUrl?.length || 0,
          keyLength: supabaseAnonKey?.length || 0
        },
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )
    
  } catch (error) {
    console.error("💥 Excepción en test-auth-connection:", error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 