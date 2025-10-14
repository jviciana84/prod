const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function marcarAusentes() {
  console.log('='.repeat(70));
  console.log('MARCAR VEHICULOS AUSENTES COMO VENDIDOS');
  console.log('='.repeat(70));

  try {
    // Leer clasificación
    const clasificacion = JSON.parse(fs.readFileSync('scripts/ausentes_para_marcar.json', 'utf8'));
    
    const { enVentas, noEnVentas } = clasificacion;

    console.log(`\nVehiculos a procesar:`);
    console.log(`  - EN VENTAS (vendido): ${enVentas.length}`);
    console.log(`  - NO EN VENTAS (vendido profesional): ${noEnVentas.length}`);
    console.log(`  - Total: ${enVentas.length + noEnVentas.length}`);

    console.log('\n' + '='.repeat(70));
    console.log('CONFIRMACION');
    console.log('='.repeat(70));
    console.log('\nSe realizaran las siguientes acciones:');
    console.log('  1. UPDATE stock SET is_sold = true');
    console.log('  2. UPDATE fotos SET estado_pintura = \'vendido\'');
    console.log('  3. INSERT en vehicle_sale_status (solo para profesionales)');
    
    console.log('\nIniciando en 3 segundos...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // CATEGORIA 1: EN VENTAS (marcar como vendido)
    console.log('\n' + '='.repeat(70));
    console.log('1. MARCANDO VEHICULOS EN VENTAS (VENDIDO)');
    console.log('='.repeat(70));

    let stockOK1 = 0, stockErr1 = 0;
    let fotosOK1 = 0, fotosErr1 = 0;

    for (const v of enVentas) {
      if (v.source === 'stock') {
        // Marcar en STOCK
        const { error: stockError } = await supabase
          .from('stock')
          .update({ is_sold: true })
          .eq('id', v.id);

        if (stockError) {
          console.log(`  ERROR STOCK: ${v.matricula} - ${stockError.message}`);
          stockErr1++;
        } else {
          stockOK1++;
        }

        // Marcar en FOTOS
        const { data: fotoExists } = await supabase
          .from('fotos')
          .select('id')
          .eq('license_plate', v.matricula)
          .single();

        if (fotoExists) {
          const { error: fotoError } = await supabase
            .from('fotos')
            .update({ estado_pintura: 'vendido' })
            .eq('license_plate', v.matricula);

          if (fotoError) {
            fotosErr1++;
          } else {
            fotosOK1++;
          }
        }

        if (stockOK1 % 10 === 0) {
          console.log(`  Procesados: ${stockOK1}/${enVentas.length}`);
        }
      }
    }

    console.log(`\nResultado CATEGORIA 1:`);
    console.log(`  STOCK actualizados: ${stockOK1}`);
    console.log(`  FOTOS actualizadas: ${fotosOK1}`);
    console.log(`  Errores: ${stockErr1 + fotosErr1}`);

    // CATEGORIA 2: NO EN VENTAS (marcar como vendido profesional)
    console.log('\n' + '='.repeat(70));
    console.log('2. MARCANDO VEHICULOS NO EN VENTAS (VENDIDO PROFESIONAL)');
    console.log('='.repeat(70));

    let stockOK2 = 0, stockErr2 = 0;
    let fotosOK2 = 0, fotosErr2 = 0;
    let statusOK = 0, statusErr = 0;

    for (const v of noEnVentas) {
      if (v.source === 'stock') {
        // Marcar en STOCK
        const { error: stockError } = await supabase
          .from('stock')
          .update({ is_sold: true })
          .eq('id', v.id);

        if (stockError) {
          console.log(`  ERROR STOCK: ${v.matricula} - ${stockError.message}`);
          stockErr2++;
        } else {
          stockOK2++;
        }

        // Marcar en FOTOS
        const { data: fotoExists } = await supabase
          .from('fotos')
          .select('id')
          .eq('license_plate', v.matricula)
          .single();

        if (fotoExists) {
          const { error: fotoError } = await supabase
            .from('fotos')
            .update({ estado_pintura: 'vendido' })
            .eq('license_plate', v.matricula);

          if (fotoError) {
            fotosErr2++;
          } else {
            fotosOK2++;
          }
        }

        // Registrar en vehicle_sale_status como profesional
        const { error: statusError } = await supabase
          .from('vehicle_sale_status')
          .insert({
            vehicle_id: v.id,
            source_table: 'stock',
            license_plate: v.matricula,
            sale_status: 'profesional',
            notes: 'Marcado automaticamente como vendido profesional (ausente en DUC)'
          });

        if (statusError) {
          statusErr++;
        } else {
          statusOK++;
        }

        if (stockOK2 % 10 === 0) {
          console.log(`  Procesados: ${stockOK2}/${noEnVentas.length}`);
        }
      }
    }

    console.log(`\nResultado CATEGORIA 2:`);
    console.log(`  STOCK actualizados: ${stockOK2}`);
    console.log(`  FOTOS actualizadas: ${fotosOK2}`);
    console.log(`  STATUS registrados: ${statusOK}`);
    console.log(`  Errores: ${stockErr2 + fotosErr2 + statusErr}`);

    // RESUMEN FINAL
    console.log('\n' + '='.repeat(70));
    console.log('RESUMEN FINAL');
    console.log('='.repeat(70));
    
    const totalStock = stockOK1 + stockOK2;
    const totalFotos = fotosOK1 + fotosOK2;
    const totalErrores = stockErr1 + stockErr2 + fotosErr1 + fotosErr2 + statusErr;

    console.log(`\nTotal procesado: ${totalStock + totalFotos}`);
    console.log(`  STOCK actualizados: ${totalStock}`);
    console.log(`  FOTOS actualizadas: ${totalFotos}`);
    console.log(`  STATUS profesional: ${statusOK}`);
    console.log(`  Errores totales: ${totalErrores}`);

    // Verificación final
    console.log('\n' + '='.repeat(70));
    console.log('VERIFICACION FINAL');
    console.log('='.repeat(70));

    const matriculas = [...enVentas, ...noEnVentas]
      .filter(v => v.source === 'stock')
      .map(v => v.matricula);

    const { data: verificacion, error: verError } = await supabase
      .from('stock')
      .select('license_plate, is_sold')
      .in('license_plate', matriculas)
      .eq('is_sold', true);

    if (!verError) {
      console.log(`\nVehiculos verificados como vendidos: ${verificacion.length}/${totalStock}`);
    }

    if (totalStock === verificacion.length) {
      console.log('\n✓ PROCESO COMPLETADO EXITOSAMENTE');
      console.log('✓ Todos los vehiculos marcados como vendidos');
      console.log('✓ Ahora aparecen en la pestaña "Vendido"');
    } else {
      console.log('\n⚠ PROCESO COMPLETADO CON ADVERTENCIAS');
      console.log(`⚠ ${totalStock - verificacion.length} vehiculos no se marcaron correctamente`);
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\nERROR GENERAL:', error.message);
    console.error('Detalles:', error);
  }
}

marcarAusentes();

