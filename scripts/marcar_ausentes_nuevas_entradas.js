const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function marcarNuevasEntradas() {
  console.log('='.repeat(70));
  console.log('MARCAR VEHICULOS DE NUEVAS_ENTRADAS COMO VENDIDOS');
  console.log('='.repeat(70));

  try {
    // Leer vehículos pendientes
    const pendientes = JSON.parse(fs.readFileSync('scripts/ausentes_nuevas_entradas.json', 'utf8'));
    
    const { enVentas, noEnVentas } = pendientes;
    const total = enVentas.length + noEnVentas.length;

    console.log(`\nVehiculos a procesar de NUEVAS_ENTRADAS:`);
    console.log(`  - EN VENTAS: ${enVentas.length}`);
    console.log(`  - NO EN VENTAS: ${noEnVentas.length}`);
    console.log(`  - Total: ${total}`);

    console.log('\n' + '='.repeat(70));
    console.log('ESTRATEGIA DE MARCADO');
    console.log('='.repeat(70));
    console.log('\nNUEVAS_ENTRADAS no tiene columna is_sold');
    console.log('Vamos a registrar en vehicle_sale_status para clasificarlos');
    console.log('\nIniciando en 3 segundos...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Procesar CATEGORIA 1: EN VENTAS
    console.log('\n' + '='.repeat(70));
    console.log('1. MARCANDO VEHICULOS EN VENTAS');
    console.log('='.repeat(70));

    let statusOK1 = 0, statusErr1 = 0;

    for (const v of enVentas) {
      const { error } = await supabase
        .from('vehicle_sale_status')
        .insert({
          vehicle_id: v.id,
          source_table: 'nuevas_entradas',
          license_plate: v.matricula,
          sale_status: 'vendido',
          notes: 'Vendido (aparece en sales_vehicles)'
        });

      if (error) {
        // Verificar si ya existe
        const { data: existing } = await supabase
          .from('vehicle_sale_status')
          .select('id')
          .eq('vehicle_id', v.id)
          .eq('source_table', 'nuevas_entradas')
          .single();

        if (!existing) {
          console.log(`  ERROR: ${v.matricula} - ${error.message}`);
          statusErr1++;
        } else {
          statusOK1++; // Ya existe, contarlo como OK
        }
      } else {
        statusOK1++;
      }

      if (statusOK1 % 10 === 0 && statusOK1 > 0) {
        console.log(`  Procesados: ${statusOK1}/${enVentas.length}`);
      }
    }

    console.log(`\nResultado CATEGORIA 1:`);
    console.log(`  Registrados: ${statusOK1}`);
    console.log(`  Errores: ${statusErr1}`);

    // Procesar CATEGORIA 2: NO EN VENTAS (PROFESIONAL)
    console.log('\n' + '='.repeat(70));
    console.log('2. MARCANDO VEHICULOS NO EN VENTAS (PROFESIONAL)');
    console.log('='.repeat(70));

    let statusOK2 = 0, statusErr2 = 0;

    for (const v of noEnVentas) {
      const { error } = await supabase
        .from('vehicle_sale_status')
        .insert({
          vehicle_id: v.id,
          source_table: 'nuevas_entradas',
          license_plate: v.matricula,
          sale_status: 'profesional',
          notes: 'Vendido profesionalmente (ausente en DUC, no en sales_vehicles)'
        });

      if (error) {
        // Verificar si ya existe
        const { data: existing } = await supabase
          .from('vehicle_sale_status')
          .select('id')
          .eq('vehicle_id', v.id)
          .eq('source_table', 'nuevas_entradas')
          .single();

        if (!existing) {
          console.log(`  ERROR: ${v.matricula} - ${error.message}`);
          statusErr2++;
        } else {
          statusOK2++; // Ya existe, contarlo como OK
        }
      } else {
        statusOK2++;
      }

      if (statusOK2 % 10 === 0 && statusOK2 > 0) {
        console.log(`  Procesados: ${statusOK2}/${noEnVentas.length}`);
      }
    }

    console.log(`\nResultado CATEGORIA 2:`);
    console.log(`  Registrados: ${statusOK2}`);
    console.log(`  Errores: ${statusErr2}`);

    // RESUMEN FINAL
    console.log('\n' + '='.repeat(70));
    console.log('RESUMEN FINAL');
    console.log('='.repeat(70));
    
    const totalRegistrados = statusOK1 + statusOK2;
    const totalErrores = statusErr1 + statusErr2;

    console.log(`\nTotal procesado: ${totalRegistrados}/${total}`);
    console.log(`  EN VENTAS: ${statusOK1}/${enVentas.length}`);
    console.log(`  PROFESIONAL: ${statusOK2}/${noEnVentas.length}`);
    console.log(`  Errores: ${totalErrores}`);

    // Verificación
    console.log('\n' + '='.repeat(70));
    console.log('VERIFICACION');
    console.log('='.repeat(70));

    const ids = [...enVentas, ...noEnVentas].map(v => v.id);
    const { data: verificacion, error: verError } = await supabase
      .from('vehicle_sale_status')
      .select('vehicle_id')
      .in('vehicle_id', ids)
      .eq('source_table', 'nuevas_entradas');

    if (!verError) {
      console.log(`\nVehiculos clasificados: ${verificacion.length}/${total}`);
    }

    if (totalRegistrados === total) {
      console.log('\n✓ PROCESO COMPLETADO EXITOSAMENTE');
      console.log('✓ Todos los vehiculos de NUEVAS_ENTRADAS clasificados');
      console.log('✓ Ya NO apareceran en "Ausentes"');
    } else {
      console.log('\n⚠ PROCESO COMPLETADO CON ADVERTENCIAS');
      console.log(`⚠ ${total - totalRegistrados} vehiculos no se clasificaron`);
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\nERROR GENERAL:', error.message);
    console.error('Detalles:', error);
  }
}

marcarNuevasEntradas();

