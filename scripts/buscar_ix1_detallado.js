const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  console.log('🔍 Análisis detallado de iX1 eDrive20...\n')

  // SIN filtro de estado
  const { data: todos } = await supabase
    .from('comparador_scraper')
    .select('modelo, año, precio, estado_anuncio, concesionario')
    .ilike('modelo', '%ix1%edrive20%')

  console.log(`📊 Total iX1 eDrive20 (sin filtro estado): ${todos?.length || 0}\n`)

  if (todos && todos.length > 0) {
    // Agrupar por estado
    const porEstado = {}
    todos.forEach(v => {
      const estado = v.estado_anuncio || 'sin estado'
      if (!porEstado[estado]) porEstado[estado] = []
      porEstado[estado].push(v)
    })

    console.log('Por estado_anuncio:')
    Object.keys(porEstado).forEach(estado => {
      console.log(`   ${estado}: ${porEstado[estado].length}`)
    })

    // Agrupar por año
    const porAño = {}
    todos.forEach(v => {
      const año = v.año || 'sin año'
      if (!porAño[año]) porAño[año] = []
      porAño[año].push(v)
    })

    console.log('\nPor año:')
    Object.keys(porAño).sort().forEach(año => {
      console.log(`   ${año}: ${porAño[año].length}`)
    })

    // Contar Quadis
    const quadis = todos.filter(v => v.concesionario && (
      v.concesionario.toLowerCase().includes('quadis') || 
      v.concesionario.toLowerCase().includes('duc')
    ))

    console.log(`\n🔴 Vehículos de Quadis (excluidos): ${quadis.length}`)
    console.log(`✅ Competidores reales: ${todos.length - quadis.length}`)

    // Mostrar solo activos y no-Quadis del 2024-2025
    console.log('\n📋 iX1 eDrive20 activos 2024-2025 (NO Quadis):')
    const competidoresReales = todos.filter(v => 
      ['activo', 'nuevo', 'precio_bajado', 'precio_subido'].includes(v.estado_anuncio) &&
      (v.año === '2024' || v.año === '2025') &&
      (!v.concesionario || (!v.concesionario.toLowerCase().includes('quadis') && !v.concesionario.toLowerCase().includes('duc')))
    )

    console.log(`Total: ${competidoresReales.length}\n`)
    competidoresReales.forEach((v, i) => {
      console.log(`${i + 1}. ${v.modelo} (${v.año}) - ${v.precio} - ${v.concesionario || 'Sin concesionario'}`)
    })
  }
}

main()

