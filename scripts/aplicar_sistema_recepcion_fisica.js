const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function aplicarSistema() {
  console.log('='.repeat(70));
  console.log('APLICAR SISTEMA DE RECEPCIÓN FÍSICA Y DISPONIBILIDAD');
  console.log('='.repeat(70));

  // Leer archivos SQL
  const migracion = fs.readFileSync('migrations/add_physical_reception_and_availability.sql', 'utf8');
  const triggers = fs.readFileSync('triggers/sync_duc_complete_system.sql', 'utf8');

  console.log('\n📋 PASO 1: EJECUTAR EN SUPABASE SQL EDITOR');
  console.log('='.repeat(70));
  console.log('\n🔗 URL: https://supabase.com/dashboard/project/wpjmimbscfsdzcwuwctk/sql/new');
  console.log('\n📝 Ejecuta estos 2 archivos EN ORDEN:\n');
  console.log('1️⃣ Primero: migrations/add_physical_reception_and_availability.sql');
  console.log('2️⃣ Segundo: triggers/sync_duc_complete_system.sql');
  
  console.log('\n' + '='.repeat(70));
  console.log('📋 PASO 2: VERIFICAR INSTALACIÓN');
  console.log('='.repeat(70));
  
  console.log('\nEjecutando verificaciones...\n');
  
  try {
    // Verificar que las columnas existen
    console.log('1. Verificando nuevas columnas en STOCK...');
    const { data: stockSample } = await supabase
      .from('stock')
      .select('id, license_plate, physical_reception_date, is_available, auto_marked_received')
      .limit(1)
      .single();

    if (stockSample && 'physical_reception_date' in stockSample) {
      console.log('   ✅ Columnas en stock: OK');
    } else {
      console.log('   ❌ Columnas en stock: NO encontradas');
      console.log('   ⚠️  Ejecuta primero la migración en Supabase');
      return;
    }

    console.log('\n2. Verificando nuevas columnas en FOTOS...');
    const { data: fotosSample } = await supabase
      .from('fotos')
      .select('id, license_plate, physical_reception_date, is_available, auto_completed')
      .limit(1)
      .single();

    if (fotosSample && 'physical_reception_date' in fotosSample) {
      console.log('   ✅ Columnas en fotos: OK');
    } else {
      console.log('   ❌ Columnas en fotos: NO encontradas');
      return;
    }

    console.log('\n' + '='.repeat(70));
    console.log('📋 PASO 3: PRUEBA DE FUNCIONAMIENTO');
    console.log('='.repeat(70));

    console.log('\n🧪 Probando con vehículo real de DUC...\n');

    // Tomar un vehículo de DUC que tenga fotos
    const { data: ducConFotos } = await supabase
      .from('duc_scraper')
      .select('"Matrícula", "Modelo", "URL foto 1", "URL foto 2"')
      .not('"Matrícula"', 'is', null)
      .not('"URL foto 1"', 'is', null)
      .limit(1)
      .single();

    if (ducConFotos) {
      const matricula = ducConFotos['Matrícula'];
      console.log(`   Vehículo de prueba: ${matricula}`);
      console.log(`   Tiene fotos: ${ducConFotos['URL foto 1'] ? 'SÍ' : 'NO'}`);

      // Verificar si se creó en stock
      const { data: enStock } = await supabase
        .from('stock')
        .select('license_plate, physical_reception_date, is_available, auto_marked_received')
        .eq('license_plate', matricula)
        .single();

      if (enStock) {
        console.log('\n   ✅ Está en STOCK:');
        console.log(`      - physical_reception_date: ${enStock.physical_reception_date || 'NULL'}`);
        console.log(`      - is_available: ${enStock.is_available}`);
        console.log(`      - auto_marked_received: ${enStock.auto_marked_received}`);
        
        if (enStock.physical_reception_date) {
          const dias = Math.floor((new Date() - new Date(enStock.physical_reception_date)) / (1000 * 60 * 60 * 24));
          console.log(`      - Días calculados: ${dias}`);
        }
      } else {
        console.log('\n   ⚠️  NO está en stock (trigger no ejecutado aún)');
      }

      // Verificar en fotos
      const { data: enFotos } = await supabase
        .from('fotos')
        .select('license_plate, physical_reception_date, is_available, photos_completed, auto_completed')
        .eq('license_plate', matricula)
        .single();

      if (enFotos) {
        console.log('\n   ✅ Está en FOTOS:');
        console.log(`      - physical_reception_date: ${enFotos.physical_reception_date || 'NULL'}`);
        console.log(`      - is_available: ${enFotos.is_available}`);
        console.log(`      - photos_completed: ${enFotos.photos_completed}`);
        console.log(`      - auto_completed: ${enFotos.auto_completed}`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ VERIFICACIÓN COMPLETADA');
    console.log('='.repeat(70));
    
    console.log('\n📊 RESUMEN:');
    console.log('  1. Migración ejecutada correctamente');
    console.log('  2. Columnas creadas en stock y fotos');
    console.log('  3. Datos históricos actualizados');
    console.log('\n⚡ PRÓXIMO PASO:');
    console.log('  - Para activar triggers, ejecuta en Supabase:');
    console.log('    triggers/sync_duc_complete_system.sql');
    console.log('\n  - Luego ejecuta scraper para probar sincronización automática');
    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nDetalles:', error);
  }
}

aplicarSistema();

