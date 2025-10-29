const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function sincronizar() {
  console.log('🔍 Buscando roles en el sistema...\n')

  try {
    // 1. Ver todos los roles únicos que hay
    const { data: profiles } = await supabase
      .from('profiles')
      .select('role, full_name')

    if (profiles) {
      const rolesUnicos = [...new Set(profiles.map(p => p.role).filter(Boolean))]
      console.log('📋 Roles encontrados en el sistema:')
      rolesUnicos.forEach(rol => {
        console.log(`   - "${rol}"`)
      })
      console.log('')
    }

    // 2. Limpiar asesores actuales
    console.log('🧹 Limpiando asesores actuales...')
    await supabase
      .from('advisors')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    console.log('✅ Limpiado\n')

    // 3. Buscar usuarios con rol "asesor de ventas" (probando variantes)
    console.log('🔍 Buscando usuarios con rol "asesor de ventas"...')
    
    const { data: asesoresVentas } = await supabase
      .from('profiles')
      .select('*')
      .or('role.ilike.%asesor%,role.ilike.%ventas%,role.ilike.%comercial%')

    if (!asesoresVentas || asesoresVentas.length === 0) {
      console.log('⚠️ No se encontraron usuarios con rol de asesor de ventas')
      console.log('\n📝 Usuarios encontrados por rol:')
      
      if (profiles) {
        profiles.forEach(p => {
          console.log(`   - ${p.full_name}: "${p.role}"`)
        })
      }
      return
    }

    console.log(`✅ ${asesoresVentas.length} asesor(es) de ventas encontrado(s):\n`)
    
    asesoresVentas.forEach((p, i) => {
      console.log(`${i + 1}. ${p.full_name}`)
      console.log(`   Rol: "${p.role}"`)
      console.log(`   Email: ${p.email}`)
      console.log('')
    })

    // 4. Crear asesores desde estos usuarios
    console.log('✅ Creando asesores...')
    
    const asesoresCrear = asesoresVentas.map(profile => ({
      profile_id: profile.id,
      full_name: profile.full_name || profile.email,
      email: profile.email,
      phone: profile.phone,
      // Por defecto COCHE_VO, se configurará después
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

    console.log(`\n✅ ${created.length} asesor(es) creado(s) en sistema de recepción`)
    console.log('\n📝 Siguiente paso:')
    console.log('   http://localhost:3000/dashboard/recepcion-admin')
    console.log('   Configurar especializaciones (VN/VO - Coche/Moto)')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

sincronizar()

