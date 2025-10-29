/**
 * Marcar 9384LMM como pendiente y mostrar último marcado como realizado
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

async function ejecutar() {
  console.log('\n🔧 OPERACIÓN: Marcar 9384LMM como pendiente\n');
  console.log('='.repeat(80));

  try {
    // 1. Marcar 9384LMM como pendiente
    console.log('📝 Paso 1: Marcando 9384LMM como pendiente...');
    console.log('-'.repeat(80));

    const { data: vehiculo, error: error1 } = await supabase
      .from('fotos')
      .select('id, license_plate, model, photos_completed, photos_completed_date')
      .eq('license_plate', '9384LMM')
      .single();

    if (error1) {
      console.error('❌ Error buscando vehículo:', error1.message);
      process.exit(1);
    }

    if (!vehiculo) {
      console.error('❌ No se encontró el vehículo 9384LMM');
      process.exit(1);
    }

    console.log(`\nVehículo encontrado:`);
    console.log(`  Matrícula: ${vehiculo.license_plate}`);
    console.log(`  Modelo: ${vehiculo.model}`);
    console.log(`  Estado actual: ${vehiculo.photos_completed ? 'Completado' : 'Pendiente'}`);
    console.log(`  Fecha completado: ${vehiculo.photos_completed_date ? new Date(vehiculo.photos_completed_date).toLocaleString('es-ES') : 'N/A'}`);

    const { error: updateError } = await supabase
      .from('fotos')
      .update({
        photos_completed: false,
        photos_completed_date: null
      })
      .eq('license_plate', '9384LMM');

    if (updateError) {
      console.error('❌ Error actualizando:', updateError.message);
      process.exit(1);
    }

    console.log('\n✅ 9384LMM marcado como PENDIENTE');

    // 2. Buscar el último marcado como completado
    console.log('\n' + '='.repeat(80));
    console.log('📊 Paso 2: Buscando último vehículo marcado como completado...');
    console.log('-'.repeat(80));

    const { data: ultimosCompletados, error: error2 } = await supabase
      .from('fotos')
      .select('license_plate, model, photos_completed_date, auto_completed')
      .eq('photos_completed', true)
      .not('photos_completed_date', 'is', null)
      .order('photos_completed_date', { ascending: false })
      .limit(10);

    if (error2) {
      console.error('❌ Error consultando:', error2.message);
      process.exit(1);
    }

    console.log('\n📋 ÚLTIMOS 10 VEHÍCULOS MARCADOS COMO COMPLETADOS:');
    console.log('-'.repeat(80));

    ultimosCompletados.forEach((v, i) => {
      const fecha = new Date(v.photos_completed_date).toLocaleString('es-ES');
      const tipo = v.auto_completed ? '🤖 AUTO' : '👤 MANUAL';
      const ultimo = i === 0 ? ' ← ÚLTIMO' : '';
      console.log(`${(i + 1).toString().padStart(2)}. ${v.license_plate.padEnd(10)} - ${v.model.padEnd(40)} [${fecha}] ${tipo}${ultimo}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ OPERACIÓN COMPLETADA');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

ejecutar();


