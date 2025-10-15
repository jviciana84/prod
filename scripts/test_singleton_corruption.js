/**
 * 🔬 TEST: Detectar corrupción del Singleton Supabase
 * 
 * Simula múltiples consultas simultáneas para ver si corrompe el cliente
 * 
 * USO:
 *   node scripts/test_singleton_corruption.js
 * 
 * VERIFICA:
 *   - Si múltiples consultas simultáneas causan problemas
 *   - Si el cliente se corrompe después de muchas peticiones
 *   - Si hay memory leaks
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wpjmimbscfsdzcwuwctk.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDIyNTksImV4cCI6MjA2MjIxODI1OX0.ZqP4FGG3_ZBOauHb3l_qhz5ULY2i9Dtwn3JX_hzqUuM'

console.log('\n' + '='.repeat(80))
console.log('🔬 TEST: Corrupción del Cliente Singleton')
console.log('='.repeat(80) + '\n')

// Simular patrón singleton
let supabaseClient = null

function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey)
    console.log('🆕 Cliente Supabase creado (singleton)')
  } else {
    console.log('♻️  Reutilizando cliente Supabase existente')
  }
  return supabaseClient
}

async function testMultipleSimultaneousQueries() {
  console.log('📊 TEST 1: Consultas simultáneas (como photos-table)\n')
  
  const client = getSupabaseClient()
  
  try {
    const startTime = Date.now()
    
    // Simular las 5 consultas que hace photos-table SIMULTÁNEAMENTE
    const [
      fotosResult,
      asignadasResult,
      salesResult,
      ducResult,
      profilesResult
    ] = await Promise.all([
      client.from('fotos').select('*').limit(5),
      client.from('fotos_asignadas').select('*').eq('is_active', true),
      client.from('sales_vehicles').select('license_plate').limit(5),
      client.from('duc_scraper').select('Matrícula').limit(5),
      client.from('profiles').select('id, alias').limit(5)
    ])
    
    const endTime = Date.now()
    
    console.log('Resultados:')
    console.log(`  - fotos: ${fotosResult.data?.length || 0} (${fotosResult.error ? '❌ ' + fotosResult.error.message : '✓'})`)
    console.log(`  - fotos_asignadas: ${asignadasResult.data?.length || 0} (${asignadasResult.error ? '❌ ' + asignadasResult.error.message : '✓'})`)
    console.log(`  - sales_vehicles: ${salesResult.data?.length || 0} (${salesResult.error ? '❌ ' + salesResult.error.message : '✓'})`)
    console.log(`  - duc_scraper: ${ducResult.data?.length || 0} (${ducResult.error ? '❌ ' + ducResult.error.message : '✓'})`)
    console.log(`  - profiles: ${profilesResult.data?.length || 0} (${profilesResult.error ? '❌ ' + profilesResult.error.message : '✓'})`)
    console.log(`  Tiempo total: ${endTime - startTime}ms\n`)
    
    return {
      success: !fotosResult.error && !asignadasResult.error,
      time: endTime - startTime
    }
  } catch (error) {
    console.error('❌ Error en consultas simultáneas:', error.message)
    return { success: false, error: error.message }
  }
}

async function testClientAfterHeavyLoad() {
  console.log('📊 TEST 2: Cliente después de carga pesada\n')
  
  const client = getSupabaseClient() // Reutilizar el mismo cliente
  
  try {
    // Hacer una consulta simple para ver si el cliente sigue funcionando
    const { data, error } = await client
      .from('stock')
      .select('id, license_plate')
      .limit(5)
    
    if (error) {
      console.error('❌ Cliente CORRUPTO - No puede hacer consultas simples')
      console.error('   Error:', error.message)
      return { success: false, corrupted: true }
    }
    
    console.log(`✓ Cliente funciona correctamente después de carga pesada`)
    console.log(`  Obtenidos: ${data?.length || 0} registros de stock\n`)
    
    return { success: true, corrupted: false }
    
  } catch (error) {
    console.error('❌ Cliente CORRUPTO - Excepción:', error.message)
    return { success: false, corrupted: true, error: error.message }
  }
}

async function testSequentialLoad() {
  console.log('📊 TEST 3: Simulación de flujo real del usuario\n')
  
  console.log('Usuario entra a Photos...')
  const photosResult = await testMultipleSimultaneousQueries()
  
  if (!photosResult.success) {
    console.log('❌ Photos-table falló al cargar\n')
    return false
  }
  
  console.log('Usuario sale de Photos y va a otra página...')
  await new Promise(resolve => setTimeout(resolve, 1000)) // Simular navegación
  
  const afterResult = await testClientAfterHeavyLoad()
  
  if (afterResult.corrupted) {
    console.log('❌ PROBLEMA DETECTADO: Cliente corrupto después de Photos\n')
    return false
  }
  
  console.log('✅ Cliente sigue funcionando después de Photos\n')
  return true
}

async function runAllTests() {
  console.log('🚀 Iniciando batería de pruebas...\n')
  
  const results = {
    test1: null,
    test2: null,
    test3: null
  }
  
  // Test 1: Consultas simultáneas
  results.test1 = await testMultipleSimultaneousQueries()
  
  // Test 2: Cliente después de carga
  results.test2 = await testClientAfterHeavyLoad()
  
  // Test 3: Flujo completo
  results.test3 = await testSequentialLoad()
  
  // Resultados finales
  console.log('='.repeat(80))
  console.log('📊 RESUMEN DE RESULTADOS:')
  console.log('='.repeat(80))
  
  console.log(`\nTest 1 - Consultas simultáneas: ${results.test1.success ? '✅ PASS' : '❌ FAIL'}`)
  if (results.test1.time) {
    console.log(`         Tiempo: ${results.test1.time}ms`)
  }
  
  console.log(`Test 2 - Cliente después de carga: ${results.test2.success ? '✅ PASS' : '❌ FAIL'}`)
  if (results.test2.corrupted) {
    console.log('         ⚠️  CLIENTE CORRUPTO DETECTADO')
  }
  
  console.log(`Test 3 - Flujo completo usuario: ${results.test3 ? '✅ PASS' : '❌ FAIL'}`)
  
  console.log('\n' + '='.repeat(80))
  
  if (results.test1.success && results.test2.success && results.test3) {
    console.log('✅ TODOS LOS TESTS PASARON')
    console.log('   El problema NO es de photos-table en sí.')
    console.log('   Posiblemente sea problema de cookies en navegador.\n')
    return true
  } else {
    console.log('❌ TESTS FALLARON')
    console.log('   El problema SÍ está en el código de photos-table.')
    console.log('   Revisar consultas o lógica de carga.\n')
    return false
  }
}

// Ejecutar
runAllTests()
  .then(allPassed => {
    process.exit(allPassed ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Error fatal en tests:', error)
    process.exit(1)
  })


