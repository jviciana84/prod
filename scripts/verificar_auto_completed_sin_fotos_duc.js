/**
 * Script para verificar vehículos con auto_completed = true
 * pero que DUC no tiene fotos (inconsistencia)
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

async function verificarInconsistencias(ejecutarCambios = false) {
  console.log('\n🔍 VERIFICANDO INCONSISTENCIAS: auto_completed PERO SIN FOTOS EN DUC\n');
  console.log('='.repeat(80));

  try {
    // 1. Obtener todos los vehículos de DUC
    const { data: ducVehiculos, error: ducError } = await supabase
      .from('duc_scraper')
      .select('"Matrícula", "Modelo", "URL foto 1", "URL foto 2", "URL foto 3"');

    if (ducError) throw ducError;

    console.log(`\n📋 TOTAL VEHÍCULOS EN DUC: ${ducVehiculos.length}`);

    // 2. Buscar inconsistencias
    const inconsistencias = [];

    for (const ducVehiculo of ducVehiculos) {
      const matricula = ducVehiculo['Matrícula'];
      const modelo = ducVehiculo['Modelo'];

      // Filtrar motos
      const esMoto = modelo && (
        modelo.toLowerCase().includes('motorrad') ||
        modelo.toLowerCase().includes('moto ')
      );

      if (esMoto) continue;

      // Verificar si tiene fotos en DUC
      const tieneFotosEnDuc = !!(
        ducVehiculo['URL foto 1'] || 
        ducVehiculo['URL foto 2'] || 
        ducVehiculo['URL foto 3']
      );

      // Si tiene fotos en DUC, no hay problema
      if (tieneFotosEnDuc) continue;

      // Buscar en tabla fotos
      const { data: fotoData, error: fotoError } = await supabase
        .from('fotos')
        .select('id, license_plate, model, photos_completed, auto_completed, photos_completed_date')
        .eq('license_plate', matricula)
        .single();

      if (fotoError && fotoError.code !== 'PGRST116') continue;
      if (!fotoData) continue;

      // INCONSISTENCIA: auto_completed = true pero DUC sin fotos
      if (fotoData.auto_completed === true && fotoData.photos_completed === true) {
        inconsistencias.push({
          id: fotoData.id,
          license_plate: fotoData.license_plate,
          model: fotoData.model,
          modeloDuc: modelo,
          photos_completed_date: fotoData.photos_completed_date,
          urlFoto1: ducVehiculo['URL foto 1'],
          urlFoto2: ducVehiculo['URL foto 2'],
          urlFoto3: ducVehiculo['URL foto 3'],
        });
      }
    }

    // 3. Mostrar resultados
    console.log('\n' + '='.repeat(80));
    console.log(`🔴 INCONSISTENCIAS ENCONTRADAS: ${inconsistencias.length}`);
    console.log('-'.repeat(80));

    if (inconsistencias.length === 0) {
      console.log('\n✅ No hay inconsistencias');
      return;
    }

    inconsistencias.forEach((item, index) => {
      console.log(`\n${index + 1}. Matrícula: ${item.license_plate}`);
      console.log(`   Modelo: ${item.model}`);
      console.log(`   Completada: ${item.photos_completed_date ? new Date(item.photos_completed_date).toLocaleString() : 'N/A'}`);
      console.log(`   ❌ DUC Foto 1: ${item.urlFoto1 || 'Vacío'}`);
      console.log(`   ❌ DUC Foto 2: ${item.urlFoto2 || 'Vacío'}`);
      console.log(`   ❌ DUC Foto 3: ${item.urlFoto3 || 'Vacío'}`);
      console.log(`   🔴 PROBLEMA: Marcado como auto_completed pero DUC sin fotos`);
    });

    // 4. Ejecutar corrección si se solicita
    if (ejecutarCambios) {
      console.log('\n' + '='.repeat(80));
      console.log('🔄 MARCANDO COMO PENDIENTES (quitando auto_completed)...');
      console.log('-'.repeat(80));

      let actualizados = 0;
      let errores = 0;

      for (const item of inconsistencias) {
        const { error: updateError } = await supabase
          .from('fotos')
          .update({
            photos_completed: false,
            photos_completed_date: null,
            auto_completed: false,
          })
          .eq('id', item.id);

        if (updateError) {
          console.log(`❌ Error: ${item.license_plate}`, updateError.message);
          errores++;
        } else {
          console.log(`✅ ${item.license_plate} corregido`);
          actualizados++;
        }
      }

      console.log('\n' + '='.repeat(80));
      console.log('📊 RESUMEN:');
      console.log(`Actualizados: ${actualizados}`);
      console.log(`Errores: ${errores}`);
      console.log('='.repeat(80));
    } else {
      console.log('\n' + '='.repeat(80));
      console.log('⚠️  MODO SIMULACIÓN');
      console.log('='.repeat(80));
      console.log(`\nEncontradas ${inconsistencias.length} inconsistencias.`);
      console.log('\nPara corregir, ejecuta:');
      console.log('node scripts/verificar_auto_completed_sin_fotos_duc.js --ejecutar');
      console.log('='.repeat(80));
    }

  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

const ejecutarCambios = process.argv.includes('--ejecutar');

if (ejecutarCambios) {
  console.log('⚠️  MODO EJECUCIÓN');
} else {
  console.log('ℹ️  MODO SIMULACIÓN');
}

verificarInconsistencias(ejecutarCambios);

