/**
 * Script para analizar la tabla fotos:
 * - Comparar registros con fotos automáticas (auto_completed = true)
 * - vs registros con fotos manuales (auto_completed = false/null)
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

async function analizarFotos() {
  console.log('\n📊 ANÁLISIS DE FOTOS AUTOMÁTICAS VS MANUALES\n');
  console.log('='.repeat(80));

  try {
    // 1. Total de registros en la tabla fotos
    const { count: totalCount, error: totalError } = await supabase
      .from('fotos')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    console.log(`\n📋 TOTAL DE REGISTROS EN TABLA FOTOS: ${totalCount}`);

    // 2. Registros con fotos completadas
    const { data: fotosCompletadas, error: completadasError } = await supabase
      .from('fotos')
      .select('id, license_plate, model, photos_completed, auto_completed, photos_completed_date, physical_reception_date')
      .eq('photos_completed', true);

    if (completadasError) throw completadasError;

    console.log(`\n✅ FOTOS COMPLETADAS: ${fotosCompletadas.length}`);
    console.log('-'.repeat(80));

    // 3. Separar automáticas vs manuales
    const fotosAutomaticas = fotosCompletadas.filter(f => f.auto_completed === true);
    const fotosManuales = fotosCompletadas.filter(f => !f.auto_completed);

    console.log(`\n🤖 FOTOS AUTOMÁTICAS (auto_completed = true): ${fotosAutomaticas.length}`);
    console.log(`👤 FOTOS MANUALES (auto_completed = false/null): ${fotosManuales.length}`);

    // 4. Mostrar porcentajes
    const porcentajeAutomaticas = ((fotosAutomaticas.length / fotosCompletadas.length) * 100).toFixed(2);
    const porcentajeManuales = ((fotosManuales.length / fotosCompletadas.length) * 100).toFixed(2);

    console.log('\n📈 DISTRIBUCIÓN:');
    console.log(`   - Automáticas: ${porcentajeAutomaticas}%`);
    console.log(`   - Manuales: ${porcentajeManuales}%`);

    // 5. Fotos pendientes
    const { count: pendientesCount, error: pendientesError } = await supabase
      .from('fotos')
      .select('*', { count: 'exact', head: true })
      .eq('photos_completed', false);

    if (pendientesError) throw pendientesError;

    console.log(`\n⏳ FOTOS PENDIENTES: ${pendientesCount}`);

    // 6. Detalles de fotos automáticas (primeros 10)
    console.log('\n' + '='.repeat(80));
    console.log('🤖 EJEMPLOS DE FOTOS AUTOMÁTICAS (primeros 10):');
    console.log('-'.repeat(80));
    
    fotosAutomaticas.slice(0, 10).forEach((foto, index) => {
      console.log(`\n${index + 1}. Matrícula: ${foto.license_plate}`);
      console.log(`   Modelo: ${foto.model}`);
      console.log(`   Fecha completada: ${foto.photos_completed_date ? new Date(foto.photos_completed_date).toLocaleString() : 'N/A'}`);
      console.log(`   Recepción física: ${foto.physical_reception_date ? new Date(foto.physical_reception_date).toLocaleString() : 'N/A'}`);
    });

    // 7. Detalles de fotos manuales (primeros 10)
    console.log('\n' + '='.repeat(80));
    console.log('👤 EJEMPLOS DE FOTOS MANUALES (primeros 10):');
    console.log('-'.repeat(80));
    
    fotosManuales.slice(0, 10).forEach((foto, index) => {
      console.log(`\n${index + 1}. Matrícula: ${foto.license_plate}`);
      console.log(`   Modelo: ${foto.model}`);
      console.log(`   Fecha completada: ${foto.photos_completed_date ? new Date(foto.photos_completed_date).toLocaleString() : 'N/A'}`);
      console.log(`   Recepción física: ${foto.physical_reception_date ? new Date(foto.physical_reception_date).toLocaleString() : 'N/A'}`);
    });

    // 8. Resumen final
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN FINAL:');
    console.log('-'.repeat(80));
    console.log(`Total registros en fotos: ${totalCount}`);
    console.log(`Fotos completadas: ${fotosCompletadas.length}`);
    console.log(`  └─ Automáticas: ${fotosAutomaticas.length} (${porcentajeAutomaticas}%)`);
    console.log(`  └─ Manuales: ${fotosManuales.length} (${porcentajeManuales}%)`);
    console.log(`Fotos pendientes: ${pendientesCount}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

analizarFotos();

