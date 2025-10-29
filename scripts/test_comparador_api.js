const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

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

async function testAPI() {
  console.log('🧪 Probando la lógica de la API localmente...\n')

  try {
    // Paso 1: Obtener duc_scraper
    console.log('1. Obteniendo datos de duc_scraper...')
    const { data: stockData, error: stockError } = await supabase
      .from('duc_scraper')
      .select('"ID Anuncio", "Matrícula", "Modelo", "Fecha primera matriculación", "KM", "Precio", "Precio vehículo nuevo", "Disponibilidad", "URL"')
      .eq('"Disponibilidad"', 'DISPONIBLE')
      .not('"Modelo"', 'is', null)

    if (stockError) {
      console.error('❌ Error:', stockError.message)
      return
    }

    console.log(`✅ ${stockData.length} vehículos\n`)

    // Paso 2: Transformar datos
    console.log('2. Transformando datos...')
    const stockDataTransformed = stockData.map((v) => {
      const year = parseSpanishDate(v['Fecha primera matriculación'])
      return {
        id: v['ID Anuncio'],
        license_plate: v['Matrícula'],
        model: v['Modelo'],
        year: year ? year.toString() : null,
        km: v['KM'],
        price: v['Precio'],
        original_new_price: v['Precio vehículo nuevo'],
        duc_url: v['URL'],
        cms_url: null
      }
    })

    console.log(`✅ Transformados ${stockDataTransformed.length} vehículos`)
    console.log('Ejemplo:', stockDataTransformed[0])

    // Paso 3: Obtener comparador
    console.log('\n3. Obteniendo datos de comparador_scraper...')
    const { data: comparadorData, error: comparadorError } = await supabase
      .from('comparador_scraper')
      .select('id, source, id_anuncio, modelo, año, km, precio, precio_nuevo, precio_nuevo_original, concesionario, url, dias_publicado, estado_anuncio')
      .in('estado_anuncio', ['activo', 'nuevo', 'precio_bajado', 'precio_subido'])

    if (comparadorError) {
      console.error('❌ Error:', comparadorError.message)
      return
    }

    console.log(`✅ ${comparadorData.length} competidores`)

    // Paso 4: Intentar procesar
    console.log('\n4. Procesando primer vehículo...')
    const vehiculo = stockDataTransformed[0]
    console.log('Vehículo:', vehiculo.model, vehiculo.year)

    // Test de normalización
    const normalizeModel = (modelo) => {
      let normalized = modelo.trim().toLowerCase()
      let base = ''
      let variant = ''
      
      if (/\bi\d\b/.test(normalized)) {
        const match = normalized.match(/\b(i\d+)\s*(\d+|edrive\d+)?/i)
        if (match) {
          base = match[1]
          variant = match[2] || ''
        }
      }
      
      return { base, variant: variant.toLowerCase() }
    }

    const nuestroNorm = normalizeModel(vehiculo.model || '')
    console.log('Normalizado:', nuestroNorm)

    const competidores = comparadorData.filter((comp) => {
      if (!comp.modelo) return false
      const compNorm = normalizeModel(comp.modelo)
      
      if (nuestroNorm.base !== compNorm.base) return false
      
      if (nuestroNorm.variant && compNorm.variant) {
        if (nuestroNorm.variant !== compNorm.variant) return false
      }
      
      if (vehiculo.year && comp.año) {
        const añoNuestro = parseInt(vehiculo.year)
        const añoComp = parseInt(comp.año)
        
        if (!isNaN(añoNuestro) && !isNaN(añoComp)) {
          const diferenciaAños = Math.abs(añoNuestro - añoComp)
          if (diferenciaAños > 1) return false
        }
      }
      
      return true
    })

    console.log(`✅ Encontrados ${competidores.length} competidores para ${vehiculo.model}`)
    if (competidores.length > 0) {
      console.log('Ejemplos:', competidores.slice(0, 3).map(c => `${c.modelo} (${c.año})`))
    }

    console.log('\n✅ La lógica funciona correctamente')
    console.log('El error debe estar en otro lado de la API')

  } catch (error) {
    console.error('❌ Error en el test:', error.message)
    console.error(error.stack)
  }
}

testAPI()

