/**
 * Análisis completo: Todos los vehículos en tabla fotos
 * vs qué tienen realmente fotos en DUC
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

async function analizarCompleto() {
  console.log('\n📊 ANÁLISIS COMPLETO: TABLA FOTOS VS DUC\n');
  console.log('='.repeat(80));

  try {
    // 1. Obtener TODOS los vehículos de tabla fotos
    const { data: todosVehiculos, error: fotosError } = await supabase
      .from('fotos')
      .select('id, license_plate, model, photos_completed, auto_completed, photos_completed_date')
      .order('license_plate');

    if (fotosError) throw fotosError;

    console.log(`\n📋 TOTAL VEHÍCULOS EN TABLA FOTOS: ${todosVehiculos.length}`);
    console.log('-'.repeat(80));

    // 2. Clasificar vehículos
    const conFotosEnDuc = [];
    const sinFotosEnDuc = [];
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
        .select('"Matrícula", "Modelo", "URL foto 1", "URL foto 2", "URL foto 3"')
        .eq('Matrícula', vehiculo.license_plate)
        .single();

      if (ducError && ducError.code !== 'PGRST116') {
        console.log(`⚠️  Error consultando ${vehiculo.license_plate}:`, ducError.message);
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

      // Verificar si tiene fotos en DUC
      const tieneFotosEnDuc = !!(
        ducData['URL foto 1'] || 
        ducData['URL foto 2'] || 
        ducData['URL foto 3']
      );

      if (tieneFotosEnDuc) {
        conFotosEnDuc.push({
          ...vehiculo,
          modeloDuc: ducData['Modelo'],
          urlFoto1: ducData['URL foto 1'] ? '✅' : '❌',
          urlFoto2: ducData['URL foto 2'] ? '✅' : '❌',
          urlFoto3: ducData['URL foto 3'] ? '✅' : '❌',
          estado: vehiculo.photos_completed ? '✅ Completado' : '⏳ Pendiente'
        });
      } else {
        sinFotosEnDuc.push({
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
    console.log(`  ├─ ✅ Con fotos en DUC: ${conFotosEnDuc.length}`);
    console.log(`  ├─ ❌ Sin fotos en DUC (pero en DUC): ${sinFotosEnDuc.length}`);
    console.log(`  └─ ⚠️  No están en DUC: ${noEnDuc.length}`);

    // 4. Detalles: CON FOTOS EN DUC
    console.log('\n' + '='.repeat(80));
    console.log(`✅ VEHÍCULOS CON FOTOS EN DUC (${conFotosEnDuc.length}):`);
    console.log('-'.repeat(80));
    
    const conFotosCompletados = conFotosEnDuc.filter(v => v.photos_completed).length;
    const conFotosPendientes = conFotosEnDuc.filter(v => !v.photos_completed).length;
    
    console.log(`  ├─ Completados: ${conFotosCompletados}`);
    console.log(`  └─ Pendientes: ${conFotosPendientes}`);

    if (conFotosPendientes > 0) {
      console.log('\n⚠️  VEHÍCULOS CON FOTOS EN DUC PERO MARCADOS COMO PENDIENTES:');
      conFotosEnDuc.filter(v => !v.photos_completed).forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.license_plate} - ${v.model} (${v.urlFoto1} ${v.urlFoto2} ${v.urlFoto3})`);
      });
    }

    // 5. Detalles: SIN FOTOS EN DUC
    console.log('\n' + '='.repeat(80));
    console.log(`❌ VEHÍCULOS EN DUC PERO SIN FOTOS (${sinFotosEnDuc.length}):`);
    console.log('-'.repeat(80));
    
    const sinFotosCompletados = sinFotosEnDuc.filter(v => v.photos_completed).length;
    const sinFotosPendientes = sinFotosEnDuc.filter(v => !v.photos_completed).length;
    
    console.log(`  ├─ Completados: ${sinFotosCompletados}`);
    console.log(`  └─ Pendientes: ${sinFotosPendientes}`);

    console.log('\nListado completo:');
    sinFotosEnDuc.forEach((v, i) => {
      console.log(`  ${i + 1}. ${v.license_plate} - ${v.model} [${v.estado}]`);
    });

    // 6. Detalles: NO EN DUC
    console.log('\n' + '='.repeat(80));
    console.log(`⚠️  VEHÍCULOS NO PUBLICADOS EN DUC (${noEnDuc.length}):`);
    console.log('-'.repeat(80));
    
    const noEnDucCompletados = noEnDuc.filter(v => v.photos_completed).length;
    const noEnDucPendientes = noEnDuc.filter(v => !v.photos_completed).length;
    
    console.log(`  ├─ Completados: ${noEnDucCompletados} (fotografiados para uso interno)`);
    console.log(`  └─ Pendientes: ${noEnDucPendientes}`);

    console.log('\nPrimeros 20:');
    noEnDuc.slice(0, 20).forEach((v, i) => {
      console.log(`  ${i + 1}. ${v.license_plate} - ${v.model} [${v.estado}]`);
    });
    if (noEnDuc.length > 20) {
      console.log(`  ... y ${noEnDuc.length - 20} más`);
    }

    // 7. RESUMEN FINAL
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN FINAL:');
    console.log('='.repeat(80));
    console.log(`\nDe ${todosVehiculos.length - motos.length} vehículos BPS:`);
    console.log(`  • ${conFotosEnDuc.length} tienen fotos en DUC (${((conFotosEnDuc.length / (todosVehiculos.length - motos.length)) * 100).toFixed(1)}%)`);
    console.log(`  • ${sinFotosEnDuc.length} están en DUC sin fotos (${((sinFotosEnDuc.length / (todosVehiculos.length - motos.length)) * 100).toFixed(1)}%)`);
    console.log(`  • ${noEnDuc.length} no están en DUC (${((noEnDuc.length / (todosVehiculos.length - motos.length)) * 100).toFixed(1)}%)`);
    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

analizarCompleto();

