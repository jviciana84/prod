import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    console.log("🔍 Iniciando debug de RLS en tabla stock...")
    const supabase = await createClient()

    // Test 1: Verificar si RLS está habilitado
    console.log("📋 Test 1: Verificando RLS...")
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('check_rls_status', { table_name: 'stock' })
      .single()

    if (rlsError) {
      console.log("⚠️ No se pudo verificar RLS directamente, continuando con otros tests...")
    } else {
      console.log("✅ RLS status:", rlsData)
    }

    // Test 2: Intentar consulta como usuario anónimo
    console.log("👤 Test 2: Consulta como anónimo...")
    const { data: anonData, error: anonError } = await supabase
      .from('stock')
      .select('id, license_plate')
      .limit(1)

    console.log("📊 Test anónimo resultado:", anonData?.length || 0, "error:", anonError?.message)

    // Test 3: Intentar consulta como usuario autenticado
    console.log("🔐 Test 3: Consulta como autenticado...")
    const { data: authData, error: authError } = await supabase
      .from('stock')
      .select('id, license_plate')
      .limit(1)

    console.log("📊 Test autenticado resultado:", authData?.length || 0, "error:", authError?.message)

    // Test 4: Verificar políticas RLS existentes
    console.log("📋 Test 4: Verificando políticas RLS...")
    const { data: policiesData, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'stock' })

    if (policiesError) {
      console.log("⚠️ No se pudieron obtener políticas:", policiesError.message)
    } else {
      console.log("✅ Políticas encontradas:", policiesData?.length || 0)
    }

    // Test 5: Verificar permisos de tabla
    console.log("🔐 Test 5: Verificando permisos...")
    const { data: permissionsData, error: permissionsError } = await supabase
      .rpc('check_table_permissions', { table_name: 'stock' })

    if (permissionsError) {
      console.log("⚠️ No se pudieron verificar permisos:", permissionsError.message)
    } else {
      console.log("✅ Permisos verificados:", permissionsData)
    }

    return NextResponse.json(
      {
        status: 'ok',
        message: 'RLS debug completed',
        tests: {
          anonQuery: {
            success: !anonError,
            count: anonData?.length || 0,
            error: anonError?.message || null
          },
          authQuery: {
            success: !authError,
            count: authData?.length || 0,
            error: authError?.message || null
          },
          policies: {
            success: !policiesError,
            count: policiesData?.length || 0,
            error: policiesError?.message || null
          },
          permissions: {
            success: !permissionsError,
            data: permissionsData,
            error: permissionsError?.message || null
          }
        },
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("💥 Excepción en debug-rls-stock:", error)
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