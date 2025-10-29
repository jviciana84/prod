const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const MATRICULA = process.argv[2] || '9594MKL'

async function main() {
  console.log(`🔍 Viendo datos completos de: ${MATRICULA}\n`)

  const { data } = await supabase
    .from('duc_scraper')
    .select('*')
    .eq('"Matrícula"', MATRICULA)
    .single()

  if (!data) {
    console.log('❌ No encontrado')
    return
  }

  console.log('📋 DATOS DEL VEHÍCULO:\n')
  console.log('Modelo:', data['Modelo'])
  console.log('Versión:', data['Versión'])
  console.log('Potencia CV:', data['Potencia Cv'])
  console.log('Tipo motor:', data['Tipo motor'])
  console.log('Carrocería:', data['Carrocería'])
  console.log('\nURL:', data['URL'])
  
  // Intentar construir modelo completo
  const modeloCompleto = [
    data['Modelo'],
    data['Versión'],
    data['Potencia Cv'] ? `${data['Potencia Cv']} CV` : null
  ].filter(Boolean).join(' ')
  
  console.log('\n🔧 MODELO COMPLETO POSIBLE:')
  console.log(modeloCompleto)
}

main()

