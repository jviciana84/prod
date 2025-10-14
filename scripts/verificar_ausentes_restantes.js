const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function verificarRestantes() {
  console.log('='.repeat(70));
  console.log('VERIFICACION: POR QUE SIGUEN APARECIENDO AUSENTES');
  console.log('='.repeat(70));

  try {
    // Leer clasificación guardada
    const clasificacion = JSON.parse(fs.readFileSync('scripts/ausentes_para_marcar.json', 'utf8'));
    
    console.log('\nVEHICULOS IDENTIFICADOS PARA MARCAR:');
    console.log(`  En ventas: ${clasificacion.enVentas.length}`);
    console.log(`  No en ventas: ${clasificacion.noEnVentas.length}`);
    console.log(`  Total: ${clasificacion.enVentas.length + clasificacion.noEnVentas.length}`);

    // Contar por fuente
    const porFuente = {
      stock: { enVentas: 0, noEnVentas: 0 },
      nuevas_entradas: { enVentas: 0, noEnVentas: 0 }
    };

    clasificacion.enVentas.forEach(v => {
      porFuente[v.source].enVentas++;
    });

    clasificacion.noEnVentas.forEach(v => {
      porFuente[v.source].noEnVentas++;
    });

    console.log('\nDISTRIBUCION POR FUENTE:');
    console.log('  STOCK:');
    console.log(`    - En ventas: ${porFuente.stock.enVentas}`);
    console.log(`    - No en ventas: ${porFuente.stock.noEnVentas}`);
    console.log(`    - Total: ${porFuente.stock.enVentas + porFuente.stock.noEnVentas}`);
    
    console.log('  NUEVAS_ENTRADAS:');
    console.log(`    - En ventas: ${porFuente.nuevas_entradas.enVentas}`);
    console.log(`    - No en ventas: ${porFuente.nuevas_entradas.noEnVentas}`);
    console.log(`    - Total: ${porFuente.nuevas_entradas.enVentas + porFuente.nuevas_entradas.noEnVentas}`);

    // Verificar cuántos se procesaron
    console.log('\n' + '='.repeat(70));
    console.log('VEHICULOS PROCESADOS vs NO PROCESADOS:');
    console.log('='.repeat(70));

    const stockMatriculas = [
      ...clasificacion.enVentas.filter(v => v.source === 'stock').map(v => v.matricula),
      ...clasificacion.noEnVentas.filter(v => v.source === 'stock').map(v => v.matricula)
    ];

    const nuevasMatriculas = [
      ...clasificacion.enVentas.filter(v => v.source === 'nuevas_entradas').map(v => v.matricula),
      ...clasificacion.noEnVentas.filter(v => v.source === 'nuevas_entradas').map(v => v.matricula)
    ];

    console.log(`\nVehiculos de STOCK: ${stockMatriculas.length}`);
    console.log(`Vehiculos de NUEVAS_ENTRADAS: ${nuevasMatriculas.length}`);

    // Verificar cuáles se marcaron
    if (stockMatriculas.length > 0) {
      const { data: marcadosStock, error } = await supabase
        .from('stock')
        .select('license_plate, is_sold')
        .in('license_plate', stockMatriculas);

      if (!error) {
        const vendidos = marcadosStock.filter(v => v.is_sold === true).length;
        console.log(`\nSTOCK marcados como vendidos: ${vendidos}/${stockMatriculas.length}`);
      }
    }

    // El problema: nuevas_entradas no se procesó
    console.log('\n' + '='.repeat(70));
    console.log('PROBLEMA IDENTIFICADO:');
    console.log('='.repeat(70));
    
    console.log(`\n${nuevasMatriculas.length} vehiculos de NUEVAS_ENTRADAS NO SE PROCESARON`);
    console.log('Razon: El script solo procesaba source === "stock"');
    console.log('\nVehiculos de NUEVAS_ENTRADAS pendientes:');
    
    const nuevasVehiculos = [
      ...clasificacion.enVentas.filter(v => v.source === 'nuevas_entradas'),
      ...clasificacion.noEnVentas.filter(v => v.source === 'nuevas_entradas')
    ];

    nuevasVehiculos.slice(0, 20).forEach((v, i) => {
      console.log(`  ${(i + 1).toString().padStart(3)}. ${v.matricula} - ${v.modelo || 'N/A'}`);
    });

    if (nuevasVehiculos.length > 20) {
      console.log(`  ... y ${nuevasVehiculos.length - 20} mas`);
    }

    // Guardar solo los de nuevas_entradas para procesarlos
    const pendientes = {
      enVentas: clasificacion.enVentas.filter(v => v.source === 'nuevas_entradas'),
      noEnVentas: clasificacion.noEnVentas.filter(v => v.source === 'nuevas_entradas')
    };

    fs.writeFileSync(
      'scripts/ausentes_nuevas_entradas.json',
      JSON.stringify(pendientes, null, 2)
    );

    console.log('\n✓ Lista de pendientes guardada en: scripts/ausentes_nuevas_entradas.json');
    console.log('\nSOLUCION:');
    console.log('  Necesitamos marcar estos vehiculos en NUEVAS_ENTRADAS');
    console.log('  O moverlos a STOCK primero');
    
    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\nERROR:', error.message);
  }
}

verificarRestantes();



