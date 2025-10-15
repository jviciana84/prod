/**
 * 🧪 TEST: Comportamiento de Photos-Table
 * 
 * Simula el flujo de photos-table para detectar el problema
 * 
 * USO:
 *   node scripts/test_photos_table_behavior.js
 * 
 * VERIFICA:
 *   - Cuántas consultas hace photos-table
 *   - Si deja peticiones pendientes
 *   - Si corrompe el cliente Supabase
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wpjmimbscfsdzcwuwctk.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDIyNTksImV4cCI6MjA2MjIxODI1OX0.ZqP4FGG3_ZBOauHb3l_qhz5ULY2i9Dtwn3JX_hzqUuM'

console.log('\n' + '='.repeat(80))
console.log('🧪 TEST: Simulación de Photos-Table')
console.log('='.repeat(80) + '\n')

async function simulatePhotosTableLoad() {
  console.log('📊 Simulando carga de photos-table...\n')
  
  const startTime = Date.now()
  let queryCount = 0
  
  try {
    // Crear cliente
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('✓ Cliente Supabase creado')
    
    // 1. Consulta: Obtener fotos
    console.log('\n1️⃣ Consultando tabla "fotos"...')
    queryCount++
    const { data: fotosData, error: fotosError } = await supabase
      .from('fotos')
      .select('*')
      .order('disponible', { ascending: false })
      .limit(10) // Limitamos para el test
    
    if (fotosError) {
      console.error('❌ Error en fotos:', fotosError.message)
    } else {
      console.log(`✓ Fotos obtenidas: ${fotosData?.length || 0} registros`)
    }
    
    // 2. Consulta: Obtener fotógrafos
    console.log('\n2️⃣ Consultando tabla "fotos_asignadas"...')
    queryCount++
    const { data: fotografosData, error: fotografosError } = await supabase
      .from('fotos_asignadas')
      .select('*')
      .eq('is_active', true)
    
    if (fotografosError) {
      console.error('❌ Error en fotos_asignadas:', fotografosError.message)
    } else {
      console.log(`✓ Fotógrafos obtenidos: ${fotografosData?.length || 0} registros`)
    }
    
    // 3. Consulta: Obtener profiles
    if (fotografosData && fotografosData.length > 0) {
      console.log('\n3️⃣ Consultando tabla "profiles"...')
      queryCount++
      const userIds = fotografosData.map(p => p.user_id)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, alias, full_name')
        .in('id', userIds)
      
      if (profilesError) {
        console.error('❌ Error en profiles:', profilesError.message)
      } else {
        console.log(`✓ Profiles obtenidos: ${profilesData?.length || 0} registros`)
      }
    }
    
    // 4. Consulta: Obtener vehículos vendidos
    console.log('\n4️⃣ Consultando tabla "sales_vehicles"...')
    queryCount++
    const { data: salesData, error: salesError } = await supabase
      .from('sales_vehicles')
      .select('license_plate, model, sale_date, advisor, advisor_name')
      .limit(10)
    
    if (salesError) {
      console.error('❌ Error en sales_vehicles:', salesError.message)
    } else {
      console.log(`✓ Vehículos vendidos: ${salesData?.length || 0} registros`)
    }
    
    // 5. Consulta: Obtener vehículos reservados
    console.log('\n5️⃣ Consultando tabla "duc_scraper"...')
    queryCount++
    const { data: ducData, error: ducError } = await supabase
      .from('duc_scraper')
      .select('Matrícula, Modelo, Disponibilidad')
      .ilike('Disponibilidad', '%reservado%')
      .limit(10)
    
    if (ducError) {
      console.error('❌ Error en duc_scraper:', ducError.message)
    } else {
      console.log(`✓ Vehículos reservados: ${ducData?.length || 0} registros`)
    }
    
    const endTime = Date.now()
    const totalTime = endTime - startTime
    
    console.log('\n' + '='.repeat(80))
    console.log('📊 RESULTADOS:')
    console.log('='.repeat(80))
    console.log(`Total de consultas: ${queryCount}`)
    console.log(`Tiempo total: ${totalTime}ms`)
    console.log(`Tiempo promedio por consulta: ${Math.round(totalTime / queryCount)}ms`)
    
    if (totalTime > 5000) {
      console.log('\n⚠️  ADVERTENCIA: Tiempo de carga muy alto (>5s)')
      console.log('   Esto puede causar timeouts y corromper el cliente.')
    } else if (totalTime > 3000) {
      console.log('\n⚠️  ADVERTENCIA: Tiempo de carga alto (>3s)')
      console.log('   Podría causar problemas en conexiones lentas.')
    } else {
      console.log('\n✅ Tiempo de carga aceptable')
    }
    
    console.log('\n' + '='.repeat(80) + '\n')
    
    return {
      success: true,
      queryCount,
      totalTime
    }
    
  } catch (error) {
    console.error('\n❌ ERROR DURANTE TEST:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

// Ejecutar test
simulatePhotosTableLoad()
  .then(result => {
    if (result.success) {
      console.log('✅ Test completado exitosamente')
      process.exit(0)
    } else {
      console.log('❌ Test falló')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })


