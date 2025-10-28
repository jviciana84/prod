/**
 * Marcar como pendientes los vehículos que:
 * - Están en DUC
 * - Solo tienen fotos dummy (1-8), NO fotos reales (9+)
 * - Están marcados como completados
 * - Solo BPS (sin motos)
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

async function marcarPendientesSinFotosReales(ejecutarCambios = false) {
  console.log('\n🔄 MARCAR COMO PENDIENTES: Vehículos sin fotos reales en DUC\n');
  console.log('='.repeat(80));
  console.log('LÓGICA: URL foto 9+ = FOTOS REALES | URL foto 1-8 = DUMMY');
  console.log('='.repeat(80));

  try {
    // 1. Obtener vehículos completados
    const { data: vehiculosCompletados, error: fotosError } = await supabase
      .from('fotos')
      .select('id, license_plate, model, photos_completed, auto_completed, photos_completed_date')
      .eq('photos_completed', true);

    if (fotosError) throw fotosError;

    console.log(`\n📋 VEHÍCULOS COMPLETADOS EN TABLA FOTOS: ${vehiculosCompletados.length}`);

    // 2. Filtrar los que necesitan marcarse como pendientes
    const paraMarcarPendiente = [];

    for (const vehiculo of vehiculosCompletados) {
      // Filtrar motos
      const esMoto = vehiculo.model && (
        vehiculo.model.toLowerCase().includes('motorrad') ||
        vehiculo.model.toLowerCase().includes('moto ')
      );

      if (esMoto) continue;

      // Buscar en DUC
      const { data: ducData, error: ducError } = await supabase
        .from('duc_scraper')
        .select('"Matrícula", "Modelo", "URL foto 9", "URL foto 10", "URL foto 11", "URL foto 12", "URL foto 13", "URL foto 14", "URL foto 15"')
        .eq('Matrícula', vehiculo.license_plate)
        .single();

      if (ducError && ducError.code !== 'PGRST116') continue;
      
      // Si no está en DUC, está bien (fotografiado interno)
      if (!ducData) continue;

      // Verificar si tiene fotos REALES (9+)
      const tieneFotosReales = !!(
        ducData['URL foto 9'] || 
        ducData['URL foto 10'] || 
        ducData['URL foto 11'] ||
        ducData['URL foto 12'] ||
        ducData['URL foto 13'] ||
        ducData['URL foto 14'] ||
        ducData['URL foto 15']
      );

      // Si NO tiene fotos reales pero está completado = INCONSISTENCIA
      if (!tieneFotosReales) {
        paraMarcarPendiente.push({
          id: vehiculo.id,
          license_plate: vehiculo.license_plate,
          model: vehiculo.model,
          modeloDuc: ducData['Modelo'],
          photos_completed_date: vehiculo.photos_completed_date,
          auto_completed: vehiculo.auto_completed
        });
      }
    }

    // 3. Mostrar resultados
    console.log(`\n🔴 VEHÍCULOS A MARCAR COMO PENDIENTES: ${paraMarcarPendiente.length}`);
    console.log('   (En DUC pero solo con fotos dummy, sin fotos reales)');
    console.log('-'.repeat(80));

    if (paraMarcarPendiente.length === 0) {
      console.log('\n✅ No hay inconsistencias. Todo correcto.');
      return;
    }

    paraMarcarPendiente.forEach((v, i) => {
      console.log(`${i + 1}. ${v.license_plate} - ${v.model}`);
    });

    // 4. Ejecutar cambios si se solicita
    if (ejecutarCambios) {
      console.log('\n' + '='.repeat(80));
      console.log('🔄 MARCANDO COMO PENDIENTES...');
      console.log('-'.repeat(80));

      let actualizados = 0;
      let errores = 0;

      for (const vehiculo of paraMarcarPendiente) {
        const { error: updateError } = await supabase
          .from('fotos')
          .update({
            photos_completed: false,
            photos_completed_date: null,
          })
          .eq('id', vehiculo.id);

        if (updateError) {
          console.log(`❌ Error: ${vehiculo.license_plate} - ${updateError.message}`);
          errores++;
        } else {
          console.log(`✅ ${vehiculo.license_plate} marcado como pendiente`);
          actualizados++;
        }
      }

      console.log('\n' + '='.repeat(80));
      console.log('📊 RESUMEN DE ACTUALIZACIÓN:');
      console.log('-'.repeat(80));
      console.log(`✅ Registros actualizados: ${actualizados}`);
      console.log(`❌ Errores: ${errores}`);
      console.log('='.repeat(80));
      
      if (actualizados > 0) {
        console.log('\n✅ Los vehículos ahora aparecerán como pendientes para fotografiar.');
      }
    } else {
      console.log('\n' + '='.repeat(80));
      console.log('⚠️  MODO SIMULACIÓN - NO SE REALIZARON CAMBIOS');
      console.log('='.repeat(80));
      console.log(`\nSe encontraron ${paraMarcarPendiente.length} vehículos para marcar como pendientes.`);
      console.log('\n📌 CRITERIOS:');
      console.log('   ✓ Vehículos BPS (BMW + MINI, sin Motorrad)');
      console.log('   ✓ ESTÁN en DUC');
      console.log('   ✓ Solo tienen fotos dummy (1-8)');
      console.log('   ✓ NO tienen fotos reales (9+)');
      console.log('   ✓ Marcados como completados');
      console.log('\nPara ejecutar los cambios, ejecuta:');
      console.log('node scripts/marcar_pendientes_sin_fotos_reales.js --ejecutar');
      console.log('='.repeat(80));
    }

  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

// Verificar argumentos
const ejecutarCambios = process.argv.includes('--ejecutar');

if (ejecutarCambios) {
  console.log('⚠️  MODO EJECUCIÓN: Se marcarán como pendientes');
} else {
  console.log('ℹ️  MODO SIMULACIÓN: Solo se mostrarán los resultados');
}

marcarPendientesSinFotosReales(ejecutarCambios);

