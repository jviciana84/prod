import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    console.log("🔍 Iniciando debug de conexión a stock...")
    const supabase = await createClient()
    
    // Test 1: Verificar conexión básica
    console.log("📡 Test 1: Verificando conexión básica...")
    const { data: testData, error: testError } = await supabase
      .from('stock')
      .select('id')
      .limit(1)
    
    if (testError) {
      console.error("❌ Error en test básico:", testError)
      return NextResponse.json(
        { 
          error: 'Basic connection failed', 
          details: testError.message,
          code: testError.code,
          hint: testError.hint
        },
        { status: 500 }
      )
    }
    
    console.log("✅ Test básico exitoso")
    
    // Test 2: Contar registros
    console.log("📊 Test 2: Contando registros...")
    const { count, error: countError } = await supabase
      .from('stock')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error("❌ Error al contar registros:", countError)
      return NextResponse.json(
        { 
          error: 'Count query failed', 
          details: countError.message,
          code: countError.code
        },
        { status: 500 }
      )
    }
    
    console.log("✅ Conteo exitoso:", count, "registros")
    
    // Test 3: Obtener algunos registros de muestra
    console.log("📋 Test 3: Obteniendo registros de muestra...")
    const { data: sampleData, error: sampleError } = await supabase
      .from('stock')
      .select('id, license_plate, model, created_at')
      .limit(5)
      .order('created_at', { ascending: false })
    
    if (sampleError) {
      console.error("❌ Error al obtener muestra:", sampleError)
      return NextResponse.json(
        { 
          error: 'Sample query failed', 
          details: sampleError.message,
          code: sampleError.code
        },
        { status: 500 }
      )
    }
    
    console.log("✅ Muestra obtenida:", sampleData?.length || 0, "registros")
    
    return NextResponse.json(
      { 
        status: 'ok', 
        message: 'All tests passed',
        recordCount: count || 0,
        sampleData: sampleData || [],
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )
    
  } catch (error) {
    console.error("💥 Excepción en debug-stock-connection:", error)
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