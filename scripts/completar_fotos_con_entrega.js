const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function completarFotosConEntrega() {
  console.log('='.repeat(70));
  console.log('COMPLETAR FOTOS DE VENTAS CON FECHA DE ENTREGA');
  console.log('='.repeat(70));

  try {
    // Leer lista
    const data = JSON.parse(fs.readFileSync('scripts/ventas_para_completar_fotos.json', 'utf8'));
    const ventas = data.conEntrega;

    console.log(`\nVentas con entrega pero fotos pendientes: ${ventas.length}`);
    console.log('\nLogica:');
    console.log('  - Si tiene fecha_entrega → fotos completadas automaticamente');
    console.log('  - Razon: Ya se entrego, no necesita mas fotos');

    console.log('\nPrimeras 10:');
    ventas.slice(0, 10).forEach((v, i) => {
      console.log(`  ${i + 1}. ${v.matricula} - ${v.modelo}`);
    });

    if (ventas.length > 10) {
      console.log(`  ... y ${ventas.length - 10} mas`);
    }

    console.log('\nIniciando en 3 segundos...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Procesar ventas
    console.log('\n' + '='.repeat(70));
    console.log('PROCESANDO...');
    console.log('='.repeat(70));

    let actualizados = 0, creados = 0, errores = 0;

    for (const v of ventas) {
      // Verificar si existe registro en fotos
      const { data: existe } = await supabase
        .from('fotos')
        .select('id')
        .eq('license_plate', v.matricula)
        .single();

      if (existe) {
        // Actualizar existente
        const { error } = await supabase
          .from('fotos')
          .update({ photos_completed: true })
          .eq('license_plate', v.matricula);

        if (error) {
          errores++;
        } else {
          actualizados++;
        }
      } else {
        // Crear nuevo
        const { error } = await supabase
          .from('fotos')
          .insert({
            license_plate: v.matricula,
            model: v.modelo,
            estado_pintura: 'completado',
            photos_completed: true
          });

        if (error) {
          errores++;
        } else {
          creados++;
        }
      }

      if ((actualizados + creados) % 10 === 0) {
        console.log(`  Procesados: ${actualizados + creados}/${ventas.length}`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('RESUMEN:');
    console.log('='.repeat(70));
    console.log(`\nActualizados: ${actualizados}`);
    console.log(`Creados: ${creados}`);
    console.log(`Errores: ${errores}`);
    console.log(`Total procesados: ${actualizados + creados}/${ventas.length}`);

    if (errores === 0) {
      console.log('\n✓ PROCESO COMPLETADO EXITOSAMENTE');
      console.log('✓ Ventas con entrega ya tienen fotos completadas');
      console.log('✓ Ya NO apareceran en pendientes');
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\nERROR:', error.message);
  }
}

completarFotosConEntrega();



