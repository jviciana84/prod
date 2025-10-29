const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  console.log('🔍 Probando combinación de Modelo + Versión...\n')

  const { data } = await supabase
    .from('duc_scraper')
    .select('"Matrícula", "Modelo", "Versión"')
    .eq('"Disponibilidad"', 'DISPONIBLE')
    .limit(10)

  if (data) {
    data.forEach(v => {
      let modeloCompleto = v['Modelo']
      
      if (v['Versión']) {
        const versionMatch = v['Versión'].match(/([ex]?Drive\d+|M\d+|\d{3}[a-z]+)/i)
        if (versionMatch) {
          modeloCompleto = `${v['Modelo']} ${versionMatch[1]}`
        } else {
          modeloCompleto = `${v['Modelo']} ${v['Versión'].split(' ')[0]}`
        }
      }
      
      console.log(`${v['Matrícula']}:`)
      console.log(`  Original: "${v['Modelo']}"`)
      console.log(`  Versión: "${v['Versión']}"`)
      console.log(`  → Combinado: "${modeloCompleto}"`)
      console.log('')
    })
  }
}

main()

