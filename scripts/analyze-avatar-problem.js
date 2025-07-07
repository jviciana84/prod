const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = 'https://wpjmimbscfsdzcwuwctk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeAvatarProblem() {
  console.log('🔍 === ANÁLISIS DEL PROBLEMA DE AVATARES ===\n')

  try {
    // 1. Verificar tabla avatar_mappings
    console.log('1. 🔗 Verificando tabla avatar_mappings...')
    const { data: mappings, error: mappingsError } = await supabase
      .from('avatar_mappings')
      .select('*')
    
    if (mappingsError) {
      console.log('❌ Error accediendo a avatar_mappings:', mappingsError.message)
    } else {
      console.log(`✅ Encontrados ${mappings.length} mapeos de avatares:`)
      mappings.forEach(mapping => {
        console.log(`   - ${mapping.local_path} → ${mapping.blob_url}`)
      })
    }
    console.log('')

    // 2. Verificar tabla profiles con más detalle
    console.log('2. 👥 Analizando tabla profiles...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
    
    if (profilesError) {
      console.log('❌ Error accediendo a profiles:', profilesError.message)
    } else {
      console.log(`✅ Encontrados ${profiles.length} perfiles:`)
      
      // Analizar patrones en los avatares
      const avatarPatterns = {}
      profiles.forEach(profile => {
        const avatarUrl = profile.avatar_url
        if (avatarUrl) {
          if (!avatarPatterns[avatarUrl]) {
            avatarPatterns[avatarUrl] = []
          }
          avatarPatterns[avatarUrl].push(profile.full_name || profile.id)
        }
      })

      console.log('\n📊 Patrones de avatares:')
      Object.entries(avatarPatterns).forEach(([url, users]) => {
        console.log(`   - ${url}: ${users.length} usuarios`)
        users.forEach(user => console.log(`     * ${user}`))
      })

      // Verificar usuarios sin avatar
      const usersWithoutAvatar = profiles.filter(p => !p.avatar_url)
      console.log(`\n⚠️ ${usersWithoutAvatar.length} usuarios sin avatar:`)
      usersWithoutAvatar.forEach(profile => {
        console.log(`   - ${profile.full_name || profile.id}`)
      })
    }
    console.log('')

    // 3. Verificar tabla users vs profiles
    console.log('3. 🔄 Comparando users vs profiles...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
    
    if (usersError) {
      console.log('❌ Error accediendo a users:', usersError.message)
    } else {
      console.log(`✅ Encontrados ${users.length} usuarios en tabla users:`)
      users.forEach(user => {
        const profile = profiles.find(p => p.id === user.id)
        console.log(`   - ${user.email}:`)
        console.log(`     * Users avatar: ${user.avatar_url || 'No configurado'}`)
        console.log(`     * Profile avatar: ${profile?.avatar_url || 'No configurado'}`)
        console.log(`     * Coinciden: ${user.avatar_url === profile?.avatar_url ? '✅' : '❌'}`)
      })
    }
    console.log('')

    // 4. Verificar URLs de avatares específicos
    console.log('4. 🌐 Verificando URLs de avatares...')
    const specificAvatars = [
      'https://n6va547dj09mfqlu.public.blob.vercel-storage.com/avatars/23-pT9mOkZGQDDcJKeKlZTHf53SZfHIvQ.png',
      'https://n6va547dj09mfqlu.public.blob.vercel-storage.com/avatars/1-zfO7DppGTLdiD02IUk4BkqbQcmzWd4.png'
    ]

    for (const avatarUrl of specificAvatars) {
      try {
        const response = await fetch(avatarUrl, { method: 'HEAD' })
        console.log(`   - ${avatarUrl}: ${response.ok ? '✅ Accesible' : '❌ No accesible'} (${response.status})`)
      } catch (error) {
        console.log(`   - ${avatarUrl}: ❌ Error de red`)
      }
    }
    console.log('')

    // 5. Verificar configuración de storage
    console.log('5. 🗂️ Verificando configuración de storage...')
    try {
      const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets()
      
      if (bucketsError) {
        console.log('❌ Error accediendo a buckets:', bucketsError.message)
      } else {
        console.log('✅ Buckets disponibles:')
        buckets.forEach(bucket => {
          console.log(`   - ${bucket.name} (${bucket.public ? 'Público' : 'Privado'})`)
        })
      }
    } catch (err) {
      console.log('❌ No se pudo acceder a la configuración de storage')
    }

    // 6. Recomendaciones
    console.log('\n6. 💡 RECOMENDACIONES:')
    console.log('   - Los avatares están almacenados en Vercel Blob Storage')
    console.log('   - Los usuarios tienen avatares asignados en profiles pero no en users')
    console.log('   - Necesitas sincronizar avatar_url entre users y profiles')
    console.log('   - Considera usar una función para asignar avatares automáticamente')

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar el análisis
analyzeAvatarProblem() 