const fs = require('fs');
const path = require('path');

// Leer el archivo SVG
const svgPath = path.join(__dirname, '../app/dashboard/images/spain-provinces.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

console.log('🔍 Analizando SVG de provincias de España...');

// Extraer todos los paths del SVG
const pathMatches = svgContent.match(/<path[^>]*d="([^"]*)"[^>]*>/g);

if (!pathMatches) {
  console.log('❌ No se encontraron paths en el SVG');
  process.exit(1);
}

console.log(`📊 Se encontraron ${pathMatches.length} paths (provincias)`);

// Procesar cada path para extraer información
const provincias = [];

pathMatches.forEach((pathElement, index) => {
  // Extraer el atributo d (coordenadas)
  const dMatch = pathElement.match(/d="([^"]*)"/);
  if (!dMatch) return;

  const d = dMatch[1];
  
  // Extraer otros atributos si existen
  const fillMatch = pathElement.match(/fill="([^"]*)"/);
  const strokeMatch = pathElement.match(/stroke="([^"]*)"/);
  
  // Calcular el centro aproximado del path
  const coordinates = d.split(/[ML]/).filter(coord => coord.trim());
  let sumX = 0, sumY = 0, count = 0;
  
  coordinates.forEach(coord => {
    const parts = coord.trim().split(/\s+/);
    if (parts.length >= 2) {
      const x = parseFloat(parts[0]);
      const y = parseFloat(parts[1]);
      if (!isNaN(x) && !isNaN(y)) {
        sumX += x;
        sumY += y;
        count++;
      }
    }
  });
  
  const centerX = count > 0 ? Math.round(sumX / count) : 0;
  const centerY = count > 0 ? Math.round(sumY / count) : 0;
  
  provincias.push({
    index,
    d,
    centerX,
    centerY,
    fill: fillMatch ? fillMatch[1] : '#e5e7eb',
    stroke: strokeMatch ? strokeMatch[1] : '#9ca3af'
  });
});

// Generar el código TypeScript para el componente
const generateComponentCode = () => {
  let code = `// Coordenadas de provincias extraídas del SVG real
const coordenadasProvincias = {
`;

  provincias.forEach((provincia, index) => {
    code += `  "Provincia_${index}": { x: ${provincia.centerX}, y: ${provincia.centerY }},\n`;
  });

  code += `};

// Paths SVG de las provincias
const pathsProvincias = [
`;

  provincias.forEach((provincia, index) => {
    code += `  {
    id: ${index},
    d: "${provincia.d}",
    fill: "${provincia.fill}",
    stroke: "${provincia.stroke}"
  },\n`;
  });

  code += `];`;

  return code;
};

// Guardar el código generado
const outputPath = path.join(__dirname, '../components/reports/svg-provinces-data.ts');
const componentCode = generateComponentCode();

fs.writeFileSync(outputPath, componentCode);
console.log(`✅ Datos de provincias guardados en: ${outputPath}`);

// Mostrar estadísticas
console.log('\n📈 Estadísticas:');
console.log(`- Total de provincias: ${provincias.length}`);
console.log(`- Coordenadas X: ${Math.min(...provincias.map(p => p.centerX))} - ${Math.max(...provincias.map(p => p.centerX))}`);
console.log(`- Coordenadas Y: ${Math.min(...provincias.map(p => p.centerY))} - ${Math.max(...provincias.map(p => p.centerY))}`);

console.log('\n🎯 Próximos pasos:');
console.log('1. Revisar el archivo generado: components/reports/svg-provinces-data.ts');
console.log('2. Mapear los nombres reales de las provincias con las coordenadas');
console.log('3. Actualizar el componente MapaEspanaSVGReal para usar estos datos');
