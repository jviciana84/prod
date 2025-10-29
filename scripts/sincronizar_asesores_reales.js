const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function sincronizar() {
  console.log('🔄 Sincronizando asesores reales...\n')

  try {
    // 1. Limpiar asesores de prueba
    console.log('1️⃣ Limpiando asesores de prueba...')
    const { error: deleteError } = await supabase
      .from('advisors')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deleteError) {
      console.log('⚠️ Error limpiando:', deleteError.message)
    } else {
      console.log('✅ Asesores de prueba eliminados\n')
    }

    // 2. Obtener todos los usuarios con profile
    console.log('2️⃣ Obteniendo usuarios del sistema...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, position')

    if (profilesError) {
      console.error('❌ Error:', profilesError.message)
      return
    }

    console.log(`✅ ${profiles.length} usuarios encontrados\n`)

    // 3. Crear asesores para cada usuario
    console.log('3️⃣ Creando asesores desde usuarios...')
    
    const asesoresCrear = profiles.map(profile => ({
      profile_id: profile.id,
      full_name: profile.full_name || profile.email,
      email: profile.email,
      phone: profile.phone,
      // Por defecto todos pueden atender coches VO (se puede cambiar después)
      specialization: ['COCHE_VO'],
      is_active: true,
      current_turn_priority: 0,
      total_visits: 0,
      visits_today: 0
    }))

    const { data: created, error: createError } = await supabase
      .from('advisors')
      .insert(asesoresCrear)
      .select()

    if (createError) {
      console.error('❌ Error creando asesores:', createError.message)
      return
    }

    console.log(`✅ ${created.length} asesores creados:\n`)
    
    created.forEach((asesor, index) => {
      console.log(`${index + 1}. ${asesor.full_name}`)
      console.log(`   Email: ${asesor.email}`)
      console.log(`   Especialización: ${asesor.specialization.join(', ')}`)
      console.log('')
    })

    console.log('\n📝 SIGUIENTE PASO:')
    console.log('   Ir a: http://localhost:3000/dashboard/recepcion-admin')
    console.log('   Configurar las especializaciones de cada asesor')
    console.log('   (VN/VO - Coche/Moto según corresponda)')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

sincronizar()

