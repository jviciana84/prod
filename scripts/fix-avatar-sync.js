const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = 'https://wpjmimbscfsdzcwuwctk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixAvatarSync() {
  console.log('🔧 === SOLUCIONANDO SINCRONIZACIÓN DE AVATARES ===\n')

  try {
    // 1. Obtener todos los perfiles con avatares
    console.log('1. 📋 Obteniendo perfiles con avatares...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
    
    if (profilesError) {
      console.error('❌ Error accediendo a profiles:', profilesError)
      return
    }

    console.log(`✅ Encontrados ${profiles.length} perfiles`)

    // 2. Obtener todos los usuarios
    console.log('\n2. 👥 Obteniendo usuarios...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
    
    if (usersError) {
      console.error('❌ Error accediendo a users:', usersError)
      return
    }

    console.log(`✅ Encontrados ${users.length} usuarios`)

    // 3. Sincronizar avatares de profiles a users
    console.log('\n3. 🔄 Sincronizando avatares...')
    let updatedCount = 0
    let errorCount = 0

    for (const profile of profiles) {
      if (profile.avatar_url) {
        // Buscar el usuario correspondiente
        const user = users.find(u => u.id === profile.id)
        
        if (user) {
          // Verificar si el avatar es diferente
          if (user.avatar_url !== profile.avatar_url) {
            console.log(`   🔄 Actualizando ${profile.full_name || profile.id}:`)
            console.log(`      De: ${user.avatar_url || 'No configurado'}`)
            console.log(`      A:  ${profile.avatar_url}`)

            // Actualizar el usuario
            const { error: updateError } = await supabase
              .from('users')
              .update({ avatar_url: profile.avatar_url })
              .eq('id', profile.id)

            if (updateError) {
              console.error(`      ❌ Error: ${updateError.message}`)
              errorCount++
            } else {
              console.log(`      ✅ Actualizado correctamente`)
              updatedCount++
            }
          } else {
            console.log(`   ✅ ${profile.full_name || profile.id}: Ya sincronizado`)
          }
        } else {
          console.log(`   ⚠️ ${profile.full_name || profile.id}: Usuario no encontrado`)
        }
      }
    }

    console.log(`\n📊 Resumen de sincronización:`)
    console.log(`   - Actualizados: ${updatedCount}`)
    console.log(`   - Errores: ${errorCount}`)
    console.log(`   - Total procesados: ${profiles.length}`)

    // 4. Verificar resultado final
    console.log('\n4. ✅ Verificando resultado final...')
    const { data: finalUsers, error: finalError } = await supabase
      .from('users')
      .select('*')
    
    if (finalError) {
      console.error('❌ Error verificando resultado:', finalError)
    } else {
      console.log('✅ Usuarios con avatares después de la sincronización:')
      finalUsers.forEach(user => {
        const profile = profiles.find(p => p.id === user.id)
        console.log(`   - ${user.email}:`)
        console.log(`     * Users avatar: ${user.avatar_url || 'No configurado'}`)
        console.log(`     * Profile avatar: ${profile?.avatar_url || 'No configurado'}`)
        console.log(`     * Sincronizado: ${user.avatar_url === profile?.avatar_url ? '✅' : '❌'}`)
      })
    }

    // 5. Crear función de sincronización automática
    console.log('\n5. 🛠️ Creando función de sincronización automática...')
    const syncFunction = `
-- Función para sincronizar avatares automáticamente
CREATE OR REPLACE FUNCTION sync_avatar_url()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar la tabla users cuando se actualiza profiles
  UPDATE users 
  SET avatar_url = NEW.avatar_url 
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronizar automáticamente
DROP TRIGGER IF EXISTS sync_avatar_trigger ON profiles;
CREATE TRIGGER sync_avatar_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.avatar_url IS DISTINCT FROM NEW.avatar_url)
  EXECUTE FUNCTION sync_avatar_url();
`

    console.log('📝 SQL para crear sincronización automática:')
    console.log(syncFunction)

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar la sincronización
fixAvatarSync() 