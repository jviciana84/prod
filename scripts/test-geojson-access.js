const fs = require('fs');
const path = require('path');

console.log('🧪 Test de Acceso al GeoJSON:');
console.log('============================');

// Verificar que el archivo existe
const geoJSONPath = path.join(__dirname, '..', 'public', 'data', 'spain-provinces-simple.geojson');

console.log('📁 Verificando archivo...');
console.log('   Ruta:', geoJSONPath);

if (fs.existsSync(geoJSONPath)) {
  console.log('   ✅ Archivo existe');
  
  const stats = fs.statSync(geoJSONPath);
  console.log('   📊 Tamaño:', stats.size, 'bytes');
  console.log('   📅 Última modificación:', stats.mtime);
  
  // Leer y verificar el contenido
  try {
    const content = fs.readFileSync(geoJSONPath, 'utf8');
    console.log('   📖 Contenido leído correctamente');
    
    const data = JSON.parse(content);
    console.log('   ✅ JSON válido');
    console.log('   📊 Tipo:', data.type);
    console.log('   🏛️  Provincias:', data.features?.length || 0);
    
    if (data.features && data.features.length > 0) {
      console.log('   📋 Primera provincia:', data.features[0].properties.name);
    }
    
  } catch (err) {
    console.log('   ❌ Error al parsear JSON:', err.message);
  }
  
} else {
  console.log('   ❌ Archivo no existe');
}

// Verificar estructura de directorios
console.log('\n📂 Estructura de directorios:');
const publicDir = path.join(__dirname, '..', 'public');
const dataDir = path.join(publicDir, 'data');

console.log('   public/ existe:', fs.existsSync(publicDir));
console.log('   public/data/ existe:', fs.existsSync(dataDir));

if (fs.existsSync(dataDir)) {
  const files = fs.readdirSync(dataDir);
  console.log('   📁 Archivos en public/data/:', files);
}

console.log('\n🌐 Para acceder desde el navegador:');
console.log('   URL: http://localhost:3000/data/spain-provinces-simple.geojson');
console.log('   (Asegúrate de que el servidor Next.js esté corriendo)');
