const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function comparativaDucVsStock() {
  console.log('='.repeat(70));
  console.log('COMPARATIVA: DUC_SCRAPER vs STOCK');
  console.log('='.repeat(70));

  try {
    // 1. Obtener todas las matrículas de duc_scraper
    console.log('\n1. Obteniendo vehiculos de DUC_SCRAPER...');
    const { data: ducData, error: ducError } = await supabase
      .from('duc_scraper')
      .select('Matrícula, Modelo, Disponibilidad');

    if (ducError) throw ducError;

    const matriculasDuc = new Set(ducData.map(v => v['Matrícula']));
    console.log(`   Total en DUC_SCRAPER: ${matriculasDuc.size}`);

    // 2. Obtener todos los vehículos de stock
    console.log('\n2. Obteniendo vehiculos de STOCK...');
    const { data: stockData, error: stockError } = await supabase
      .from('stock')
      .select('license_plate, model, is_sold');

    if (stockError) throw stockError;

    console.log(`   Total en STOCK: ${stockData.length}`);

    // 3. Clasificar vehículos de STOCK
    const enAmbos = [];
    const soloEnStock = [];
    const yaVendidos = [];

    stockData.forEach(v => {
      if (matriculasDuc.has(v.license_plate)) {
        enAmbos.push(v);
      } else {
        if (v.is_sold === true) {
          yaVendidos.push(v);
        } else {
          soloEnStock.push(v);
        }
      }
    });

    // 4. Mostrar resultados
    console.log('\n' + '='.repeat(70));
    console.log('RESULTADOS DE LA COMPARATIVA:');
    console.log('='.repeat(70));

    console.log(`\nVehiculos en AMBAS tablas (DUC + STOCK): ${enAmbos.length}`);
    console.log(`Vehiculos SOLO en STOCK (no en DUC): ${soloEnStock.length + yaVendidos.length}`);
    console.log(`  - Ya marcados vendidos: ${yaVendidos.length}`);
    console.log(`  - Pendientes de marcar: ${soloEnStock.length}`);

    // 5. Mostrar vehículos que se marcarían como vendidos
    console.log('\n' + '='.repeat(70));
    console.log(`VEHICULOS QUE SE MARCARIAN COMO VENDIDOS: ${soloEnStock.length}`);
    console.log('='.repeat(70));

    if (soloEnStock.length > 0) {
      console.log('\nPrimeros 20 vehiculos:');
      soloEnStock.slice(0, 20).forEach((v, i) => {
        console.log(`${(i + 1).toString().padStart(3)}. ${v.license_plate} - ${v.model || 'N/A'}`);
      });

      if (soloEnStock.length > 20) {
        console.log(`\n... y ${soloEnStock.length - 20} vehiculos mas`);
      }

      // Agrupar por modelo
      console.log('\n' + '-'.repeat(70));
      console.log('DISTRIBUCION POR MODELO:');
      console.log('-'.repeat(70));
      
      const porModelo = {};
      soloEnStock.forEach(v => {
        const modelo = v.model || 'Sin modelo';
        porModelo[modelo] = (porModelo[modelo] || 0) + 1;
      });

      Object.entries(porModelo)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([modelo, count]) => {
          console.log(`  ${modelo}: ${count}`);
        });
    } else {
      console.log('\nNo hay vehiculos pendientes de marcar como vendidos.');
    }

    // 6. Mostrar vehículos ya marcados como vendidos
    if (yaVendidos.length > 0) {
      console.log('\n' + '='.repeat(70));
      console.log(`VEHICULOS YA MARCADOS COMO VENDIDOS: ${yaVendidos.length}`);
      console.log('='.repeat(70));
      console.log('\nPrimeros 10:');
      yaVendidos.slice(0, 10).forEach((v, i) => {
        console.log(`${(i + 1).toString().padStart(3)}. ${v.license_plate} - ${v.model || 'N/A'}`);
      });
      if (yaVendidos.length > 10) {
        console.log(`\n... y ${yaVendidos.length - 10} mas`);
      }
    }

    // 7. Resumen final
    console.log('\n' + '='.repeat(70));
    console.log('RESUMEN FINAL:');
    console.log('='.repeat(70));
    console.log(`\nTotal vehiculos en DUC: ${matriculasDuc.size}`);
    console.log(`Total vehiculos en STOCK: ${stockData.length}`);
    console.log(`  - En ambas tablas: ${enAmbos.length} (${Math.round(enAmbos.length/stockData.length*100)}%)`);
    console.log(`  - Solo en STOCK: ${soloEnStock.length + yaVendidos.length} (${Math.round((soloEnStock.length + yaVendidos.length)/stockData.length*100)}%)`);
    console.log(`    * Ya vendidos: ${yaVendidos.length}`);
    console.log(`    * Pendientes: ${soloEnStock.length}`);

    console.log('\n' + '='.repeat(70));
    console.log('ACCION PROPUESTA:');
    console.log('='.repeat(70));
    
    if (soloEnStock.length > 0) {
      console.log(`\nMarcar ${soloEnStock.length} vehiculos como VENDIDOS (is_sold = true)`);
      console.log('Razon: No aparecen en DUC = Vendidos profesionalmente');
      console.log('\nPara ejecutar esta accion, usa:');
      console.log('  node scripts/marcar_vendidos_profesional.js');
    } else {
      console.log('\nNo hay vehiculos pendientes de marcar.');
    }

    console.log('\n' + '='.repeat(70));

    // Guardar lista para el script de marcado
    if (soloEnStock.length > 0) {
      const fs = require('fs');
      fs.writeFileSync(
        'scripts/vehiculos_para_marcar.json',
        JSON.stringify(soloEnStock.map(v => v.license_plate), null, 2)
      );
      console.log('\nLista guardada en: scripts/vehiculos_para_marcar.json');
    }

  } catch (error) {
    console.error('\nERROR:', error.message);
    console.error('Detalles:', error);
  }
}

comparativaDucVsStock();

