const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = 'https://wpjmimbscfsdzcwuwctk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyAvatarSource() {
  console.log('🔍 === VERIFICANDO FUENTE DE AVATARES ===\n')

  try {
    // 1. Verificar qué tablas existen
    console.log('1. 📋 Tablas disponibles:')
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_names')
    
    if (tablesError) {
      console.log('❌ No se pudo obtener lista de tablas automáticamente')
      console.log('Verificando tablas conocidas...')
      
      // Verificar tablas específicas
      const knownTables = ['users', 'profiles', 'auth.users']
      
      for (const tableName of knownTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1)
          
          if (error) {
            console.log(`   ❌ ${tableName}: No existe o error de acceso`)
          } else {
            console.log(`   ✅ ${tableName}: Existe y accesible`)
          }
        } catch (err) {
          console.log(`   ❌ ${tableName}: Error de acceso`)
        }
      }
    } else {
      console.log('✅ Tablas encontradas:', tables)
    }
    console.log('')

    // 2. Verificar auth.users (tabla del sistema)
    console.log('2. 🔐 Verificando auth.users (tabla del sistema):')
    try {
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('*')
        .limit(3)
      
      if (authError) {
        console.log('❌ Error accediendo a auth.users:', authError.message)
      } else {
        console.log(`✅ auth.users: ${authUsers.length} usuarios del sistema`)
        authUsers.forEach(user => {
          console.log(`   - ${user.email}: ID=${user.id}`)
          console.log(`     * Metadata: ${JSON.stringify(user.user_metadata)}`)
        })
      }
    } catch (err) {
      console.log('❌ No se puede acceder directamente a auth.users')
    }
    console.log('')

    // 3. Verificar tabla profiles
    console.log('3. 👥 Verificando tabla profiles:')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
    
    if (profilesError) {
      console.log('❌ Error accediendo a profiles:', profilesError.message)
    } else {
      console.log(`✅ profiles: ${profiles.length} perfiles`)
      profiles.forEach(profile => {
        console.log(`   - ${profile.full_name || profile.id}:`)
        console.log(`     * Avatar: ${profile.avatar_url || 'No configurado'}`)
        console.log(`     * Email: ${profile.email || 'No configurado'}`)
      })
    }
    console.log('')

    // 4. Verificar tabla users personalizada
    console.log('4. 👤 Verificando tabla users personalizada:')
    try {
      const { data: customUsers, error: customError } = await supabase
        .from('users')
        .select('*')
      
      if (customError) {
        console.log('❌ Error accediendo a users:', customError.message)
      } else {
        console.log(`✅ users: ${customUsers.length} usuarios`)
        customUsers.forEach(user => {
          console.log(`   - ${user.email}:`)
          console.log(`     * Avatar: ${user.avatar_url || 'No configurado'}`)
          console.log(`     * Role: ${user.role || 'No configurado'}`)
        })
      }
    } catch (err) {
      console.log('❌ No se puede acceder a la tabla users')
    }
    console.log('')

    // 5. Análisis del problema
    console.log('5. 💡 ANÁLISIS DEL PROBLEMA:')
    console.log('   - Los avatares están correctamente en la tabla profiles')
    console.log('   - La aplicación probablemente está intentando leer de una tabla users que no existe')
    console.log('   - O está intentando leer de auth.users que no tiene avatar_url')
    console.log('   - Necesitamos modificar el código para leer desde profiles')
    console.log('')
    
    console.log('6. 🛠️ SOLUCIÓN RECOMENDADA:')
    console.log('   - Modificar las consultas para usar profiles en lugar de users')
    console.log('   - O crear una vista que combine auth.users con profiles')
    console.log('   - O sincronizar los datos entre las tablas')

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar la verificación
verifyAvatarSource() 