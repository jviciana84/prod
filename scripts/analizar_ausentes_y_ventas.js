const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function analizarAusentesYVentas() {
  console.log('='.repeat(70));
  console.log('ANALISIS: AUSENTES vs VENTAS');
  console.log('='.repeat(70));

  try {
    // 1. Obtener vehículos de STOCK
    console.log('\n1. Obteniendo vehiculos de STOCK...');
    const { data: stock, error: stockError } = await supabase
      .from('stock')
      .select('license_plate, model, is_sold, deleted_at');

    if (stockError) throw stockError;
    console.log(`   Total en STOCK: ${stock.length}`);

    // 2. Obtener vehículos de NUEVAS_ENTRADAS
    console.log('\n2. Obteniendo vehiculos de NUEVAS_ENTRADAS...');
    const { data: nuevasEntradas, error: nuevasError } = await supabase
      .from('nuevas_entradas')
      .select('matricula, modelo, deleted_at');

    if (nuevasError) throw nuevasError;
    console.log(`   Total en NUEVAS_ENTRADAS: ${nuevasEntradas.length}`);

    // 3. Obtener VENTAS (probar diferentes tablas)
    console.log('\n3. Obteniendo VENTAS...');
    
    // Probar sales_vehicles primero
    let ventas = [];
    try {
      const { data: salesData, error: salesError } = await supabase
        .from('sales_vehicles')
        .select('license_plate, model, sale_date');
      
      if (!salesError && salesData) {
        ventas = salesData;
        console.log(`   Total en SALES_VEHICLES: ${ventas.length}`);
      }
    } catch (err) {
      console.log('   sales_vehicles no disponible, probando sales...');
    }

    // Si no hay datos, probar tabla sales
    if (ventas.length === 0) {
      try {
        const { data: salesData2, error: salesError2 } = await supabase
          .from('sales')
          .select('*');
        
        if (!salesError2 && salesData2) {
          ventas = salesData2;
          console.log(`   Total en SALES: ${ventas.length}`);
        }
      } catch (err) {
        console.log('   sales no disponible');
      }
    }

    // 4. Identificar AUSENTES (deleted_at no null)
    console.log('\n4. Identificando vehiculos AUSENTES...');
    const ausentesStock = stock.filter(v => v.deleted_at !== null);
    const ausentesNuevas = nuevasEntradas.filter(v => v.deleted_at !== null);

    console.log(`   Ausentes en STOCK: ${ausentesStock.length}`);
    console.log(`   Ausentes en NUEVAS_ENTRADAS: ${ausentesNuevas.length}`);
    console.log(`   Total AUSENTES: ${ausentesStock.length + ausentesNuevas.length}`);

    // 5. Crear set de matrículas vendidas
    const matriculasVendidas = new Set();
    ventas.forEach(v => {
      if (v.license_plate) matriculasVendidas.add(v.license_plate);
      if (v.matricula) matriculasVendidas.add(v.matricula);
    });

    console.log(`   Matriculas en VENTAS: ${matriculasVendidas.size}`);

    // 6. Clasificar ausentes
    console.log('\n' + '='.repeat(70));
    console.log('CLASIFICACION DE VEHICULOS AUSENTES:');
    console.log('='.repeat(70));

    const enVentas = [];
    const noEnVentas = [];

    // Analizar ausentes de STOCK
    ausentesStock.forEach(v => {
      if (matriculasVendidas.has(v.license_plate)) {
        enVentas.push({ ...v, origen: 'STOCK' });
      } else {
        noEnVentas.push({ ...v, origen: 'STOCK' });
      }
    });

    // Analizar ausentes de NUEVAS_ENTRADAS
    ausentesNuevas.forEach(v => {
      if (matriculasVendidas.has(v.matricula)) {
        enVentas.push({ ...v, origen: 'NUEVAS_ENTRADAS', license_plate: v.matricula });
      } else {
        noEnVentas.push({ ...v, origen: 'NUEVAS_ENTRADAS', license_plate: v.matricula });
      }
    });

    console.log(`\nVehiculos ausentes EN VENTAS: ${enVentas.length}`);
    console.log(`Vehiculos ausentes NO EN VENTAS: ${noEnVentas.length}`);

    // 7. Mostrar detalles
    if (enVentas.length > 0) {
      console.log('\n' + '-'.repeat(70));
      console.log('VEHICULOS AUSENTES QUE ESTAN EN VENTAS:');
      console.log('(Marcar como VENDIDO)');
      console.log('-'.repeat(70));
      enVentas.slice(0, 20).forEach((v, i) => {
        console.log(`${(i + 1).toString().padStart(3)}. ${v.license_plate} - ${v.model || v.modelo || 'N/A'} [${v.origen}]`);
      });
      if (enVentas.length > 20) {
        console.log(`\n... y ${enVentas.length - 20} mas`);
      }
    }

    if (noEnVentas.length > 0) {
      console.log('\n' + '-'.repeat(70));
      console.log('VEHICULOS AUSENTES QUE NO ESTAN EN VENTAS:');
      console.log('(Marcar como VENDIDO PROFESIONAL)');
      console.log('-'.repeat(70));
      noEnVentas.slice(0, 20).forEach((v, i) => {
        console.log(`${(i + 1).toString().padStart(3)}. ${v.license_plate} - ${v.model || v.modelo || 'N/A'} [${v.origen}]`);
      });
      if (noEnVentas.length > 20) {
        console.log(`\n... y ${noEnVentas.length - 20} mas`);
      }
    }

    // 8. Resumen de acciones
    console.log('\n' + '='.repeat(70));
    console.log('RESUMEN DE ACCIONES PROPUESTAS:');
    console.log('='.repeat(70));
    console.log(`\n1. Marcar como VENDIDO: ${enVentas.length} vehiculos`);
    console.log('   (Ausentes que SI estan en tabla VENTAS)');
    console.log(`\n2. Marcar como VENDIDO PROFESIONAL: ${noEnVentas.length} vehiculos`);
    console.log('   (Ausentes que NO estan en tabla VENTAS)');
    console.log(`\nTotal a actualizar: ${enVentas.length + noEnVentas.length}`);

    // 9. Guardar listas para script de marcado
    const fs = require('fs');
    
    const ventasPorOrigen = {
      enVentas: enVentas.map(v => ({ 
        matricula: v.license_plate, 
        modelo: v.model || v.modelo,
        origen: v.origen 
      })),
      noEnVentas: noEnVentas.map(v => ({ 
        matricula: v.license_plate, 
        modelo: v.model || v.modelo,
        origen: v.origen 
      }))
    };

    fs.writeFileSync(
      'scripts/ausentes_clasificados.json',
      JSON.stringify(ventasPorOrigen, null, 2)
    );

    console.log('\n✓ Listas guardadas en: scripts/ausentes_clasificados.json');
    console.log('\nPara ejecutar el marcado:');
    console.log('  node scripts/marcar_ausentes.js');
    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\nERROR:', error.message);
    console.error('Detalles:', error);
  }
}

analizarAusentesYVentas();



