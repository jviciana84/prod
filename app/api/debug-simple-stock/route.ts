import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    console.log("🔍 Iniciando debug simple de stock...")
    const supabase = await createClient()

    // Test 1: Consulta básica sin autenticación
    console.log("📡 Test 1: Consulta básica...")
    const { data: basicData, error: basicError } = await supabase
      .from('stock')
      .select('id, license_plate')
      .limit(1)

    console.log("📊 Test básico resultado:", basicData?.length || 0, "error:", basicError?.message)

    // Test 2: Consulta con count
    console.log("📊 Test 2: Consulta con count...")
    const { count, error: countError } = await supabase
      .from('stock')
      .select('*', { count: 'exact', head: true })

    console.log("📊 Test count resultado:", count, "error:", countError?.message)

    // Test 3: Consulta completa
    console.log("📋 Test 3: Consulta completa...")
    const { data: fullData, error: fullError } = await supabase
      .from('stock')
      .select('*')
      .limit(5)

    console.log("📊 Test completo resultado:", fullData?.length || 0, "error:", fullError?.message)

    // Test 4: Verificar configuración de Supabase
    console.log("⚙️ Test 4: Verificando configuración...")
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    return NextResponse.json(
      {
        status: 'ok',
        message: 'Simple stock debug completed',
        tests: {
          basicQuery: {
            success: !basicError,
            count: basicData?.length || 0,
            error: basicError?.message || null
          },
          countQuery: {
            success: !countError,
            count: count || 0,
            error: countError?.message || null
          },
          fullQuery: {
            success: !fullError,
            count: fullData?.length || 0,
            error: fullError?.message || null
          }
        },
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
    console.error("💥 Excepción en debug-simple-stock:", error)
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