const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function resumenTotal() {
  console.log('='.repeat(70));
  console.log('RESUMEN TOTAL DE MARCADOS HOY');
  console.log('='.repeat(70));

  try {
    // Total clasificados
    const { data: classified, count: totalClasificados } = await supabase
      .from('vehicle_sale_status')
      .select('*', { count: 'exact' });

    console.log(`\nTotal registros en vehicle_sale_status: ${totalClasificados}`);

    // Por tipo
    const profesional = classified.filter(v => v.sale_status === 'profesional').length;
    const vendido = classified.filter(v => v.sale_status === 'vendido').length;
    const tactico = classified.filter(v => v.sale_status === 'tactico_vn').length;

    console.log(`  - Profesional: ${profesional}`);
    console.log(`  - Vendido: ${vendido}`);
    console.log(`  - Tactico VN: ${tactico}`);

    // Por fuente
    const stock = classified.filter(v => v.source_table === 'stock').length;
    const nuevas = classified.filter(v => v.source_table === 'nuevas_entradas').length;

    console.log(`\nPor fuente:`);
    console.log(`  - STOCK: ${stock}`);
    console.log(`  - NUEVAS_ENTRADAS: ${nuevas}`);

    // Estado de STOCK
    console.log('\n' + '='.repeat(70));
    console.log('ESTADO DE STOCK:');
    console.log('='.repeat(70));

    const { data: stockData } = await supabase
      .from('stock')
      .select('is_sold');

    const vendidosStock = stockData.filter(v => v.is_sold === true).length;
    const disponiblesStock = stockData.filter(v => !v.is_sold).length;

    console.log(`\nTotal en STOCK: ${stockData.length}`);
    console.log(`  Vendidos: ${vendidosStock} (${Math.round(vendidosStock/stockData.length*100)}%)`);
    console.log(`  Disponibles: ${disponiblesStock} (${Math.round(disponiblesStock/stockData.length*100)}%)`);

    // Verificación final de ausentes
    console.log('\n' + '='.repeat(70));
    console.log('VERIFICACION FINAL DE AUSENTES:');
    console.log('='.repeat(70));

    // Simular la lógica de la API
    const { data: duc } = await supabase
      .from('duc_scraper')
      .select('"Matrícula"')
      .not('"Matrícula"', 'is', null);

    const csvMatriculas = new Set(
      (duc || []).map(v => v['Matrícula']?.toUpperCase().trim()).filter(Boolean)
    );

    const { data: sales } = await supabase
      .from('sales_vehicles')
      .select('license_plate');

    const salesMatriculas = new Set(
      (sales || []).map(v => v.license_plate?.toUpperCase().trim()).filter(Boolean)
    );

    const classifiedSet = new Set(
      (classified || []).map(v => `${v.source_table}_${v.vehicle_id}`)
    );

    // Vehículos de STOCK
    const { data: allStock } = await supabase
      .from('stock')
      .select('id, license_plate, model');

    const ausentesStock = allStock.filter(v => {
      const matricula = v.license_plate?.toUpperCase().trim();
      const key = `stock_${v.id}`;
      return matricula && 
             !csvMatriculas.has(matricula) && 
             !salesMatriculas.has(matricula) &&
             !classifiedSet.has(key);
    });

    // Vehículos de NUEVAS_ENTRADAS
    const { data: allNuevas } = await supabase
      .from('nuevas_entradas')
      .select('id, license_plate, model');

    const ausentesNuevas = allNuevas.filter(v => {
      const matricula = v.license_plate?.toUpperCase().trim();
      const key = `nuevas_entradas_${v.id}`;
      return matricula && 
             !csvMatriculas.has(matricula) && 
             !salesMatriculas.has(matricula) &&
             !classifiedSet.has(key);
    });

    const totalAusentes = ausentesStock.length + ausentesNuevas.length;

    console.log(`\nVehiculos AUSENTES sin clasificar:`);
    console.log(`  STOCK: ${ausentesStock.length}`);
    console.log(`  NUEVAS_ENTRADAS: ${ausentesNuevas.length}`);
    console.log(`  Total: ${totalAusentes}`);

    if (totalAusentes === 0) {
      console.log('\n✓ PERFECTO: NO HAY VEHICULOS AUSENTES SIN CLASIFICAR');
      console.log('✓ Todos los vehiculos estan correctamente clasificados');
    } else {
      console.log('\n⚠ ADVERTENCIA: Todavia hay vehiculos ausentes sin clasificar');
      
      if (ausentesStock.length > 0) {
        console.log('\nAusentes de STOCK:');
        ausentesStock.slice(0, 10).forEach((v, i) => {
          console.log(`  ${i + 1}. ${v.license_plate} - ${v.model || 'N/A'}`);
        });
      }

      if (ausentesNuevas.length > 0) {
        console.log('\nAusentes de NUEVAS_ENTRADAS:');
        ausentesNuevas.slice(0, 10).forEach((v, i) => {
          console.log(`  ${i + 1}. ${v.license_plate} - ${v.model || 'N/A'}`);
        });
      }
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\nERROR:', error.message);
  }
}

resumenTotal();



