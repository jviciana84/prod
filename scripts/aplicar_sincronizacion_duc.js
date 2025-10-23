const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function aplicarSincronizacion() {
  console.log('='.repeat(70));
  console.log('APLICAR SINCRONIZACIÓN AUTOMÁTICA: duc_scraper → nuevas_entradas');
  console.log('='.repeat(70));

  try {
    // Leer el archivo SQL
    const sql = fs.readFileSync('triggers/sync_duc_to_nuevas_entradas.sql', 'utf8');
    
    console.log('\n1. Aplicando trigger en base de datos...\n');
    
    // Dividir en statements individuales
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.includes('CREATE') || statement.includes('DROP') || statement.includes('COMMENT')) {
        try {
          // Intentar ejecutar vía RPC
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          
          if (error) {
            console.log('   ⚠️  No se puede ejecutar directamente');
            console.log('   📝 Debes ejecutar manualmente en Supabase SQL Editor');
            break;
          }
        } catch (err) {
          console.log('   ⚠️  Ejecutar manualmente en Supabase');
          break;
        }
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('2. SINCRONIZACIÓN INICIAL DE DATOS EXISTENTES');
    console.log('='.repeat(70));
    
    // Obtener vehículos de duc_scraper que NO están en nuevas_entradas
    console.log('\n   Buscando vehículos en DUC que no están en nuevas_entradas...');
    
    const { data: ducVehicles } = await supabase
      .from('duc_scraper')
      .select('"Matrícula", "Modelo"')
      .not('"Matrícula"', 'is', null)
      .not('"Modelo"', 'is', null);

    const { data: existingEntries } = await supabase
      .from('nuevas_entradas')
      .select('license_plate');

    const existingPlates = new Set(
      (existingEntries || []).map(e => e.license_plate?.toUpperCase().trim())
    );

    const newVehicles = (ducVehicles || []).filter(v => {
      const plate = v['Matrícula']?.toUpperCase().trim();
      return plate && !existingPlates.has(plate);
    });

    console.log(`   Encontrados: ${newVehicles.length} vehículos nuevos\n`);

    if (newVehicles.length === 0) {
      console.log('   ✅ No hay vehículos nuevos para sincronizar');
    } else {
      console.log('   Vehículos a sincronizar:');
      newVehicles.slice(0, 10).forEach((v, i) => {
        console.log(`     ${i + 1}. ${v['Matrícula']} - ${v['Modelo']}`);
      });
      
      if (newVehicles.length > 10) {
        console.log(`     ... y ${newVehicles.length - 10} más`);
      }

      console.log('\n   ⚠️  ¿Deseas sincronizar estos vehículos ahora?');
      console.log('   Para continuar, ejecuta: node scripts/ejecutar_sincronizacion_inicial.js');
      
      // Guardar lista
      fs.writeFileSync(
        'scripts/vehiculos_a_sincronizar.json',
        JSON.stringify(newVehicles, null, 2)
      );
      
      console.log('   ✅ Lista guardada en: scripts/vehiculos_a_sincronizar.json');
    }

    console.log('\n' + '='.repeat(70));
    console.log('INSTRUCCIONES PARA COMPLETAR');
    console.log('='.repeat(70));
    console.log('\n1. Abre Supabase Dashboard → SQL Editor');
    console.log('2. Copia y ejecuta el contenido de:');
    console.log('   triggers/sync_duc_to_nuevas_entradas.sql');
    console.log('\n3. Si hay vehículos nuevos, ejecuta:');
    console.log('   node scripts/ejecutar_sincronizacion_inicial.js');
    console.log('\n4. Una vez aplicado el trigger, cada nuevo vehículo en duc_scraper');
    console.log('   aparecerá automáticamente en nuevas_entradas');
    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

aplicarSincronizacion();

