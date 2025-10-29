/**
 * Script para configurar las tablas del Comparador de Precios en Supabase
 * 
 * Ejecutar: node scripts/setup_comparador_db.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno')
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('🚀 Iniciando configuración del Comparador de Precios...\n')

  try {
    // Leer archivo SQL
    const sqlPath = path.join(__dirname, '..', 'sql', 'create_comparador_tables.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('📄 Archivo SQL cargado:', sqlPath)
    console.log('📊 Ejecutando script...\n')

    // Ejecutar SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      // Si no existe la función exec_sql, intentar ejecutar directamente
      console.log('⚠️  Función exec_sql no disponible')
      console.log('💡 Por favor, ejecuta manualmente el SQL en Supabase:')
      console.log('   1. Ir a https://wpjmimbscfsdzcwuwctk.supabase.co')
      console.log('   2. SQL Editor → New Query')
      console.log('   3. Copiar contenido de: sql/create_comparador_tables.sql')
      console.log('   4. Ejecutar\n')
      throw error
    }

    console.log('✅ Tablas creadas exitosamente\n')

    // Verificar tablas creadas
    console.log('🔍 Verificando tablas...\n')

    const { data: scraperCount, error: scraperError } = await supabase
      .from('comparador_scraper')
      .select('count', { count: 'exact', head: true })

    if (!scraperError) {
      console.log('✅ Tabla comparador_scraper: OK')
    }

    const { data: historialCount, error: historialError } = await supabase
      .from('comparador_historial_precios')
      .select('count', { count: 'exact', head: true })

    if (!historialError) {
      console.log('✅ Tabla comparador_historial_precios: OK')
    }

    // Verificar vistas analíticas
    console.log('\n📈 Verificando vistas analíticas...')
    
    const vistas = [
      'comparador_stats_por_modelo',
      'comparador_stats_por_concesionario',
      'comparador_modelos_mas_competitivos',
      'comparador_estrategias_concesionarios'
    ]

    for (const vista of vistas) {
      const { error } = await supabase
        .from(vista)
        .select('count', { count: 'exact', head: true })
      
      if (!error) {
        console.log(`  ✅ Vista ${vista}: OK`)
      } else {
        console.log(`  ⚠️  Vista ${vista}: No encontrada (ejecutar analytics_comparador.sql)`)
      }
    }

    console.log('\n🎉 Configuración completada!')
    console.log('\n📝 Próximos pasos:')
    console.log('   1. Ejecutar scraper para poblar comparador_scraper')
    console.log('   2. Verificar que tabla stock tiene precios')
    console.log('   3. (Opcional) Actualizar original_new_price en stock')
    console.log('   4. Acceder a /dashboard/comparador-precios\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('\n💡 Si el error persiste, ejecuta manualmente el SQL en Supabase')
    process.exit(1)
  }
}

main()

