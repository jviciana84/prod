/**
 * CORRECCIÓN MASIVA: Marcar como pendientes TODOS los vehículos completados
 * que NO tengan fotos reales (9+) en DUC
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

async function corregirTodosSinFotosReales(ejecutar = false) {
  console.log('\n🔧 CORRECCIÓN MASIVA: Vehículos completados sin fotos reales\n');
  console.log('='.repeat(80));
  console.log('REGLA: Solo fotos 9+ en DUC = fotos reales');
  console.log('='.repeat(80));

  try {
    // 1. Obtener TODOS los completados
    const { data: completados, error: error1 } = await supabase
      .from('fotos')
      .select('id, license_plate, model, photos_completed_date, auto_completed')
      .eq('photos_completed', true);

    if (error1) throw error1;

    console.log(`\n📊 Total vehículos completados: ${completados.length}`);
    console.log('🔍 Verificando cuáles tienen fotos reales (9+) en DUC...\n');

    const sinFotosReales = [];
    let conFotosReales = 0;
    let noEnDuc = 0;
    let motos = 0;

    for (const vehiculo of completados) {
      // Filtrar motos
      const esMoto = vehiculo.model && (
        vehiculo.model.toLowerCase().includes('motorrad') ||
        vehiculo.model.toLowerCase().includes('moto ')
      );

      if (esMoto) {
        motos++;
        continue;
      }

      // Buscar en DUC
      const { data: ducData, error: ducError } = await supabase
        .from('duc_scraper')
        .select('"Matrícula", "Modelo", "URL foto 9", "URL foto 10", "URL foto 11", "URL foto 12", "URL foto 13", "URL foto 14", "URL foto 15"')
        .eq('Matrícula', vehiculo.license_plate)
        .single();

      if (ducError && ducError.code !== 'PGRST116') continue;
      
      // Si no está en DUC, probablemente es correcto (fotografiado interno)
      if (!ducData) {
        noEnDuc++;
        continue;
      }

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

      if (tieneFotosReales) {
        conFotosReales++;
      } else {
        // En DUC pero sin fotos reales = ERROR
        sinFotosReales.push({
          id: vehiculo.id,
          license_plate: vehiculo.license_plate,
          model: vehiculo.model,
          photos_completed_date: vehiculo.photos_completed_date,
          auto_completed: vehiculo.auto_completed
        });
      }
    }

    // 2. Mostrar resultados
    console.log('='.repeat(80));
    console.log('📊 RESULTADOS:');
    console.log('='.repeat(80));
    console.log(`Total completados: ${completados.length}`);
    console.log(`  ├─ 🏍️  Motos (ignoradas): ${motos}`);
    console.log(`  ├─ ✅ Con fotos reales en DUC: ${conFotosReales}`);
    console.log(`  ├─ 📦 No en DUC (OK, uso interno): ${noEnDuc}`);
    console.log(`  └─ ❌ En DUC sin fotos reales: ${sinFotosReales.length}`);

    if (sinFotosReales.length === 0) {
      console.log('\n✅ ¡Perfecto! No hay vehículos que corregir');
      console.log('='.repeat(80));
      return;
    }

    console.log('\n' + '='.repeat(80));
    console.log(`❌ VEHÍCULOS A CORREGIR (${sinFotosReales.length}):`);
    console.log('   (En DUC pero solo con fotos dummy 1-8)');
    console.log('='.repeat(80));

    sinFotosReales.forEach((v, i) => {
      const fecha = v.photos_completed_date 
        ? new Date(v.photos_completed_date).toLocaleDateString('es-ES')
        : 'N/A';
      const tipo = v.auto_completed ? '🤖' : '👤';
      console.log(`${(i + 1).toString().padStart(3)}. ${v.license_plate.padEnd(10)} - ${v.model.padEnd(40)} [${fecha}] ${tipo}`);
    });

    if (ejecutar) {
      console.log('\n' + '='.repeat(80));
      console.log('🔄 CORRIGIENDO VEHÍCULOS...');
      console.log('='.repeat(80));

      let corregidos = 0;
      let errores = 0;

      for (const vehiculo of sinFotosReales) {
        const { error: updateError } = await supabase
          .from('fotos')
          .update({
            photos_completed: false,
            photos_completed_date: null,
            auto_completed: false
          })
          .eq('id', vehiculo.id);

        if (updateError) {
          console.log(`❌ ${vehiculo.license_plate}`);
          errores++;
        } else {
          console.log(`✅ ${vehiculo.license_plate}`);
          corregidos++;
        }
      }

      console.log('\n' + '='.repeat(80));
      console.log('📊 RESUMEN FINAL:');
      console.log('='.repeat(80));
      console.log(`✅ Corregidos: ${corregidos}`);
      console.log(`❌ Errores: ${errores}`);
      console.log('\n🎯 Ahora solo aparecen como completados los que:');
      console.log('   - Tienen fotos reales (9+) en DUC');
      console.log('   - No están en DUC (fotografiados internamente)');
      console.log('='.repeat(80));
    } else {
      console.log('\n' + '='.repeat(80));
      console.log('⚠️  MODO SIMULACIÓN - NO SE REALIZARON CAMBIOS');
      console.log('='.repeat(80));
      console.log(`\nSe encontraron ${sinFotosReales.length} vehículos para corregir.`);
      console.log('\nPara ejecutar la corrección:');
      console.log('node scripts/corregir_todos_sin_fotos_reales.js --ejecutar');
      console.log('='.repeat(80));
    }

  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

const ejecutar = process.argv.includes('--ejecutar');

if (ejecutar) {
  console.log('⚠️  MODO EJECUCIÓN: Se corregirán los vehículos');
} else {
  console.log('ℹ️  MODO SIMULACIÓN: Solo se mostrarán los resultados');
}

corregirTodosSinFotosReales(ejecutar);

