const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function verificarFotosEnDuc() {
  console.log('='.repeat(70));
  console.log('VERIFICACION: LOS 63 VEHICULOS TIENEN FOTOS EN DUC?');
  console.log('='.repeat(70));

  try {
    // Leer la lista de 63 vehículos
    const disponibles = JSON.parse(fs.readFileSync('scripts/disponibles_con_fotos_completadas.json', 'utf8'));
    
    console.log(`\nTotal vehiculos a verificar: ${disponibles.length}`);

    // Obtener datos de DUC para esos vehículos
    const matriculas = disponibles.map(v => v.matricula);

    const { data: ducData, error: ducError } = await supabase
      .from('duc_scraper')
      .select('Matrícula, "URL foto 1", "URL foto 9", Modelo')
      .in('Matrícula', matriculas);

    if (ducError) throw ducError;

    // Mapear datos
    const ducMap = {};
    ducData.forEach(d => {
      ducMap[d['Matrícula']] = d;
    });

    // Clasificar
    const conFotos = [];
    const sinFotos = [];
    const noEnDuc = [];

    disponibles.forEach(v => {
      const duc = ducMap[v.matricula];
      
      if (!duc) {
        noEnDuc.push(v);
      } else {
        const tieneFoto9 = duc['URL foto 9'] && duc['URL foto 9'] !== '';
        const tieneFoto1 = duc['URL foto 1'] && duc['URL foto 1'] !== '';
        
        if (tieneFoto9 || tieneFoto1) {
          conFotos.push({
            ...v,
            url_foto_1: duc['URL foto 1'] || 'N/A',
            url_foto_9: duc['URL foto 9'] || 'N/A',
            tiene_foto_9: tieneFoto9
          });
        } else {
          sinFotos.push(v);
        }
      }
    });

    console.log('\n' + '='.repeat(70));
    console.log('RESULTADOS:');
    console.log('='.repeat(70));

    console.log(`\nVehiculos CON fotos en DUC: ${conFotos.length} (${Math.round(conFotos.length/disponibles.length*100)}%)`);
    console.log(`Vehiculos SIN fotos en DUC: ${sinFotos.length} (${Math.round(sinFotos.length/disponibles.length*100)}%)`);
    console.log(`No encontrados en DUC: ${noEnDuc.length}`);

    // Detallar los que SÍ tienen fotos
    if (conFotos.length > 0) {
      console.log('\n' + '-'.repeat(70));
      console.log('VEHICULOS CON FOTOS EN DUC (photos_completed = true CORRECTO):');
      console.log('-'.repeat(70));
      console.log('\nPrimeros 20:');
      conFotos.slice(0, 20).forEach((v, i) => {
        const foto9 = v.tiene_foto_9 ? 'SI' : 'NO';
        console.log(`  ${(i + 1).toString().padStart(3)}. ${v.matricula} - ${v.modelo} [Foto 9: ${foto9}]`);
      });
      if (conFotos.length > 20) {
        console.log(`  ... y ${conFotos.length - 20} mas`);
      }
    }

    // Detallar los que NO tienen fotos
    if (sinFotos.length > 0) {
      console.log('\n' + '-'.repeat(70));
      console.log('VEHICULOS SIN FOTOS EN DUC (photos_completed = true INCORRECTO):');
      console.log('-'.repeat(70));
      console.log('\nEstos deberian tener photos_completed = false:');
      sinFotos.forEach((v, i) => {
        console.log(`  ${(i + 1).toString().padStart(3)}. ${v.matricula} - ${v.modelo}`);
      });
    }

    // CONCLUSIÓN
    console.log('\n' + '='.repeat(70));
    console.log('CONCLUSION:');
    console.log('='.repeat(70));

    if (conFotos.length === disponibles.length) {
      console.log('\n✓ TODOS tienen fotos en DUC');
      console.log('✓ photos_completed = true es CORRECTO');
      console.log('✓ Fueron marcados automaticamente por el sistema cada 15 min');
      console.log('✓ NO necesitan cambiarse a pendiente');
    } else if (sinFotos.length > 0) {
      console.log(`\n⚠ ${sinFotos.length} vehiculos NO tienen fotos en DUC`);
      console.log('⚠ Estos SI deberian cambiar a photos_completed = false');
      console.log(`\n✓ ${conFotos.length} vehiculos SI tienen fotos en DUC`);
      console.log('✓ Estos pueden mantenerse con photos_completed = true');

      // Guardar solo los que hay que cambiar
      fs.writeFileSync(
        'scripts/disponibles_sin_fotos_en_duc.json',
        JSON.stringify(sinFotos, null, 2)
      );

      console.log('\n✓ Lista de vehiculos sin fotos guardada en:');
      console.log('  scripts/disponibles_sin_fotos_en_duc.json');
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\nERROR:', error.message);
  }
}

verificarFotosEnDuc();



