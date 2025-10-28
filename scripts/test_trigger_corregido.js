/**
 * Test: Verificar que el trigger funciona con lógica correcta (fotos 9+)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTrigger() {
  console.log('\n🧪 TEST: Verificando trigger corregido\n');
  console.log('='.repeat(80));

  try {
    // 1. Tomar algunos vehículos que sabemos que NO tienen fotos 9+
    const vehiculosSinFotos9 = ['6272HRK', '4462JKS', '3805MBL'];
    
    console.log('📝 Verificando vehículos que NO tienen fotos 9+ en DUC:');
    console.log('='.repeat(80));

    for (const matricula of vehiculosSinFotos9) {
      // Ver en DUC
      const { data: ducData } = await supabase
        .from('duc_scraper')
        .select('"Matrícula", "Modelo", "URL foto 1", "URL foto 9", "URL foto 10"')
        .eq('Matrícula', matricula)
        .single();

      // Ver en fotos
      const { data: fotoData } = await supabase
        .from('fotos')
        .select('license_plate, photos_completed, auto_completed, photos_completed_date')
        .eq('license_plate', matricula)
        .single();

      console.log(`\n${matricula}:`);
      console.log(`  DUC: ${ducData ? 'Sí está' : 'No está'}`);
      if (ducData) {
        console.log(`    - URL foto 1: ${ducData['URL foto 1'] ? '✅' : '❌'}`);
        console.log(`    - URL foto 9: ${ducData['URL foto 9'] ? '✅' : '❌'}`);
        console.log(`    - URL foto 10: ${ducData['URL foto 10'] ? '✅' : '❌'}`);
      }
      if (fotoData) {
        console.log(`  Tabla fotos:`);
        console.log(`    - Completado: ${fotoData.photos_completed ? '✅ SÍ' : '❌ NO'}`);
        console.log(`    - Auto-completado: ${fotoData.auto_completed ? '✅ SÍ' : '❌ NO'}`);
        console.log(`    - Fecha: ${fotoData.photos_completed_date || 'N/A'}`);
      }
    }

    // 2. Ver si hay otros triggers activos
    console.log('\n' + '='.repeat(80));
    console.log('🔍 Buscando triggers que puedan estar afectando tabla fotos...');
    console.log('='.repeat(80));

    const triggers = [
      'trigger_sync_duc_to_all_tables',
      'trigger_auto_mark_received',
      'trigger_auto_complete_fotos_on_sale',
      'trigger_sync_received_status'
    ];

    console.log('\nTriggers que deberían estar activos:');
    triggers.forEach(t => console.log(`  - ${t}`));

    console.log('\n' + '='.repeat(80));
    console.log('📋 CONCLUSIÓN:');
    console.log('='.repeat(80));
    console.log('\nSi los vehículos de arriba están marcados como completados');
    console.log('pero NO tienen URL foto 9+, significa que:');
    console.log('  1. El trigger NO se aplicó correctamente');
    console.log('  2. O hay OTRO proceso marcándolos');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

testTrigger();

