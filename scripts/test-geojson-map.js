const fs = require('fs');
const path = require('path');

// Leer el archivo GeoJSON
const geoJSONPath = path.join(__dirname, '..', 'public', 'data', 'spain-provinces.geojson');

try {
  const geoJSONData = JSON.parse(fs.readFileSync(geoJSONPath, 'utf8'));
  
  console.log('🌍 Análisis del GeoJSON de España:');
  console.log('=====================================');
  console.log(`📊 Tipo: ${geoJSONData.type}`);
  console.log(`🏛️  Número de provincias: ${geoJSONData.features.length}`);
  console.log('');
  
  console.log('📋 Provincias disponibles:');
  console.log('---------------------------');
  
  // Mostrar las primeras 10 provincias
  geoJSONData.features.slice(0, 10).forEach((feature, index) => {
    console.log(`${index + 1}. ${feature.properties.name}`);
  });
  
  if (geoJSONData.features.length > 10) {
    console.log(`... y ${geoJSONData.features.length - 10} más`);
  }
  
  console.log('');
  console.log('🔍 Ejemplo de estructura de una provincia:');
  console.log('-------------------------------------------');
  
  const primeraProvincia = geoJSONData.features[0];
  console.log(`Nombre: ${primeraProvincia.properties.name}`);
  console.log(`Tipo de geometría: ${primeraProvincia.geometry.type}`);
  console.log(`Número de polígonos: ${primeraProvincia.geometry.coordinates.length}`);
  console.log(`Primeras coordenadas: [${primeraProvincia.geometry.coordinates[0][0].slice(0, 3).map(coord => `[${coord[0].toFixed(3)}, ${coord[1].toFixed(3)}]`).join(', ')}...]`);
  
  console.log('');
  console.log('✅ El archivo GeoJSON está listo para usar en el mapa');
  
} catch (error) {
  console.error('❌ Error al leer el archivo GeoJSON:', error.message);
}
