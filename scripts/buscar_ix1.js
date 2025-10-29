const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  console.log('🔍 Buscando BMW iX1 en comparador...\n')

  const { data } = await supabase
    .from('comparador_scraper')
    .select('modelo, año, precio, source, estado_anuncio, concesionario')
    .ilike('modelo', '%ix1%')
    .in('estado_anuncio', ['activo', 'nuevo', 'precio_bajado', 'precio_subido'])

  console.log(`Total iX1 encontrados: ${data?.length || 0}\n`)

  if (data && data.length > 0) {
    // Agrupar por variante
    const porVariante = {}
    data.forEach(v => {
      let variante = 'Sin especificar'
      if (/edrive20/i.test(v.modelo)) variante = 'eDrive20'
      else if (/xdrive30/i.test(v.modelo)) variante = 'xDrive30'
      
      if (!porVariante[variante]) porVariante[variante] = []
      porVariante[variante].push(v)
    })

    console.log('📊 Distribución por variante:')
    Object.keys(porVariante).forEach(variante => {
      console.log(`   ${variante}: ${porVariante[variante].length} vehículos`)
    })

    console.log('\n📋 Ejemplos de iX1 eDrive20:')
    const edrive20 = data.filter(v => /edrive20/i.test(v.modelo))
    edrive20.slice(0, 10).forEach((v, i) => {
      const isQuadis = v.concesionario && (v.concesionario.toLowerCase().includes('quadis') || v.concesionario.toLowerCase().includes('duc'))
      console.log(`${i + 1}. [${v.source}] ${v.modelo} (${v.año}) - ${v.precio} ${isQuadis ? '🔴 QUADIS (excluido)' : ''}`)
    })

    console.log('\n📋 Ejemplos de iX1 xDrive30:')
    const xdrive30 = data.filter(v => /xdrive30/i.test(v.modelo))
    xdrive30.slice(0, 5).forEach((v, i) => {
      const isQuadis = v.concesionario && (v.concesionario.toLowerCase().includes('quadis') || v.concesionario.toLowerCase().includes('duc'))
      console.log(`${i + 1}. [${v.source}] ${v.modelo} (${v.año}) - ${v.precio} ${isQuadis ? '🔴 QUADIS (excluido)' : ''}`)
    })
  }
}

main()

