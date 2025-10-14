const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function corregirEstadoPintura() {
  console.log('='.repeat(70));
  console.log('CORREGIR estado_pintura DE VENDIDOS');
  console.log('='.repeat(70));

  try {
    const data = JSON.parse(fs.readFileSync('scripts/vendidos_con_estado_incorrecto.json', 'utf8'));
    
    const { pendiente, sinRegistro } = data;

    console.log(`\nVehiculos con estado_pintura = 'pendiente': ${pendiente.length}`);
    console.log(`Vehiculos sin registro: ${sinRegistro.length}`);

    // 1. Corregir estado pendiente a vendido
    if (pendiente.length > 0) {
      console.log('\n' + '='.repeat(70));
      console.log('1. ACTUALIZANDO estado_pintura a "vendido":');
      console.log('='.repeat(70));

      let actualizados = 0;

      for (const matricula of pendiente) {
        const { error } = await supabase
          .from('fotos')
          .update({ estado_pintura: 'vendido' })
          .eq('license_plate', matricula);

        if (error) {
          console.log(`  ERROR: ${matricula} - ${error.message}`);
        } else {
          console.log(`  OK: ${matricula}`);
          actualizados++;
        }
      }

      console.log(`\nActualizados: ${actualizados}/${pendiente.length}`);
    }

    // 2. Crear registros faltantes (si hay)
    if (sinRegistro.length > 0) {
      console.log('\n' + '='.repeat(70));
      console.log('2. CREANDO REGISTROS FALTANTES:');
      console.log('='.repeat(70));

      let creados = 0;

      for (const v of sinRegistro) {
        const { error } = await supabase
          .from('fotos')
          .insert({
            license_plate: v.matricula,
            model: v.modelo,
            estado_pintura: 'vendido',
            photos_completed: true
          });

        if (error) {
          console.log(`  ERROR: ${v.matricula} - ${error.message}`);
        } else {
          console.log(`  OK: ${v.matricula}`);
          creados++;
        }
      }

      console.log(`\nCreados: ${creados}/${sinRegistro.length}`);
    }

    // 3. Verificación final
    console.log('\n' + '='.repeat(70));
    console.log('VERIFICACION FINAL:');
    console.log('='.repeat(70));

    const todasMatriculas = [...pendiente, ...sinRegistro.map(v => v.matricula)];

    const { data: verificacion } = await supabase
      .from('fotos')
      .select('license_plate, estado_pintura, photos_completed')
      .in('license_plate', todasMatriculas);

    console.log(`\nVerificados: ${verificacion.length}/${todasMatriculas.length}`);
    
    const correctos = verificacion.filter(v => v.estado_pintura === 'vendido').length;
    console.log(`Con estado_pintura = 'vendido': ${correctos}/${verificacion.length}`);

    if (correctos === verificacion.length) {
      console.log('\n✓ PROCESO COMPLETADO EXITOSAMENTE');
      console.log('✓ Todos los vendidos tienen estado_pintura = "vendido"');
      console.log('✓ Ya NO apareceran en pendientes');
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\nERROR:', error.message);
  }
}

corregirEstadoPintura();



