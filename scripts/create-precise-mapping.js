const fs = require('fs');
const path = require('path');

// Leer el archivo SVG
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
        area: area,
        fill: "#e5e7eb",
        stroke: "#9ca3af"
      });
    }
  }
}

// Mapeo preciso basado en coordenadas y características de cada provincia
const preciseMapping = {
  // Baleares (isla en el este, coordenadas altas en X)
  0: 'Baleares',
  
  // Galicia (noroeste, Y bajo, X bajo)
  2: 'A Coruña',
  4: 'Lugo', 
  14: 'Ourense',
  35: 'Pontevedra',
  
  // Asturias y Cantabria (norte, Y muy bajo)
  1: 'Asturias',
  3: 'Cantabria',
  
  // País Vasco (norte, X medio-alto)
  15: 'Bizkaia',
  30: 'Gipuzkoa',
  5: 'Álava',
  
  // Navarra y La Rioja (norte-centro)
  11: 'Navarra',
  25: 'La Rioja',
  
  // Cataluña (noreste, X alto)
  7: 'Barcelona',
  16: 'Girona',
  24: 'Lleida',
  42: 'Tarragona',
  
  // Castilla y León (centro-norte)
  23: 'León',
  33: 'Palencia',
  8: 'Burgos',
  41: 'Soria',
  39: 'Segovia',
  4: 'Ávila',
  36: 'Salamanca',
  48: 'Zamora',
  46: 'Valladolid',
  
  // Madrid (centro)
  23: 'Madrid',
  
  // Castilla-La Mancha (centro)
  18: 'Guadalajara',
  15: 'Cuenca',
  44: 'Toledo',
  12: 'Ciudad Real',
  1: 'Albacete',
  
  // Aragón (centro-este)
  21: 'Huesca',
  49: 'Zaragoza',
  43: 'Teruel',
  
  // Valencia (este)
  45: 'Valencia',
  11: 'Castellón',
  2: 'Alicante',
  
  // Murcia (sureste)
  29: 'Murcia',
  
  // Andalucía (sur, Y alto)
  13: 'Córdoba',
  40: 'Sevilla',
  20: 'Huelva',
  10: 'Cádiz',
  28: 'Málaga',
  22: 'Jaén',
  17: 'Granada',
  3: 'Almería',
  
  // Extremadura (suroeste, Y alto, X bajo)
  9: 'Cáceres',
  6: 'Badajoz'
};

// Crear mapeo inverso
const inverseMapping = {};
Object.entries(preciseMapping).forEach(([id, provincia]) => {
  inverseMapping[provincia] = parseInt(id);
});

// Generar archivo con mapeo preciso
const outputPath = path.join(__dirname, '../components/reports/precise-mapping.ts');
const outputContent = `// Mapeo preciso de provincias basado en coordenadas y características
export const preciseProvinceMapping = ${JSON.stringify(preciseMapping, null, 2)};

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

console.log('Mapeo preciso generado:');
console.log('ID | Centro X,Y | Provincia');
console.log('---|------------|----------');

Object.entries(preciseMapping).forEach(([id, provincia]) => {
  const path = paths.find(p => p.id === parseInt(id));
  if (path) {
    console.log(`${id.toString().padStart(2)} | ${path.centerX.toString().padStart(3)},${path.centerY.toString().padStart(3)} | ${provincia}`);
  }
});

console.log(`\nArchivo generado: ${outputPath}`);
console.log(`Total de provincias mapeadas: ${Object.keys(preciseMapping).length}`);
