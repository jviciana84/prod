/**
 * Script para actualizar precio_nuevo_original en comparador_scraper
 * desde el campo precio_nuevo existente
 */

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

async function main() {
  console.log('🔄 Actualizando precio_nuevo_original en comparador_scraper...\n')

  try {
    // Obtener todos los registros activos
    const { data, error } = await supabase
      .from('comparador_scraper')
      .select('id, precio_nuevo, precio')
      .in('estado_anuncio', ['activo', 'nuevo', 'precio_bajado', 'precio_subido'])

    if (error) {
      console.error('❌ Error:', error.message)
      return
    }

    console.log(`📊 Total de registros: ${data.length}`)

    let updated = 0
    let skipped = 0

    for (const item of data) {
      const precioNuevo = parsePrice(item.precio_nuevo)
      
      if (precioNuevo && precioNuevo > 0) {
        const { error: updateError } = await supabase
          .from('comparador_scraper')
          .update({ precio_nuevo_original: precioNuevo })
          .eq('id', item.id)

        if (!updateError) {
          updated++
          if (updated <= 3) {
            console.log(`   ✅ ID ${item.id}: ${item.precio_nuevo} → ${precioNuevo}`)
          }
        }
      } else {
        skipped++
      }
    }

    console.log(`\n📈 Resultados:`)
    console.log(`   ✅ Actualizados: ${updated}`)
    console.log(`   ⏭️  Omitidos (sin precio_nuevo): ${skipped}`)
    console.log(`\n✅ Proceso completado`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

main()

