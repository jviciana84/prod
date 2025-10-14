const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function analizarEntregasYFotos() {
  console.log('='.repeat(70));
  console.log('ANALISIS: VENTAS PARTICULARES, ENTREGAS Y FOTOS');
  console.log('='.repeat(70));

  try {
    // 1. Obtener ventas particulares (en sales_vehicles)
    console.log('\n1. Obteniendo ventas PARTICULARES...');
    const { data: ventas, error: ventasError } = await supabase
      .from('sales_vehicles')
      .select('license_plate, model, sale_date');

    if (ventasError) throw ventasError;

    console.log(`   Total ventas: ${ventas.length}`);

    // 2. Obtener entregas
    console.log('\n2. Obteniendo ENTREGAS...');
    const { data: entregas, error: entregasError } = await supabase
      .from('entregas')
      .select('matricula, fecha_entrega, fecha_venta');

    if (entregasError) throw entregasError;

    const entregasMap = {};
    entregas.forEach(e => {
      entregasMap[e.matricula] = e;
    });

    console.log(`   Total entregas: ${entregas.length}`);

    // 3. Clasificar ventas
    const conEntrega = [];
    const sinEntrega = [];

    ventas.forEach(v => {
      const entrega = entregasMap[v.license_plate];
      if (entrega && entrega.fecha_entrega) {
        conEntrega.push({ ...v, fecha_entrega: entrega.fecha_entrega });
      } else {
        sinEntrega.push(v);
      }
    });

    console.log(`   Con fecha de entrega: ${conEntrega.length}`);
    console.log(`   Sin fecha de entrega: ${sinEntrega.length}`);

    // 4. Obtener estado de fotos
    const { data: fotos } = await supabase
      .from('fotos')
      .select('license_plate, photos_completed, estado_pintura');

    const fotosMap = {};
    fotos.forEach(f => {
      fotosMap[f.license_plate] = f;
    });

    // 5. Analizar estado actual de fotos
    console.log('\n' + '='.repeat(70));
    console.log('CATEGORIA 1: VENTAS CON FECHA DE ENTREGA');
    console.log('(Deberian tener photos_completed = true)');
    console.log('='.repeat(70));

    const conEntregaSinFotos = conEntrega.filter(v => {
      const foto = fotosMap[v.license_plate];
      return !foto || !foto.photos_completed;
    });

    console.log(`\nTotal con entrega: ${conEntrega.length}`);
    console.log(`Fotos completadas: ${conEntrega.length - conEntregaSinFotos.length}`);
    console.log(`Fotos pendientes: ${conEntregaSinFotos.length}`);

    if (conEntregaSinFotos.length > 0) {
      console.log('\nVentas con entrega pero fotos pendientes:');
      conEntregaSinFotos.slice(0, 10).forEach((v, i) => {
        const foto = fotosMap[v.license_plate];
        const estadoFoto = foto ? foto.estado_pintura : 'sin registro';
        console.log(`  ${i + 1}. ${v.license_plate} - ${v.model} [${estadoFoto}]`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('CATEGORIA 2: VENTAS SIN FECHA DE ENTREGA');
    console.log('(NO deberian aparecer en pendientes de fotos)');
    console.log('='.repeat(70));

    const sinEntregaConFotos = sinEntrega.filter(v => {
      const foto = fotosMap[v.license_plate];
      return foto && foto.photos_completed;
    });

    const sinEntregaSinFotos = sinEntrega.filter(v => {
      const foto = fotosMap[v.license_plate];
      return !foto || !foto.photos_completed;
    });

    console.log(`\nTotal sin entrega: ${sinEntrega.length}`);
    console.log(`Fotos completadas: ${sinEntregaConFotos.length}`);
    console.log(`Fotos pendientes: ${sinEntregaSinFotos.length}`);

    if (sinEntregaSinFotos.length > 0) {
      console.log('\nVentas sin entrega con fotos pendientes:');
      sinEntregaSinFotos.slice(0, 10).forEach((v, i) => {
        const foto = fotosMap[v.license_plate];
        const estadoFoto = foto ? foto.estado_pintura : 'sin registro';
        console.log(`  ${i + 1}. ${v.license_plate} - ${v.model} [${estadoFoto}]`);
      });
    }

    // 6. Acciones propuestas
    console.log('\n' + '='.repeat(70));
    console.log('ACCIONES PROPUESTAS:');
    console.log('='.repeat(70));

    console.log(`\n1. Completar fotos para ventas con entrega: ${conEntregaSinFotos.length} vehiculos`);
    console.log('   UPDATE fotos SET photos_completed = true');
    console.log('   WHERE matricula IN (ventas con fecha_entrega)');

    console.log('\n2. Crear TRIGGER automatico:');
    console.log('   WHEN entregas.fecha_entrega IS NOT NULL');
    console.log('   THEN UPDATE fotos SET photos_completed = true');

    console.log('\n3. Filtro en interfaz "Pendientes":');
    console.log('   - Excluir: is_sold = true AND NO tiene fecha_entrega');
    console.log('   - Incluir: ventas con fecha_entrega pero fotos pendientes');

    // Guardar listas
    const fs = require('fs');
    fs.writeFileSync(
      'scripts/ventas_para_completar_fotos.json',
      JSON.stringify({
        conEntrega: conEntregaSinFotos.map(v => ({
          matricula: v.license_plate,
          modelo: v.model,
          fecha_entrega: v.fecha_entrega
        }))
      }, null, 2)
    );

    console.log('\n✓ Lista guardada en: scripts/ventas_para_completar_fotos.json');
    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\nERROR:', error.message);
  }
}

analizarEntregasYFotos();



