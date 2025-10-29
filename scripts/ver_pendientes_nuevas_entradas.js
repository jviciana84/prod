/**
 * Ver los vehículos pendientes en nuevas_entradas
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verPendientes() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('⏳ VEHÍCULOS PENDIENTES EN NUEVAS ENTRADAS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    const { data: pendientes, error } = await supabase
      .from('nuevas_entradas')
      .select('*')
      .eq('is_received', false)
      .order('created_at', { ascending: false })
    
    if (error) throw error

    if (!pendientes || pendientes.length === 0) {
      console.log('✅ No hay vehículos pendientes')
      return
    }

    console.log(`Total: ${pendientes.length} vehículos\n`)

    pendientes.forEach((v, i) => {
      console.log(`${i + 1}. Matrícula: ${v.license_plate}`)
      console.log(`   Modelo: ${v.model}`)
      console.log(`   Tipo: ${v.vehicle_type || 'N/A'}`)
      console.log(`   Fecha compra: ${v.purchase_date || 'N/A'}`)
      console.log(`   Creado: ${new Date(v.created_at).toLocaleString('es-ES')}`)
      
      // Verificar si está en DUC
      const checkDuc = async () => {
        const { data: ducData } = await supabase
          .from('duc_scraper')
          .select('Disponibilidad, "URL foto 9", "URL foto 10"')
          .eq('Matrícula', v.license_plate)
          .single()
        
        if (ducData) {
          const tieneFotos = ducData["URL foto 9"] || ducData["URL foto 10"] ? 'Sí' : 'No'
          console.log(`   En DUC: Sí | Disponibilidad: ${ducData.Disponibilidad} | Fotos: ${tieneFotos}`)
        } else {
          console.log(`   En DUC: No encontrado`)
        }
      }
      
      console.log('')
    })

    // Ver detalles adicionales con DUC
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔍 DETALLE CON DUC:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    for (const v of pendientes) {
      const { data: ducData } = await supabase
        .from('duc_scraper')
        .select('*')
        .eq('Matrícula', v.license_plate)
        .single()
      
      console.log(`📍 ${v.license_plate} - ${v.model}`)
      
      if (ducData) {
        const tieneFotos = ducData["URL foto 9"] || ducData["URL foto 10"] || ducData["URL foto 11"]
        console.log(`   DUC: ✅ Encontrado`)
        console.log(`   Disponibilidad: ${ducData.Disponibilidad}`)
        console.log(`   Tiene fotos reales (9+): ${tieneFotos ? 'Sí' : 'No'}`)
        console.log(`   Tienda: ${ducData.Tienda || 'N/A'}`)
        
        if (tieneFotos && ducData["URL foto 9"]) {
          console.log(`   ⚠️  TIENE FOTOS pero NO está marcado como recibido`)
          console.log(`   Esto es ANORMAL - el trigger debería haberlo marcado`)
        }
      } else {
        console.log(`   DUC: ❌ No encontrado`)
        console.log(`   ℹ️  Vehículo creado manualmente (no vino del scraper)`)
      }
      console.log('')
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('💡 RECOMENDACIONES:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('1. Ir a /dashboard/nuevas-entradas')
    console.log('2. Buscar estos vehículos')
    console.log('3. Marcarlos como "Recibido" con el botón correspondiente')
    console.log('4. Esto creará automáticamente los registros en stock y fotos')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

verPendientes()

