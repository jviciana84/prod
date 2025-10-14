const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function crearFotosFaltantes() {
  console.log('='.repeat(70));
  console.log('CREAR REGISTROS FALTANTES EN FOTOS');
  console.log('='.repeat(70));

  const matriculasFaltantes = ['8402HWG', '8388HLJ', '2525JHH'];

  try {
    console.log(`\nVehiculos a procesar: ${matriculasFaltantes.length}`);

    for (const matricula of matriculasFaltantes) {
      console.log(`\nProcesando ${matricula}...`);

      // Obtener datos del vehículo de STOCK
      const { data: stock, error: stockError } = await supabase
        .from('stock')
        .select('license_plate, model')
        .eq('license_plate', matricula)
        .single();

      if (stockError || !stock) {
        console.log(`  ERROR: No se encontro en STOCK`);
        continue;
      }

      console.log(`  Modelo: ${stock.model || 'Sin modelo'}`);

      // Crear en FOTOS con el modelo
      const { error: createError } = await supabase
        .from('fotos')
        .insert({
          license_plate: matricula,
          model: stock.model || 'N/A',
          estado_pintura: 'vendido',
          photos_completed: true
        });

      if (createError) {
        console.log(`  ERROR al crear: ${createError.message}`);
      } else {
        console.log(`  ✓ Registro creado en FOTOS`);
      }
    }

    // Verificación
    console.log('\n' + '='.repeat(70));
    console.log('VERIFICACION:');
    console.log('='.repeat(70));

    const { data: verificacion, error: verError } = await supabase
      .from('fotos')
      .select('license_plate, photos_completed')
      .in('license_plate', matriculasFaltantes);

    if (!verError) {
      console.log(`\nRegistros creados: ${verificacion.length}/${matriculasFaltantes.length}`);
      verificacion.forEach(v => {
        console.log(`  ✓ ${v.license_plate} - photos_completed: ${v.photos_completed}`);
      });
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\nERROR:', error.message);
  }
}

crearFotosFaltantes();



