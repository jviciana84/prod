/**
 * Análisis CORRECTO: Fotos REALES en DUC
 * LÓGICA CORRECTA: URL foto 9 en adelante = fotos reales
 * URL foto 1-8 = fotos dummy
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

async function analizarFotosReales() {
  console.log('\n📊 ANÁLISIS CON LÓGICA CORRECTA: FOTOS REALES EN DUC\n');
  console.log('='.repeat(80));
  console.log('LÓGICA: URL foto 9+ = FOTOS REALES | URL foto 1-8 = DUMMY');
  console.log('='.repeat(80));

  try {
    // 1. Obtener TODOS los vehículos de tabla fotos
    const { data: todosVehiculos, error: fotosError } = await supabase
      .from('fotos')
      .select('id, license_plate, model, photos_completed, auto_completed, photos_completed_date')
      .order('license_plate');

    if (fotosError) throw fotosError;

    console.log(`\n📋 TOTAL VEHÍCULOS EN TABLA FOTOS: ${todosVehiculos.length}`);

    // 2. Clasificar vehículos
    const conFotosRealesEnDuc = [];
    const sinFotosRealesEnDuc = [];
    const noEnDuc = [];
    const motos = [];

    for (const vehiculo of todosVehiculos) {
      // Filtrar motos
      const esMoto = vehiculo.model && (
        vehiculo.model.toLowerCase().includes('motorrad') ||
        vehiculo.model.toLowerCase().includes('moto ')
      );

      if (esMoto) {
        motos.push(vehiculo);
        continue;
      }

      // Buscar en DUC
      const { data: ducData, error: ducError } = await supabase
        .from('duc_scraper')
        .select('"Matrícula", "Modelo", "URL foto 9", "URL foto 10", "URL foto 11", "URL foto 12", "URL foto 13", "URL foto 14", "URL foto 15"')
        .eq('Matrícula', vehiculo.license_plate)
        .single();

      if (ducError && ducError.code !== 'PGRST116') {
        continue;
      }

      // No está en DUC
      if (!ducData) {
        noEnDuc.push({
          ...vehiculo,
          estado: vehiculo.photos_completed ? '✅ Completado' : '⏳ Pendiente'
        });
        continue;
      }

      // Verificar si tiene fotos REALES (9+) en DUC
      const tieneFotosReales = !!(
        ducData['URL foto 9'] || 
        ducData['URL foto 10'] || 
        ducData['URL foto 11'] ||
        ducData['URL foto 12'] ||
        ducData['URL foto 13'] ||
        ducData['URL foto 14'] ||
        ducData['URL foto 15']
      );

      // Contar cuántas fotos reales tiene
      let numFotosReales = 0;
      for (let i = 9; i <= 15; i++) {
        if (ducData[`URL foto ${i}`]) numFotosReales++;
      }

      if (tieneFotosReales) {
        conFotosRealesEnDuc.push({
          ...vehiculo,
          modeloDuc: ducData['Modelo'],
          numFotosReales,
          estado: vehiculo.photos_completed ? '✅ Completado' : '⏳ Pendiente'
        });
      } else {
        sinFotosRealesEnDuc.push({
          ...vehiculo,
          modeloDuc: ducData['Modelo'],
          estado: vehiculo.photos_completed ? '✅ Completado' : '⏳ Pendiente'
        });
      }
    }

    // 3. Mostrar estadísticas generales
    console.log('\n📊 ESTADÍSTICAS GENERALES:');
    console.log('='.repeat(80));
    console.log(`Total en tabla fotos: ${todosVehiculos.length}`);
    console.log(`  ├─ BPS (BMW + MINI): ${todosVehiculos.length - motos.length}`);
    console.log(`  └─ Motos (Motorrad): ${motos.length}`);
    console.log('\nVehículos BPS:');
    console.log(`  ├─ ✅ Con fotos REALES en DUC: ${conFotosRealesEnDuc.length}`);
    console.log(`  ├─ ❌ Sin fotos REALES en DUC (pero en DUC): ${sinFotosRealesEnDuc.length}`);
    console.log(`  └─ ⚠️  No están en DUC: ${noEnDuc.length}`);

    // 4. Detalles: CON FOTOS REALES EN DUC
    console.log('\n' + '='.repeat(80));
    console.log(`✅ VEHÍCULOS CON FOTOS REALES EN DUC (${conFotosRealesEnDuc.length}):`);
    console.log('-'.repeat(80));
    
    const conFotosCompletados = conFotosRealesEnDuc.filter(v => v.photos_completed).length;
    const conFotosPendientes = conFotosRealesEnDuc.filter(v => !v.photos_completed).length;
    
    console.log(`  ├─ Completados: ${conFotosCompletados}`);
    console.log(`  └─ Pendientes: ${conFotosPendientes}`);

    if (conFotosPendientes > 0) {
      console.log('\n⚠️  VEHÍCULOS CON FOTOS REALES EN DUC PERO MARCADOS COMO PENDIENTES:');
      conFotosRealesEnDuc.filter(v => !v.photos_completed).forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.license_plate} - ${v.model} (${v.numFotosReales} fotos reales)`);
      });
    }

    // 5. Detalles: SIN FOTOS REALES EN DUC
    console.log('\n' + '='.repeat(80));
    console.log(`❌ VEHÍCULOS EN DUC PERO SIN FOTOS REALES (${sinFotosRealesEnDuc.length}):`);
    console.log('   (Solo tienen fotos dummy 1-8, falta fotografiar)');
    console.log('-'.repeat(80));
    
    const sinFotosCompletados = sinFotosRealesEnDuc.filter(v => v.photos_completed).length;
    const sinFotosPendientes = sinFotosRealesEnDuc.filter(v => !v.photos_completed).length;
    
    console.log(`  ├─ Completados: ${sinFotosCompletados} ⚠️  INCONSISTENCIA`);
    console.log(`  └─ Pendientes: ${sinFotosPendientes} ✅ CORRECTO`);

    console.log('\nListado completo:');
    sinFotosRealesEnDuc.forEach((v, i) => {
      const inconsistencia = v.photos_completed ? ' 🔴 INCONSISTENCIA' : '';
      console.log(`  ${i + 1}. ${v.license_plate} - ${v.model} [${v.estado}]${inconsistencia}`);
    });

    // 6. Detalles: NO EN DUC
    console.log('\n' + '='.repeat(80));
    console.log(`⚠️  VEHÍCULOS NO PUBLICADOS EN DUC (${noEnDuc.length}):`);
    console.log('-'.repeat(80));
    
    const noEnDucCompletados = noEnDuc.filter(v => v.photos_completed).length;
    const noEnDucPendientes = noEnDuc.filter(v => !v.photos_completed).length;
    
    console.log(`  ├─ Completados: ${noEnDucCompletados} (fotografiados para uso interno)`);
    console.log(`  └─ Pendientes: ${noEnDucPendientes}`);

    console.log('\nPrimeros 10:');
    noEnDuc.slice(0, 10).forEach((v, i) => {
      console.log(`  ${i + 1}. ${v.license_plate} - ${v.model} [${v.estado}]`);
    });
    if (noEnDuc.length > 10) {
      console.log(`  ... y ${noEnDuc.length - 10} más`);
    }

    // 7. RESUMEN FINAL
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN FINAL (LÓGICA CORRECTA):');
    console.log('='.repeat(80));
    console.log(`\nDe ${todosVehiculos.length - motos.length} vehículos BPS:`);
    console.log(`  • ${conFotosRealesEnDuc.length} tienen fotos REALES en DUC (${((conFotosRealesEnDuc.length / (todosVehiculos.length - motos.length)) * 100).toFixed(1)}%)`);
    console.log(`  • ${sinFotosRealesEnDuc.length} están en DUC sin fotos reales (${((sinFotosRealesEnDuc.length / (todosVehiculos.length - motos.length)) * 100).toFixed(1)}%)`);
    console.log(`  • ${noEnDuc.length} no están en DUC (${((noEnDuc.length / (todosVehiculos.length - motos.length)) * 100).toFixed(1)}%)`);
    
    if (sinFotosCompletados > 0) {
      console.log(`\n🔴 INCONSISTENCIAS ENCONTRADAS: ${sinFotosCompletados}`);
      console.log(`   Vehículos marcados como completados pero sin fotos reales en DUC`);
    }
    
    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

analizarFotosReales();

