const fs = require('fs');
const path = require('path');

// Leer el archivo GeoJSON
const geojsonPath = path.join(__dirname, '../public/data/spain-provinces.geojson');
const geojsonContent = fs.readFileSync(geojsonPath, 'utf8');
const geojsonData = JSON.parse(geojsonContent);

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

console.log(`Encontrados ${paths.length} paths en el SVG`);
console.log(`Encontradas ${geojsonData.features.length} provincias en el GeoJSON`);

// Función para convertir coordenadas SVG a coordenadas geográficas aproximadas
function svgToGeo(svgX, svgY) {
  // El SVG tiene viewBox="0 0 800 507"
  // Aproximadamente: X=0 es -10° (oeste), X=800 es 5° (este)
  // Y=0 es 44° (norte), Y=507 es 36° (sur)
  const geoX = -10 + (svgX / 800) * 15; // -10 a 5 grados
  const geoY = 44 - (svgY / 507) * 8;   // 44 a 36 grados
  return { lon: geoX, lat: geoY };
}

// Función para calcular la distancia entre dos puntos geográficos (simplificada)
function distance(lat1, lon1, lat2, lon2) {
  // Usar distancia euclidiana simplificada para mayor velocidad
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

// Precalcular centros de provincias para mayor velocidad
const provinceCenters = [];
geojsonData.features.forEach(feature => {
  const provinceName = feature.properties.name;
  const coords = feature.geometry.coordinates[0][0]; // Tomar solo el primer anillo
  let sumLon = 0, sumLat = 0;
  
  // Usar solo algunos puntos para mayor velocidad
  const step = Math.max(1, Math.floor(coords.length / 10));
  for (let i = 0; i < coords.length; i += step) {
    sumLon += coords[i][0];
    sumLat += coords[i][1];
  }
  
  const center = {
    name: provinceName,
    lon: sumLon / Math.ceil(coords.length / step),
    lat: sumLat / Math.ceil(coords.length / step)
  };
  
  provinceCenters.push(center);
});

console.log(`Centros de provincias calculados: ${provinceCenters.length}`);

// Mapear cada path del SVG a la provincia más cercana del GeoJSON
const mapping = {};
const usedProvinces = new Set();

paths.forEach((path, index) => {
  const pathCenter = svgToGeo(path.centerX, path.centerY);
  let closestProvince = null;
  let minDistance = Infinity;
  
  provinceCenters.forEach(province => {
    if (usedProvinces.has(province.name)) return;
    
    const dist = distance(pathCenter.lat, pathCenter.lon, province.lat, province.lon);
    
    if (dist < minDistance) {
      minDistance = dist;
      closestProvince = province.name;
    }
  });
  
  if (closestProvince) {
    mapping[path.id] = closestProvince;
    usedProvinces.add(closestProvince);
    console.log(`Path ${path.id} (${pathCenter.lon.toFixed(2)}, ${pathCenter.lat.toFixed(2)}) → ${closestProvince} (dist: ${minDistance.toFixed(2)})`);
  } else {
    console.log(`Path ${path.id} no mapeado`);
  }
  
  // Mostrar progreso cada 10 paths
  if ((index + 1) % 10 === 0) {
    console.log(`Progreso: ${index + 1}/${paths.length} paths procesados`);
  }
});

// Crear mapeo inverso
const inverseMapping = {};
Object.entries(mapping).forEach(([id, provincia]) => {
  inverseMapping[provincia] = parseInt(id);
});

// Generar archivo con mapeo automático
const outputPath = path.join(__dirname, '../components/reports/precise-mapping.ts');
const outputContent = `// Mapeo automático de provincias basado en GeoJSON
export const preciseProvinceMapping = ${JSON.stringify(mapping, null, 2)};

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

console.log('\n=== RESUMEN ===');
console.log(`Total de paths en SVG: ${paths.length}`);
console.log(`Total de provincias en GeoJSON: ${geojsonData.features.length}`);
console.log(`Provincias mapeadas: ${Object.keys(mapping).length}`);
console.log(`Provincias no mapeadas: ${geojsonData.features.length - Object.keys(mapping).length}`);

console.log('\n=== PROVINCIAS MAPEADAS ===');
Object.entries(mapping).forEach(([id, provincia]) => {
  const path = paths.find(p => p.id === parseInt(id));
  if (path) {
    const geo = svgToGeo(path.centerX, path.centerY);
    console.log(`${id.toString().padStart(2)} | ${path.centerX.toString().padStart(3)},${path.centerY.toString().padStart(3)} | ${geo.lon.toFixed(2)}°,${geo.lat.toFixed(2)}° | ${provincia}`);
  }
});

console.log('\n=== PROVINCIAS NO MAPEADAS ===');
provinceCenters.forEach(province => {
  if (!usedProvinces.has(province.name)) {
    console.log(`- ${province.name}`);
  }
});

console.log(`\nArchivo generado: ${outputPath}`);
