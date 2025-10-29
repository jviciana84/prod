const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  console.log('Verificando formato de fechas...\n')
  
  const { data } = await supabase
    .from('duc_scraper')
    .select('"Matrícula", "Fecha primera matriculación", "Fecha fabricación", "Modelo"')
    .limit(5)
  
  if (data) {
    data.forEach(v => {
      console.log(`Matrícula: ${v['Matrícula']}`)
      console.log(`  Modelo: ${v['Modelo']}`)
      console.log(`  Fecha primera matriculación: "${v['Fecha primera matriculación']}" (tipo: ${typeof v['Fecha primera matriculación']})`)
      console.log(`  Fecha fabricación: "${v['Fecha fabricación']}"`)
      
      // Intentar parsear
      const fecha = v['Fecha primera matriculación']
      if (fecha) {
        const fechaObj = new Date(fecha)
        console.log(`  Parseado: ${fechaObj} → Año: ${fechaObj.getFullYear()}`)
      }
      console.log('')
    })
  }
}

main()

