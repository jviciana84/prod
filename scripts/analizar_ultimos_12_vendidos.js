const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function analizarUltimos12() {
  console.log('='.repeat(70));
  console.log('ANALISIS DETALLADO: 12 VENDIDOS CON FOTOS PENDIENTES');
  console.log('='.repeat(70));

  const matriculas = [
    '7569MZH', '1124LBL', '3742MVJ', '9721MCH', '6689LSC',
    '8284LLH', '4712MLY', '0044NCS', '2382MPL', '5230MMB',
    '7049NBL', '5509LSR'
  ];

  try {
    // 1. Obtener datos de STOCK
    const { data: stock, error: stockError } = await supabase
      .from('stock')
      .select('id, license_plate, model, is_sold')
      .in('license_plate', matriculas);

    if (stockError) throw stockError;

    // 2. Obtener clasificación
    const { data: clasificados, error: clasifError } = await supabase
      .from('vehicle_sale_status')
      .select('vehicle_id, license_plate, sale_status')
      .in('license_plate', matriculas);

    if (clasifError) throw clasifError;

    const clasifMap = {};
    clasificados.forEach(c => {
      clasifMap[c.license_plate] = c.sale_status;
    });

    // 3. Verificar si están en VENTAS
    const { data: ventas, error: ventasError } = await supabase
      .from('sales_vehicles')
      .select('license_plate')
      .in('license_plate', matriculas);

    if (ventasError) throw ventasError;

    const ventasSet = new Set(ventas.map(v => v.license_plate));

    // 4. Obtener estado de FOTOS
    const { data: fotos, error: fotosError } = await supabase
      .from('fotos')
      .select('license_plate, photos_completed, estado_pintura');

    if (fotosError) throw fotosError;

    const fotosMap = {};
    fotos.forEach(f => {
      fotosMap[f.license_plate] = f;
    });

    // 5. Clasificar los 12 vehículos
    console.log('\n' + '='.repeat(70));
    console.log('CLASIFICACION DETALLADA:');
    console.log('='.repeat(70));

    const profesionales = [];
    const particulares = [];
    const sinClasificar = [];

    stock.forEach(v => {
      const clasificacion = clasifMap[v.license_plate];
      const enVentas = ventasSet.has(v.license_plate);
      const foto = fotosMap[v.license_plate];
      
      const vehiculo = {
        ...v,
        clasificacion: clasificacion || (enVentas ? 'vendido' : 'sin clasificar'),
        en_ventas: enVentas,
        tiene_foto: !!foto,
        fotos_completadas: foto?.photos_completed || false
      };

      if (clasificacion === 'profesional' || (!clasificacion && !enVentas)) {
        profesionales.push(vehiculo);
      } else if (clasificacion === 'vendido' || enVentas) {
        particulares.push(vehiculo);
      } else {
        sinClasificar.push(vehiculo);
      }
    });

    console.log(`\nPROFESIONALES (no necesitan fotos): ${profesionales.length}`);
    if (profesionales.length > 0) {
      profesionales.forEach((v, i) => {
        const estadoFoto = v.tiene_foto ? 'existe' : 'NO existe';
        console.log(`  ${i + 1}. ${v.license_plate} - ${v.model} [fotos: ${estadoFoto}]`);
      });
    }

    console.log(`\nPARTICULARES (SI necesitan fotos): ${particulares.length}`);
    if (particulares.length > 0) {
      particulares.forEach((v, i) => {
        const estadoFoto = v.tiene_foto ? `pendiente=${!v.fotos_completadas}` : 'NO existe';
        console.log(`  ${i + 1}. ${v.license_plate} - ${v.model} [fotos: ${estadoFoto}]`);
      });
    }

    console.log(`\nSIN CLASIFICAR: ${sinClasificar.length}`);
    if (sinClasificar.length > 0) {
      sinClasificar.forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.license_plate} - ${v.model}`);
      });
    }

    // 6. Acciones recomendadas
    console.log('\n' + '='.repeat(70));
    console.log('ACCIONES RECOMENDADAS:');
    console.log('='.repeat(70));

    if (profesionales.length > 0) {
      console.log(`\n1. PROFESIONALES (${profesionales.length}):`);
      console.log('   - Crear/completar fotos automaticamente');
      console.log('   - NO deberian aparecer en pendientes');
    }

    if (particulares.length > 0) {
      console.log(`\n2. PARTICULARES (${particulares.length}):`);
      console.log('   - MANTENER en pendientes');
      console.log('   - Son ventas normales que necesitan fotos');
    }

    if (sinClasificar.length > 0) {
      console.log(`\n3. SIN CLASIFICAR (${sinClasificar.length}):`);
      console.log('   - Clasificar primero');
      console.log('   - Luego decidir si necesitan fotos');
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\nERROR:', error.message);
  }
}

analizarUltimos12();



