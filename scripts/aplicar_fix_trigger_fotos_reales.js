/**
 * 1. Aplicar trigger corregido
 * 2. Corregir los 35 vehículos mal marcados
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

async function aplicarFixCompleto() {
  console.log('\n🔧 APLICANDO FIX COMPLETO: Trigger + Datos\n');
  console.log('='.repeat(80));

  try {
    // 1. Aplicar trigger corregido
    console.log('📝 Paso 1: Aplicando trigger corregido...');
    console.log('-'.repeat(80));
    
    const triggerSQL = readFileSync('triggers/sync_duc_complete_system.sql', 'utf8');
    
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql_query: triggerSQL
    });

    if (triggerError) {
      console.error('❌ Error aplicando trigger:', triggerError);
      console.log('\n⚠️  Aplicar manualmente el trigger desde Supabase SQL Editor');
      console.log('   Archivo: triggers/sync_duc_complete_system.sql');
    } else {
      console.log('✅ Trigger aplicado correctamente');
    }

    // 2. Encontrar vehículos mal marcados
    console.log('\n📊 Paso 2: Identificando vehículos mal marcados...');
    console.log('-'.repeat(80));

    const { data: vehiculosCompletados, error: fotosError } = await supabase
      .from('fotos')
      .select('id, license_plate, model, photos_completed, auto_completed')
      .eq('photos_completed', true)
      .eq('auto_completed', true);

    if (fotosError) throw fotosError;

    const paraCorregir = [];

    for (const vehiculo of vehiculosCompletados) {
      const esMoto = vehiculo.model && (
        vehiculo.model.toLowerCase().includes('motorrad') ||
        vehiculo.model.toLowerCase().includes('moto ')
      );

      if (esMoto) continue;

      const { data: ducData, error: ducError } = await supabase
        .from('duc_scraper')
        .select('"Matrícula", "URL foto 9", "URL foto 10", "URL foto 11", "URL foto 12", "URL foto 13", "URL foto 14", "URL foto 15"')
        .eq('Matrícula', vehiculo.license_plate)
        .single();

      if (ducError && ducError.code !== 'PGRST116') continue;
      if (!ducData) continue;

      const tieneFotosReales = !!(
        ducData['URL foto 9'] || 
        ducData['URL foto 10'] || 
        ducData['URL foto 11'] ||
        ducData['URL foto 12'] ||
        ducData['URL foto 13'] ||
        ducData['URL foto 14'] ||
        ducData['URL foto 15']
      );

      if (!tieneFotosReales) {
        paraCorregir.push(vehiculo);
      }
    }

    console.log(`\n❌ Vehículos mal marcados encontrados: ${paraCorregir.length}`);

    if (paraCorregir.length === 0) {
      console.log('\n✅ ¡No hay vehículos que corregir!');
      console.log('='.repeat(80));
      return;
    }

    // 3. Corregir vehículos
    console.log('\n🔄 Paso 3: Corrigiendo vehículos...');
    console.log('-'.repeat(80));

    let corregidos = 0;
    let errores = 0;

    for (const vehiculo of paraCorregir) {
      const { error: updateError } = await supabase
        .from('fotos')
        .update({
          photos_completed: false,
          photos_completed_date: null,
          auto_completed: false,
        })
        .eq('id', vehiculo.id);

      if (updateError) {
        console.log(`❌ Error: ${vehiculo.license_plate}`);
        errores++;
      } else {
        console.log(`✅ ${vehiculo.license_plate} corregido`);
        corregidos++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN FINAL:');
    console.log('='.repeat(80));
    console.log(`✅ Vehículos corregidos: ${corregidos}`);
    console.log(`❌ Errores: ${errores}`);
    console.log('\n✅ Trigger corregido: Ahora solo detecta fotos reales (9+)');
    console.log('✅ Datos corregidos: Vehículos con fotos dummy marcados como pendientes');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

aplicarFixCompleto();


