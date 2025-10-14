const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function analizarAusentesYVentas() {
  console.log('='.repeat(70));
  console.log('ANALISIS: VEHICULOS AUSENTES vs VENTAS');
  console.log('='.repeat(70));

  try {
    // 1. Obtener vehículos de STOCK
    console.log('\n1. Obteniendo vehiculos de STOCK...');
    const { data: stockData, error: stockError } = await supabase
      .from('stock')
      .select('id, license_plate, model, is_sold');

    if (stockError) throw stockError;
    console.log(`   Total en STOCK: ${stockData.length}`);

    // 2. Obtener vehículos de NUEVAS_ENTRADAS
    console.log('\n2. Obteniendo vehiculos de NUEVAS_ENTRADAS...');
    const { data: nuevasData, error: nuevasError } = await supabase
      .from('nuevas_entradas')
      .select('id, license_plate, model');

    if (nuevasError) throw nuevasError;
    console.log(`   Total en NUEVAS_ENTRADAS: ${nuevasData.length}`);

    // 3. Obtener vehículos clasificados
    console.log('\n3. Obteniendo vehiculos YA CLASIFICADOS...');
    const { data: classified, error: classifiedError } = await supabase
      .from('vehicle_sale_status')
      .select('vehicle_id, source_table');

    if (classifiedError) {
      console.log(`   vehicle_sale_status no disponible: ${classifiedError.message}`);
      console.log('   Continuando sin filtrar clasificados...');
    }
    
    const classifiedSet = new Set(
      (classified || []).map(v => `${v.source_table}_${v.vehicle_id}`)
    );
    console.log(`   Total ya clasificados: ${classifiedSet.size || 0}`);

    // 4. Combinar vehículos NO clasificados
    const allVehicles = [
      ...(stockData || [])
        .filter(v => !classifiedSet.has(`stock_${v.id}`))
        .map(v => ({ ...v, source: 'stock' })),
      ...(nuevasData || [])
        .filter(v => !classifiedSet.has(`nuevas_entradas_${v.id}`))
        .map(v => ({ ...v, source: 'nuevas_entradas' }))
    ];

    console.log(`   Vehiculos NO clasificados: ${allVehicles.length}`);

    // 5. Obtener matrículas del CSV de DUC
    console.log('\n4. Obteniendo matriculas del CSV DUC...');
    const { data: csvData, error: csvError } = await supabase
      .from('duc_scraper')
      .select('"Matrícula"')
      .not('"Matrícula"', 'is', null);

    if (csvError) throw csvError;

    const csvMatriculas = new Set(
      (csvData || []).map(v => v['Matrícula']?.toUpperCase().trim()).filter(Boolean)
    );
    console.log(`   Matriculas en DUC: ${csvMatriculas.size}`);

    // 6. Obtener ventas
    console.log('\n5. Obteniendo VENTAS...');
    const { data: salesData, error: salesError } = await supabase
      .from('sales_vehicles')
      .select('license_plate');

    if (salesError) throw salesError;

    const salesMatriculas = new Set(
      (salesData || []).map(v => v.license_plate?.toUpperCase().trim()).filter(Boolean)
    );
    console.log(`   Matriculas en VENTAS: ${salesMatriculas.size}`);

    // 7. Identificar AUSENTES (no están en DUC)
    console.log('\n' + '='.repeat(70));
    console.log('IDENTIFICACION DE AUSENTES:');
    console.log('='.repeat(70));

    const ausentes = allVehicles.filter(v => {
      const matricula = v.license_plate?.toUpperCase().trim();
      return matricula && !csvMatriculas.has(matricula);
    });

    console.log(`\nTotal vehiculos AUSENTES (no en DUC): ${ausentes.length}`);

    // 8. Clasificar ausentes
    const enVentas = [];
    const noEnVentas = [];

    ausentes.forEach(v => {
      const matricula = v.license_plate?.toUpperCase().trim();
      if (salesMatriculas.has(matricula)) {
        enVentas.push(v);
      } else {
        noEnVentas.push(v);
      }
    });

    console.log(`  - EN tabla VENTAS: ${enVentas.length}`);
    console.log(`  - NO en tabla VENTAS: ${noEnVentas.length}`);

    // 9. Mostrar detalles
    console.log('\n' + '='.repeat(70));
    console.log('CATEGORIA 1: AUSENTES EN VENTAS (marcar como VENDIDO)');
    console.log('='.repeat(70));
    
    if (enVentas.length > 0) {
      enVentas.slice(0, 20).forEach((v, i) => {
        console.log(`${(i + 1).toString().padStart(3)}. ${v.license_plate} - ${v.model || 'N/A'} [${v.source}]`);
      });
      if (enVentas.length > 20) {
        console.log(`... y ${enVentas.length - 20} mas`);
      }
    } else {
      console.log('  Ningun vehiculo en esta categoria');
    }

    console.log('\n' + '='.repeat(70));
    console.log('CATEGORIA 2: AUSENTES NO EN VENTAS (marcar como VENDIDO PROFESIONAL)');
    console.log('='.repeat(70));
    
    if (noEnVentas.length > 0) {
      noEnVentas.slice(0, 20).forEach((v, i) => {
        console.log(`${(i + 1).toString().padStart(3)}. ${v.license_plate} - ${v.model || 'N/A'} [${v.source}]`);
      });
      if (noEnVentas.length > 20) {
        console.log(`... y ${noEnVentas.length - 20} mas`);
      }
    } else {
      console.log('  Ningun vehiculo en esta categoria');
    }

    // 10. Resumen de acciones
    console.log('\n' + '='.repeat(70));
    console.log('RESUMEN DE ACCIONES:');
    console.log('='.repeat(70));
    
    console.log(`\n1. Marcar como VENDIDO: ${enVentas.length} vehiculos`);
    console.log('   - Ausentes que SI estan en sales_vehicles');
    console.log('   - Se marcaran: is_sold = true en stock');
    console.log('   - Se marcaran: estado_pintura = vendido en fotos');

    console.log(`\n2. Marcar como VENDIDO PROFESIONAL: ${noEnVentas.length} vehiculos`);
    console.log('   - Ausentes que NO estan en sales_vehicles');
    console.log('   - Se marcaran: is_sold = true en stock');
    console.log('   - Se marcaran: estado_pintura = vendido en fotos');
    console.log('   - Se registraran en vehicle_sale_status como profesional');

    console.log(`\nTotal a actualizar: ${enVentas.length + noEnVentas.length}`);

    // 11. Guardar listas
    const fs = require('fs');
    const clasificacion = {
      enVentas: enVentas.map(v => ({
        id: v.id,
        matricula: v.license_plate,
        modelo: v.model,
        source: v.source
      })),
      noEnVentas: noEnVentas.map(v => ({
        id: v.id,
        matricula: v.license_plate,
        modelo: v.model,
        source: v.source
      }))
    };

    fs.writeFileSync(
      'scripts/ausentes_para_marcar.json',
      JSON.stringify(clasificacion, null, 2)
    );

    console.log('\n✓ Clasificacion guardada en: scripts/ausentes_para_marcar.json');
    console.log('\nPara ejecutar el marcado:');
    console.log('  node scripts/marcar_ausentes_final.js');
    
    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\nERROR:', error.message);
    console.error('Detalles:', error);
  }
}

analizarAusentesYVentas();

