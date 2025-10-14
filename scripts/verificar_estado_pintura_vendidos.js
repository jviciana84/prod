const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function verificarEstadoPintura() {
  console.log('='.repeat(70));
  console.log('VERIFICACION: estado_pintura EN VENDIDOS');
  console.log('='.repeat(70));

  try {
    // Obtener vendidos de STOCK
    const { data: vendidos } = await supabase
      .from('stock')
      .select('license_plate, model, is_sold')
      .eq('is_sold', true);

    console.log(`\nTotal vendidos en STOCK: ${vendidos.length}`);

    // Obtener estado en FOTOS
    const { data: fotos } = await supabase
      .from('fotos')
      .select('license_plate, estado_pintura, photos_completed');

    const fotosMap = {};
    fotos.forEach(f => {
      fotosMap[f.license_plate] = f;
    });

    // Clasificar por estado_pintura
    const estadoVendido = [];
    const estadoPendiente = [];
    const estadoOtro = [];
    const sinRegistro = [];

    vendidos.forEach(v => {
      const foto = fotosMap[v.license_plate];
      
      if (!foto) {
        sinRegistro.push(v);
      } else if (foto.estado_pintura === 'vendido') {
        estadoVendido.push(v);
      } else if (foto.estado_pintura === 'pendiente') {
        estadoPendiente.push(v);
      } else {
        estadoOtro.push({ ...v, estado: foto.estado_pintura });
      }
    });

    console.log('\n' + '='.repeat(70));
    console.log('CLASIFICACION POR estado_pintura:');
    console.log('='.repeat(70));

    console.log(`\nestado_pintura = 'vendido': ${estadoVendido.length} ✓ NO aparecen en pendientes`);
    console.log(`estado_pintura = 'pendiente': ${estadoPendiente.length} ⚠ SI aparecen en pendientes`);
    console.log(`Otros estados: ${estadoOtro.length}`);
    console.log(`Sin registro en fotos: ${sinRegistro.length} ⚠ Podrian aparecer`);

    // Mostrar los problemáticos
    if (estadoPendiente.length > 0) {
      console.log('\n' + '-'.repeat(70));
      console.log('VENDIDOS CON estado_pintura = "pendiente":');
      console.log('(ESTOS SI APARECEN EN PENDIENTES)');
      console.log('-'.repeat(70));
      estadoPendiente.slice(0, 15).forEach((v, i) => {
        const foto = fotosMap[v.license_plate];
        console.log(`  ${i + 1}. ${v.license_plate} - ${v.model} [photos_completed: ${foto.photos_completed}]`);
      });
      if (estadoPendiente.length > 15) {
        console.log(`  ... y ${estadoPendiente.length - 15} mas`);
      }
    }

    if (sinRegistro.length > 0) {
      console.log('\n' + '-'.repeat(70));
      console.log('VENDIDOS SIN REGISTRO EN FOTOS:');
      console.log('(Necesitan crearse con estado_pintura = vendido)');
      console.log('-'.repeat(70));
      sinRegistro.slice(0, 15).forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.license_plate} - ${v.model}`);
      });
      if (sinRegistro.length > 15) {
        console.log(`  ... y ${sinRegistro.length - 15} mas`);
      }
    }

    // Acción recomendada
    console.log('\n' + '='.repeat(70));
    console.log('ACCION RECOMENDADA:');
    console.log('='.repeat(70));

    const totalProblematicos = estadoPendiente.length + sinRegistro.length;

    if (totalProblematicos > 0) {
      console.log(`\nCorregir ${totalProblematicos} vehiculos vendidos:`);
      
      if (estadoPendiente.length > 0) {
        console.log(`\n1. Actualizar ${estadoPendiente.length} con estado_pintura = 'pendiente':`);
        console.log('   UPDATE fotos');
        console.log('   SET estado_pintura = \'vendido\'');
        console.log('   WHERE license_plate IN (...)');
      }

      if (sinRegistro.length > 0) {
        console.log(`\n2. Crear ${sinRegistro.length} registros faltantes:`);
        console.log('   INSERT INTO fotos');
        console.log('   (license_plate, model, estado_pintura, photos_completed)');
        console.log('   VALUES (..., \'vendido\', true)');
      }

      // Guardar listas
      const fs = require('fs');
      fs.writeFileSync(
        'scripts/vendidos_con_estado_incorrecto.json',
        JSON.stringify({
          pendiente: estadoPendiente.map(v => v.license_plate),
          sinRegistro: sinRegistro.map(v => ({ matricula: v.license_plate, modelo: v.model }))
        }, null, 2)
      );

      console.log('\n✓ Listas guardadas en: scripts/vendidos_con_estado_incorrecto.json');
      console.log('\nPara ejecutar la correccion:');
      console.log('  node scripts/corregir_estado_pintura_vendidos.js');
    } else {
      console.log('\n✓ TODOS LOS VENDIDOS TIENEN estado_pintura = "vendido"');
      console.log('✓ La logica esta funcionando correctamente');
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\nERROR:', error.message);
  }
}

verificarEstadoPintura();



