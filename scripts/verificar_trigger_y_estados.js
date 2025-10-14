const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function verificarTriggerYEstados() {
  console.log('='.repeat(60));
  console.log('VERIFICACION DE TRIGGER Y ESTADOS');
  console.log('='.repeat(60));

  try {
    // 1. Obtener vehículos RESERVADOS de duc_scraper
    console.log('\n1. VEHICULOS RESERVADOS EN DUC_SCRAPER:');
    const { data: reservados, error: reservadosError } = await supabase
      .from('duc_scraper')
      .select('Matrícula, Modelo, Marca, Disponibilidad, Concesionario')
      .ilike('Disponibilidad', '%reservado%')
      .order('Matrícula');

    if (reservadosError) throw reservadosError;
    
    console.log(`   Total: ${reservados.length}`);
    console.log('   Primeros 5:');
    reservados.slice(0, 5).forEach((r, i) => {
      console.log(`   ${i + 1}. ${r['Matrícula']} - ${r['Modelo']} (${r['Disponibilidad']})`);
    });

    // 2. Verificar en STOCK
    console.log('\n2. VERIFICACION EN STOCK:');
    const matriculas = reservados.map(r => r['Matrícula']);
    
    const { data: enStock, error: stockError } = await supabase
      .from('stock')
      .select('license_plate, is_sold, model')
      .in('license_plate', matriculas);

    if (stockError) throw stockError;

    const enStockMap = {};
    enStock.forEach(s => {
      enStockMap[s.license_plate] = s;
    });

    let existenEnStock = 0;
    let marcadosVendidos = 0;
    let noExistenEnStock = [];

    reservados.forEach(r => {
      const matricula = r['Matrícula'];
      const stock = enStockMap[matricula];
      
      if (stock) {
        existenEnStock++;
        if (stock.is_sold === true) {
          marcadosVendidos++;
        }
      } else {
        noExistenEnStock.push(matricula);
      }
    });

    console.log(`   Existen en stock: ${existenEnStock}/${reservados.length}`);
    console.log(`   Marcados como vendidos: ${marcadosVendidos}/${existenEnStock}`);
    console.log(`   NO existen en stock: ${noExistenEnStock.length}`);
    
    if (noExistenEnStock.length > 0) {
      console.log('\n   Vehiculos que NO existen en stock:');
      noExistenEnStock.slice(0, 10).forEach((m, i) => {
        console.log(`   ${i + 1}. ${m}`);
      });
      if (noExistenEnStock.length > 10) {
        console.log(`   ... y ${noExistenEnStock.length - 10} mas`);
      }
    }

    // 3. Verificar en FOTOS
    console.log('\n3. VERIFICACION EN FOTOS:');
    const { data: enFotos, error: fotosError } = await supabase
      .from('fotos')
      .select('license_plate, estado_pintura')
      .in('license_plate', matriculas);

    if (fotosError) throw fotosError;

    const enFotosMap = {};
    enFotos.forEach(f => {
      enFotosMap[f.license_plate] = f;
    });

    let existenEnFotos = 0;
    let marcadosVendidosFotos = 0;

    reservados.forEach(r => {
      const matricula = r['Matrícula'];
      const foto = enFotosMap[matricula];
      
      if (foto) {
        existenEnFotos++;
        if (foto.estado_pintura === 'vendido') {
          marcadosVendidosFotos++;
        }
      }
    });

    console.log(`   Existen en fotos: ${existenEnFotos}/${reservados.length}`);
    console.log(`   Marcados como vendidos: ${marcadosVendidosFotos}/${existenEnFotos}`);

    // 4. Resumen y recomendaciones
    console.log('\n' + '='.repeat(60));
    console.log('RESUMEN:');
    console.log('='.repeat(60));
    console.log(`Total RESERVADOS en DUC: ${reservados.length}`);
    console.log(`Existen en STOCK: ${existenEnStock} (${Math.round(existenEnStock/reservados.length*100)}%)`);
    console.log(`Marcados vendidos en STOCK: ${marcadosVendidos} (${Math.round(marcadosVendidos/existenEnStock*100)}%)`);
    console.log(`Existen en FOTOS: ${existenEnFotos} (${Math.round(existenEnFotos/reservados.length*100)}%)`);
    console.log(`Marcados vendidos en FOTOS: ${marcadosVendidosFotos} (${Math.round(marcadosVendidosFotos/existenEnFotos*100)}%)`);

    // 5. Estado del trigger
    console.log('\n' + '='.repeat(60));
    console.log('ESTADO DEL TRIGGER:');
    console.log('='.repeat(60));
    
    const pendientesStock = existenEnStock - marcadosVendidos;
    const pendientesFotos = existenEnFotos - marcadosVendidosFotos;
    
    if (pendientesStock > 0 || pendientesFotos > 0) {
      console.log('ADVERTENCIA: El trigger NO ha sincronizado todos los vehiculos');
      console.log(`  Pendientes en STOCK: ${pendientesStock}`);
      console.log(`  Pendientes en FOTOS: ${pendientesFotos}`);
      console.log('\nRECOMENDACION:');
      console.log('  Ejecuta: scripts/arreglar_trigger_reservados_simple.sql');
      console.log('  Y luego: scripts/procesar_reservados_existentes_simple.sql');
    } else if (noExistenEnStock.length > 0) {
      console.log('ADVERTENCIA: Hay vehiculos RESERVADOS que no existen en STOCK');
      console.log(`  Total: ${noExistenEnStock.length}`);
      console.log('\nRECOMENDACION:');
      console.log('  Estos vehiculos necesitan ser creados en STOCK primero');
    } else {
      console.log('OK: Todos los vehiculos RESERVADOS estan sincronizados correctamente');
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\nERROR:', error.message);
    console.error('Detalles:', error);
  }
}

verificarTriggerYEstados();



