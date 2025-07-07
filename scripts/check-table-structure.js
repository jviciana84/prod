const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = 'https://wpjmimbscfsdzcwuwctk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTableStructure() {
  console.log('🔍 === VERIFICANDO ESTRUCTURA DE TABLAS ===\n')

  try {
    // 1. Verificar estructura de la tabla users
    console.log('1. 📋 Estructura de la tabla users:')
    const { data: usersStructure, error: usersStructureError } = await supabase
      .rpc('get_table_structure', { table_name: 'users' })
    
    if (usersStructureError) {
      console.log('❌ Error obteniendo estructura de users:', usersStructureError.message)
      console.log('Intentando obtener información de otra manera...')
      
      // Intentar obtener una muestra de datos para inferir la estructura
      const { data: usersSample, error: usersSampleError } = await supabase
        .from('users')
        .select('*')
        .limit(1)
      
      if (usersSampleError) {
        console.log('❌ Error obteniendo muestra de users:', usersSampleError.message)
      } else if (usersSample && usersSample.length > 0) {
        console.log('✅ Columnas disponibles en users:')
        Object.keys(usersSample[0]).forEach(column => {
          console.log(`   - ${column}: ${typeof usersSample[0][column]}`)
        })
      }
    } else {
      console.log('✅ Estructura de users:')
      usersStructure.forEach(column => {
        console.log(`   - ${column.column_name}: ${column.data_type}`)
      })
    }
    console.log('')

    // 2. Verificar estructura de la tabla profiles
    console.log('2. 📋 Estructura de la tabla profiles:')
    const { data: profilesStructure, error: profilesStructureError } = await supabase
      .rpc('get_table_structure', { table_name: 'profiles' })
    
    if (profilesStructureError) {
      console.log('❌ Error obteniendo estructura de profiles:', profilesStructureError.message)
      console.log('Intentando obtener información de otra manera...')
      
      // Intentar obtener una muestra de datos para inferir la estructura
      const { data: profilesSample, error: profilesSampleError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
      
      if (profilesSampleError) {
        console.log('❌ Error obteniendo muestra de profiles:', profilesSampleError.message)
      } else if (profilesSample && profilesSample.length > 0) {
        console.log('✅ Columnas disponibles en profiles:')
        Object.keys(profilesSample[0]).forEach(column => {
          console.log(`   - ${column}: ${typeof profilesSample[0][column]}`)
        })
      }
    } else {
      console.log('✅ Estructura de profiles:')
      profilesStructure.forEach(column => {
        console.log(`   - ${column.column_name}: ${column.data_type}`)
      })
    }
    console.log('')

    // 3. Verificar si existe la función get_table_structure
    console.log('3. 🔧 Verificando función get_table_structure...')
    try {
      const { data: functionExists, error: functionError } = await supabase
        .rpc('get_table_structure', { table_name: 'users' })
      
      if (functionError) {
        console.log('❌ La función get_table_structure no existe')
        console.log('Creando función para obtener estructura de tablas...')
        
        const createFunctionSQL = `
-- Función para obtener estructura de tablas
CREATE OR REPLACE FUNCTION get_table_structure(table_name text)
RETURNS TABLE(column_name text, data_type text) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::text,
    c.data_type::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' 
    AND c.table_name = $1
  ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql;
`
        console.log('📝 SQL para crear función:')
        console.log(createFunctionSQL)
      } else {
        console.log('✅ La función get_table_structure existe')
      }
    } catch (err) {
      console.log('❌ Error verificando función:', err.message)
    }

    // 4. Verificar relación entre users y profiles
    console.log('\n4. 🔗 Verificando relación entre users y profiles...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
    
    if (!usersError && !profilesError) {
      console.log(`✅ Users: ${users.length} registros`)
      console.log(`✅ Profiles: ${profiles.length} registros`)
      
      // Verificar coincidencias
      const userIds = users.map(u => u.id)
      const profileIds = profiles.map(p => p.id)
      
      const matchingIds = userIds.filter(id => profileIds.includes(id))
      console.log(`✅ Coincidencias: ${matchingIds.length} usuarios tienen perfil`)
      
      if (matchingIds.length < users.length) {
        console.log('⚠️ Algunos usuarios no tienen perfil')
        const missingProfiles = userIds.filter(id => !profileIds.includes(id))
        console.log('   Usuarios sin perfil:', missingProfiles)
      }
      
      if (matchingIds.length < profiles.length) {
        console.log('⚠️ Algunos perfiles no tienen usuario correspondiente')
        const orphanProfiles = profileIds.filter(id => !userIds.includes(id))
        console.log('   Perfiles huérfanos:', orphanProfiles)
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar la verificación
checkTableStructure() 