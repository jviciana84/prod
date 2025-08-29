const fs = require('fs');
const path = require('path');

// Leer el archivo SVG para obtener los paths
const svgPath = path.join(__dirname, '../app/dashboard/images/mapa_final.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

// Extraer los paths del SVG
const pathRegex = /<path[^>]*d="([^"]*)"[^>]*\/>/g;
const paths = [];
let match;
let id = 0;

while ((match = pathRegex.exec(svgContent)) !== null) {
  const d = match[1];
  
  // Calcular el centro aproximado del path
  const coordinates = d.match(/[ML]\s*([\d.-]+)\s+([\d.-]+)/g);
  if (coordinates && coordinates.length > 0) {
    let sumX = 0, sumY = 0, count = 0;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    coordinates.forEach(coord => {
      const parts = coord.trim().split(/\s+/);
      if (parts.length >= 3) {
        const x = parseFloat(parts[1]);
        const y = parseFloat(parts[2]);
        sumX += x;
        sumY += y;
        count++;
        
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    });
    
    if (count > 0) {
      const centerX = Math.round(sumX / count);
      const centerY = Math.round(sumY / count);
      const width = maxX - minX;
      const height = maxY - minY;
      const area = width * height;
      
      paths.push({
        id: id++,
        d: d,
        centerX: centerX,
        centerY: centerY,
        width: width,
        height: height,
        area: area
      });
    }
  }
}

// Función para convertir coordenadas SVG a coordenadas geográficas aproximadas
function svgToGeo(svgX, svgY) {
  // El SVG tiene viewBox="0 0 800 507"
  // Aproximadamente: X=0 es -10° (oeste), X=800 es 5° (este)
  // Y=0 es 44° (norte), Y=507 es 36° (sur)
  const geoX = -10 + (svgX / 800) * 15; // -10 a 5 grados
  const geoY = 44 - (svgY / 507) * 8;   // 44 a 36 grados
  return { lon: geoX, lat: geoY };
}

console.log('=== ANÁLISIS DE COORDENADAS SVG ===');
console.log('ID | Centro X,Y | Coordenadas Geo | Área | Posición');
console.log('---|------------|-----------------|------|----------');

paths.forEach(path => {
  const geo = svgToGeo(path.centerX, path.centerY);
  let position = '';
  
  // Determinar posición aproximada
  if (path.centerX > 600) position = 'Este (Cataluña/Baleares)';
  else if (path.centerX > 400) position = 'Centro-Este';
  else if (path.centerX > 200) position = 'Centro';
  else position = 'Oeste';
  
  if (path.centerY < 100) position += ' - Norte';
  else if (path.centerY > 400) position += ' - Sur';
  else position += ' - Centro';
  
  console.log(`${path.id.toString().padStart(2)} | ${path.centerX.toString().padStart(3)},${path.centerY.toString().padStart(3)} | ${geo.lon.toFixed(2)}°,${geo.lat.toFixed(2)}° | ${path.area.toFixed(0)} | ${position}`);
});

// Crear mapeo manual basado en ubicación geográfica
const manualMapping = {
  // Baleares (este, isla)
  0: 'Illes Balears',
  
  // Galicia (noroeste)
  2: 'A Coruña',
  4: 'Pontevedra',
  14: 'Ourense',
  35: 'Lugo',
  
  // Asturias y Cantabria (norte)
  1: 'Cantabria',
  45: 'Asturias',
  
  // País Vasco (norte)
  5: 'Bizkaia/Vizcaya',
  11: 'Araba/Álava',
  26: 'Gipuzkoa/Guipúzcoa',
  
  // Navarra y La Rioja (norte-centro)
  31: 'Navarra',
  25: 'La Rioja',
  
  // Cataluña (noreste)
  15: 'Barcelona',
  3: 'Girona',
  28: 'Lleida',
  19: 'Tarragona',
  
  // Castilla y León (centro-norte)
  29: 'León',
  37: 'Palencia',
  16: 'Burgos',
  23: 'Soria',
  36: 'Segovia',
  12: 'Ávila',
  17: 'Salamanca',
  38: 'Zamora',
  10: 'Valladolid',
  
  // Madrid (centro)
  39: 'Madrid',
  
  // Castilla-La Mancha (centro)
  41: 'Guadalajara',
  9: 'Cuenca',
  20: 'Toledo',
  21: 'Ciudad Real',
  7: 'Albacete',
  
  // Aragón (centro-este)
  30: 'Huesca',
  32: 'Zaragoza',
  33: 'Teruel',
  
  // Valencia (este)
  8: 'València/Valencia',
  13: 'Castelló/Castellón',
  42: 'Alacant/Alicante',
  
  // Murcia (sureste)
  24: 'Murcia',
  
  // Andalucía (sur)
  6: 'Córdoba',
  18: 'Sevilla',
  27: 'Huelva',
  34: 'Cádiz',
  47: 'Málaga',
  44: 'Jaén',
  46: 'Granada',
  43: 'Almería',
  
  // Extremadura (suroeste)
  40: 'Cáceres',
  22: 'Badajoz',
  
  // Ciudades autónomas
  48: 'Melilla',
  49: 'Ceuta'
};

console.log('\n=== MAPEO MANUAL SUGERIDO ===');
console.log('ID | Provincia');
console.log('---|----------');
Object.entries(manualMapping).forEach(([id, provincia]) => {
  const path = paths.find(p => p.id === parseInt(id));
  if (path) {
    const geo = svgToGeo(path.centerX, path.centerY);
    console.log(`${id.toString().padStart(2)} | ${provincia} (${geo.lon.toFixed(2)}°, ${geo.lat.toFixed(2)}°)`);
  }
});

// Crear mapeo inverso
const inverseMapping = {};
Object.entries(manualMapping).forEach(([id, provincia]) => {
  inverseMapping[provincia] = parseInt(id);
});

// Generar archivo con mapeo manual
const outputPath = path.join(__dirname, '../components/reports/precise-mapping.ts');
const outputContent = `// Mapeo manual de provincias basado en ubicación geográfica
export const preciseProvinceMapping = ${JSON.stringify(manualMapping, null, 2)};

export const inverseProvinceMapping = ${JSON.stringify(inverseMapping, null, 2)};

export const pathData = ${JSON.stringify(paths.map(p => ({
  id: p.id,
  centerX: p.centerX,
  centerY: p.centerY,
  width: p.width,
  height: p.height,
  area: p.area
})), null, 2)};

// Función para obtener provincia por coordenadas
export function getProvinceByCoordinates(x: number, y: number): string | null {
  const tolerance = 50; // Radio de tolerancia
  
  for (const path of pathData) {
    const distance = Math.sqrt(Math.pow(x - path.centerX, 2) + Math.pow(y - path.centerY, 2));
    if (distance <= tolerance) {
      return preciseProvinceMapping[path.id] || null;
    }
  }
  return null;
}
`;

fs.writeFileSync(outputPath, outputContent);

console.log(`\nArchivo generado: ${outputPath}`);
console.log(`Total de provincias mapeadas: ${Object.keys(manualMapping).length}`);
