const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function analizarVehiculoCompleto(matricula) {
  console.log('='.repeat(70));
  console.log(`ANALISIS COMPLETO: ${matricula}`);
  console.log('='.repeat(70));

  try {
    const resultados = {
      duc_scraper: null,
      stock: null,
      fotos: null,
      nuevas_entradas: null,
      sales_vehicles: null,
      entregas: null,
      vehicle_sale_status: null
    };

    // 1. DUC_SCRAPER
    console.log('\n1. DUC_SCRAPER:');
    const { data: duc } = await supabase
      .from('duc_scraper')
      .select('*')
      .eq('Matrícula', matricula)
      .single();

    if (duc) {
      resultados.duc_scraper = duc;
      console.log('   ✓ ENCONTRADO');
      console.log(`   Marca: ${duc['Marca']}`);
      console.log(`   Modelo: ${duc['Modelo']}`);
      console.log(`   Disponibilidad: ${duc['Disponibilidad']}`);
      console.log(`   Concesionario: ${duc['Concesionario']}`);
      console.log(`   KM: ${duc['KM']}`);
      console.log(`   Precio: ${duc['Precio']}`);
    } else {
      console.log('   ✗ NO ENCONTRADO');
    }

    // 2. STOCK
    console.log('\n2. STOCK:');
    const { data: stock } = await supabase
      .from('stock')
      .select('*')
      .eq('license_plate', matricula)
      .single();

    if (stock) {
      resultados.stock = stock;
      console.log('   ✓ ENCONTRADO');
      console.log(`   ID: ${stock.id}`);
      console.log(`   Model: ${stock.model}`);
      console.log(`   is_sold: ${stock.is_sold}`);
      console.log(`   paint_status: ${stock.paint_status || 'N/A'}`);
      console.log(`   body_status: ${stock.body_status || 'N/A'}`);
      console.log(`   mechanical_status: ${stock.mechanical_status || 'N/A'}`);
      console.log(`   created_at: ${stock.created_at}`);
    } else {
      console.log('   ✗ NO ENCONTRADO');
    }

    // 3. FOTOS
    console.log('\n3. FOTOS:');
    const { data: fotos } = await supabase
      .from('fotos')
      .select('*')
      .eq('license_plate', matricula)
      .single();

    if (fotos) {
      resultados.fotos = fotos;
      console.log('   ✓ ENCONTRADO');
      console.log(`   ID: ${fotos.id}`);
      console.log(`   estado_pintura: ${fotos.estado_pintura}`);
      console.log(`   photos_completed: ${fotos.photos_completed}`);
      console.log(`   photographer_id: ${fotos.photographer_id || 'Sin asignar'}`);
    } else {
      console.log('   ✗ NO ENCONTRADO');
    }

    // 4. NUEVAS_ENTRADAS
    console.log('\n4. NUEVAS_ENTRADAS:');
    const { data: nuevas } = await supabase
      .from('nuevas_entradas')
      .select('*')
      .eq('license_plate', matricula)
      .single();

    if (nuevas) {
      resultados.nuevas_entradas = nuevas;
      console.log('   ✓ ENCONTRADO');
      console.log(`   ID: ${nuevas.id}`);
      console.log(`   Model: ${nuevas.model}`);
      console.log(`   reception_date: ${nuevas.reception_date}`);
    } else {
      console.log('   ✗ NO ENCONTRADO');
    }

    // 5. SALES_VEHICLES
    console.log('\n5. SALES_VEHICLES (Ventas):');
    const { data: sales } = await supabase
      .from('sales_vehicles')
      .select('*')
      .eq('license_plate', matricula)
      .single();

    if (sales) {
      resultados.sales_vehicles = sales;
      console.log('   ✓ ENCONTRADO');
      console.log(`   ID: ${sales.id}`);
      console.log(`   sale_date: ${sales.sale_date}`);
      console.log(`   advisor: ${sales.advisor}`);
      console.log(`   price: ${sales.price}`);
      console.log(`   client_name: ${sales.client_name || 'N/A'}`);
    } else {
      console.log('   ✗ NO ENCONTRADO');
    }

    // 6. ENTREGAS
    console.log('\n6. ENTREGAS:');
    const { data: entregas } = await supabase
      .from('entregas')
      .select('*')
      .eq('matricula', matricula)
      .single();

    if (entregas) {
      resultados.entregas = entregas;
      console.log('   ✓ ENCONTRADO');
      console.log(`   fecha_venta: ${entregas.fecha_venta || 'N/A'}`);
      console.log(`   fecha_entrega: ${entregas.fecha_entrega || 'PENDIENTE'}`);
      console.log(`   asesor: ${entregas.asesor || 'N/A'}`);
    } else {
      console.log('   ✗ NO ENCONTRADO');
    }

    // 7. VEHICLE_SALE_STATUS
    console.log('\n7. VEHICLE_SALE_STATUS (Clasificacion):');
    const { data: status } = await supabase
      .from('vehicle_sale_status')
      .select('*')
      .eq('license_plate', matricula)
      .single();

    if (status) {
      resultados.vehicle_sale_status = status;
      console.log('   ✓ ENCONTRADO');
      console.log(`   sale_status: ${status.sale_status}`);
      console.log(`   source_table: ${status.source_table}`);
      console.log(`   notes: ${status.notes || 'N/A'}`);
    } else {
      console.log('   ✗ NO ENCONTRADO');
    }

    // ANALISIS Y EXPLICACION
    console.log('\n' + '='.repeat(70));
    console.log('SITUACION DEL VEHICULO:');
    console.log('='.repeat(70));

    console.log(`\n📍 UBICACION:`);
    console.log(`  DUC_SCRAPER: ${resultados.duc_scraper ? 'SI' : 'NO'}`);
    console.log(`  STOCK: ${resultados.stock ? 'SI' : 'NO'}`);
    console.log(`  FOTOS: ${resultados.fotos ? 'SI' : 'NO'}`);
    console.log(`  NUEVAS_ENTRADAS: ${resultados.nuevas_entradas ? 'SI' : 'NO'}`);
    console.log(`  SALES_VEHICLES: ${resultados.sales_vehicles ? 'SI' : 'NO'}`);
    console.log(`  ENTREGAS: ${resultados.entregas ? 'SI' : 'NO'}`);
    console.log(`  CLASIFICACION: ${resultados.vehicle_sale_status ? 'SI' : 'NO'}`);

    console.log(`\n📊 ESTADO:`);
    if (resultados.stock) {
      console.log(`  Estado de venta: ${resultados.stock.is_sold ? 'VENDIDO' : 'DISPONIBLE'}`);
    }
    if (resultados.fotos) {
      console.log(`  Estado pintura: ${resultados.fotos.estado_pintura}`);
      console.log(`  Fotos completadas: ${resultados.fotos.photos_completed ? 'SI' : 'NO'}`);
    }

    console.log(`\n🔍 TIPO DE VENTA:`);
    if (resultados.vehicle_sale_status) {
      console.log(`  ${resultados.vehicle_sale_status.sale_status.toUpperCase()}`);
    } else if (resultados.sales_vehicles) {
      console.log(`  VENTA PARTICULAR (en sales_vehicles)`);
    } else if (resultados.stock?.is_sold) {
      console.log(`  VENDIDO PROFESIONAL (sin registro de venta)`);
    } else {
      console.log(`  DISPONIBLE`);
    }

    console.log(`\n🖥️ COMO SE MUESTRA EN LA INTERFAZ:`);
    
    if (!resultados.stock) {
      console.log(`  NO SE MUESTRA (no existe en STOCK)`);
    } else if (resultados.stock.is_sold === true) {
      console.log(`  Pestaña VENDIDO ✓`);
      
      if (resultados.fotos && resultados.fotos.estado_pintura !== 'vendido') {
        console.log(`  ⚠ APARECE en pendientes de FOTOS (estado_pintura != vendido)`);
      } else {
        console.log(`  NO aparece en pendientes de FOTOS ✓`);
      }
    } else {
      console.log(`  Pestaña DISPONIBLE ✓`);
      
      if (resultados.fotos && !resultados.fotos.photos_completed) {
        console.log(`  SI aparece en pendientes de FOTOS (normal)`);
      }
    }

    console.log(`\n📝 HISTORIAL:`);
    if (resultados.entregas) {
      if (resultados.entregas.fecha_entrega) {
        console.log(`  ✓ ENTREGADO: ${resultados.entregas.fecha_entrega}`);
      } else {
        console.log(`  ⚠ VENDIDO pero SIN ENTREGAR`);
        if (resultados.entregas.fecha_venta) {
          console.log(`  Fecha venta: ${resultados.entregas.fecha_venta}`);
        }
      }
    } else if (resultados.sales_vehicles) {
      console.log(`  Vendido: ${resultados.sales_vehicles.sale_date}`);
      console.log(`  Sin registro de entrega`);
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\nERROR:', error.message);
  }
}

const matricula = process.argv[2] || '0774NBT';
analizarVehiculoCompleto(matricula);



