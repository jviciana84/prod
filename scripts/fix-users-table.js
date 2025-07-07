const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = 'https://wpjmimbscfsdzcwuwctk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixUsersTable() {
  console.log('🔧 === ARREGLANDO TABLA USERS ===\n')

  try {
    // 1. Verificar estructura actual de la tabla users
    console.log('1. 📋 Verificando estructura actual de users...')
    const { data: usersSample, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (usersError) {
      console.error('❌ Error accediendo a users:', usersError)
      return
    }

    if (usersSample && usersSample.length > 0) {
      console.log('✅ Columnas actuales en users:')
      Object.keys(usersSample[0]).forEach(column => {
        console.log(`   - ${column}: ${typeof usersSample[0][column]}`)
      })
    }
    console.log('')

    // 2. Intentar agregar la columna avatar_url
    console.log('2. ➕ Agregando columna avatar_url...')
    
    // Usar rpc para ejecutar SQL personalizado
    const { data: alterResult, error: alterError } = await supabase
      .rpc('exec_sql', { 
        sql_query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;' 
      })
    
    if (alterError) {
      console.log('⚠️ No se pudo ejecutar ALTER TABLE directamente')
      console.log('Error:', alterError.message)
      console.log('')
      console.log('📝 INSTRUCCIONES MANUALES:')
      console.log('1. Ve a https://supabase.com/dashboard/project/wpjmimbscfsdzcwuwctk/sql')
      console.log('2. Ejecuta este SQL:')
      console.log('   ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;')
      console.log('3. Luego ejecuta este script nuevamente')
      return
    }

    console.log('✅ Columna avatar_url agregada correctamente')
    console.log('')

    // 3. Sincronizar avatares desde profiles
    console.log('3. 🔄 Sincronizando avatares desde profiles...')
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, avatar_url')
      .not('avatar_url', 'is', null)
    
    if (profilesError) {
      console.error('❌ Error obteniendo profiles:', profilesError)
      return
    }

    console.log(`✅ Encontrados ${profiles.length} perfiles con avatar`)
    
    let updatedCount = 0
    let errorCount = 0

    for (const profile of profiles) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: profile.avatar_url })
        .eq('id', profile.id)

      if (updateError) {
        console.error(`   ❌ Error actualizando ${profile.id}: ${updateError.message}`)
        errorCount++
      } else {
        console.log(`   ✅ Actualizado avatar para ${profile.id}`)
        updatedCount++
      }
    }

    console.log(`\n📊 Resumen de sincronización:`)
    console.log(`   - Actualizados: ${updatedCount}`)
    console.log(`   - Errores: ${errorCount}`)
    console.log('')

    // 4. Verificar resultado final
    console.log('4. ✅ Verificando resultado final...')
    const { data: finalUsers, error: finalError } = await supabase
      .from('users')
      .select('*')
    
    if (finalError) {
      console.error('❌ Error verificando resultado:', finalError)
    } else {
      const usersWithAvatars = finalUsers.filter(u => u.avatar_url)
      console.log(`✅ Total usuarios: ${finalUsers.length}`)
      console.log(`✅ Usuarios con avatar: ${usersWithAvatars.length}`)
      
      console.log('\n📋 Usuarios con avatares:')
      usersWithAvatars.forEach(user => {
        console.log(`   - ${user.email}: ${user.avatar_url}`)
      })
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar la corrección
fixUsersTable() 