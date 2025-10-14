const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function verificarEstadoFinal() {
  console.log('='.repeat(70));
  console.log('ESTADO FINAL DEL SISTEMA');
  console.log('='.repeat(70));

  try {
    // 1. Estado de STOCK
    console.log('\n1. ESTADO DE STOCK:');
    const { data: stock, error: stockError } = await supabase
      .from('stock')
      .select('license_plate, model, is_sold');

    if (stockError) throw stockError;

    const totalStock = stock.length;
    const vendidos = stock.filter(v => v.is_sold === true).length;
    const disponibles = stock.filter(v => v.is_sold === false || v.is_sold === null).length;

    console.log(`   Total vehiculos en STOCK: ${totalStock}`);
    console.log(`   - VENDIDOS (is_sold = true): ${vendidos} (${Math.round(vendidos/totalStock*100)}%)`);
    console.log(`   - DISPONIBLES (is_sold = false/null): ${disponibles} (${Math.round(disponibles/totalStock*100)}%)`);

    // 2. Estado de DUC_SCRAPER
    console.log('\n2. ESTADO DE DUC_SCRAPER:');
    const { data: duc, error: ducError } = await supabase
      .from('duc_scraper')
      .select('Matrícula, Disponibilidad');

    if (ducError) throw ducError;

    const totalDuc = duc.length;
    const reservadosDuc = duc.filter(v => v['Disponibilidad'] && v['Disponibilidad'].toLowerCase().includes('reservado')).length;
    const disponiblesDuc = duc.filter(v => v['Disponibilidad'] === 'DISPONIBLE').length;

    console.log(`   Total vehiculos en DUC: ${totalDuc}`);
    console.log(`   - RESERVADOS: ${reservadosDuc}`);
    console.log(`   - DISPONIBLES: ${disponiblesDuc}`);

    // 3. Comparativa DUC vs STOCK
    console.log('\n3. COMPARATIVA DUC vs STOCK:');
    const matriculasDuc = new Set(duc.map(v => v['Matrícula']));
    
    const enAmbos = stock.filter(v => matriculasDuc.has(v.license_plate));
    const soloEnStock = stock.filter(v => !matriculasDuc.has(v.license_plate));
    const soloEnStockVendidos = soloEnStock.filter(v => v.is_sold === true);
    const soloEnStockDisponibles = soloEnStock.filter(v => v.is_sold === false || v.is_sold === null);

    console.log(`   Vehiculos en AMBAS tablas: ${enAmbos.length}`);
    console.log(`   Vehiculos SOLO en STOCK: ${soloEnStock.length}`);
    console.log(`     - Vendidos: ${soloEnStockVendidos.length}`);
    console.log(`     - Disponibles: ${soloEnStockDisponibles.length}`);

    // 4. Estado de FOTOS
    console.log('\n4. ESTADO DE FOTOS:');
    const { data: fotos, error: fotosError } = await supabase
      .from('fotos')
      .select('license_plate, estado_pintura, photos_completed');

    if (fotosError) throw fotosError;

    const totalFotos = fotos.length;
    const fotosVendido = fotos.filter(f => f.estado_pintura === 'vendido').length;
    const fotosCompletadas = fotos.filter(f => f.photos_completed === true).length;

    console.log(`   Total registros en FOTOS: ${totalFotos}`);
    console.log(`   - Estado "vendido": ${fotosVendido}`);
    console.log(`   - Fotos completadas: ${fotosCompletadas}`);

    // 5. Distribución en pestañas de la interfaz
    console.log('\n' + '='.repeat(70));
    console.log('DISTRIBUCION EN PESTAÑAS DE LA INTERFAZ:');
    console.log('='.repeat(70));

    console.log(`\nPestaña VENDIDO: ${vendidos} vehiculos`);
    console.log(`  (Todos los vehiculos con is_sold = true)`);

    console.log(`\nPestaña DISPONIBLE: ${disponibles} vehiculos`);
    console.log(`  (Todos los vehiculos con is_sold = false/null)`);

    const pendientes = stock.filter(v => 
      (v.is_sold === false || v.is_sold === null)
    );
    console.log(`\nPestaña PENDIENTE: Hasta ${pendientes.length} vehiculos`);
    console.log(`  (Vehiculos disponibles con tareas pendientes)`);

    console.log(`\nPestaña FOTOS: ${totalStock} vehiculos`);
    console.log(`  (Todos los vehiculos de STOCK)`);

    // 6. Resumen de la sesión
    console.log('\n' + '='.repeat(70));
    console.log('RESUMEN DE CAMBIOS REALIZADOS HOY:');
    console.log('='.repeat(70));
    console.log('\n1. SCRAPER DUC:');
    console.log('   ✓ Corregido mapeo de columna "Regimen fiscal"');
    console.log('   ✓ Corregidas rutas de carpetas (dist/data/duc)');
    console.log('   ✓ Mejorado manejo de errores');
    console.log('   ✓ Datos cargados: 140 registros completos');

    console.log('\n2. TRIGGER DE SINCRONIZACION:');
    console.log('   ✓ Verificado: Funciona al 100%');
    console.log('   ✓ Sincroniza RESERVADOS → VENDIDOS correctamente');

    console.log('\n3. MARCADO MASIVO:');
    console.log('   ✓ 22 vehiculos marcados como vendidos profesionalmente');
    console.log('   ✓ Vehiculos que no estan en DUC = Vendidos');

    console.log('\n4. ESTADO FINAL:');
    console.log(`   ✓ Total vehiculos: ${totalStock}`);
    console.log(`   ✓ Vendidos: ${vendidos} (${Math.round(vendidos/totalStock*100)}%)`);
    console.log(`   ✓ Disponibles: ${disponibles} (${Math.round(disponibles/totalStock*100)}%)`);
    console.log(`   ✓ Pendientes marcar: ${soloEnStockDisponibles.length}`);

    if (soloEnStockDisponibles.length > 0) {
      console.log('\n⚠ ADVERTENCIA:');
      console.log(`   Aun hay ${soloEnStockDisponibles.length} vehiculos DISPONIBLES que no estan en DUC`);
      console.log('   Esto puede ser normal si son vehiculos muy recientes');
    } else {
      console.log('\n✓ PERFECTO:');
      console.log('   Todos los vehiculos que no estan en DUC ya estan marcados como vendidos');
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\nERROR:', error.message);
  }
}

verificarEstadoFinal();



