require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function limpiarDuplicados() {
  console.log('\n🧹 LIMPIEZA DE DUPLICADOS EN DUC_SCRAPER\n')
  console.log('='.repeat(80))
  
  // 1. Encontrar duplicados
  const { data: allData } = await supabase
    .from('duc_scraper')
    .select('id, "Matrícula", "Disponibilidad", last_seen_date')
    .not('"Matrícula"', 'is', null)
    .order('"Matrícula"')
  
  const matriculasCount = {}
  const duplicados = {}
  
  allData?.forEach(registro => {
    const matricula = registro['Matrícula']
    if (!matriculasCount[matricula]) {
      matriculasCount[matricula] = []
    }
    matriculasCount[matricula].push(registro)
  })
  
  // Filtrar solo duplicados
  Object.entries(matriculasCount).forEach(([matricula, registros]) => {
    if (registros.length > 1) {
      duplicados[matricula] = registros
    }
  })
  
  console.log(`\n📋 Total registros en duc_scraper: ${allData?.length || 0}`)
  console.log(`🔍 Matrículas únicas: ${Object.keys(matriculasCount).length}`)
  console.log(`⚠️  Matrículas duplicadas: ${Object.keys(duplicados).length}`)
  
  if (Object.keys(duplicados).length > 0) {
    console.log(`\n📝 Duplicados encontrados:`)
    Object.entries(duplicados).slice(0, 10).forEach(([matricula, registros]) => {
      console.log(`\n   • ${matricula} (${registros.length} registros):`)
      registros.forEach((r, i) => {
        console.log(`      ${i + 1}. ${r['Disponibilidad']} (ID: ${r.id.substring(0, 8)}...)`)
      })
    })
    
    // 2. Estrategia: Mantener solo UN registro por matrícula (el primero que encontremos)
    console.log(`\n\n🧹 LIMPIANDO DUPLICADOS...`)
    
    let eliminados = 0
    
    for (const [matricula, registros] of Object.entries(duplicados)) {
      // Ordenar por fecha (más reciente primero) y mantener solo el primero
      const ordenados = registros.sort((a, b) => {
        const dateA = new Date(a.last_seen_date || 0)
        const dateB = new Date(b.last_seen_date || 0)
        return dateB - dateA
      })
      
      // Mantener el primero (más reciente), eliminar el resto
      const aEliminar = ordenados.slice(1)
      
      for (const registro of aEliminar) {
        const { error } = await supabase
          .from('duc_scraper')
          .delete()
          .eq('id', registro.id)
        
        if (!error) {
          eliminados++
        }
      }
    }
    
    console.log(`   ✅ Eliminados ${eliminados} registros duplicados`)
    
    // 3. Verificación
    const { count: finalCount } = await supabase
      .from('duc_scraper')
      .select('*', { count: 'exact', head: true })
    
    console.log(`   📊 Total registros después: ${finalCount || 0}`)
    
  } else {
    console.log('\n✅ No hay duplicados')
  }
  
  console.log('\n')
}

limpiarDuplicados().catch(console.error)

