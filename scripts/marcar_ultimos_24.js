const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function marcarUltimos24() {
  console.log('='.repeat(70));
  console.log('MARCAR ULTIMOS 24 VEHICULOS DE STOCK');
  console.log('='.repeat(70));

  try {
    // Obtener matriculas de DUC, VENTAS y CLASIFICADOS
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

    const { data: classified } = await supabase
      .from('vehicle_sale_status')
      .select('vehicle_id, source_table');

    const classifiedSet = new Set(
      (classified || []).map(v => `${v.source_table}_${v.vehicle_id}`)
    );

    // Obtener vehículos de STOCK ausentes
    const { data: stock } = await supabase
      .from('stock')
      .select('id, license_plate, model, is_sold');

    const ausentes = stock.filter(v => {
      const matricula = v.license_plate?.toUpperCase().trim();
      const key = `stock_${v.id}`;
      return matricula && 
             !csvMatriculas.has(matricula) && 
             !salesMatriculas.has(matricula) &&
             !classifiedSet.has(key);
    });

    console.log(`\nVehiculos ausentes de STOCK: ${ausentes.length}`);

    if (ausentes.length === 0) {
      console.log('\n✓ NO HAY VEHICULOS PENDIENTES DE MARCAR');
      return;
    }

    console.log('\nVehiculos a marcar:');
    ausentes.forEach((v, i) => {
      console.log(`  ${(i + 1).toString().padStart(3)}. ${v.license_plate} - ${v.model || 'N/A'}`);
    });

    console.log('\nIniciando en 3 segundos...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Procesar vehículos
    console.log('\n' + '='.repeat(70));
    console.log('PROCESANDO...');
    console.log('='.repeat(70));

    let stockOK = 0, fotosOK = 0, statusOK = 0;
    let errors = 0;

    for (const v of ausentes) {
      // 1. Marcar en STOCK
      const { error: stockError } = await supabase
        .from('stock')
        .update({ is_sold: true })
        .eq('id', v.id);

      if (!stockError) stockOK++;

      // 2. Marcar en FOTOS
      const { data: fotoExists } = await supabase
        .from('fotos')
        .select('id')
        .eq('license_plate', v.license_plate)
        .single();

      if (fotoExists) {
        const { error: fotoError } = await supabase
          .from('fotos')
          .update({ estado_pintura: 'vendido' })
          .eq('license_plate', v.license_plate);

        if (!fotoError) fotosOK++;
      }

      // 3. Registrar en vehicle_sale_status
      const { error: statusError } = await supabase
        .from('vehicle_sale_status')
        .insert({
          vehicle_id: v.id,
          source_table: 'stock',
          license_plate: v.license_plate,
          sale_status: 'profesional',
          notes: 'Vendido profesionalmente (ausente en DUC y VENTAS)'
        });

      if (!statusError) statusOK++;

      if ((stockOK + errors) % 5 === 0) {
        console.log(`  Procesados: ${stockOK + errors}/${ausentes.length}`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('RESUMEN:');
    console.log('='.repeat(70));
    console.log(`\nVehiculos procesados: ${ausentes.length}`);
    console.log(`  STOCK actualizados: ${stockOK}`);
    console.log(`  FOTOS actualizadas: ${fotosOK}`);
    console.log(`  STATUS registrados: ${statusOK}`);

    // Verificación final
    const { data: verificacion } = await supabase
      .from('stock')
      .select('license_plate, is_sold')
      .in('license_plate', ausentes.map(v => v.license_plate))
      .eq('is_sold', true);

    console.log(`\nVerificados como vendidos: ${verificacion.length}/${ausentes.length}`);

    if (verificacion.length === ausentes.length) {
      console.log('\n✓ PROCESO COMPLETADO EXITOSAMENTE');
      console.log('✓ Todos los vehiculos marcados como vendidos');
    } else {
      console.log('\n⚠ Algunos vehiculos no se marcaron correctamente');
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\nERROR:', error.message);
  }
}

marcarUltimos24();



