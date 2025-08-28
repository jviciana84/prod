const fs = require('fs');
const path = require('path');

// Leer el archivo GeoJSON simplificado
const geoJSONPath = path.join(__dirname, '..', 'public', 'data', 'spain-provinces-simple.geojson');

try {
  const geoJSONData = JSON.parse(fs.readFileSync(geoJSONPath, 'utf8'));
  
  console.log('🧪 Test GeoJSON Simplificado:');
  console.log('============================');
  console.log(`📊 Tipo: ${geoJSONData.type}`);
  console.log(`🏛️  Número de provincias: ${geoJSONData.features.length}`);
  
  // Probar con todas las provincias
  geoJSONData.features.forEach((feature, index) => {
    console.log(`\n📍 Provincia ${index + 1}: ${feature.properties.name}`);
    
    const coordinates = feature.geometry.coordinates;
    console.log(`   Tipo: ${feature.geometry.type}`);
    console.log(`   Número de polígonos: ${coordinates.length}`);
    
    // Probar el primer polígono
    const primerPoligono = coordinates[0];
    console.log(`   Primer polígono - puntos: ${primerPoligono.length}`);
    
    // Probar las coordenadas
    console.log('   Coordenadas:');
    primerPoligono.slice(0, 3).forEach((coord, coordIndex) => {
      console.log(`     ${coordIndex + 1}. [${coord[0]}, ${coord[1]}]`);
      
      // Convertir a SVG
      const x = ((coord[0] + 9.5) / 13) * 800;
      const y = ((44 - coord[1]) / 8) * 600;
      
      console.log(`        SVG: x=${x.toFixed(2)}, y=${y.toFixed(2)}`);
    });
    
    // Calcular centro
    let totalX = 0, totalY = 0, validPoints = 0;
    
    primerPoligono.forEach(coord => {
      const x = ((coord[0] + 9.5) / 13) * 800;
      const y = ((44 - coord[1]) / 8) * 600;
      
      totalX += x;
      totalY += y;
      validPoints++;
    });
    
    const centerX = totalX / validPoints;
    const centerY = totalY / validPoints;
    
    console.log(`   Centro: x=${centerX.toFixed(2)}, y=${centerY.toFixed(2)}`);
  });
  
  console.log('\n✅ Test completado exitosamente');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
