/**
 * Script para marcar como pendientes los vehículos que:
 * 1. Están en DUC
 * 2. NO tienen auto_completed = true (no fueron detectados automáticamente)
 * 3. DUC NO tiene fotos para ellos
 * 4. Solo BPS (sin motos)
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

async function marcarPendientesDucSinFotos(ejecutarCambios = false) {
  console.log('\n🔍 BUSCANDO VEHÍCULOS EN DUC SIN FOTOS AUTOMÁTICAS\n');
  console.log('='.repeat(80));

  try {
    // 1. Obtener TODOS los vehículos de DUC
    const { data: ducVehiculos, error: ducError } = await supabase
      .from('duc_scraper')
      .select('"Matrícula", "Modelo", "URL foto 1", "URL foto 2", "URL foto 3"');

    if (ducError) throw ducError;

    console.log(`\n📋 TOTAL VEHÍCULOS EN DUC: ${ducVehiculos.length}`);
    console.log('-'.repeat(80));

    // 2. Para cada vehículo en DUC, verificar estado en tabla fotos
    const paraMarcarPendiente = [];
    let enDucConFotos = 0;
    let enDucSinFotos = 0;
    let noEnTablaFotos = 0;
    let yaAutoCompletados = 0;

    for (const ducVehiculo of ducVehiculos) {
      const matricula = ducVehiculo['Matrícula'];
      const modelo = ducVehiculo['Modelo'];

      // Filtrar motos
      const esMoto = modelo && (
        modelo.toLowerCase().includes('motorrad') ||
        modelo.toLowerCase().includes('moto ')
      );

      if (esMoto) {
        continue;
      }

      // Verificar si tiene fotos en DUC
      const tieneFotosEnDuc = !!(
        ducVehiculo['URL foto 1'] || 
        ducVehiculo['URL foto 2'] || 
        ducVehiculo['URL foto 3']
      );

      if (tieneFotosEnDuc) {
        enDucConFotos++;
        continue; // Si tiene fotos en DUC, está bien
      }

      enDucSinFotos++;

      // Buscar en tabla fotos
      const { data: fotoData, error: fotoError } = await supabase
        .from('fotos')
        .select('id, license_plate, model, photos_completed, auto_completed, photos_completed_date')
        .eq('license_plate', matricula)
        .single();

      if (fotoError && fotoError.code !== 'PGRST116') {
        console.log(`⚠️  Error consultando fotos para ${matricula}:`, fotoError.message);
        continue;
      }

      // Si no está en tabla fotos, reportar
      if (!fotoData) {
        noEnTablaFotos++;
        console.log(`⚠️  ${matricula} (${modelo}) está en DUC sin fotos pero NO en tabla fotos`);
        continue;
      }

      // Si ya tiene auto_completed = true, está bien
      if (fotoData.auto_completed === true) {
        yaAutoCompletados++;
        continue;
      }

      // Si está marcado como completado pero NO es auto_completed
      if (fotoData.photos_completed === true) {
        paraMarcarPendiente.push({
          id: fotoData.id,
          license_plate: fotoData.license_plate,
          model: fotoData.model,
          modeloDuc: modelo,
          photos_completed_date: fotoData.photos_completed_date,
          auto_completed: fotoData.auto_completed,
        });
      }
    }

    // 3. Mostrar estadísticas
    console.log('\n📊 ESTADÍSTICAS:');
    console.log('-'.repeat(80));
    console.log(`Total en DUC (BPS): ${ducVehiculos.length - (ducVehiculos.length - enDucConFotos - enDucSinFotos)}`);
    console.log(`  ├─ Con fotos en DUC: ${enDucConFotos}`);
    console.log(`  └─ Sin fotos en DUC: ${enDucSinFotos}`);
    console.log(`\nDe los sin fotos en DUC:`);
    console.log(`  ├─ Ya auto-completados correctamente: ${yaAutoCompletados}`);
    console.log(`  ├─ No están en tabla fotos: ${noEnTablaFotos}`);
    console.log(`  └─ Marcados manualmente como completados: ${paraMarcarPendiente.length}`);

    // 4. Mostrar detalles
    if (paraMarcarPendiente.length === 0) {
      console.log('\n✅ ¡No hay vehículos para marcar como pendientes!');
      console.log('='.repeat(80));
      return;
    }

    console.log('\n' + '='.repeat(80));
    console.log('❌ VEHÍCULOS A MARCAR COMO PENDIENTES:');
    console.log('   (En DUC sin fotos, pero marcados como completados)');
    console.log('-'.repeat(80));

    paraMarcarPendiente.forEach((foto, index) => {
      console.log(`\n${index + 1}. Matrícula: ${foto.license_plate}`);
      console.log(`   Modelo (fotos): ${foto.model}`);
      console.log(`   Modelo (DUC): ${foto.modeloDuc}`);
      console.log(`   Fecha completada: ${foto.photos_completed_date ? new Date(foto.photos_completed_date).toLocaleString() : 'N/A'}`);
      console.log(`   Auto completado: ${foto.auto_completed === true ? 'Sí' : 'No'}`);
    });

    // 5. Ejecutar cambios si se solicita
    if (ejecutarCambios) {
      console.log('\n' + '='.repeat(80));
      console.log('🔄 MARCANDO COMO PENDIENTES...');
      console.log('-'.repeat(80));

      let actualizados = 0;
      let errores = 0;

      for (const foto of paraMarcarPendiente) {
        const { error: updateError } = await supabase
          .from('fotos')
          .update({
            photos_completed: false,
            photos_completed_date: null,
          })
          .eq('id', foto.id);

        if (updateError) {
          console.log(`❌ Error actualizando ${foto.license_plate}:`, updateError.message);
          errores++;
        } else {
          console.log(`✅ ${foto.license_plate} marcado como pendiente`);
          actualizados++;
        }
      }

      console.log('\n' + '='.repeat(80));
      console.log('📊 RESUMEN DE ACTUALIZACIÓN:');
      console.log('-'.repeat(80));
      console.log(`Registros actualizados: ${actualizados}`);
      console.log(`Errores: ${errores}`);
      console.log('='.repeat(80));
    } else {
      console.log('\n' + '='.repeat(80));
      console.log('⚠️  MODO SIMULACIÓN - NO SE REALIZARON CAMBIOS');
      console.log('='.repeat(80));
      console.log(`\nSe encontraron ${paraMarcarPendiente.length} vehículos para marcar como pendientes.`);
      console.log('\n📌 CRITERIOS:');
      console.log('   ✓ Vehículos BPS (BMW + MINI, sin Motorrad)');
      console.log('   ✓ ESTÁN en DUC');
      console.log('   ✓ DUC NO tiene fotos (URL vacías)');
      console.log('   ✓ Marcados como completados en tabla fotos');
      console.log('   ✓ NO tienen auto_completed = true');
      console.log('\nPara marcarlos como pendientes, ejecuta:');
      console.log('node scripts/marcar_pendientes_duc_sin_fotos.js --ejecutar');
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

marcarPendientesDucSinFotos(ejecutarCambios);

