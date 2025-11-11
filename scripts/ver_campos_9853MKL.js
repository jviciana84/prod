require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function ver() {
  const { data, error } = await supabase
    .from('duc_scraper')
    .select('*')
    .eq('Matrícula', '9853MKL')
    .single()
  
  if (error) {
    console.log('Error:', error.message)
    return
  }
  
  console.log('\n📋 CAMPOS DEL VEHÍCULO 9853MKL:\n')
  console.log(JSON.stringify(data, null, 2))
}

ver().then(() => process.exit(0))



