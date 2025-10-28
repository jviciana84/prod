/**
 * Script para verificar fotos marcadas manualmente que NO tienen fotos en DUC
 * Si están marcadas como completadas pero no hay fotos en DUC, las marca como pendientes
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

async function verificarFotosManualesSinDuc(ejecutarCambios = false) {
  console.log('\n🔍 VERIFICANDO FOTOS MANUALES SIN FOTOS EN DUC\n');
  console.log('='.repeat(80));

  try {
    // 1. Obtener fotos marcadas como completadas manualmente (auto_completed = false/null)
    const { data: fotosManuales, error: fotosError } = await supabase
      .from('fotos')
      .select('id, license_plate, model, photos_completed, auto_completed, photos_completed_date')
      .eq('photos_completed', true)
      .or('auto_completed.is.null,auto_completed.eq.false');

    if (fotosError) throw fotosError;

    console.log(`\n📋 FOTOS COMPLETADAS MANUALMENTE: ${fotosManuales.length}`);
    console.log('-'.repeat(80));

    // 2. Para cada foto manual, verificar si tiene fotos en DUC
    const sinFotosEnDuc = [];

    for (const foto of fotosManuales) {
      // Filtrar motos (solo BPS = BMW + MINI)
      const esMoto = foto.model && (
        foto.model.toLowerCase().includes('motorrad') ||
        foto.model.toLowerCase().includes('moto ')
      );

      if (esMoto) {
        continue; // Saltar motos
      }

      // Buscar en duc_scraper
      const { data: ducData, error: ducError } = await supabase
        .from('duc_scraper')
        .select('"Matrícula", "Modelo", "URL foto 1", "URL foto 2", "URL foto 3"')
        .eq('Matrícula', foto.license_plate)
        .single();

      if (ducError && ducError.code !== 'PGRST116') {
        // PGRST116 = no encontrado, que es esperado
        console.log(`⚠️  Error consultando DUC para ${foto.license_plate}:`, ducError.message);
        continue;
      }

      // SOLO si está en DUC (si no está, ignorar)
      if (!ducData) {
        continue;
      }

      // Verificar si tiene fotos en DUC
      const tieneFotosEnDuc = ducData && (
        ducData['URL foto 1'] || 
        ducData['URL foto 2'] || 
        ducData['URL foto 3']
      );

      // SOLO añadir si ESTÁ en DUC pero NO tiene fotos
      if (!tieneFotosEnDuc) {
        sinFotosEnDuc.push({
          ...foto,
          enDuc: true,
          modeloDuc: ducData['Modelo'],
          urlFoto1: ducData['URL foto 1'] || null,
          urlFoto2: ducData['URL foto 2'] || null,
          urlFoto3: ducData['URL foto 3'] || null,
        });
      }
    }

    // 3. Mostrar resultados
    console.log(`\n❌ FOTOS MARCADAS COMO COMPLETADAS SIN FOTOS EN DUC: ${sinFotosEnDuc.length}`);
    console.log('-'.repeat(80));

    if (sinFotosEnDuc.length === 0) {
      console.log('\n✅ ¡Excelente! Todos los vehículos BPS en DUC tienen fotos correctas');
      console.log('='.repeat(80));
      return;
    }

    // 4. Mostrar detalles de cada vehículo sin fotos
    console.log('\n📋 VEHÍCULOS BPS EN DUC SIN FOTOS:');
    console.log('    (Estos deberían marcarse como pendientes)');
    console.log('-'.repeat(80));

    sinFotosEnDuc.forEach((foto, index) => {
      console.log(`\n${index + 1}. Matrícula: ${foto.license_plate}`);
      console.log(`   Modelo (fotos): ${foto.model}`);
      console.log(`   Modelo (DUC): ${foto.modeloDuc}`);
      console.log(`   Fecha completada: ${foto.photos_completed_date ? new Date(foto.photos_completed_date).toLocaleString() : 'N/A'}`);
      console.log(`   ❌ URL Foto 1: ${foto.urlFoto1 || 'Vacío'}`);
      console.log(`   ❌ URL Foto 2: ${foto.urlFoto2 || 'Vacío'}`);
      console.log(`   ❌ URL Foto 3: ${foto.urlFoto3 || 'Vacío'}`);
    });

    // 5. Si ejecutarCambios es true, marcar como pendientes
    if (ejecutarCambios) {
      console.log('\n' + '='.repeat(80));
      console.log('🔄 MARCANDO COMO PENDIENTES...');
      console.log('-'.repeat(80));

      let actualizados = 0;
      let errores = 0;

      for (const foto of sinFotosEnDuc) {
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
      console.log(`\nSe encontraron ${sinFotosEnDuc.length} vehículos BPS en DUC sin fotos.`);
      console.log('\n📌 CRITERIOS:');
      console.log('   ✓ Solo vehículos BPS (BMW + MINI, sin Motorrad)');
      console.log('   ✓ Que ESTÁN en DUC');
      console.log('   ✓ Pero NO tienen fotos (URL foto 1, 2, 3 vacías)');
      console.log('   ✓ Actualmente marcados como "completados"');
      console.log('\nPara marcarlos como pendientes, ejecuta:');
      console.log('node scripts/verificar_fotos_manuales_sin_duc.js --ejecutar');
      console.log('='.repeat(80));
    }

  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

// Verificar argumentos de línea de comandos
const ejecutarCambios = process.argv.includes('--ejecutar');

if (ejecutarCambios) {
  console.log('⚠️  MODO EJECUCIÓN: Se marcarán como pendientes las fotos sin DUC');
} else {
  console.log('ℹ️  MODO SIMULACIÓN: Solo se mostrarán los resultados');
}

verificarFotosManualesSinDuc(ejecutarCambios);

