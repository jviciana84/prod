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
    
    coordinates.forEach(coord => {
      const parts = coord.trim().split(/\s+/);
      if (parts.length >= 3) {
        sumX += parseFloat(parts[1]);
        sumY += parseFloat(parts[2]);
        count++;
      }
    });
    
    if (count > 0) {
      paths.push({
        id: id++,
        d: d,
        fill: "#e5e7eb",
        stroke: "#9ca3af"
      });
    }
  }
}

// Generar el archivo de datos
const outputPath = path.join(__dirname, '../components/reports/mapa-final-data.ts');
const outputContent = `// Datos extraídos de mapa_final.svg
export const pathsProvincias = ${JSON.stringify(paths, null, 2)};

// Coordenadas aproximadas de los centros de las provincias
export const coordenadasProvincias = {
${paths.map((path, index) => {
  const coords = path.d.match(/[ML]\s*([\d.-]+)\s+([\d.-]+)/g);
  if (coords && coords.length > 0) {
    let sumX = 0, sumY = 0, count = 0;
    coords.forEach(coord => {
      const parts = coord.trim().split(/\s+/);
      if (parts.length >= 3) {
        sumX += parseFloat(parts[1]);
        sumY += parseFloat(parts[2]);
        count++;
      }
    });
    if (count > 0) {
      return `  "Provincia_${index}": { x: ${Math.round(sumX / count)}, y: ${Math.round(sumY / count)} }`;
    }
  }
  return `  "Provincia_${index}": { x: 400, y: 250 }`;
}).join(',\n')}
};

export { pathsProvincias, coordenadasProvincias };
`;

fs.writeFileSync(outputPath, outputContent);
console.log(`Archivo generado: ${outputPath}`);
console.log(`Total de provincias: ${paths.length}`);
