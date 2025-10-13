require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function revertir() {
  console.log('\n🔄 REVIRTIENDO CORRECCIÓN (Vehículos son DISPONIBLES, no RESERVADOS)\n')
  console.log('='.repeat(80))
  
  const matriculas = ['7049NBL', '5509LSR']
  
  for (const matricula of matriculas) {
    // Revertir a is_sold = false
    const { error: stockError } = await supabase
      .from('stock')
      .update({ is_sold: false })
      .eq('license_plate', matricula)
    
    if (stockError) {
      console.log(`❌ ${matricula}: Error - ${stockError.message}`)
    } else {
      console.log(`✅ ${matricula}: is_sold = false (DISPONIBLE en CSV)`)
      
      // Actualizar fotos a pendiente
      await supabase
        .from('fotos')
        .update({ estado_pintura: 'pendiente' })
        .eq('license_plate', matricula)
    }
  }
  
  console.log('\n✅ Revertido correctamente\n')
}

revertir().catch(console.error)

