const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase con service role key
const supabaseUrl = 'https://wpjmimbscfsdzcwuwctk.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function getAnonKey() {
  console.log('🔑 === OBTENIENDO CLAVE ANÓNIMA ===\n')

  try {
    // Intentar obtener la configuración del proyecto
    const { data: config, error } = await supabase
      .from('config')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('No se pudo obtener configuración de la base de datos')
    } else {
      console.log('Configuración encontrada:', config)
    }

    // La clave anónima típicamente se puede obtener de la configuración del proyecto
    // o necesitamos acceder al dashboard de Supabase
    
    console.log('\n📋 INFORMACIÓN IMPORTANTE:')
    console.log('Para obtener la clave anónima correcta, necesitas:')
    console.log('1. Ir a https://supabase.com/dashboard/project/wpjmimbscfsdzcwuwctk/settings/api')
    console.log('2. Copiar la "anon public" key')
    console.log('3. Reemplazar la clave en el archivo .env.local')
    
    console.log('\n🔗 URL del proyecto: https://wpjmimbscfsdzcwuwctk.supabase.co')
    console.log('🔑 Service Role Key (ya tienes): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

getAnonKey() 