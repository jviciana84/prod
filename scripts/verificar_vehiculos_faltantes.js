const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function verificarFaltantes() {
  console.log('='.repeat(70));
  console.log('VEHICULOS RESERVADOS QUE NO EXISTEN EN STOCK');
  console.log('='.repeat(70));

  try {
    // Obtener vehículos RESERVADOS de duc_scraper
    const { data: reservados, error: reservadosError } = await supabase
      .from('duc_scraper')
      .select('*')
      .ilike('Disponibilidad', '%reservado%');

    if (reservadosError) throw reservadosError;

    const matriculas = reservados.map(r => r['Matrícula']);

    // Obtener cuáles existen en stock
    const { data: enStock, error: stockError } = await supabase
      .from('stock')
      .select('license_plate')
      .in('license_plate', matriculas);

    if (stockError) throw stockError;

    const enStockSet = new Set(enStock.map(s => s.license_plate));

    // Filtrar los que NO existen
    const faltantes = reservados.filter(r => !enStockSet.has(r['Matrícula']));

    console.log(`\nTotal vehiculos RESERVADOS que NO estan en STOCK: ${faltantes.length}\n`);

    faltantes.forEach((v, i) => {
      console.log(`${i + 1}. ${v['Matrícula']} - ${v['Marca']} ${v['Modelo']}`);
      console.log(`   Concesionario: ${v['Concesionario']}`);
      console.log(`   KM: ${v['KM']}`);
      console.log(`   Precio: ${v['Precio']}`);
      console.log(`   Estado: ${v['Disponibilidad']}`);
      console.log(`   Fecha creacion DUC: ${v['Fecha creación'] || 'N/A'}`);
      console.log(`   Fecha entrada VO: ${v['Fecha entrada VO'] || 'N/A'}`);
      console.log('');
    });

    console.log('='.repeat(70));
    console.log('ANALISIS:');
    console.log('='.repeat(70));
    console.log('\nEstos vehiculos aparecen en DUC como RESERVADOS pero:');
    console.log('  - NO existen en la tabla STOCK');
    console.log('  - NO existen en la tabla FOTOS');
    console.log('  - Por lo tanto, el trigger NO puede sincronizarlos');
    console.log('\nPosibles razones:');
    console.log('  1. Son vehiculos muy nuevos que aun no fueron dados de alta en CVO');
    console.log('  2. Son vehiculos que se vendieron antes de entrar al sistema CVO');
    console.log('  3. Hay un desfase entre DUC y el sistema interno');
    console.log('\nRECOMENDACION:');
    console.log('  - Si son vehiculos que deben estar en el sistema: darlos de alta en STOCK');
    console.log('  - Si ya se vendieron: ignorarlos (no necesitan estar en CVO)');
    console.log('  - El trigger funcionara automaticamente cuando se creen en STOCK');
    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\nERROR:', error.message);
  }
}

verificarFaltantes();



