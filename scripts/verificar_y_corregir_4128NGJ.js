/**
 * Verificar si 4128NGJ tiene fotos reales en DUC y marcarlo como pendiente
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

async function verificarYCorregir() {
  console.log('\n🔍 VERIFICANDO: 4128NGJ\n');
  console.log('='.repeat(80));

  try {
    // 1. Verificar fotos en DUC
    console.log('📝 Paso 1: Verificando fotos en DUC...');
    console.log('-'.repeat(80));

    const { data: ducData, error: ducError } = await supabase
      .from('duc_scraper')
      .select('*')
      .eq('Matrícula', '4128NGJ')
      .single();

    if (ducError && ducError.code !== 'PGRST116') {
      console.error('❌ Error consultando DUC:', ducError.message);
      process.exit(1);
    }

    if (!ducData) {
      console.log('\n⚠️  4128NGJ NO está en DUC');
    } else {
      console.log(`\n✅ 4128NGJ encontrado en DUC:`);
      console.log(`   Modelo: ${ducData['Modelo']}`);
      console.log(`   Disponibilidad: ${ducData['Disponibilidad']}`);
      
      console.log('\n📸 FOTOS EN DUC:');
      console.log('-'.repeat(80));
      
      // Verificar TODAS las fotos (1-15)
      let tieneFotosReales = false;
      
      console.log('\nFOTOS DUMMY (1-8):');
      for (let i = 1; i <= 8; i++) {
        const urlKey = `URL foto ${i}`;
        const tiene = ducData[urlKey] ? '✅' : '❌';
        if (ducData[urlKey]) {
          console.log(`  ${urlKey}: ${tiene} ${ducData[urlKey].substring(0, 60)}...`);
        } else {
          console.log(`  ${urlKey}: ${tiene}`);
        }
      }
      
      console.log('\nFOTOS REALES (9-15):');
      for (let i = 9; i <= 15; i++) {
        const urlKey = `URL foto ${i}`;
        const tiene = ducData[urlKey] ? '✅' : '❌';
        if (ducData[urlKey]) {
          tieneFotosReales = true;
          console.log(`  ${urlKey}: ${tiene} ${ducData[urlKey].substring(0, 60)}...`);
        } else {
          console.log(`  ${urlKey}: ${tiene}`);
        }
      }
      
      console.log('\n' + '-'.repeat(80));
      if (tieneFotosReales) {
        console.log('✅ TIENE FOTOS REALES (9+)');
      } else {
        console.log('❌ NO TIENE FOTOS REALES (solo dummy 1-8)');
      }
    }

    // 2. Ver estado en tabla fotos
    console.log('\n' + '='.repeat(80));
    console.log('📊 Paso 2: Estado en tabla fotos...');
    console.log('-'.repeat(80));

    const { data: fotoData, error: fotoError } = await supabase
      .from('fotos')
      .select('id, license_plate, model, photos_completed, auto_completed, photos_completed_date')
      .eq('license_plate', '4128NGJ')
      .single();

    if (fotoError) {
      console.error('❌ Error consultando fotos:', fotoError.message);
      process.exit(1);
    }

    console.log(`\nEstado actual:`);
    console.log(`  Matrícula: ${fotoData.license_plate}`);
    console.log(`  Modelo: ${fotoData.model}`);
    console.log(`  Completado: ${fotoData.photos_completed ? 'SÍ' : 'NO'}`);
    console.log(`  Auto-completado: ${fotoData.auto_completed ? 'SÍ' : 'NO'}`);
    console.log(`  Fecha: ${fotoData.photos_completed_date ? new Date(fotoData.photos_completed_date).toLocaleString('es-ES') : 'N/A'}`);

    // 3. Marcar como pendiente
    console.log('\n' + '='.repeat(80));
    console.log('🔄 Paso 3: Marcando como PENDIENTE...');
    console.log('-'.repeat(80));

    const { error: updateError } = await supabase
      .from('fotos')
      .update({
        photos_completed: false,
        photos_completed_date: null,
        auto_completed: false
      })
      .eq('license_plate', '4128NGJ');

    if (updateError) {
      console.error('❌ Error actualizando:', updateError.message);
      process.exit(1);
    }

    console.log('\n✅ 4128NGJ marcado como PENDIENTE');
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ OPERACIÓN COMPLETADA');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

verificarYCorregir();


