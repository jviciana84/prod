/**
 * URGENTE: Desactivar trigger y corregir vehículos
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function desactivarYCorregir() {
  console.log('\n🚨 DESACTIVANDO TRIGGER Y CORRIGIENDO VEHÍCULOS\n');
  console.log('='.repeat(80));

  try {
    // 1. Desactivar trigger
    console.log('📝 Paso 1: Desactivando trigger problemático...');
    console.log('-'.repeat(80));

    const sqlContent = readFileSync('DESACTIVAR_TRIGGER_DUC_URGENTE.sql', 'utf8');
    
    const { error: triggerError } = await supabase.rpc('exec_sql', { 
      sql_query: sqlContent 
    });

    if (triggerError) {
      console.log('⚠️  Por favor, ejecuta manualmente en Supabase SQL Editor:');
      console.log('   DROP TRIGGER IF EXISTS trigger_sync_duc_to_all_tables ON duc_scraper;');
    } else {
      console.log('✅ Trigger desactivado');
    }

    // 2. Corregir vehículos marcados incorrectamente
    console.log('\n📝 Paso 2: Corrigiendo vehículos sin fotos reales...');
    console.log('-'.repeat(80));

    const vehiculosCorregir = ['6272HRK', '4462JKS'];
    
    for (const matricula of vehiculosCorregir) {
      const { error: updateError } = await supabase
        .from('fotos')
        .update({
          photos_completed: false,
          photos_completed_date: null,
          auto_completed: false
        })
        .eq('license_plate', matricula);

      if (updateError) {
        console.log(`❌ Error: ${matricula}`);
      } else {
        console.log(`✅ ${matricula} marcado como PENDIENTE`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ OPERACIÓN COMPLETADA');
    console.log('='.repeat(80));
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   - Trigger DUC desactivado');
    console.log('   - Ahora SOLO marcado manual por fotógrafos');
    console.log('   - NO más auto-completados incorrectos');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

desactivarYCorregir();

