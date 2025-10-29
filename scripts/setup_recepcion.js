// ============================================
// SCRIPT: Setup Automático Sistema Recepción
// ============================================
// Ejecutar: node scripts/setup_recepcion.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Faltan variables de entorno')
  console.error('Crea archivo .env.local con:')
  console.error('NEXT_PUBLIC_SUPABASE_URL=...')
  console.error('SUPABASE_SERVICE_ROLE_KEY=...')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function setup() {
  console.log('🚀 Configurando sistema de recepción...\n')

  // 1. Verificar tablas
  console.log('1️⃣ Verificando tablas...')
  const { data: advisors, error: advisorsError } = await supabase
    .from('advisors')
    .select('count')
    .limit(1)

  if (advisorsError) {
    console.log('❌ Tablas no existen')
    console.log('\n📝 SOLUCIÓN:')
    console.log('1. Ve a Supabase Dashboard → SQL Editor')
    console.log('2. Copia y ejecuta: sql/create_visit_distribution_system.sql')
    console.log('\nDespués vuelve a ejecutar este script.')
    return
  }

  console.log('✅ Tablas existen\n')

  // 2. Verificar si hay asesores
  console.log('2️⃣ Verificando asesores...')
  const { data: existingAdvisors } = await supabase
    .from('advisors')
    .select('*')

  if (existingAdvisors && existingAdvisors.length > 0) {
    console.log(`✅ Ya hay ${existingAdvisors.length} asesor(es):\n`)
    existingAdvisors.forEach(adv => {
      console.log(`   - ${adv.full_name}`)
      console.log(`     Especialización: ${adv.specialization.join(', ')}`)
      console.log(`     Activo: ${adv.is_active}`)
      console.log('')
    })
    console.log('✅ Sistema listo para usar')
    console.log('\n🎯 Prueba en: http://localhost:3000/recepcion')
    return
  }

  // 3. Crear asesores de prueba
  console.log('⚠️ No hay asesores. Creando asesores de prueba...\n')

  const { data: created, error: createError } = await supabase
    .from('advisors')
    .insert([
      {
        full_name: 'Juan Pérez (Prueba)',
        email: 'juan@test.com',
        phone: '666 123 456',
        specialization: ['COCHE_VN', 'COCHE_VO'],
        is_active: true,
        office_location: 'Planta 1',
        desk_number: 'Puesto 10'
      },
      {
        full_name: 'María García (Prueba)',
        email: 'maria@test.com',
        phone: '666 987 654',
        specialization: ['MOTO_VN', 'MOTO_VO'],
        is_active: true,
        office_location: 'Planta 1',
        desk_number: 'Puesto 11'
      }
    ])
    .select()

  if (createError) {
    console.error('❌ Error creando asesores:', createError.message)
    return
  }

  console.log('✅ Asesores creados:\n')
  created.forEach(adv => {
    console.log(`   - ${adv.full_name}`)
    console.log(`     ${adv.specialization.join(', ')}`)
    console.log('')
  })

  console.log('\n🎉 ¡Sistema configurado!')
  console.log('\n🎯 Prueba en: http://localhost:3000/recepcion')
  console.log('   1. Click en "COCHE VN" → Te asigna a Juan')
  console.log('   2. Click en "MOTO VN" → Te asigna a María')
  console.log('   3. Si ocupado → Click "OCUPADO" → Busca otro')
}

setup().catch(console.error)

