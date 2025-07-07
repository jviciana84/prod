const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = 'https://wpjmimbscfsdzcwuwctk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function syncUsersProfiles() {
  console.log('🔄 === SINCRONIZANDO USERS Y PROFILES ===\n')

  try {
    // 1. Obtener datos de ambas tablas
    console.log('1. 📋 Obteniendo datos de ambas tablas...')
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
    
    if (profilesError) {
      console.error('❌ Error obteniendo profiles:', profilesError)
      return
    }
    
    if (usersError) {
      console.error('❌ Error obteniendo users:', usersError)
      return
    }

    console.log(`✅ Profiles: ${profiles.length} registros`)
    console.log(`✅ Users: ${users.length} registros`)
    console.log('')

    // 2. Crear usuarios faltantes en la tabla users
    console.log('2. 👥 Creando usuarios faltantes en tabla users...')
    let createdCount = 0
    let errorCount = 0

    for (const profile of profiles) {
      const existingUser = users.find(u => u.id === profile.id)
      
      if (!existingUser) {
        console.log(`   ➕ Creando usuario para ${profile.full_name || profile.email}:`)
        
        const userData = {
          id: profile.id,
          email: profile.email,
          role: profile.role || 'user',
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        }

        const { error: insertError } = await supabase
          .from('users')
          .insert([userData])

        if (insertError) {
          console.error(`      ❌ Error: ${insertError.message}`)
          errorCount++
        } else {
          console.log(`      ✅ Creado correctamente`)
          createdCount++
        }
      } else {
        console.log(`   ✅ ${profile.full_name || profile.email}: Ya existe en users`)
      }
    }

    console.log(`\n📊 Resumen de creación:`)
    console.log(`   - Creados: ${createdCount}`)
    console.log(`   - Errores: ${errorCount}`)
    console.log('')

    // 3. Sincronizar avatares de profiles a users
    console.log('3. 🖼️ Sincronizando avatares...')
    let updatedCount = 0
    let avatarErrorCount = 0

    for (const profile of profiles) {
      const user = users.find(u => u.id === profile.id)
      
      if (user && profile.avatar_url && user.avatar_url !== profile.avatar_url) {
        console.log(`   🔄 Actualizando avatar de ${profile.full_name || profile.email}:`)
        console.log(`      De: ${user.avatar_url || 'No configurado'}`)
        console.log(`      A:  ${profile.avatar_url}`)

        const { error: updateError } = await supabase
          .from('users')
          .update({ avatar_url: profile.avatar_url })
          .eq('id', profile.id)

        if (updateError) {
          console.error(`      ❌ Error: ${updateError.message}`)
          avatarErrorCount++
        } else {
          console.log(`      ✅ Actualizado correctamente`)
          updatedCount++
        }
      }
    }

    console.log(`\n📊 Resumen de sincronización de avatares:`)
    console.log(`   - Actualizados: ${updatedCount}`)
    console.log(`   - Errores: ${avatarErrorCount}`)
    console.log('')

    // 4. Verificar resultado final
    console.log('4. ✅ Verificando resultado final...')
    const { data: finalUsers, error: finalError } = await supabase
      .from('users')
      .select('*')
    
    if (finalError) {
      console.error('❌ Error verificando resultado:', finalError)
    } else {
      console.log(`✅ Total usuarios en tabla users: ${finalUsers.length}`)
      
      const usersWithAvatars = finalUsers.filter(u => u.avatar_url)
      console.log(`✅ Usuarios con avatar: ${usersWithAvatars.length}`)
      
      console.log('\n📋 Lista de usuarios con avatares:')
      usersWithAvatars.forEach(user => {
        const profile = profiles.find(p => p.id === user.id)
        console.log(`   - ${profile?.full_name || user.email}:`)
        console.log(`     * Avatar: ${user.avatar_url}`)
        console.log(`     * Role: ${user.role}`)
      })
    }

    // 5. Crear trigger para sincronización automática
    console.log('\n5. 🛠️ Creando trigger para sincronización automática...')
    const triggerSQL = `
-- Función para sincronizar automáticamente
CREATE OR REPLACE FUNCTION sync_profile_to_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar o actualizar en users cuando se modifica profiles
  INSERT INTO users (id, email, role, avatar_url, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NEW.role, NEW.avatar_url, NEW.created_at, NEW.updated_at)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = EXCLUDED.updated_at;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronizar automáticamente
DROP TRIGGER IF EXISTS sync_profile_trigger ON profiles;
CREATE TRIGGER sync_profile_trigger
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_user();
`
    console.log('📝 SQL para crear sincronización automática:')
    console.log(triggerSQL)

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar la sincronización
syncUsersProfiles() 