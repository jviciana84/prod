const https = require('https');
const fs = require('fs');
const path = require('path');

// URL del GeoJSON de España (provincias)
const GEOJSON_URL = 'https://raw.githubusercontent.com/codeforgermany/click_that_hood/master/public/data/spain-provinces.geojson';

// Directorio donde guardar el archivo
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'spain-provinces.geojson');

console.log('🌍 Descargando GeoJSON de España...');

// Crear directorio si no existe
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log('📁 Directorio creado:', OUTPUT_DIR);
}

// Descargar el archivo
https.get(GEOJSON_URL, (response) => {
  if (response.statusCode !== 200) {
    console.error('❌ Error al descargar:', response.statusCode);
    return;
  }

  const file = fs.createWriteStream(OUTPUT_FILE);
  response.pipe(file);

  file.on('finish', () => {
    file.close();
    console.log('✅ GeoJSON descargado exitosamente en:', OUTPUT_FILE);
    
    // Verificar el contenido
    const data = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    console.log('📊 Datos del archivo:');
    console.log('   - Tipo:', data.type);
    console.log('   - Número de provincias:', data.features.length);
    console.log('   - Provincias disponibles:');
    data.features.slice(0, 5).forEach(feature => {
      console.log(`     • ${feature.properties.name}`);
    });
    if (data.features.length > 5) {
      console.log(`     ... y ${data.features.length - 5} más`);
    }
  });

  file.on('error', (err) => {
    fs.unlink(OUTPUT_FILE, () => {}); // Eliminar archivo parcial
    console.error('❌ Error al guardar archivo:', err.message);
  });
}).on('error', (err) => {
  console.error('❌ Error al descargar:', err.message);
});
