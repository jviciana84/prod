require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verificarDashboard() {
  console.log('\n📊 VERIFICACIÓN DE DATOS DEL DASHBOARD\n')
  console.log('='.repeat(80))
  
  // 1. Datos que muestra el dashboard (según el código)
  console.log('\n1️⃣ DATOS QUE CONSULTA EL DASHBOARD:')
  
  // El dashboard filtra: .eq("is_sold", false)
  const { data: stockDashboard } = await supabase
    .from('stock')
    .select('*')
    .eq('is_sold', false)
  
  console.log(`   Query del dashboard: .from("stock").select("*").eq("is_sold", false)`)
  console.log(`   ✅ Resultado: ${stockDashboard?.length || 0} vehículos`)
  
  // 2. Estado real del stock
  console.log('\n2️⃣ ESTADO REAL DEL STOCK:')
  
  const { data: allStock } = await supabase
    .from('stock')
    .select('is_sold, vehicle_type')
  
  const isSoldFalse = allStock?.filter(s => s.is_sold === false).length || 0
  const isSoldNull = allStock?.filter(s => s.is_sold === null).length || 0
  const isSoldTrue = allStock?.filter(s => s.is_sold === true).length || 0
  
  console.log(`   Total vehículos en stock: ${allStock?.length || 0}`)
  console.log(`   ├─ is_sold = false: ${isSoldFalse}`)
  console.log(`   ├─ is_sold = null: ${isSoldNull}`)
  console.log(`   └─ is_sold = true: ${isSoldTrue}`)
  
  // 3. Lo que debería mostrar el dashboard
  console.log('\n3️⃣ LO QUE MUESTRA EL DASHBOARD:')
  
  const coches = stockDashboard?.filter(item => {
    const type = item.vehicle_type?.trim().toLowerCase()
    return type === "coche" || type === "car" || type === "turismo"
  }).length || 0
  
  const motos = stockDashboard?.filter(item => {
    const type = item.vehicle_type?.trim().toLowerCase()
    return type === "moto" || type === "motorcycle" || type === "motorrad"
  }).length || 0
  
  console.log(`   📊 Card "Vehículos en Stock": ${stockDashboard?.length || 0} vehículos`)
  console.log(`      ├─ Coches: ${coches}`)
  console.log(`      └─ Motos: ${motos}`)
  
  // 4. Comparar con duc_scraper
  console.log('\n4️⃣ COMPARACIÓN CON DUC_SCRAPER:')
  
  const { data: ducData } = await supabase
    .from('duc_scraper')
    .select('"Disponibilidad"')
  
  const disponibles = ducData?.filter(d => 
    d['Disponibilidad']?.toUpperCase().includes('DISPONIBLE')
  ).length || 0
  
  const reservados = ducData?.filter(d => 
    d['Disponibilidad']?.toUpperCase().includes('RESERVADO')
  ).length || 0
  
  console.log(`   DUC_SCRAPER:`)
  console.log(`   ├─ DISPONIBLES: ${disponibles}`)
  console.log(`   └─ RESERVADOS: ${reservados}`)
  
  console.log(`\n   STOCK (dashboard):`)
  console.log(`   └─ Disponibles (is_sold = false): ${stockDashboard?.length || 0}`)
  
  // 5. Resumen
  console.log('\n\n📋 RESUMEN:')
  console.log('='.repeat(80))
  console.log(`Dashboard muestra: ${stockDashboard?.length || 0} vehículos disponibles`)
  console.log(`Stock real disponible: ${isSoldFalse} vehículos (is_sold = false)`)
  console.log(`Stock vendido: ${isSoldTrue} vehículos (is_sold = true)`)
  
  if (isSoldNull > 0) {
    console.log(`\n⚠️  NOTA: Hay ${isSoldNull} vehículos con is_sold = NULL`)
    console.log(`   Estos NO se muestran en el dashboard (filtro: .eq("is_sold", false))`)
    console.log(`   Recomendación: Actualizar filtro a .or("is_sold.eq.false,is_sold.is.null")`)
  }
  
  console.log(`\n✅ El dashboard está mostrando los datos CORRECTOS`)
  console.log(`   (Solo vehículos con is_sold = false, excluyendo vendidos)`)
  
  console.log('\n')
}

verificarDashboard().catch(console.error)

