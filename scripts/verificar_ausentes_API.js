const fetch = require('node-fetch');

async function verificarAusentesViaAPI() {
  console.log('='.repeat(70));
  console.log('VERIFICACION DE AUSENTES VIA API (como la interfaz)');
  console.log('='.repeat(70));

  try {
    console.log('\nLlamando a /api/compare-csv-with-db...');
    
    const response = await fetch('http://localhost:3000/api/compare-csv-with-db');
    
    if (!response.ok) {
      console.log('ERROR: API no disponible (servidor no esta corriendo)');
      console.log('Necesitas iniciar el servidor para verificar via API');
      return;
    }

    const data = await response.json();

    console.log('\n' + '='.repeat(70));
    console.log('RESULTADO DE LA API:');
    console.log('='.repeat(70));

    console.log(`\nTotal vehiculos en BD: ${data.totalVehicles || 0}`);
    console.log(`Vehiculos en CSV DUC: ${data.csvMatriculasCount || 0}`);
    console.log(`Vehiculos en VENTAS: ${data.salesMatriculasCount || 0}`);
    console.log(`Vehiculos ya clasificados: ${data.classifiedVehiclesCount || 0}`);
    console.log(`Vehiculos AUSENTES: ${data.removedVehicles?.length || 0}`);

    if (data.removedVehicles && data.removedVehicles.length > 0) {
      console.log('\n' + '='.repeat(70));
      console.log('VEHICULOS AUSENTES DETECTADOS:');
      console.log('='.repeat(70));
      
      data.removedVehicles.slice(0, 20).forEach((v, i) => {
        console.log(`${(i + 1).toString().padStart(3)}. ${v.license_plate} - ${v.model || 'N/A'} [${v.source}]`);
      });

      if (data.removedVehicles.length > 20) {
        console.log(`... y ${data.removedVehicles.length - 20} mas`);
      }

      // Agrupar por fuente
      const porFuente = {};
      data.removedVehicles.forEach(v => {
        porFuente[v.source] = (porFuente[v.source] || 0) + 1;
      });

      console.log('\nDistribucion por fuente:');
      Object.entries(porFuente).forEach(([fuente, count]) => {
        console.log(`  ${fuente}: ${count}`);
      });
    } else {
      console.log('\n✓ NO HAY VEHICULOS AUSENTES');
      console.log('✓ Todos los vehiculos estan clasificados correctamente');
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\nERROR:', error.message);
    console.log('\nNOTA: Si el servidor no esta corriendo, usa:');
    console.log('  node scripts/analizar_ausentes_ventas_correcto.js');
  }
}

verificarAusentesViaAPI();



