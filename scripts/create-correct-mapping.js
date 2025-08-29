const fs = require('fs');
const path = require('path');

// Mapeo manual corregido basado en coordenadas geográficas reales
const correctMapping = {
  // Baleares (este, isla)
  0: 'Illes Balears', // 701,257 - Este
  
  // Galicia (noroeste)
  2: 'A Coruña',      // 95,9 - Noroeste
  4: 'Pontevedra',    // 49,64 - Noroeste
  14: 'Ourense',      // 82,75 - Noroeste
  35: 'Lugo',         // 133,19 - Noroeste
  
  // Asturias y Cantabria (norte)
  1: 'Cantabria',     // 281,28 - Norte
  45: 'Asturias',     // 236,94 - Norte
  
  // País Vasco (norte)
  5: 'Bizkaia/Vizcaya', // 358,29 - Norte
  11: 'Araba/Álava',    // 375,48 - Norte
  26: 'Gipuzkoa/Guipúzcoa', // 441,31 - Norte
  
  // Navarra y La Rioja (norte-centro)
  31: 'Navarra',      // 373,68 - Norte-centro
  25: 'La Rioja',     // 378,148 - Norte-centro
  
  // Cataluña (noreste)
  15: 'Barcelona',    // 665,94 - Noreste
  3: 'Girona',        // 678,101 - Noreste
  28: 'Lleida',       // 586,67 - Noreste
  19: 'Tarragona',    // 552,180 - Noreste
  
  // Castilla y León (centro-norte)
  29: 'León',         // 249,65 - Centro-norte
  37: 'Palencia',     // 302,67 - Centro-norte
  16: 'Burgos',       // 349,64 - Centro-norte
  23: 'Soria',        // 429,189 - Centro-norte
  36: 'Segovia',      // 319,172 - Centro
  12: 'Ávila',        // 270,260 - Centro
  17: 'Salamanca',    // 186,197 - Centro-oeste
  38: 'Zamora',       // 176,149 - Centro-oeste
  10: 'Valladolid',   // 261,159 - Centro
  
  // Madrid (centro)
  39: 'Madrid',       // 322,136 - Centro
  
  // Castilla-La Mancha (centro)
  41: 'Guadalajara',  // 291,205 - Centro
  9: 'Cuenca',        // 460,259 - Centro-este
  20: 'Toledo',       // 288,251 - Centro
  21: 'Ciudad Real',  // 395,316 - Centro
  7: 'Albacete',      // 418,347 - Centro-este
  
  // Aragón (centro-este)
  30: 'Huesca',       // 647,80 - Noreste
  32: 'Zaragoza',     // 412,98 - Centro-este
  33: 'Teruel',       // 485,71 - Centro-este
  
  // Valencia (este)
  8: 'València/Valencia', // 480,297 - Este
  13: 'Castelló/Castellón', // 537,290 - Este
  42: 'Alacant/Alicante', // 631,131 - Este
  
  // Murcia (sureste)
  24: 'Murcia',       // 409,339 - Sureste
  
  // Andalucía (sur)
  6: 'Córdoba',       // 295,392 - Sur
  18: 'Sevilla',      // 228,398 - Sur
  27: 'Huelva',       // 148,330 - Suroeste
  34: 'Cádiz',        // 233,465 - Sur
  47: 'Málaga',       // 164,94 - Sur (corregido)
  44: 'Jaén',         // 481,219 - Sur
  46: 'Granada',      // 375,37 - Sur
  43: 'Almería',      // 559,160 - Sureste
  
  // Extremadura (suroeste)
  40: 'Cáceres',      // 232,345 - Suroeste
  22: 'Badajoz',      // 251,331 - Suroeste
  
  // Ciudades autónomas
  48: 'Melilla',      // 483,75 - Norte (enclave)
  49: 'Ceuta'         // 373,500 - Sur (enclave)
};

// Crear mapeo inverso
const inverseMapping = {};
Object.entries(correctMapping).forEach(([id, provincia]) => {
  inverseMapping[provincia] = parseInt(id);
});

// Generar archivo con mapeo corregido
const outputPath = path.join(__dirname, '../components/reports/precise-mapping.ts');
const outputContent = `// Mapeo manual corregido de provincias basado en coordenadas geográficas reales
export const preciseProvinceMapping = ${JSON.stringify(correctMapping, null, 2)};

export const inverseProvinceMapping = ${JSON.stringify(inverseMapping, null, 2)};

// Datos de los paths del SVG (mantener compatibilidad)
export const pathData = [
  { id: 0, centerX: 701, centerY: 257, width: 110, height: 110, area: 12085 },
  { id: 1, centerX: 281, centerY: 28, width: 0, height: 0, area: 0 },
  { id: 2, centerX: 95, centerY: 9, width: 0, height: 0, area: 0 },
  { id: 3, centerX: 678, centerY: 101, width: 47, height: 47, area: 2238 },
  { id: 4, centerX: 49, centerY: 64, width: 27, height: 27, area: 765 },
  { id: 5, centerX: 358, centerY: 29, width: 5, height: 5, area: 31 },
  { id: 6, centerX: 295, centerY: 392, width: 0, height: 0, area: 0 },
  { id: 7, centerX: 418, centerY: 347, width: 0, height: 0, area: 0 },
  { id: 8, centerX: 480, centerY: 297, width: 0, height: 0, area: 0 },
  { id: 9, centerX: 460, centerY: 259, width: 0, height: 0, area: 0 },
  { id: 10, centerX: 261, centerY: 159, width: 0, height: 0, area: 0 },
  { id: 11, centerX: 375, centerY: 48, width: 15, height: 15, area: 235 },
  { id: 12, centerX: 270, centerY: 260, width: 0, height: 0, area: 0 },
  { id: 13, centerX: 537, centerY: 290, width: 0, height: 0, area: 0 },
  { id: 14, centerX: 82, centerY: 75, width: 0, height: 0, area: 0 },
  { id: 15, centerX: 665, centerY: 94, width: 6, height: 6, area: 38 },
  { id: 16, centerX: 349, centerY: 64, width: 69, height: 69, area: 4786 },
  { id: 17, centerX: 186, centerY: 197, width: 0, height: 0, area: 0 },
  { id: 18, centerX: 228, centerY: 398, width: 0, height: 0, area: 0 },
  { id: 19, centerX: 552, centerY: 180, width: 0, height: 0, area: 0 },
  { id: 20, centerX: 288, centerY: 251, width: 17, height: 17, area: 286 },
  { id: 21, centerX: 395, centerY: 316, width: 0, height: 0, area: 0 },
  { id: 22, centerX: 251, centerY: 331, width: 12, height: 12, area: 154 },
  { id: 23, centerX: 429, centerY: 189, width: 0, height: 0, area: 0 },
  { id: 24, centerX: 409, centerY: 339, width: 0, height: 0, area: 0 },
  { id: 25, centerX: 378, centerY: 148, width: 0, height: 0, area: 0 },
  { id: 26, centerX: 441, centerY: 31, width: 0, height: 0, area: 0 },
  { id: 27, centerX: 148, centerY: 330, width: 0, height: 0, area: 0 },
  { id: 28, centerX: 586, centerY: 67, width: 0, height: 0, area: 0 },
  { id: 29, centerX: 249, centerY: 65, width: 38, height: 38, area: 1455 },
  { id: 30, centerX: 647, centerY: 80, width: 0, height: 0, area: 0 },
  { id: 31, centerX: 373, centerY: 68, width: 0, height: 0, area: 0 },
  { id: 32, centerX: 412, centerY: 98, width: 0, height: 0, area: 0 },
  { id: 33, centerX: 485, centerY: 71, width: 25, height: 25, area: 629 },
  { id: 34, centerX: 233, centerY: 465, width: 0, height: 0, area: 0 },
  { id: 35, centerX: 133, centerY: 19, width: 0, height: 0, area: 0 },
  { id: 36, centerX: 319, centerY: 172, width: 34, height: 34, area: 1160 },
  { id: 37, centerX: 302, centerY: 67, width: 35, height: 35, area: 1230 },
  { id: 38, centerX: 176, centerY: 149, width: 0, height: 0, area: 0 },
  { id: 39, centerX: 322, centerY: 136, width: 0, height: 0, area: 0 },
  { id: 40, centerX: 232, centerY: 345, width: 35, height: 35, area: 1218 },
  { id: 41, centerX: 291, centerY: 205, width: 0, height: 0, area: 0 },
  { id: 42, centerX: 631, centerY: 131, width: 0, height: 0, area: 0 },
  { id: 43, centerX: 559, centerY: 160, width: 0, height: 0, area: 0 },
  { id: 44, centerX: 481, centerY: 219, width: 19, height: 19, area: 368 },
  { id: 45, centerX: 236, centerY: 94, width: 18, height: 18, area: 341 },
  { id: 46, centerX: 375, centerY: 37, width: 27, height: 27, area: 729 },
  { id: 47, centerX: 164, centerY: 94, width: 0, height: 0, area: 0 },
  { id: 48, centerX: 483, centerY: 75, width: 16, height: 16, area: 246 },
  { id: 49, centerX: 373, centerY: 500, width: 0, height: 0, area: 0 }
];

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

console.log('=== MAPEO CORREGIDO GENERADO ===');
console.log('ID | Provincia | Coordenadas');
console.log('---|-----------|------------');
Object.entries(correctMapping).forEach(([id, provincia]) => {
  const pathData = [
    { id: 0, centerX: 701, centerY: 257 },
    { id: 1, centerX: 281, centerY: 28 },
    { id: 2, centerX: 95, centerY: 9 },
    { id: 3, centerX: 678, centerY: 101 },
    { id: 4, centerX: 49, centerY: 64 },
    { id: 5, centerX: 358, centerY: 29 },
    { id: 6, centerX: 295, centerY: 392 },
    { id: 7, centerX: 418, centerY: 347 },
    { id: 8, centerX: 480, centerY: 297 },
    { id: 9, centerX: 460, centerY: 259 },
    { id: 10, centerX: 261, centerY: 159 },
    { id: 11, centerX: 375, centerY: 48 },
    { id: 12, centerX: 270, centerY: 260 },
    { id: 13, centerX: 537, centerY: 290 },
    { id: 14, centerX: 82, centerY: 75 },
    { id: 15, centerX: 665, centerY: 94 },
    { id: 16, centerX: 349, centerY: 64 },
    { id: 17, centerX: 186, centerY: 197 },
    { id: 18, centerX: 228, centerY: 398 },
    { id: 19, centerX: 552, centerY: 180 },
    { id: 20, centerX: 288, centerY: 251 },
    { id: 21, centerX: 395, centerY: 316 },
    { id: 22, centerX: 251, centerY: 331 },
    { id: 23, centerX: 429, centerY: 189 },
    { id: 24, centerX: 409, centerY: 339 },
    { id: 25, centerX: 378, centerY: 148 },
    { id: 26, centerX: 441, centerY: 31 },
    { id: 27, centerX: 148, centerY: 330 },
    { id: 28, centerX: 586, centerY: 67 },
    { id: 29, centerX: 249, centerY: 65 },
    { id: 30, centerX: 647, centerY: 80 },
    { id: 31, centerX: 373, centerY: 68 },
    { id: 32, centerX: 412, centerY: 98 },
    { id: 33, centerX: 485, centerY: 71 },
    { id: 34, centerX: 233, centerY: 465 },
    { id: 35, centerX: 133, centerY: 19 },
    { id: 36, centerX: 319, centerY: 172 },
    { id: 37, centerX: 302, centerY: 67 },
    { id: 38, centerX: 176, centerY: 149 },
    { id: 39, centerX: 322, centerY: 136 },
    { id: 40, centerX: 232, centerY: 345 },
    { id: 41, centerX: 291, centerY: 205 },
    { id: 42, centerX: 631, centerY: 131 },
    { id: 43, centerX: 559, centerY: 160 },
    { id: 44, centerX: 481, centerY: 219 },
    { id: 45, centerX: 236, centerY: 94 },
    { id: 46, centerX: 375, centerY: 37 },
    { id: 47, centerX: 164, centerY: 94 },
    { id: 48, centerX: 483, centerY: 75 },
    { id: 49, centerX: 373, centerY: 500 }
  ];
  
  const path = pathData.find(p => p.id === parseInt(id));
  if (path) {
    console.log(`${id.toString().padStart(2)} | ${provincia.padEnd(20)} | ${path.centerX},${path.centerY}`);
  }
});

console.log(`\nArchivo generado: ${outputPath}`);
console.log(`Total de provincias mapeadas: ${Object.keys(correctMapping).length}`);
