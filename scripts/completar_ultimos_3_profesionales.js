const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function completarUltimos3() {
  console.log('='.repeat(70));
  console.log('COMPLETAR ULTIMOS 3 PROFESIONALES');
  console.log('='.repeat(70));

  const vehiculos = [
    { matricula: '1124LBL', modelo: 'Serie 1 118d', accion: 'crear' },
    { matricula: '0044NCS', modelo: 'M M3 CS Touring', accion: 'actualizar' },
    { matricula: '7049NBL', modelo: 'X2 sDrive18d', accion: 'actualizar' }
  ];

  try {
    console.log(`\nVehiculos a procesar: ${vehiculos.length}`);

    let creados = 0, actualizados = 0, errores = 0;

    for (const v of vehiculos) {
      console.log(`\n${v.matricula} - ${v.modelo}:`);

      if (v.accion === 'crear') {
        // Crear registro en fotos
        const { error } = await supabase
          .from('fotos')
          .insert({
            license_plate: v.matricula,
            model: v.modelo,
            estado_pintura: 'vendido',
            photos_completed: true
          });

        if (error) {
          console.log(`  ERROR al crear: ${error.message}`);
          errores++;
        } else {
          console.log(`  ✓ Registro creado`);
          creados++;
        }
      } else {
        // Actualizar registro existente
        const { error } = await supabase
          .from('fotos')
          .update({ photos_completed: true })
          .eq('license_plate', v.matricula);

        if (error) {
          console.log(`  ERROR al actualizar: ${error.message}`);
          errores++;
        } else {
          console.log(`  ✓ Registro actualizado`);
          actualizados++;
        }
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('RESUMEN:');
    console.log('='.repeat(70));
    console.log(`\nCreados: ${creados}`);
    console.log(`Actualizados: ${actualizados}`);
    console.log(`Errores: ${errores}`);

    // Verificación
    const { data: verificacion, error: verError } = await supabase
      .from('fotos')
      .select('license_plate, photos_completed')
      .in('license_plate', vehiculos.map(v => v.matricula))
      .eq('photos_completed', true);

    if (!verError) {
      console.log(`\nVerificados con fotos completadas: ${verificacion.length}/${vehiculos.length}`);
    }

    if (verificacion.length === vehiculos.length) {
      console.log('\n✓ PROCESO COMPLETADO');
      console.log('✓ Profesionales ya no apareceran en pendientes');
    }

    // Verificar sin clasificar
    console.log('\n' + '='.repeat(70));
    console.log('VERIFICAR SIN CLASIFICAR:');
    console.log('='.repeat(70));

    const { data: sinClasif } = await supabase
      .from('stock')
      .select('license_plate, model, is_sold')
      .eq('license_plate', '3742MVJ')
      .single();

    if (sinClasif) {
      const enVentas = await supabase
        .from('sales_vehicles')
        .select('license_plate')
        .eq('license_plate', '3742MVJ')
        .single();

      console.log(`\n3742MVJ - ix1:`);
      console.log(`  is_sold: ${sinClasif.is_sold}`);
      console.log(`  en sales_vehicles: ${!!enVentas.data}`);
      console.log(`  clasificacion: ${!!enVentas.data ? 'vendido (particular)' : 'profesional'}`);
      
      if (!enVentas.data) {
        console.log('\n  ⚠ Este vehiculo deberia clasificarse como PROFESIONAL');
        console.log('    (is_sold=true pero no esta en sales_vehicles)');
      }
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\nERROR:', error.message);
  }
}

completarUltimos3();

