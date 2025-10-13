require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verificacionFinal() {
  console.log('\n📊 VERIFICACIÓN FINAL DEL SISTEMA DE STOCK\n')
  console.log('='.repeat(80))
  
  // 1. DUC_SCRAPER
  console.log('\n1️⃣ ESTADO DE DUC_SCRAPER:')
  
  const { count: totalDuc } = await supabase
    .from('duc_scraper')
    .select('*', { count: 'exact', head: true })
  
  const { data: disponibilidad } = await supabase
    .from('duc_scraper')
    .select('"Disponibilidad"')
  
  const disponibles = disponibilidad?.filter(d => 
    d['Disponibilidad']?.toUpperCase().includes('DISPONIBLE')
  ).length || 0
  
  const reservados = disponibilidad?.filter(d => 
    d['Disponibilidad']?.toUpperCase().includes('RESERVADO')
  ).length || 0
  
  const vendidos = disponibilidad?.filter(d => 
    d['Disponibilidad']?.toUpperCase().includes('VENDIDO')
  ).length || 0
  
  console.log(`   Total registros: ${totalDuc || 0}`)
  console.log(`   ├─ DISPONIBLES: ${disponibles}`)
  console.log(`   ├─ RESERVADOS: ${reservados}`)
  console.log(`   └─ VENDIDOS: ${vendidos}`)
  
  // 2. STOCK
  console.log('\n2️⃣ ESTADO DEL STOCK:')
  
  const { data: allStock } = await supabase
    .from('stock')
    .select('id, license_plate, is_sold')
  
  const stockVendidos = allStock?.filter(s => s.is_sold === true).length || 0
  const stockDisponibles = allStock?.filter(s => s.is_sold === false || s.is_sold === null).length || 0
  
  console.log(`   Total vehículos: ${allStock?.length || 0}`)
  console.log(`   ├─ Vendidos (is_sold = true): ${stockVendidos}`)
  console.log(`   └─ Disponibles (is_sold = false/null): ${stockDisponibles}`)
  
  // 3. SINCRONIZACIÓN RESERVADOS
  console.log('\n3️⃣ SINCRONIZACIÓN - VEHÍCULOS RESERVADOS:')
  
  const { data: reservadosData } = await supabase
    .from('duc_scraper')
    .select('"Matrícula", "Modelo"')
    .ilike('"Disponibilidad"', '%reservado%')
    .not('"Matrícula"', 'is', null)
  
  const reservadosSet = new Set(
    reservadosData?.map(v => v['Matrícula']?.toUpperCase().replace(/\s+/g, '').trim())
  )
  
  const enStock = []
  const malSincronizados = []
  
  for (const v of reservadosData || []) {
    const matricula = v['Matrícula']?.toUpperCase().replace(/\s+/g, '').trim()
    const stockItem = allStock?.find(
      s => s.license_plate?.toUpperCase().replace(/\s+/g, '').trim() === matricula
    )
    
    if (stockItem) {
      enStock.push({ ...v, stockItem })
      if (stockItem.is_sold !== true) {
        malSincronizados.push({ ...v, stockItem })
      }
    }
  }
  
  console.log(`   Total RESERVADOS en CSV: ${reservados}`)
  console.log(`   En stock: ${enStock.length}`)
  
  if (malSincronizados.length > 0) {
    console.log(`   ❌ Mal sincronizados: ${malSincronizados.length}`)
    malSincronizados.forEach(v => {
      console.log(`      • ${v['Matrícula']} (is_sold: ${v.stockItem.is_sold})`)
    })
  } else {
    console.log(`   ✅ Todos correctamente sincronizados (is_sold = true)`)
  }
  
  // 4. SINCRONIZACIÓN DISPONIBLES
  console.log('\n4️⃣ SINCRONIZACIÓN - VEHÍCULOS DISPONIBLES:')
  
  const { data: disponiblesData } = await supabase
    .from('duc_scraper')
    .select('"Matrícula", "Modelo"')
    .ilike('"Disponibilidad"', '%disponible%')
    .not('"Matrícula"', 'is', null)
  
  const disponiblesEnStock = []
  const disponiblesMalMarcados = []
  
  for (const v of disponiblesData || []) {
    const matricula = v['Matrícula']?.toUpperCase().replace(/\s+/g, '').trim()
    const stockItem = allStock?.find(
      s => s.license_plate?.toUpperCase().replace(/\s+/g, '').trim() === matricula
    )
    
    if (stockItem) {
      disponiblesEnStock.push({ ...v, stockItem })
      if (stockItem.is_sold === true) {
        disponiblesMalMarcados.push({ ...v, stockItem })
      }
    }
  }
  
  console.log(`   Total DISPONIBLES en CSV: ${disponibles}`)
  console.log(`   En stock: ${disponiblesEnStock.length}`)
  
  if (disponiblesMalMarcados.length > 0) {
    console.log(`   ❌ Mal marcados (is_sold = true): ${disponiblesMalMarcados.length}`)
    disponiblesMalMarcados.forEach(v => {
      console.log(`      • ${v['Matrícula']}`)
    })
  } else {
    console.log(`   ✅ Todos correctamente sincronizados (is_sold = false/null)`)
  }
  
  // 5. RESUMEN FINAL
  console.log('\n\n📋 RESUMEN FINAL DEL SISTEMA:')
  console.log('='.repeat(80))
  console.log(`\n📊 DUC_SCRAPER (CSV):`)
  console.log(`   ✅ ${totalDuc || 0} vehículos importados`)
  console.log(`   • ${disponibles} DISPONIBLES`)
  console.log(`   • ${reservados} RESERVADOS`)
  console.log(`   • ${vendidos} VENDIDOS`)
  
  console.log(`\n📦 STOCK:`)
  console.log(`   ✅ ${allStock?.length || 0} vehículos total`)
  console.log(`   • ${stockDisponibles} disponibles`)
  console.log(`   • ${stockVendidos} vendidos`)
  
  console.log(`\n🔄 SINCRONIZACIÓN:`)
  if (malSincronizados.length === 0 && disponiblesMalMarcados.length === 0) {
    console.log(`   ✅ PERFECTA - 100% sincronizado`)
  } else {
    console.log(`   ⚠️  Problemas encontrados:`)
    if (malSincronizados.length > 0) {
      console.log(`      • ${malSincronizados.length} RESERVADOS mal sincronizados`)
    }
    if (disponiblesMalMarcados.length > 0) {
      console.log(`      • ${disponiblesMalMarcados.length} DISPONIBLES mal marcados`)
    }
  }
  
  console.log('\n')
}

verificacionFinal().catch(console.error)

