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
      const centerX = Math.round(sumX / count);
      const centerY = Math.round(sumY / count);
      
      paths.push({
        id: id++,
        d: d,
        centerX: centerX,
        centerY: centerY,
        fill: "#e5e7eb",
        stroke: "#9ca3af"
      });
    }
  }
}

// Ordenar por posición geográfica (de norte a sur, de oeste a este)
paths.sort((a, b) => {
  // Primero por Y (latitud), luego por X (longitud)
  if (Math.abs(a.centerY - b.centerY) > 50) {
    return a.centerY - b.centerY;
  }
  return a.centerX - b.centerX;
});

console.log('Paths ordenados por posición geográfica:');
console.log('ID | Centro X,Y | Posible Provincia');
console.log('---|------------|------------------');

paths.forEach((path, index) => {
  console.log(`${path.id.toString().padStart(2)} | ${path.centerX.toString().padStart(3)},${path.centerY.toString().padStart(3)} | Provincia_${index}`);
});

// Generar un archivo con el mapeo sugerido
const outputPath = path.join(__dirname, '../components/reports/province-mapping.ts');
const outputContent = `// Mapeo sugerido de provincias basado en posición geográfica
// Este archivo debe ser revisado manualmente para asignar los nombres correctos

export const provinceMapping = {
${paths.map((path, index) => {
  // Asignar provincias basándose en la posición aproximada
  let provincia = `Provincia_${index}`;
  
  // Mapeo aproximado basado en coordenadas
  if (path.centerY < 100) {
    if (path.centerX < 200) provincia = 'Galicia';
    else if (path.centerX < 400) provincia = 'Asturias/Cantabria';
    else if (path.centerX < 600) provincia = 'País Vasco/Navarra';
    else provincia = 'Cataluña';
  } else if (path.centerY < 200) {
    if (path.centerX < 300) provincia = 'Castilla y León';
    else if (path.centerX < 500) provincia = 'Madrid/Aragón';
    else provincia = 'Cataluña/Valencia';
  } else if (path.centerY < 300) {
    if (path.centerX < 300) provincia = 'Castilla-La Mancha';
    else if (path.centerX < 500) provincia = 'Valencia/Murcia';
    else provincia = 'Baleares';
  } else {
    if (path.centerX < 300) provincia = 'Extremadura';
    else provincia = 'Andalucía';
  }
  
  return `  ${path.id}: '${provincia}',`;
}).join('\n')}
};

export const sortedPaths = ${JSON.stringify(paths.map(p => ({ id: p.id, centerX: p.centerX, centerY: p.centerY })), null, 2)};
`;

fs.writeFileSync(outputPath, outputContent);
console.log(`\nArchivo de mapeo generado: ${outputPath}`);
console.log(`Total de paths: ${paths.length}`);
