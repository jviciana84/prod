const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function resumenFinal() {
  console.log('='.repeat(70));
  console.log('RESUMEN FINAL: FOTOS PENDIENTES');
  console.log('='.repeat(70));

  try {
    // Obtener vendidos
    const { data: vendidos } = await supabase
      .from('stock')
      .select('id, license_plate, model, is_sold')
      .eq('is_sold', true);

    // Obtener fotos
    const { data: fotos } = await supabase
      .from('fotos')
      .select('license_plate, photos_completed, estado_pintura');

    const fotosMap = {};
    fotos.forEach(f => {
      fotosMap[f.license_plate] = f;
    });

    // Obtener clasificación
    const { data: clasificados } = await supabase
      .from('vehicle_sale_status')
      .select('vehicle_id, license_plate, sale_status');

    const clasifMap = {};
    clasificados.forEach(c => {
      clasifMap[c.license_plate] = c.sale_status;
    });

    // Obtener ventas
    const { data: ventas } = await supabase
      .from('sales_vehicles')
      .select('license_plate');

    const ventasSet = new Set(ventas.map(v => v.license_plate));

    // Analizar vendidos con fotos pendientes
    const conFotosPendientes = vendidos.filter(v => {
      const foto = fotosMap[v.license_plate];
      return !foto || !foto.photos_completed;
    });

    // Clasificar
    const profesionales = [];
    const particulares = [];

    conFotosPendientes.forEach(v => {
      const clasificacion = clasifMap[v.license_plate];
      const enVentas = ventasSet.has(v.license_plate);
      const foto = fotosMap[v.license_plate];

      const info = {
        ...v,
        clasificacion: clasificacion || (enVentas ? 'particular' : 'profesional'),
        en_ventas: enVentas,
        tiene_foto: !!foto,
        estado_foto: foto?.estado_pintura || 'N/A'
      };

      if (clasificacion === 'profesional' || (!clasificacion && !enVentas)) {
        profesionales.push(info);
      } else {
        particulares.push(info);
      }
    });

    console.log('\n' + '='.repeat(70));
    console.log('RESULTADO FINAL:');
    console.log('='.repeat(70));

    console.log(`\nTotal vendidos: ${vendidos.length}`);
    console.log(`Con fotos completadas: ${vendidos.length - conFotosPendientes.length} (${Math.round((vendidos.length - conFotosPendientes.length)/vendidos.length*100)}%)`);
    console.log(`Con fotos pendientes: ${conFotosPendientes.length} (${Math.round(conFotosPendientes.length/vendidos.length*100)}%)`);

    console.log('\n' + '-'.repeat(70));
    console.log('DESGLOSE DE PENDIENTES:');
    console.log('-'.repeat(70));

    if (profesionales.length > 0) {
      console.log(`\nPROFESIONALES con fotos pendientes: ${profesionales.length}`);
      console.log('ESTOS NO DEBERIAN APARECER - Completar automaticamente:');
      profesionales.forEach((v, i) => {
        const estado = v.tiene_foto ? `${v.estado_foto}` : 'sin registro';
        console.log(`  ${i + 1}. ${v.license_plate} - ${v.model} [${estado}]`);
      });
    } else {
      console.log('\n✓ NO hay profesionales con fotos pendientes');
    }

    if (particulares.length > 0) {
      console.log(`\nPARTICULARES con fotos pendientes: ${particulares.length}`);
      console.log('ESTOS SI DEBEN APARECER - Son ventas normales:');
      particulares.forEach((v, i) => {
        const estado = v.tiene_foto ? `${v.estado_foto}` : 'sin registro';
        console.log(`  ${i + 1}. ${v.license_plate} - ${v.model} [${estado}]`);
      });
    }

    // Conclusión
    console.log('\n' + '='.repeat(70));
    console.log('CONCLUSION:');
    console.log('='.repeat(70));

    if (profesionales.length === 0) {
      console.log('\n✓ CORRECTO: Solo particulares aparecen en pendientes');
      console.log('✓ Los vendidos profesionales YA NO aparecen');
      console.log(`✓ ${particulares.length} ventas particulares con fotos pendientes (normal)`);
    } else {
      console.log(`\n⚠ Todavia hay ${profesionales.length} profesionales con fotos pendientes`);
      console.log('  Estos deberian completarse automaticamente');
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\nERROR:', error.message);
  }
}

resumenFinal();



