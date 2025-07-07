const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = 'https://wpjmimbscfsdzcwuwctk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectSupabase() {
  console.log('🔍 === INSPECCIÓN DE SUPABASE ===\n')

  try {
    // 1. Verificar conexión
    console.log('1. ✅ Verificando conexión...')
    const { data: testData, error: testError } = await supabase
      .from('nuevas_entradas')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Error de conexión:', testError)
      return
    }
    console.log('✅ Conexión exitosa\n')

    // 2. Listar todas las tablas
    console.log('2. 📋 Listando tablas disponibles...')
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_names')
    
    if (tablesError) {
      console.log('⚠️ No se pudieron obtener las tablas automáticamente')
      console.log('Intentando obtener información de tablas conocidas...\n')
    } else {
      console.log('Tablas encontradas:', tables)
      console.log('')
    }

    // 3. Verificar tablas específicas que sabemos que existen
    const knownTables = [
      'nuevas_entradas',
      'users',
      'profiles',
      'locations',
      'expense_types',
      'extornos_email_config',
      'entregas_email_config',
      'email_config'
    ]

    console.log('3. 🔍 Verificando tablas específicas...')
    for (const tableName of knownTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`)
        } else {
          console.log(`✅ ${tableName}: ${data.length} registros disponibles`)
        }
      } catch (err) {
        console.log(`❌ ${tableName}: No existe o error de acceso`)
      }
    }
    console.log('')

    // 4. Verificar configuración de usuarios
    console.log('4. 👥 Verificando configuración de usuarios...')
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(5)
      
      if (usersError) {
        console.log('❌ Error accediendo a tabla users:', usersError.message)
      } else {
        console.log(`✅ Tabla users: ${users.length} usuarios encontrados`)
        if (users.length > 0) {
          console.log('Ejemplo de usuario:', {
            id: users[0].id,
            email: users[0].email,
            role: users[0].role
          })
        }
      }
    } catch (err) {
      console.log('❌ No se pudo acceder a la tabla users')
    }
    console.log('')

    // 5. Verificar configuración de email
    console.log('5. 📧 Verificando configuración de email...')
    try {
      const { data: emailConfig, error: emailError } = await supabase
        .from('email_config')
        .select('*')
        .limit(1)
      
      if (emailError) {
        console.log('❌ Error accediendo a email_config:', emailError.message)
      } else {
        console.log(`✅ email_config: ${emailConfig.length} configuraciones`)
        if (emailConfig.length > 0) {
          console.log('Configuración actual:', emailConfig[0])
        }
      }
    } catch (err) {
      console.log('❌ No se pudo acceder a email_config')
    }
    console.log('')

    // 6. Verificar nuevas_entradas
    console.log('6. 🚗 Verificando tabla nuevas_entradas...')
    try {
      const { data: entradas, error: entradasError } = await supabase
        .from('nuevas_entradas')
        .select('*')
        .limit(3)
      
      if (entradasError) {
        console.log('❌ Error accediendo a nuevas_entradas:', entradasError.message)
      } else {
        console.log(`✅ nuevas_entradas: ${entradas.length} registros disponibles`)
        if (entradas.length > 0) {
          console.log('Ejemplo de registro:', {
            id: entradas[0].id,
            license_plate: entradas[0].license_plate,
            model: entradas[0].model,
            is_received: entradas[0].is_received
          })
        }
      }
    } catch (err) {
      console.log('❌ No se pudo acceder a nuevas_entradas')
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar la inspección
inspectSupabase() 