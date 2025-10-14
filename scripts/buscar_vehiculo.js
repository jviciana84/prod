const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function buscarVehiculo(matricula) {
  console.log('='.repeat(70));
  console.log(`BUSCANDO VEHICULO: ${matricula}`);
  console.log('='.repeat(70));

  try {
    // 1. Buscar en duc_scraper
    console.log('\n1. BUSCANDO EN DUC_SCRAPER:');
    const { data: duc, error: ducError } = await supabase
      .from('duc_scraper')
      .select('*')
      .eq('Matrícula', matricula);

    if (ducError) throw ducError;

    if (duc && duc.length > 0) {
      console.log('   ENCONTRADO EN DUC_SCRAPER');
      const v = duc[0];
      console.log(`   Marca: ${v['Marca']}`);
      console.log(`   Modelo: ${v['Modelo']}`);
      console.log(`   Disponibilidad: ${v['Disponibilidad']}`);
      console.log(`   Concesionario: ${v['Concesionario']}`);
      console.log(`   KM: ${v['KM']}`);
      console.log(`   Precio: ${v['Precio']}`);
      console.log(`   Fecha creacion: ${v['Fecha creación']}`);
      console.log(`   Created at: ${v.created_at}`);
    } else {
      console.log('   NO ENCONTRADO en duc_scraper');
    }

    // 2. Buscar en stock
    console.log('\n2. BUSCANDO EN STOCK:');
    const { data: stock, error: stockError } = await supabase
      .from('stock')
      .select('*')
      .eq('license_plate', matricula);

    if (stockError) throw stockError;

    if (stock && stock.length > 0) {
      console.log('   ENCONTRADO EN STOCK');
      const s = stock[0];
      console.log(`   ID: ${s.id}`);
      console.log(`   Model: ${s.model}`);
      console.log(`   Brand: ${s.brand}`);
      console.log(`   is_sold: ${s.is_sold}`);
      console.log(`   paint_status: ${s.paint_status}`);
      console.log(`   body_status: ${s.body_status}`);
      console.log(`   mechanical_status: ${s.mechanical_status}`);
      console.log(`   photos_completed: ${s.photos_completed}`);
      console.log(`   created_at: ${s.created_at}`);
    } else {
      console.log('   NO ENCONTRADO en stock');
    }

    // 3. Buscar en fotos
    console.log('\n3. BUSCANDO EN FOTOS:');
    const { data: fotos, error: fotosError } = await supabase
      .from('fotos')
      .select('*')
      .eq('license_plate', matricula);

    if (fotosError) throw fotosError;

    if (fotos && fotos.length > 0) {
      console.log('   ENCONTRADO EN FOTOS');
      const f = fotos[0];
      console.log(`   ID: ${f.id}`);
      console.log(`   estado_pintura: ${f.estado_pintura}`);
      console.log(`   photos_completed: ${f.photos_completed}`);
      console.log(`   photographer: ${f.photographer_id || 'N/A'}`);
      console.log(`   created_at: ${f.created_at}`);
    } else {
      console.log('   NO ENCONTRADO en fotos');
    }

    // 4. RESUMEN Y CONCLUSION
    console.log('\n' + '='.repeat(70));
    console.log('RESUMEN:');
    console.log('='.repeat(70));

    const enDuc = duc && duc.length > 0;
    const enStock = stock && stock.length > 0;
    const enFotos = fotos && fotos.length > 0;

    console.log(`\nVehiculo ${matricula}:`);
    console.log(`  - En DUC_SCRAPER: ${enDuc ? 'SI' : 'NO'}`);
    console.log(`  - En STOCK: ${enStock ? 'SI' : 'NO'}`);
    console.log(`  - En FOTOS: ${enFotos ? 'SI' : 'NO'}`);

    if (enStock) {
      const s = stock[0];
      console.log('\nCOMO SE MUESTRA EN LA INTERFAZ:');
      
      if (s.is_sold === true) {
        console.log('  PESTAÑA: VENDIDO');
        console.log('  Razon: is_sold = true');
      } else {
        console.log('  PESTAÑA: DISPONIBLE');
        console.log('  Razon: is_sold = false o null');
        
        // Verificar si aparece en pendiente
        const tienePendientes = !s.photos_completed || 
                               s.paint_status === 'pendiente' || 
                               s.body_status === 'pendiente' ||
                               s.mechanical_status === 'pendiente';
        
        if (tienePendientes) {
          console.log('  TAMBIEN EN: PENDIENTE');
          console.log('  Razon: Tiene tareas pendientes');
        }
      }
      
      console.log('  TAMBIEN EN: FOTOS');
      console.log('  Razon: Todos los vehiculos aparecen en fotos');
    } else {
      console.log('\nNO SE MUESTRA EN LA INTERFAZ');
      console.log('Razon: No existe en la tabla STOCK');
    }

    if (enDuc && !enStock) {
      console.log('\nADVERTENCIA:');
      console.log('  El vehiculo existe en DUC pero no en STOCK');
      console.log('  Posibles razones:');
      console.log('  1. Es muy nuevo y aun no fue dado de alta en CVO');
      console.log('  2. Se vendio antes de entrar al sistema CVO');
      console.log('  3. Hay un desfase entre DUC y el sistema interno');
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\nERROR:', error.message);
  }
}

// Obtener matrícula del argumento o usar la proporcionada
const matricula = process.argv[2] || '0281JWJ';
buscarVehiculo(matricula);



