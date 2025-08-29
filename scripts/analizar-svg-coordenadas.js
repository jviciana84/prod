const fs = require('fs');
const path = require('path');

// Leer el archivo SVG
const svgPath = path.join(__dirname, '../app/dashboard/images/spain-provinces (1).svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

console.log('🔍 Analizando estructura del SVG...');

// Extraer el viewBox
const viewBoxMatch = svgContent.match(/viewBox="([^"]*)"/);
if (viewBoxMatch) {
  console.log(`📐 ViewBox: ${viewBoxMatch[1]}`);
}

// Extraer todos los paths
const pathMatches = svgContent.match(/<path[^>]*d="([^"]*)"[^>]*>/g);

if (!pathMatches) {
  console.log('❌ No se encontraron paths en el SVG');
  process.exit(1);
}

console.log(`📊 Total de paths encontrados: ${pathMatches.length}`);

// Analizar los primeros 5 paths para entender la estructura
console.log('\n🔍 Analizando los primeros 5 paths:');
pathMatches.slice(0, 5).forEach((pathElement, index) => {
  const dMatch = pathElement.match(/d="([^"]*)"/);
  if (dMatch) {
    const d = dMatch[1];
    console.log(`\nPath ${index + 1}:`);
    console.log(`  Longitud del path: ${d.length} caracteres`);
    console.log(`  Primeros 100 caracteres: ${d.substring(0, 100)}...`);
    
    // Extraer coordenadas del path
    const coordenadas = extraerCoordenadas(d);
    console.log(`  Coordenadas extraídas: ${coordenadas.length} puntos`);
    if (coordenadas.length > 0) {
      const minX = Math.min(...coordenadas.map(c => c.x));
      const maxX = Math.max(...coordenadas.map(c => c.x));
      const minY = Math.min(...coordenadas.map(c => c.y));
      const maxY = Math.max(...coordenadas.map(c => c.y));
      console.log(`  Rango X: ${minX.toFixed(2)} - ${maxX.toFixed(2)}`);
      console.log(`  Rango Y: ${minY.toFixed(2)} - ${maxY.toFixed(2)}`);
      console.log(`  Centro aproximado: (${((minX + maxX) / 2).toFixed(2)}, ${((minY + maxY) / 2).toFixed(2)})`);
    }
  }
});

// Función para extraer coordenadas de un path SVG
function extraerCoordenadas(d) {
  const comandos = d.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/g) || [];
  let coordenadas = [];
  let currentX = 0;
  let currentY = 0;
  
  comandos.forEach(comando => {
    const tipo = comando[0];
    const valores = comando.slice(1).trim().split(/[\s,]+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
    
    if (tipo === 'M') {
      if (valores.length >= 2) {
        currentX = valores[0];
        currentY = valores[1];
        coordenadas.push({ x: currentX, y: currentY });
      }
    } else if (tipo === 'L') {
      for (let i = 0; i < valores.length; i += 2) {
        if (valores[i] !== undefined && valores[i + 1] !== undefined) {
          currentX = valores[i];
          currentY = valores[i + 1];
          coordenadas.push({ x: currentX, y: currentY });
        }
      }
    } else if (tipo === 'l') {
      for (let i = 0; i < valores.length; i += 2) {
        if (valores[i] !== undefined && valores[i + 1] !== undefined) {
          currentX += valores[i];
          currentY += valores[i + 1];
          coordenadas.push({ x: currentX, y: currentY });
        }
      }
    } else if (tipo === 'H') {
      valores.forEach(x => {
        if (x !== undefined) {
          currentX = x;
          coordenadas.push({ x: currentX, y: currentY });
        }
      });
    } else if (tipo === 'h') {
      valores.forEach(x => {
        if (x !== undefined) {
          currentX += x;
          coordenadas.push({ x: currentX, y: currentY });
        }
      });
    } else if (tipo === 'V') {
      valores.forEach(y => {
        if (y !== undefined) {
          currentY = y;
          coordenadas.push({ x: currentX, y: currentY });
        }
      });
    } else if (tipo === 'v') {
      valores.forEach(y => {
        if (y !== undefined) {
          currentY += y;
          coordenadas.push({ x: currentX, y: currentY });
        }
      });
    }
  });
  
  return coordenadas;
}

// Analizar todos los paths y calcular centros
console.log('\n📊 Calculando centros para todos los paths...');
const centros = [];

pathMatches.forEach((pathElement, index) => {
  const dMatch = pathElement.match(/d="([^"]*)"/);
  if (dMatch) {
    const coordenadas = extraerCoordenadas(dMatch[1]);
    if (coordenadas.length > 0) {
      const minX = Math.min(...coordenadas.map(c => c.x));
      const maxX = Math.max(...coordenadas.map(c => c.x));
      const minY = Math.min(...coordenadas.map(c => c.y));
      const maxY = Math.max(...coordenadas.map(c => c.y));
      
      const centroX = (minX + maxX) / 2;
      const centroY = (minY + maxY) / 2;
      
      centros.push({
        index,
        centroX,
        centroY,
        puntos: coordenadas.length,
        rangoX: maxX - minX,
        rangoY: maxY - minY
      });
    }
  }
});

console.log(`✅ Centros calculados: ${centros.length}`);

// Mostrar estadísticas
const todosLosCentrosX = centros.map(c => c.centroX);
const todosLosCentrosY = centros.map(c => c.centroY);

console.log('\n📈 Estadísticas generales:');
console.log(`Rango total X: ${Math.min(...todosLosCentrosX).toFixed(2)} - ${Math.max(...todosLosCentrosX).toFixed(2)}`);
console.log(`Rango total Y: ${Math.min(...todosLosCentrosY).toFixed(2)} - ${Math.max(...todosLosCentrosY).toFixed(2)}`);

// Mostrar algunos centros como ejemplo
console.log('\n📍 Ejemplos de centros calculados:');
centros.slice(0, 10).forEach((centro, index) => {
  console.log(`  Path ${centro.index}: (${centro.centroX.toFixed(2)}, ${centro.centroY.toFixed(2)}) - ${centro.puntos} puntos`);
});

console.log('\n🎯 Recomendaciones:');
console.log('1. Los paths parecen ser muy detallados con muchos puntos pequeños');
console.log('2. Las coordenadas están en un rango razonable para un SVG de España');
console.log('3. Cada path representa una provincia con su contorno detallado');
console.log('4. Los centros calculados deberían funcionar bien para posicionar los puntos de ventas');

