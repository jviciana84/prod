const fs = require('fs');
const path = require('path');

// Leer el archivo GeoJSON
const geoJSONPath = path.join(__dirname, '..', 'public', 'data', 'spain-provinces.geojson');

try {
  const geoJSONData = JSON.parse(fs.readFileSync(geoJSONPath, 'utf8'));
  
  console.log('🔍 Debug GeoJSON Structure:');
  console.log('==========================');
  console.log(`📊 Tipo: ${geoJSONData.type}`);
  console.log(`🏛️  Número de provincias: ${geoJSONData.features.length}`);
  console.log('');
  
  // Analizar las primeras 3 provincias en detalle
  geoJSONData.features.slice(0, 3).forEach((feature, index) => {
    console.log(`\n📍 Provincia ${index + 1}: ${feature.properties.name}`);
    console.log(`   Tipo de geometría: ${feature.geometry.type}`);
    console.log(`   Número de polígonos: ${feature.geometry.coordinates.length}`);
    
    // Analizar el primer polígono
    const firstPolygon = feature.geometry.coordinates[0];
    if (firstPolygon && firstPolygon.length > 0) {
      console.log(`   Primer polígono - puntos: ${firstPolygon.length}`);
      
             // Verificar las primeras 3 coordenadas
       firstPolygon.slice(0, 3).forEach((coord, coordIndex) => {
         console.log(`     Coord ${coordIndex + 1}: [${coord[0]}, ${coord[1]}]`);
         
         // Verificar si las coordenadas son válidas
         const x = ((coord[0] + 9.5) / 13) * 800;
         const y = ((44 - coord[1]) / 8) * 600;
         
         console.log(`       SVG: x=${x.toFixed(2)}, y=${y.toFixed(2)} (válido: ${!isNaN(x) && !isNaN(y)})`);
       });
      
      // Calcular centro
      let totalX = 0, totalY = 0, validPoints = 0;
      firstPolygon.forEach(coord => {
        if (coord && coord.length >= 2 && !isNaN(coord[0]) && !isNaN(coord[1])) {
          const x = ((coord[0] + 9.5) / 13) * 800;
          const y = ((44 - coord[1]) / 8) * 600;
          
          if (!isNaN(x) && !isNaN(y)) {
            totalX += x;
            totalY += y;
            validPoints++;
          }
        }
      });
      
      if (validPoints > 0) {
        const centerX = totalX / validPoints;
        const centerY = totalY / validPoints;
        console.log(`   Centro calculado: x=${centerX.toFixed(2)}, y=${centerY.toFixed(2)} (puntos válidos: ${validPoints})`);
      } else {
        console.log(`   ❌ No se pudieron calcular puntos válidos para el centro`);
      }
    }
  });
  
  // Buscar provincias con problemas
  console.log('\n🔍 Buscando provincias con coordenadas problemáticas...');
  let problematicProvinces = 0;
  
  geoJSONData.features.forEach((feature, index) => {
    const coordinates = feature.geometry.coordinates;
    let hasValidCoordinates = false;
    
    coordinates.forEach(polygon => {
      if (polygon && polygon.length > 0) {
        polygon.forEach(coord => {
          if (coord && coord.length >= 2 && !isNaN(coord[0]) && !isNaN(coord[1])) {
            const x = ((coord[0] + 9.5) / 13) * 800;
            const y = ((44 - coord[1]) / 8) * 600;
            
            if (!isNaN(x) && !isNaN(y)) {
              hasValidCoordinates = true;
            }
          }
        });
      }
    });
    
    if (!hasValidCoordinates) {
      console.log(`   ❌ ${feature.properties.name} - Sin coordenadas válidas`);
      problematicProvinces++;
    }
  });
  
  console.log(`\n📊 Resumen:`);
  console.log(`   Total provincias: ${geoJSONData.features.length}`);
  console.log(`   Provincias problemáticas: ${problematicProvinces}`);
  console.log(`   Provincias válidas: ${geoJSONData.features.length - problematicProvinces}`);
  
} catch (error) {
  console.error('❌ Error al leer el archivo GeoJSON:', error.message);
}
