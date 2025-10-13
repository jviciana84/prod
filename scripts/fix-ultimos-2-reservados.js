require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixUltimos2Reservados() {
  console.log('\n🔧 CORRIGIENDO ÚLTIMOS 2 VEHÍCULOS RESERVADOS\n')
  console.log('='.repeat(80))
  
  const matriculas = ['7049NBL', '5509LSR']
  
  console.log('\nVehículos a corregir:')
  matriculas.forEach((m, i) => console.log(`  ${i + 1}. ${m}`))
  
  console.log('\n🔧 Aplicando correcciones...\n')
  
  for (const matricula of matriculas) {
    // Actualizar stock
    const { error: stockError } = await supabase
      .from('stock')
      .update({ is_sold: true })
      .eq('license_plate', matricula)
    
    if (stockError) {
      console.log(`❌ ${matricula}: Error en stock - ${stockError.message}`)
    } else {
      console.log(`✅ ${matricula}: is_sold = true`)
      
      // Actualizar fotos
      const { error: fotosError } = await supabase
        .from('fotos')
        .update({ estado_pintura: 'vendido' })
        .eq('license_plate', matricula)
      
      if (!fotosError) {
        console.log(`   └─ Fotos: estado_pintura = vendido`)
      }
    }
  }
  
  console.log('\n✅ Corrección completada\n')
}

fixUltimos2Reservados().catch(console.error)

