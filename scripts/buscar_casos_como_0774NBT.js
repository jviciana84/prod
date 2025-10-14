const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function buscarCasosSimilares() {
  console.log('='.repeat(70));
  console.log('BUSCAR VEHICULOS COMO 0774NBT');
  console.log('='.repeat(70));
  console.log('\nCriterio de busqueda:');
  console.log('  1. En DUC_SCRAPER como DISPONIBLE');
  console.log('  2. En STOCK como disponible (is_sold = false)');
  console.log('  3. En FOTOS con photos_completed = true (incorrecto)');

  try {
    // 1. Obtener vehículos DISPONIBLES de DUC
    console.log('\n1. Obteniendo vehiculos DISPONIBLES de DUC...');
    const { data: ducDisponibles, error: ducError } = await supabase
      .from('duc_scraper')
      .select('Matrícula, Modelo, Disponibilidad')
      .eq('Disponibilidad', 'DISPONIBLE');

    if (ducError) throw ducError;

    const matriculasDuc = new Set(
      (ducDisponibles || []).map(v => v['Matrícula']?.toUpperCase().trim()).filter(Boolean)
    );

    console.log(`   Disponibles en DUC: ${matriculasDuc.size}`);

    // 2. Obtener vehículos DISPONIBLES de STOCK
    console.log('\n2. Obteniendo vehiculos DISPONIBLES de STOCK...');
    const { data: stockDisponibles, error: stockError } = await supabase
      .from('stock')
      .select('license_plate, model, is_sold')
      .eq('is_sold', false);

    if (stockError) throw stockError;

    console.log(`   Disponibles en STOCK: ${stockDisponibles.length}`);

    // Filtrar solo los que están en DUC
    const disponiblesEnAmbos = stockDisponibles.filter(v => 
      matriculasDuc.has(v.license_plate?.toUpperCase().trim())
    );

    console.log(`   Disponibles en AMBOS (DUC y STOCK): ${disponiblesEnAmbos.length}`);

    // 3. Obtener estado de FOTOS
    console.log('\n3. Verificando estado de FOTOS...');
    const { data: fotos, error: fotosError } = await supabase
      .from('fotos')
      .select('license_plate, estado_pintura, photos_completed');

    if (fotosError) throw fotosError;

    const fotosMap = {};
    fotos.forEach(f => {
      fotosMap[f.license_plate] = f;
    });

    // 4. Encontrar casos problemáticos
    const casosProblematicos = [];

    disponiblesEnAmbos.forEach(v => {
      const foto = fotosMap[v.license_plate];
      
      // Caso problemático: disponible pero con fotos marcadas como completadas
      if (foto && foto.photos_completed === true) {
        casosProblematicos.push({
          matricula: v.license_plate,
          modelo: v.model,
          estado_pintura: foto.estado_pintura,
          photos_completed: foto.photos_completed
        });
      }
    });

    // 5. Mostrar resultados
    console.log('\n' + '='.repeat(70));
    console.log('CASOS ENCONTRADOS:');
    console.log('='.repeat(70));

    if (casosProblematicos.length === 0) {
      console.log('\n✓ NO HAY CASOS PROBLEMATICOS');
      console.log('✓ Todos los disponibles tienen fotos correctamente configuradas');
    } else {
      console.log(`\nTotal casos como 0774NBT: ${casosProblematicos.length}`);
      console.log('\nVehiculos DISPONIBLES con fotos marcadas como COMPLETADAS:');
      console.log('(Deberian tener photos_completed = false)\n');
      
      casosProblematicos.forEach((v, i) => {
        console.log(`${(i + 1).toString().padStart(3)}. ${v.matricula} - ${v.modelo}`);
        console.log(`     Estado pintura: ${v.estado_pintura}`);
        console.log(`     Photos completed: ${v.photos_completed} ← INCORRECTO`);
      });

      // Análisis adicional
      console.log('\n' + '-'.repeat(70));
      console.log('ANALISIS:');
      console.log('-'.repeat(70));
      
      const conEstadoPendiente = casosProblematicos.filter(v => v.estado_pintura === 'pendiente').length;
      const conEstadoOtro = casosProblematicos.length - conEstadoPendiente;

      console.log(`\nCon estado_pintura = 'pendiente': ${conEstadoPendiente}`);
      console.log(`Con otro estado_pintura: ${conEstadoOtro}`);

      console.log('\n' + '-'.repeat(70));
      console.log('DECISION:');
      console.log('-'.repeat(70));
      
      console.log(`\n¿Cambiar estos ${casosProblematicos.length} vehiculos a photos_completed = false?`);
      console.log('\nRazon:');
      console.log('  - Son vehiculos DISPONIBLES (no vendidos)');
      console.log('  - Probablemente necesitan fotos');
      console.log('  - Con photos_completed = true NO aparecen en pendientes');
      console.log('  - Deberian aparecer en pendientes si las fotos no estan listas');

      // Guardar lista
      const fs = require('fs');
      fs.writeFileSync(
        'scripts/disponibles_con_fotos_completadas.json',
        JSON.stringify(casosProblematicos, null, 2)
      );

      console.log('\n✓ Lista guardada en: scripts/disponibles_con_fotos_completadas.json');
      console.log('\nPara cambiarlos a pendiente:');
      console.log('  node scripts/cambiar_disponibles_a_pendiente.js');
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\nERROR:', error.message);
  }
}

buscarCasosSimilares();



