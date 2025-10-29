const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function crear10Asesores() {
  console.log('🚀 Creando 10 asesores de prueba...\n')

  const asesores = [
    {
      full_name: 'Juan Pérez',
      email: 'juan@cvo.com',
      phone: '666 111 111',
      specialization: ['COCHE_VN', 'COCHE_VO'],
      office_location: 'Planta 1',
      desk_number: 'Puesto 1'
    },
    {
      full_name: 'María García',
      email: 'maria@cvo.com',
      phone: '666 222 222',
      specialization: ['COCHE_VN', 'COCHE_VO'],
      office_location: 'Planta 1',
      desk_number: 'Puesto 2'
    },
    {
      full_name: 'Carlos López',
      email: 'carlos@cvo.com',
      phone: '666 333 333',
      specialization: ['COCHE_VN', 'COCHE_VO'],
      office_location: 'Planta 1',
      desk_number: 'Puesto 3'
    },
    {
      full_name: 'Ana Martínez',
      email: 'ana@cvo.com',
      phone: '666 444 444',
      specialization: ['COCHE_VN', 'COCHE_VO'],
      office_location: 'Planta 1',
      desk_number: 'Puesto 4'
    },
    {
      full_name: 'Pedro Sánchez',
      email: 'pedro@cvo.com',
      phone: '666 555 555',
      specialization: ['COCHE_VN', 'COCHE_VO'],
      office_location: 'Planta 2',
      desk_number: 'Puesto 5'
    },
    {
      full_name: 'Laura Fernández',
      email: 'laura@cvo.com',
      phone: '666 666 666',
      specialization: ['MOTO_VN', 'MOTO_VO'],
      office_location: 'Planta 2',
      desk_number: 'Puesto 6'
    },
    {
      full_name: 'Alberto Ruiz',
      email: 'alberto@cvo.com',
      phone: '666 777 777',
      specialization: ['MOTO_VN', 'MOTO_VO'],
      office_location: 'Planta 2',
      desk_number: 'Puesto 7'
    },
    {
      full_name: 'Sofía Díaz',
      email: 'sofia@cvo.com',
      phone: '666 888 888',
      specialization: ['MOTO_VN', 'MOTO_VO'],
      office_location: 'Planta 2',
      desk_number: 'Puesto 8'
    },
    {
      full_name: 'David Torres',
      email: 'david@cvo.com',
      phone: '666 999 999',
      specialization: ['COCHE_VN', 'COCHE_VO', 'MOTO_VN', 'MOTO_VO'],
      office_location: 'Planta 3',
      desk_number: 'Puesto 9'
    },
    {
      full_name: 'Carmen Morales',
      email: 'carmen@cvo.com',
      phone: '666 000 000',
      specialization: ['COCHE_VN', 'COCHE_VO', 'MOTO_VN', 'MOTO_VO'],
      office_location: 'Planta 3',
      desk_number: 'Puesto 10'
    }
  ]

  try {
    // Limpiar asesores existentes
    const { error: deleteError } = await supabase
      .from('advisors')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deleteError) {
      console.log('⚠️ Error limpiando asesores:', deleteError.message)
    }

    // Crear nuevos asesores
    const { data, error } = await supabase
      .from('advisors')
      .insert(asesores.map(a => ({
        ...a,
        is_active: true,
        current_turn_priority: 0,
        total_visits: 0,
        visits_today: 0
      })))
      .select()

    if (error) {
      console.error('❌ Error creando asesores:', error.message)
      return
    }

    console.log('✅ 10 Asesores creados:\n')
    
    data.forEach((asesor, index) => {
      console.log(`${index + 1}. ${asesor.full_name}`)
      console.log(`   Especialización: ${asesor.specialization.join(', ')}`)
      console.log(`   Ubicación: ${asesor.office_location} - ${asesor.desk_number}`)
      console.log('')
    })

    console.log('\n🎯 Distribución:')
    console.log(`   COCHE VN/VO: 7 asesores`)
    console.log(`   MOTO VN/VO: 5 asesores`)
    console.log(`   Polivalentes: 2 asesores (David y Carmen)`)
    
    console.log('\n✅ Listo para probar en: http://localhost:3000/recepcion')
    console.log('\n📊 Prueba:')
    console.log('   1. Click "COCHE VN" varias veces')
    console.log('   2. Verás cómo rota entre: Juan → María → Carlos → Ana → Pedro → David → Carmen')
    console.log('   3. Si uno está ocupado → Click "OCUPADO" → Aparece el siguiente')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

crear10Asesores()

