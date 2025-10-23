const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetFotosPendientes() {
  console.log('='.repeat(70));
  console.log('RESET: Fotos Pendientes basado en duc_scraper');
  console.log('='.repeat(70));

  try {
    // 1. Obtener TODOS los vehículos de duc_scraper
    console.log('\n1. Obteniendo vehículos de duc_scraper...');
    const { data: ducData } = await supabase
      .from('duc_scraper')
      .select('"Matrícula", "Modelo", "URL foto 1", "URL foto 2", "URL foto 3", "URL foto 4", "URL foto 5"')
      .not('"Matrícula"', 'is', null);

    console.log(`   Total en DUC: ${ducData?.length || 0}`);

    // 2. Clasificar vehículos según fotos
    const conFotos = [];
    const sinFotos = [];

    ducData.forEach(v => {
      const tienefotos = (
        (v['URL foto 1'] && v['URL foto 1'] !== '') ||
        (v['URL foto 2'] && v['URL foto 2'] !== '') ||
        (v['URL foto 3'] && v['URL foto 3'] !== '')
      );

      if (tienefotos) {
        conFotos.push(v);
      } else {
        sinFotos.push(v);
      }
    });

    console.log(`\n   CON fotos: ${conFotos.length}`);
    console.log(`   SIN fotos: ${sinFotos.length}`);

    // 3. Obtener estado actual en tabla fotos
    console.log('\n2. Obteniendo estado actual de tabla fotos...');
    const { data: fotosData } = await supabase
      .from('fotos')
      .select('license_plate, photos_completed, estado_pintura, is_available, auto_completed');

    const fotosMap = new Map();
    fotosData.forEach(f => {
      fotosMap.set(f.license_plate?.toUpperCase().trim(), f);
    });

    console.log(`   Total en tabla fotos: ${fotosData?.length || 0}`);

    // 4. Analizar inconsistencias
    console.log('\n' + '='.repeat(70));
    console.log('ANÁLISIS DE INCONSISTENCIAS');
    console.log('='.repeat(70));

    // Vehículos SIN fotos en DUC pero COMPLETADOS en BD
    const incorrectosCompletados = [];
    sinFotos.forEach(v => {
      const matricula = v['Matrícula']?.toUpperCase().trim();
      const fotoRecord = fotosMap.get(matricula);
      
      if (fotoRecord && fotoRecord.photos_completed === true) {
        incorrectosCompletados.push({
          matricula,
          modelo: v['Modelo'],
          estado_actual: fotoRecord.estado_pintura,
          photos_completed: fotoRecord.photos_completed
        });
      }
    });

    console.log(`\n❌ Vehículos SIN fotos en DUC pero COMPLETADOS en BD: ${incorrectosCompletados.length}`);
    if (incorrectosCompletados.length > 0) {
      console.log('   (Estos deben resetearse a pendiente)\n');
      incorrectosCompletados.slice(0, 10).forEach((v, i) => {
        console.log(`   ${i+1}. ${v.matricula} - ${v.modelo}`);
      });
      if (incorrectosCompletados.length > 10) {
        console.log(`   ... y ${incorrectosCompletados.length - 10} más`);
      }
    }

    // Vehículos CON fotos en DUC pero PENDIENTES en BD
    const incorrectosPendientes = [];
    conFotos.forEach(v => {
      const matricula = v['Matrícula']?.toUpperCase().trim();
      const fotoRecord = fotosMap.get(matricula);
      
      if (fotoRecord && fotoRecord.photos_completed === false) {
        incorrectosPendientes.push({
          matricula,
          modelo: v['Modelo'],
          estado_actual: fotoRecord.estado_pintura,
          url_foto_1: v['URL foto 1'] ? 'SÍ' : 'NO'
        });
      }
    });

    console.log(`\n✅ Vehículos CON fotos en DUC pero PENDIENTES en BD: ${incorrectosPendientes.length}`);
    if (incorrectosPendientes.length > 0) {
      console.log('   (Estos deben marcarse como completados)\n');
      incorrectosPendientes.slice(0, 10).forEach((v, i) => {
        console.log(`   ${i+1}. ${v.matricula} - ${v.modelo}`);
      });
      if (incorrectosPendientes.length > 10) {
        console.log(`   ... y ${incorrectosPendientes.length - 10} más`);
      }
    }

    // Vehículos SIN fotos que NO existen en tabla fotos
    const faltanEnFotos = [];
    sinFotos.forEach(v => {
      const matricula = v['Matrícula']?.toUpperCase().trim();
      if (!fotosMap.has(matricula)) {
        faltanEnFotos.push({
          matricula,
          modelo: v['Modelo']
        });
      }
    });

    console.log(`\n📋 Vehículos en DUC (sin fotos) que NO están en tabla fotos: ${faltanEnFotos.length}`);
    if (faltanEnFotos.length > 0) {
      console.log('   (Estos se crearán como pendientes)\n');
      faltanEnFotos.slice(0, 10).forEach((v, i) => {
        console.log(`   ${i+1}. ${v.matricula} - ${v.modelo}`);
      });
      if (faltanEnFotos.length > 10) {
        console.log(`   ... y ${faltanEnFotos.length - 10} más`);
      }
    }

    // 5. Resumen de acciones
    console.log('\n' + '='.repeat(70));
    console.log('ACCIONES A REALIZAR');
    console.log('='.repeat(70));

    console.log(`\n1. RESETEAR a pendiente: ${incorrectosCompletados.length} vehículos`);
    console.log(`   (SIN fotos en DUC pero marcados como completados)`);
    
    console.log(`\n2. MARCAR como completados: ${incorrectosPendientes.length} vehículos`);
    console.log(`   (CON fotos en DUC pero pendientes)`);
    
    console.log(`\n3. CREAR como pendientes: ${faltanEnFotos.length} vehículos`);
    console.log(`   (En DUC sin fotos, no existen en tabla fotos)`);

    console.log(`\nTotal a procesar: ${incorrectosCompletados.length + incorrectosPendientes.length + faltanEnFotos.length}`);

    // Guardar datos para script de ejecución
    const fs = require('fs');
    fs.writeFileSync(
      'scripts/reset_fotos_data.json',
      JSON.stringify({
        incorrectosCompletados,
        incorrectosPendientes,
        faltanEnFotos,
        fecha: new Date().toISOString()
      }, null, 2)
    );

    console.log('\n✅ Datos guardados en: scripts/reset_fotos_data.json');
    console.log('\n📝 Para ejecutar el reset:');
    console.log('   node scripts/ejecutar_reset_fotos.js');
    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

resetFotosPendientes();

