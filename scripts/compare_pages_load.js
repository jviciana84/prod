/**
 * 📊 COMPARATIVA: Carga de diferentes páginas
 * 
 * Compara cuántas consultas hace cada página principal
 * para identificar cuál es más pesada
 * 
 * USO:
 *   node scripts/compare_pages_load.js
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wpjmimbscfsdzcwuwctk.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDIyNTksImV4cCI6MjA2MjIxODI1OX0.ZqP4FGG3_ZBOauHb3l_qhz5ULY2i9Dtwn3JX_hzqUuM'

console.log('\n' + '='.repeat(80))
console.log('📊 COMPARATIVA DE CARGA DE PÁGINAS')
console.log('='.repeat(80) + '\n')

async function simulateStockTableLoad(supabase) {
  const start = Date.now()
  let queries = 0
  
  // Stock-table hace:
  queries++ // 1. Consulta stock
  await supabase.from('stock').select('*').limit(5)
  
  queries++ // 2. Consulta fotos para photo status
  await supabase.from('fotos').select('license_plate, photos_completed, estado_pintura').limit(5)
  
  queries++ // 3. Consulta expense_types
  await supabase.from('expense_types').select('id, name').limit(10)
  
  const time = Date.now() - start
  return { page: 'Vehículos/Stock', queries, time }
}

async function simulatePhotosTableLoad(supabase) {
  const start = Date.now()
  let queries = 0
  
  // Photos-table hace:
  queries++ // 1. Fotos
  await supabase.from('fotos').select('*').limit(5)
  
  queries++ // 2. Fotógrafos
  await supabase.from('fotos_asignadas').select('*').eq('is_active', true)
  
  queries++ // 3. Profiles
  await supabase.from('profiles').select('id, alias, full_name').limit(5)
  
  queries++ // 4. Sales
  await supabase.from('sales_vehicles').select('license_plate').limit(5)
  
  queries++ // 5. DUC
  await supabase.from('duc_scraper').select('Matrícula').limit(5)
  
  const time = Date.now() - start
  return { page: 'Fotos', queries, time }
}

async function simulateSalesTableLoad(supabase) {
  const start = Date.now()
  let queries = 0
  
  // Sales-table hace:
  queries++ // 1. Consulta sales_vehicles
  await supabase.from('sales_vehicles').select('*').limit(5)
  
  const time = Date.now() - start
  return { page: 'Ventas', queries, time }
}

async function simulateEntregasTableLoad(supabase) {
  const start = Date.now()
  let queries = 0
  
  // Entregas-table hace:
  queries++ // 1. Consulta entregas
  await supabase.from('entregas').select('*').limit(5)
  
  const time = Date.now() - start
  return { page: 'Entregas', queries, time }
}

async function runComparison() {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log('Ejecutando simulación de cada página...\n')
  
  const results = []
  
  // Simular cada página
  results.push(await simulateStockTableLoad(supabase))
  results.push(await simulatePhotosTableLoad(supabase))
  results.push(await simulateSalesTableLoad(supabase))
  results.push(await simulateEntregasTableLoad(supabase))
  
  // Mostrar resultados
  console.log('='.repeat(80))
  console.log('PÁGINA                  | CONSULTAS | TIEMPO    | PROMEDIO/CONSULTA')
  console.log('='.repeat(80))
  
  results.forEach(result => {
    const avg = Math.round(result.time / result.queries)
    const pageFormatted = result.page.padEnd(23)
    const queriesFormatted = String(result.queries).padEnd(9)
    const timeFormatted = `${result.time}ms`.padEnd(9)
    const avgFormatted = `${avg}ms`
    
    console.log(`${pageFormatted} | ${queriesFormatted} | ${timeFormatted} | ${avgFormatted}`)
  })
  
  console.log('='.repeat(80))
  
  // Identificar la más pesada
  const heaviest = results.reduce((prev, current) => 
    current.queries > prev.queries ? current : prev
  )
  
  console.log(`\n🔴 Página más pesada: ${heaviest.page}`)
  console.log(`   ${heaviest.queries} consultas, ${heaviest.time}ms total\n`)
  
  if (heaviest.page === 'Fotos' && heaviest.queries >= 5) {
    console.log('⚠️  HALLAZGO: Fotos hace significativamente MÁS consultas que otras páginas')
    console.log('   Esto podría saturar el cliente Supabase singleton.')
    console.log('   Recomendación: Optimizar o hacer consultas secuenciales.\n')
  }
  
  // Test adicional: ¿Cliente sigue funcionando?
  console.log('📊 Verificando estado del cliente después de todas las simulaciones...')
  const { data, error } = await supabase.from('stock').select('id').limit(1)
  
  if (error) {
    console.log('❌ CLIENTE CORRUPTO - No funciona después de consultas pesadas')
    console.log(`   Error: ${error.message}\n`)
    return false
  } else {
    console.log('✅ Cliente sigue funcionando correctamente\n')
    return true
  }
}

runComparison()
  .then(success => {
    if (success) {
      console.log('✅ Comparativa completada')
      process.exit(0)
    } else {
      console.log('❌ Se detectó corrupción del cliente')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('💥 Error:', error)
    process.exit(1)
  })


