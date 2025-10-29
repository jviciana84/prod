const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const MATRICULA = process.argv[2] || '9594MKL'

function parsePrice(precio) {
  if (!precio) return null
  const cleaned = precio.toString().replace(/[€.\s]/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function parseSpanishDate(fecha) {
  if (!fecha) return null
  try {
    if (fecha.includes('-')) {
      const year = parseInt(fecha.split('-')[0])
      return isNaN(year) ? null : year
    }
    const parts = fecha.split('/').map(p => p.trim())
    if (parts.length === 3) {
      const year = parseInt(parts[2])
      return isNaN(year) ? null : year
    }
    return null
  } catch {
    return null
  }
}

async function main() {
  console.log(`🧪 Test API Real para: ${MATRICULA}\n`)

  // Simular exactamente lo que hace la API
  const { data: ducData } = await supabase
    .from('duc_scraper')
    .select('"ID Anuncio", "Matrícula", "Modelo", "Versión", "Fecha primera matriculación", "KM", "Precio", "Precio vehículo nuevo"')
    .eq('"Matrícula"', MATRICULA)
    .single()

  if (!ducData) {
    console.log('❌ No encontrado')
    return
  }

  // Combinar Modelo + Versión (como en la API)
  let modeloCompleto = ducData['Modelo']
  if (ducData['Versión']) {
    const versionMatch = ducData['Versión'].match(/([ex]?Drive\d+|M\d+|\d{3}[a-z]+)/i)
    if (versionMatch) {
      modeloCompleto = `${ducData['Modelo']} ${versionMatch[1]}`
    } else {
      modeloCompleto = `${ducData['Modelo']} ${ducData['Versión'].split(' ')[0]}`
    }
  }

  const year = parseSpanishDate(ducData['Fecha primera matriculación'])

  console.log('📋 DATOS TRANSFORMADOS (como API):')
  console.log(`   Modelo original: "${ducData['Modelo']}"`)
  console.log(`   Versión: "${ducData['Versión']}"`)
  console.log(`   → Modelo completo: "${modeloCompleto}"`)
  console.log(`   Año: ${year}`)
  console.log(`   Precio: ${ducData['Precio']}`)
  console.log(`   Precio nuevo: ${ducData['Precio vehículo nuevo']}`)

  console.log('\n✅ Ahora el modelo completo se usará en el comparador')
  console.log('   La página debería mostrar competidores correctos')
}

main()

