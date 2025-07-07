const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = 'https://wpjmimbscfsdzcwuwctk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectAvatars() {
  console.log('👤 === INSPECCIÓN DE AVATARES ===\n')

  try {
    // 1. Verificar tabla users y sus avatares
    console.log('1. 👥 Verificando usuarios y sus avatares...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
    
    if (usersError) {
      console.error('❌ Error accediendo a users:', usersError)
      return
    }

    console.log(`✅ Encontrados ${users.length} usuarios:`)
    users.forEach(user => {
      console.log(`   - ${user.email} (ID: ${user.id})`)
      console.log(`     Avatar URL: ${user.avatar_url || 'No configurado'}`)
      console.log(`     Role: ${user.role}`)
      console.log('')
    })

    // 2. Verificar tabla profiles
    console.log('2. 📋 Verificando tabla profiles...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
    
    if (profilesError) {
      console.log('❌ Error accediendo a profiles:', profilesError.message)
    } else {
      console.log(`✅ Encontrados ${profiles.length} perfiles:`)
      profiles.forEach(profile => {
        console.log(`   - User ID: ${profile.user_id}`)
        console.log(`     Avatar URL: ${profile.avatar_url || 'No configurado'}`)
        console.log(`     Full Name: ${profile.full_name || 'No configurado'}`)
        console.log('')
      })
    }

    // 3. Verificar storage de avatares
    console.log('3. 🗂️ Verificando storage de avatares...')
    try {
      const { data: avatarFiles, error: storageError } = await supabase
        .storage
        .from('avatars')
        .list('', {
          limit: 100,
          offset: 0
        })
      
      if (storageError) {
        console.log('❌ Error accediendo a storage:', storageError.message)
      } else {
        console.log(`✅ Encontrados ${avatarFiles.length} archivos de avatar:`)
        avatarFiles.forEach(file => {
          console.log(`   - ${file.name} (${file.metadata?.size || 'N/A'} bytes)`)
        })
      }
    } catch (err) {
      console.log('❌ No se pudo acceder al storage de avatares')
    }
    console.log('')

    // 4. Verificar configuración de avatares por defecto
    console.log('4. ⚙️ Verificando configuración de avatares por defecto...')
    try {
      const { data: avatarConfig, error: configError } = await supabase
        .from('avatar_config')
        .select('*')
        .limit(1)
      
      if (configError) {
        console.log('❌ No hay tabla avatar_config o error de acceso')
      } else {
        console.log('✅ Configuración de avatares:', avatarConfig)
      }
    } catch (err) {
      console.log('❌ No se pudo acceder a la configuración de avatares')
    }
    console.log('')

    // 5. Verificar si hay usuarios sin avatar
    console.log('5. 🔍 Usuarios sin avatar configurado:')
    const usersWithoutAvatar = users.filter(user => !user.avatar_url)
    if (usersWithoutAvatar.length > 0) {
      console.log(`⚠️ ${usersWithoutAvatar.length} usuarios sin avatar:`)
      usersWithoutAvatar.forEach(user => {
        console.log(`   - ${user.email}`)
      })
    } else {
      console.log('✅ Todos los usuarios tienen avatar configurado')
    }

    // 6. Verificar usuarios específicos mencionados
    console.log('\n6. 🎯 Verificando usuarios específicos:')
    const specificUsers = ['viciana84@gmail.com', 'jordi.viciana@munichgroup.es']
    specificUsers.forEach(email => {
      const user = users.find(u => u.email === email)
      if (user) {
        console.log(`✅ ${email}:`)
        console.log(`   - ID: ${user.id}`)
        console.log(`   - Avatar: ${user.avatar_url || 'No configurado'}`)
        console.log(`   - Role: ${user.role}`)
      } else {
        console.log(`❌ ${email}: No encontrado`)
      }
    })

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar la inspección
inspectAvatars() 