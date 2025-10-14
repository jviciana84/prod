const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function analizarVendidosConFotosPendientes() {
  console.log('='.repeat(70));
  console.log('ANALISIS: VENDIDOS CON FOTOS PENDIENTES');
  console.log('='.repeat(70));

  try {
    // 1. Obtener vehículos VENDIDOS de STOCK
    console.log('\n1. Obteniendo vehiculos VENDIDOS de STOCK...');
    const { data: vendidos, error: vendidosError } = await supabase
      .from('stock')
      .select('id, license_plate, model, is_sold')
      .eq('is_sold', true);

    if (vendidosError) throw vendidosError;

    console.log(`   Total vendidos en STOCK: ${vendidos.length}`);

    // 2. Verificar en tabla FOTOS
    console.log('\n2. Verificando tabla FOTOS...');
    
    const { data: fotos, error: fotosError } = await supabase
      .from('fotos')
      .select('license_plate, estado_pintura, photos_completed');

    if (fotosError) throw fotosError;

    const fotosMap = {};
    fotos.forEach(f => {
      fotosMap[f.license_plate] = f;
    });

    // Contar vendidos con fotos pendientes
    const sinFotos = vendidos.filter(v => {
      const foto = fotosMap[v.license_plate];
      return !foto || !foto.photos_completed;
    });
    
    console.log(`   Vendidos con fotos pendientes: ${sinFotos.length}`);
    console.log(`   Vendidos con fotos completadas: ${vendidos.length - sinFotos.length}`);

    // 3. Analizar vendidos con fotos pendientes
    console.log('\n' + '='.repeat(70));
    console.log('VEHICULOS VENDIDOS CON FOTOS PENDIENTES:');
    console.log('='.repeat(70));

    if (sinFotos.length > 0) {
      console.log(`\nTotal: ${sinFotos.length}`);
      console.log('\nPrimeros 20:');
      
      sinFotos.slice(0, 20).forEach((v, i) => {
        const foto = fotosMap[v.license_plate];
        console.log(`${(i + 1).toString().padStart(3)}. ${v.license_plate} - ${v.model || 'N/A'}`);
        console.log(`     STOCK: is_sold=true`);
        if (foto) {
          console.log(`     FOTOS: estado_pintura=${foto.estado_pintura}, photos_completed=${foto.photos_completed || false}`);
        } else {
          console.log(`     FOTOS: NO EXISTE (necesita crearse)`);
        }
      });

      if (sinFotos.length > 20) {
        console.log(`\n... y ${sinFotos.length - 20} mas`);
      }
    } else {
      console.log('\n✓ NO HAY VENDIDOS CON FOTOS PENDIENTES');
    }

    // 4. Verificar clasificación en vehicle_sale_status
    console.log('\n' + '='.repeat(70));
    console.log('CLASIFICACION DE VENDIDOS:');
    console.log('='.repeat(70));

    const { data: clasificados, error: clasifError } = await supabase
      .from('vehicle_sale_status')
      .select('vehicle_id, license_plate, sale_status, source_table')
      .eq('source_table', 'stock');

    if (clasifError) throw clasifError;

    const clasificadosMap = {};
    clasificados.forEach(c => {
      clasificadosMap[c.vehicle_id] = c;
    });

    const profesionales = [];
    const particulares = [];
    const sinClasificar = [];

    vendidos.forEach(v => {
      const clasif = clasificadosMap[v.id];
      if (clasif) {
        if (clasif.sale_status === 'profesional') {
          profesionales.push(v);
        } else {
          particulares.push(v);
        }
      } else {
        sinClasificar.push(v);
      }
    });

    console.log(`\nVendidos PROFESIONALES: ${profesionales.length}`);
    console.log(`Vendidos PARTICULARES: ${particulares.length}`);
    console.log(`Sin clasificar en vehicle_sale_status: ${sinClasificar.length}`);

    // 5. Cuántos profesionales tienen fotos pendientes
    const profesionalesSinFotos = profesionales.filter(v => {
      const foto = fotosMap[v.license_plate];
      return !foto || !foto.photos_completed;
    });
    const particularesSinFotos = particulares.filter(v => {
      const foto = fotosMap[v.license_plate];
      return !foto || !foto.photos_completed;
    });

    console.log('\n' + '='.repeat(70));
    console.log('PROBLEMA IDENTIFICADO:');
    console.log('='.repeat(70));

    if (profesionalesSinFotos.length > 0) {
      console.log(`\n${profesionalesSinFotos.length} VENDIDOS PROFESIONALES con fotos pendientes`);
      console.log('Estos NO deberian aparecer en "Pendientes de fotografias"');
      console.log('\nEjemplos:');
      profesionalesSinFotos.slice(0, 10).forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.license_plate} - ${v.model || 'N/A'}`);
      });
    }

    if (particularesSinFotos.length > 0) {
      console.log(`\n${particularesSinFotos.length} VENDIDOS PARTICULARES con fotos pendientes`);
      console.log('Estos SI deberian aparecer en "Pendientes de fotografias"');
      console.log('(Son ventas normales que necesitan fotos)');
    }

    // 6. Recomendación
    console.log('\n' + '='.repeat(70));
    console.log('RECOMENDACION:');
    console.log('='.repeat(70));

    if (profesionalesSinFotos.length > 0) {
      console.log('\nOPCION 1: Marcar fotos como completadas en vendidos profesionales');
      console.log('  - UPDATE stock SET photos_completed = true');
      console.log('  - UPDATE fotos SET photos_completed = true');
      console.log('  - Solo para vendidos profesionales');
      
      console.log('\nOPCION 2: Modificar filtro en interfaz');
      console.log('  - Excluir vendidos profesionales de "Pendientes"');
      console.log('  - Mantener vendidos particulares (necesitan fotos)');

      console.log('\nOPCION 3 (Recomendada): Combinar ambas');
      console.log('  1. Completar fotos automaticamente para profesionales');
      console.log('  2. Ajustar filtro para excluir is_sold=true de pendientes');
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\nERROR:', error.message);
  }
}

analizarVendidosConFotosPendientes();

