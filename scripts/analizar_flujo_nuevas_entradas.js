/**
 * Script para analizar el flujo de datos desde DUC hasta nuevas entradas
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function analizarFlujo() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 ANÁLISIS DE FLUJO: DUC → NUEVAS ENTRADAS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    // 1. Contar registros en duc_scraper
    console.log('1️⃣ DUC_SCRAPER (origen de datos):')
    const { count: ducCount, error: ducError } = await supabase
      .from('duc_scraper')
      .select('*', { count: 'exact', head: true })
    
    if (ducError) throw ducError
    console.log(`   Total vehículos en DUC: ${ducCount}`)

    // Ver algunos registros de duc_scraper
    const { data: ducSample } = await supabase
      .from('duc_scraper')
      .select('Matrícula, Modelo, Disponibilidad, "URL foto 9", "URL foto 10"')
      .limit(5)
    
    console.log(`   Muestra de vehículos:`)
    ducSample?.forEach(v => {
      const tieneFotos = v["URL foto 9"] || v["URL foto 10"] ? '✅' : '❌'
      console.log(`   - ${v.Matrícula} | ${v.Modelo} | ${v.Disponibilidad} | Fotos: ${tieneFotos}`)
    })
    console.log('')

    // 2. Contar registros en nuevas_entradas
    console.log('2️⃣ NUEVAS_ENTRADAS (tabla de transporte):')
    const { count: nuevasCount, error: nuevasError } = await supabase
      .from('nuevas_entradas')
      .select('*', { count: 'exact', head: true })
    
    if (nuevasError) throw nuevasError
    console.log(`   Total en nuevas entradas: ${nuevasCount}`)

    // Ver registros recibidos vs no recibidos
    const { count: recibidosCount } = await supabase
      .from('nuevas_entradas')
      .select('*', { count: 'exact', head: true })
      .eq('is_received', true)
    
    const { count: noRecibidosCount } = await supabase
      .from('nuevas_entradas')
      .select('*', { count: 'exact', head: true })
      .eq('is_received', false)

    console.log(`   - Recibidos (is_received=true): ${recibidosCount}`)
    console.log(`   - No recibidos (is_received=false): ${noRecibidosCount}`)

    // Ver algunos registros
    const { data: nuevasSample } = await supabase
      .from('nuevas_entradas')
      .select('license_plate, model, is_received, reception_date, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    console.log(`   Últimas entradas:`)
    nuevasSample?.forEach(v => {
      const status = v.is_received ? '✅ Recibido' : '⏳ Pendiente'
      console.log(`   - ${v.license_plate} | ${v.model} | ${status}`)
    })
    console.log('')

    // 3. Contar registros en stock
    console.log('3️⃣ STOCK (tabla central):')
    const { count: stockCount, error: stockError } = await supabase
      .from('stock')
      .select('*', { count: 'exact', head: true })
    
    if (stockError) throw stockError
    console.log(`   Total en stock: ${stockCount}`)

    const { count: disponiblesCount } = await supabase
      .from('stock')
      .select('*', { count: 'exact', head: true })
      .eq('is_available', true)
    
    console.log(`   - Disponibles: ${disponiblesCount}`)
    console.log('')

    // 4. Contar registros en fotos
    console.log('4️⃣ FOTOS (tabla de fotografía):')
    const { count: fotosCount, error: fotosError } = await supabase
      .from('fotos')
      .select('*', { count: 'exact', head: true })
    
    if (fotosError) throw fotosError
    console.log(`   Total en fotos: ${fotosCount}`)

    const { count: pendientesCount } = await supabase
      .from('fotos')
      .select('*', { count: 'exact', head: true })
      .eq('estado_pintura', 'pendiente')
    
    const { count: completadasCount } = await supabase
      .from('fotos')
      .select('*', { count: 'exact', head: true })
      .eq('photos_completed', true)

    console.log(`   - Pendientes: ${pendientesCount}`)
    console.log(`   - Completadas: ${completadasCount}`)
    console.log('')

    // 5. Análisis del flujo
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔍 DIAGNÓSTICO:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    if (ducCount === 0) {
      console.log('❌ PROBLEMA: No hay vehículos en duc_scraper')
      console.log('   Solución: Ejecutar el scraper de DUC')
    } else if (nuevasCount === 0) {
      console.log('❌ PROBLEMA: Hay vehículos en DUC pero NO en nuevas_entradas')
      console.log('   Posibles causas:')
      console.log('   1. El trigger sync_duc_to_all_tables NO está activo')
      console.log('   2. Los vehículos en DUC no tienen matrícula o modelo')
      console.log('   3. Hay un error en el trigger')
    } else if (noRecibidosCount > 0) {
      console.log(`⚠️  HAY ${noRecibidosCount} vehículos sin recibir en nuevas_entradas`)
      console.log('   Estos NO aparecerán en stock ni fotos hasta marcarlos como recibidos')
      console.log('   Solución: Ir a /dashboard/nuevas-entradas y marcar como recibidos')
    } else {
      console.log('✅ El flujo parece estar funcionando correctamente')
    }

    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 FLUJO ESPERADO:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('1. Scraper DUC → duc_scraper (cada 8h)')
    console.log('2. Trigger automático → nuevas_entradas')
    console.log('   - Si tiene fotos: is_received = true')
    console.log('   - Si NO tiene fotos: is_received = false')
    console.log('3. Usuario marca "recibido" → trigger → stock + fotos')
    console.log('4. Vehículo aparece en stock y fotos pendientes')
    console.log('')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

analizarFlujo()

