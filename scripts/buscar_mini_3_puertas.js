const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  console.log('🔍 Buscando MINI 3 Puertas en comparador...\n')

  const { data } = await supabase
    .from('comparador_scraper')
    .select('modelo, año, precio, source, estado_anuncio')
    .ilike('modelo', '%3 puertas%')
    .in('estado_anuncio', ['activo', 'nuevo', 'precio_bajado', 'precio_subido'])

  console.log(`Total encontrados: ${data?.length || 0}\n`)

  if (data && data.length > 0) {
    // Agrupar por año
    const porAño = {}
    data.forEach(v => {
      const año = v.año || 'Sin año'
      if (!porAño[año]) porAño[año] = []
      porAño[año].push(v)
    })

    console.log('📊 Distribución por año:')
    Object.keys(porAño).sort().forEach(año => {
      console.log(`   ${año}: ${porAño[año].length} vehículos`)
    })

    console.log('\n📋 Ejemplos (primeros 10):')
    data.slice(0, 10).forEach((v, i) => {
      console.log(`${i + 1}. [${v.source}] ${v.modelo} (${v.año}) - ${v.precio}`)
    })

    // Buscar específicamente del 2023-2025 (±1 año de 2024)
    const años2024 = data.filter(v => {
      const año = parseInt(v.año)
      return año >= 2023 && año <= 2025
    })

    console.log(`\n🎯 MINI 3 Puertas de 2023-2025: ${años2024.length}`)
    if (años2024.length > 0) {
      años2024.slice(0, 5).forEach((v, i) => {
        console.log(`${i + 1}. [${v.source}] ${v.modelo} (${v.año}) - ${v.precio}`)
      })
    }
  }
}

main()

