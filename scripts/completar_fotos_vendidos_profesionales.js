const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function completarFotosProfesionales() {
  console.log('='.repeat(70));
  console.log('COMPLETAR FOTOS DE VENDIDOS PROFESIONALES');
  console.log('='.repeat(70));

  try {
    // 1. Obtener vendidos profesionales
    console.log('\n1. Obteniendo vendidos PROFESIONALES...');
    const { data: profesionales, error: profError } = await supabase
      .from('vehicle_sale_status')
      .select('vehicle_id, license_plate, source_table')
      .eq('sale_status', 'profesional')
      .eq('source_table', 'stock');

    if (profError) throw profError;

    console.log(`   Total vendidos profesionales: ${profesionales.length}`);

    // 2. Verificar cuáles tienen fotos pendientes
    const { data: fotos, error: fotosError } = await supabase
      .from('fotos')
      .select('license_plate, photos_completed, estado_pintura');

    if (fotosError) throw fotosError;

    const fotosMap = {};
    fotos.forEach(f => {
      fotosMap[f.license_plate] = f;
    });

    const conFotosPendientes = profesionales.filter(p => {
      const foto = fotosMap[p.license_plate];
      return foto && !foto.photos_completed;
    });

    const sinRegistroFotos = profesionales.filter(p => {
      return !fotosMap[p.license_plate];
    });

    console.log(`   Con fotos pendientes: ${conFotosPendientes.length}`);
    console.log(`   Sin registro en fotos: ${sinRegistroFotos.length}`);
    console.log(`   Total a procesar: ${conFotosPendientes.length + sinRegistroFotos.length}`);

    if (conFotosPendientes.length === 0 && sinRegistroFotos.length === 0) {
      console.log('\n✓ NO HAY VENDIDOS PROFESIONALES CON FOTOS PENDIENTES');
      console.log('✓ Todo correcto');
      return;
    }

    // Mostrar vehículos a procesar
    console.log('\nVehiculos a procesar:');
    [...conFotosPendientes, ...sinRegistroFotos].slice(0, 20).forEach((v, i) => {
      const foto = fotosMap[v.license_plate];
      const estado = foto ? 'actualizar' : 'crear';
      console.log(`  ${(i + 1).toString().padStart(3)}. ${v.license_plate} [${estado}]`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('ACCION A REALIZAR:');
    console.log('='.repeat(70));
    console.log('\nPara vendidos profesionales:');
    console.log('  1. Completar fotos automaticamente (photos_completed = true)');
    console.log('  2. Mantener estado_pintura = vendido');
    console.log('  3. Crear registros en fotos si no existen');
    console.log('\nRazon: No necesitan fotos (vendidos fuera del sistema)');

    console.log('\nIniciando en 3 segundos...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Procesar registros existentes
    console.log('\n' + '='.repeat(70));
    console.log('ACTUALIZANDO FOTOS EXISTENTES:');
    console.log('='.repeat(70));

    let actualizados = 0;

    for (const v of conFotosPendientes) {
      const { error } = await supabase
        .from('fotos')
        .update({ photos_completed: true })
        .eq('license_plate', v.license_plate);

      if (!error) {
        actualizados++;
        if (actualizados % 5 === 0) {
          console.log(`  Actualizados: ${actualizados}/${conFotosPendientes.length}`);
        }
      } else {
        console.log(`  ERROR: ${v.license_plate} - ${error.message}`);
      }
    }

    console.log(`\nResultado: ${actualizados}/${conFotosPendientes.length} actualizados`);

    // 4. Crear registros faltantes
    console.log('\n' + '='.repeat(70));
    console.log('CREANDO REGISTROS EN FOTOS:');
    console.log('='.repeat(70));

    let creados = 0;

    for (const v of sinRegistroFotos) {
      const { error } = await supabase
        .from('fotos')
        .insert({
          license_plate: v.license_plate,
          estado_pintura: 'vendido',
          photos_completed: true
        });

      if (!error) {
        creados++;
        if (creados % 5 === 0) {
          console.log(`  Creados: ${creados}/${sinRegistroFotos.length}`);
        }
      } else {
        console.log(`  ERROR: ${v.license_plate} - ${error.message}`);
      }
    }

    console.log(`\nResultado: ${creados}/${sinRegistroFotos.length} creados`);

    // 5. Resumen final
    console.log('\n' + '='.repeat(70));
    console.log('RESUMEN FINAL:');
    console.log('='.repeat(70));
    console.log(`\nFotos actualizadas: ${actualizados}`);
    console.log(`Fotos creadas: ${creados}`);
    console.log(`Total procesados: ${actualizados + creados}`);

    // Verificación
    const { data: verificacion, error: verError } = await supabase
      .from('fotos')
      .select('license_plate, photos_completed')
      .in('license_plate', profesionales.map(p => p.license_plate))
      .eq('photos_completed', true);

    if (!verError) {
      console.log(`\nVerificados con fotos completadas: ${verificacion.length}/${profesionales.length}`);
    }

    if (verificacion.length === profesionales.length) {
      console.log('\n✓ PROCESO COMPLETADO EXITOSAMENTE');
      console.log('✓ Vendidos profesionales ya NO apareceran en pendientes');
    } else {
      console.log('\n⚠ Algunos vehiculos no se procesaron');
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\nERROR:', error.message);
  }
}

completarFotosProfesionales();



