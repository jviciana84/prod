require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verificar2Vehiculos() {
  console.log('\n🔍 VERIFICANDO ESTADO DE 7049NBL Y 5509LSR EN DUC_SCRAPER\n')
  console.log('='.repeat(80))
  
  const matriculas = ['7049NBL', '5509LSR']
  
  for (const matricula of matriculas) {
    const { data } = await supabase
      .from('duc_scraper')
      .select('"Matrícula", "Modelo", "Disponibilidad", "Marca"')
      .eq('"Matrícula"', matricula)
    
    console.log(`\n📋 ${matricula}:`)
    if (data && data.length > 0) {
      data.forEach((registro, i) => {
        console.log(`   Registro ${i + 1}:`)
        console.log(`      Modelo: ${registro['Modelo']}`)
        console.log(`      Marca: ${registro['Marca']}`)
        console.log(`      Disponibilidad: ${registro['Disponibilidad']}`)
      })
      
      if (data.length > 1) {
        console.log(`   ⚠️  ATENCIÓN: ${data.length} registros encontrados (duplicados!)`)
      }
    } else {
      console.log(`   ❌ No encontrado en duc_scraper`)
    }
  }
  
  console.log('\n')
}

verificar2Vehiculos().catch(console.error)

