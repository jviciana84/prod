const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function limpiarPendientesVendidos() {
  console.log('='.repeat(70));
  console.log('LIMPIAR FOTOS PENDIENTES DE VEHÍCULOS VENDIDOS');
  console.log('='.repeat(70));

  try {
    // 1. Obtener fotos pendientes
    console.log('\n1. Obteniendo fotos pendientes...');
    const { data: fotosPendientes } = await supabase
      .from('fotos')
      .select('license_plate, model, estado_pintura, photos_completed')
      .eq('estado_pintura', 'pendiente');

    console.log(`   Total fotos pendientes: ${fotosPendientes?.length || 0}`);

    // 2. Obtener ventas
    console.log('\n2. Obteniendo vehículos vendidos...');
    const { data: vendidos } = await supabase
      .from('sales_vehicles')
      .select('license_plate');

    const vendidosSet = new Set(
      (vendidos || []).map(v => v.license_plate?.toUpperCase().trim())
    );

    console.log(`   Total vendidos: ${vendidosSet.size}`);

    // 3. Identificar pendientes que están vendidos
    const pendientesVendidos = fotosPendientes.filter(f => {
      const matricula = f.license_plate?.toUpperCase().trim();
      return vendidosSet.has(matricula);
    });

    console.log('\n' + '='.repeat(70));
    console.log('PENDIENTES QUE ESTÁN VENDIDOS');
    console.log('='.repeat(70));
    console.log(`\nTotal: ${pendientesVendidos.length}`);

    if (pendientesVendidos.length === 0) {
      console.log('\n✅ No hay fotos pendientes de vehículos vendidos');
      console.log('✅ Todo está correctamente sincronizado');
      return;
    }

    console.log('\nVehículos a actualizar:');
    pendientesVendidos.forEach((v, i) => {
      console.log(`  ${i+1}. ${v.license_plate} - ${v.model || 'N/A'}`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('ACCIÓN');
    console.log('='.repeat(70));
    console.log('\nSe actualizará:');
    console.log('  - fotos.estado_pintura → "vendido"');
    console.log('  - fotos.photos_completed → true (si no lo está)');
    console.log('  - Dejarán de aparecer en pendientes');

    console.log('\nEjecutando en 3 segundos...');
    await new Promise(r => setTimeout(r, 3000));

    console.log('\n' + '='.repeat(70));
    console.log('ACTUALIZANDO');
    console.log('='.repeat(70));

    let actualizados = 0;
    let errores = 0;

    for (const v of pendientesVendidos) {
      try {
        const { error } = await supabase
          .from('fotos')
          .update({
            estado_pintura: 'vendido',
            photos_completed: true,
            updated_at: new Date().toISOString()
          })
          .eq('license_plate', v.license_plate);

        if (error) {
          console.error(`  ❌ Error con ${v.license_plate}:`, error.message);
          errores++;
        } else {
          actualizados++;
          if (actualizados % 5 === 0) {
            console.log(`  ✅ Actualizados: ${actualizados}/${pendientesVendidos.length}`);
          }
        }
      } catch (err) {
        console.error(`  ❌ Error con ${v.license_plate}:`, err.message);
        errores++;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('RESULTADO');
    console.log('='.repeat(70));
    console.log(`\n✅ Actualizados: ${actualizados}/${pendientesVendidos.length}`);
    console.log(`❌ Errores: ${errores}`);

    if (errores === 0) {
      console.log('\n🎉 LIMPIEZA COMPLETADA');
      console.log('✅ Fotos pendientes sincronizadas con ventas');
      console.log('✅ Vehículos vendidos no aparecerán en pendientes');
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

limpiarPendientesVendidos();

