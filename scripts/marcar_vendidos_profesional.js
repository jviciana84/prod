const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function marcarVendidosProfesional() {
  console.log('='.repeat(70));
  console.log('MARCAR VEHICULOS COMO VENDIDOS PROFESIONALMENTE');
  console.log('='.repeat(70));

  try {
    // Leer lista de vehículos a marcar
    const matriculas = JSON.parse(fs.readFileSync('scripts/vehiculos_para_marcar.json', 'utf8'));
    
    console.log(`\nVehiculos a marcar como vendidos: ${matriculas.length}`);
    console.log('\nMatriculas:');
    matriculas.forEach((m, i) => {
      console.log(`  ${(i + 1).toString().padStart(3)}. ${m}`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('CONFIRMACION');
    console.log('='.repeat(70));
    console.log('\nSe realizaran las siguientes acciones:');
    console.log('  1. UPDATE stock SET is_sold = true');
    console.log('  2. UPDATE fotos SET estado_pintura = \'vendido\'');
    console.log('\nEsto movera estos vehiculos a la pestaña "Vendido"');
    
    // Dar 3 segundos para cancelar
    console.log('\nIniciando en 3 segundos...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 1. Marcar en STOCK
    console.log('\n' + '='.repeat(70));
    console.log('1. ACTUALIZANDO TABLA STOCK');
    console.log('='.repeat(70));

    let stockActualizados = 0;
    let stockErrores = 0;

    for (const matricula of matriculas) {
      try {
        const { error } = await supabase
          .from('stock')
          .update({ is_sold: true })
          .eq('license_plate', matricula);

        if (error) {
          console.log(`  ERROR: ${matricula} - ${error.message}`);
          stockErrores++;
        } else {
          console.log(`  OK: ${matricula}`);
          stockActualizados++;
        }
      } catch (err) {
        console.log(`  ERROR: ${matricula} - ${err.message}`);
        stockErrores++;
      }
    }

    console.log(`\nResultado STOCK:`);
    console.log(`  Actualizados: ${stockActualizados}`);
    console.log(`  Errores: ${stockErrores}`);

    // 2. Marcar en FOTOS
    console.log('\n' + '='.repeat(70));
    console.log('2. ACTUALIZANDO TABLA FOTOS');
    console.log('='.repeat(70));

    let fotosActualizadas = 0;
    let fotosErrores = 0;
    let fotosNoExisten = 0;

    for (const matricula of matriculas) {
      try {
        // Verificar si existe primero
        const { data: existe } = await supabase
          .from('fotos')
          .select('id')
          .eq('license_plate', matricula)
          .single();

        if (!existe) {
          console.log(`  NO EXISTE: ${matricula} (no tiene registro en fotos)`);
          fotosNoExisten++;
          continue;
        }

        const { error } = await supabase
          .from('fotos')
          .update({ estado_pintura: 'vendido' })
          .eq('license_plate', matricula);

        if (error) {
          console.log(`  ERROR: ${matricula} - ${error.message}`);
          fotosErrores++;
        } else {
          console.log(`  OK: ${matricula}`);
          fotosActualizadas++;
        }
      } catch (err) {
        console.log(`  ERROR: ${matricula} - ${err.message}`);
        fotosErrores++;
      }
    }

    console.log(`\nResultado FOTOS:`);
    console.log(`  Actualizadas: ${fotosActualizadas}`);
    console.log(`  No existen: ${fotosNoExisten}`);
    console.log(`  Errores: ${fotosErrores}`);

    // 3. Verificación final
    console.log('\n' + '='.repeat(70));
    console.log('3. VERIFICACION FINAL');
    console.log('='.repeat(70));

    const { data: verificacion, error: verError } = await supabase
      .from('stock')
      .select('license_plate, model, is_sold')
      .in('license_plate', matriculas)
      .eq('is_sold', true);

    if (verError) throw verError;

    console.log(`\nVehiculos verificados como vendidos: ${verificacion.length}/${matriculas.length}`);
    
    if (verificacion.length < matriculas.length) {
      console.log('\nADVERTENCIA: No todos los vehiculos se marcaron correctamente');
      const marcados = new Set(verificacion.map(v => v.license_plate));
      const noMarcados = matriculas.filter(m => !marcados.has(m));
      console.log('\nNo marcados:');
      noMarcados.forEach(m => console.log(`  - ${m}`));
    }

    // 4. Resumen final
    console.log('\n' + '='.repeat(70));
    console.log('RESUMEN FINAL');
    console.log('='.repeat(70));
    console.log(`\nTotal vehiculos procesados: ${matriculas.length}`);
    console.log(`  STOCK actualizados: ${stockActualizados}`);
    console.log(`  FOTOS actualizadas: ${fotosActualizadas}`);
    console.log(`  FOTOS no existian: ${fotosNoExisten}`);
    console.log(`  Errores: ${stockErrores + fotosErrores}`);
    console.log(`\nVerificados como vendidos: ${verificacion.length}/${matriculas.length}`);

    if (verificacion.length === matriculas.length) {
      console.log('\n✓ PROCESO COMPLETADO EXITOSAMENTE');
      console.log('✓ Todos los vehiculos marcados como vendidos');
      console.log('✓ Ahora aparecen en la pestaña "Vendido"');
    } else {
      console.log('\n⚠ PROCESO COMPLETADO CON ADVERTENCIAS');
      console.log('⚠ Revisa los errores anteriores');
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\nERROR GENERAL:', error.message);
    console.error('Detalles:', error);
  }
}

marcarVendidosProfesional();



