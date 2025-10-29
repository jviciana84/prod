/**
 * Script para buscar modelos específicos en comparador_scraper
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  console.log('🔍 Buscando modelos en comparador_scraper...\n')

  // Buscar i4
  console.log('1️⃣ BMW i4:')
  const { data: i4Data } = await supabase
    .from('comparador_scraper')
    .select('modelo, año, precio, estado_anuncio, source')
    .ilike('modelo', '%i4%')
  
  if (i4Data && i4Data.length > 0) {
    console.log(`   ✅ Encontrados: ${i4Data.length}`)
    i4Data.forEach((v, i) => {
      console.log(`   ${i+1}. ${v.modelo} (${v.año}) - ${v.precio} - [${v.source}] ${v.estado_anuncio}`)
    })
  } else {
    console.log('   ❌ No hay BMW i4 en comparador_scraper')
  }

  console.log('\n2️⃣ BMW i7:')
  const { data: i7Data } = await supabase
    .from('comparador_scraper')
    .select('modelo, año, precio, estado_anuncio, source')
    .ilike('modelo', '%i7%')
  
  if (i7Data && i7Data.length > 0) {
    console.log(`   ✅ Encontrados: ${i7Data.length}`)
    i7Data.forEach((v, i) => {
      console.log(`   ${i+1}. ${v.modelo} (${v.año}) - ${v.precio} - [${v.source}] ${v.estado_anuncio}`)
    })
  } else {
    console.log('   ❌ No hay BMW i7 en comparador_scraper')
  }

  console.log('\n3️⃣ Todos los modelos BMW en comparador_scraper:')
  const { data: allBMW } = await supabase
    .from('comparador_scraper')
    .select('modelo')
    .ilike('modelo', '%bmw%')
  
  if (allBMW && allBMW.length > 0) {
    const modelos = [...new Set(allBMW.map(v => v.modelo))].sort()
    console.log(`   Total de modelos únicos: ${modelos.length}`)
    console.log('   Modelos disponibles:')
    modelos.slice(0, 20).forEach(m => console.log(`      - ${m}`))
    if (modelos.length > 20) {
      console.log(`      ... y ${modelos.length - 20} más`)
    }
  }

  console.log('\n4️⃣ Nuestros vehículos en duc_scraper:')
  const { data: ducData } = await supabase
    .from('duc_scraper')
    .select('"Modelo", "Matrícula", "Precio", "Disponibilidad"')
    .eq('"Disponibilidad"', 'DISPONIBLE')
    .limit(10)
  
  if (ducData && ducData.length > 0) {
    console.log(`   Total: ${ducData.length}`)
    const modelosNuestros = [...new Set(ducData.map(v => v.Modelo))].sort()
    console.log('   Modelos en nuestro stock:')
    modelosNuestros.forEach(m => console.log(`      - ${m}`))
  }

  console.log('\n✅ Búsqueda completada')
}

main()

