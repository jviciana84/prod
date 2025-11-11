require(''dotenv'').config({ path: ''.env.local'' })
const { createClient } = require(''@supabase/supabase-js'')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function ver(matricula) {
  const { data, error } = await supabase
    .from(''duc_scraper'')
    .select('*')
    .eq(''Matrícula'', matricula)
    .single()

  if (error) {
    console.log(''Error:'', error.message)
    return
  }

  console.log(\n CAMPOS DEL VEHÍCULO :\n)
  console.log(JSON.stringify(data, null, 2))
}

const matricula = process.argv[2]

if (!matricula) {
  console.error(''Uso: node scripts/get_campos.js <MATRICULA>'')
  process.exit(1)
}

ver(matricula).then(() => process.exit(0))
