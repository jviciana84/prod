/**
 * 🔍 SCRIPT DE DETECCIÓN: useEffect con dependencia de supabase
 * 
 * Este script busca el patrón problemático que causa tablas que no cargan
 * y requieren F5 para funcionar.
 * 
 * USO:
 *   node scripts/detectar_problema_useEffect_supabase.js
 * 
 * FECHA: 14 Oct 2025
 * PROBLEMA: Re-renders infinitos por useEffect con supabase en dependencies
 */

const fs = require('fs');
const path = require('path');

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

// Directorios a escanear
const dirsToScan = [
  'components',
  'app',
  'hooks'
];

// Estadísticas
let totalFiles = 0;
let filesWithProblem = 0;
let problemsFound = [];

/**
 * Escanea recursivamente un directorio buscando archivos .tsx y .ts
 */
function scanDirectory(dir) {
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Ignorar node_modules y .next
        if (item !== 'node_modules' && item !== '.next' && item !== 'dist') {
          scanDirectory(fullPath);
        }
      } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
        scanFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error escaneando directorio ${dir}:`, error.message);
  }
}

/**
 * Escanea un archivo buscando el patrón problemático
 */
function scanFile(filePath) {
  totalFiles++;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Buscar patrón: useEffect con supabase en dependencies
    // Patrón regex mejorado para detectar }, [..., supabase, ...])
    const problemPattern = /},\s*\[([^\]]*supabase[^\]]*)\]\s*\)/g;
    
    let match;
    const problems = [];
    
    while ((match = problemPattern.exec(content)) !== null) {
      // Encontrar número de línea
      const position = match.index;
      let lineNumber = 1;
      let currentPos = 0;
      
      for (let i = 0; i < lines.length; i++) {
        currentPos += lines[i].length + 1; // +1 por el \n
        if (currentPos > position) {
          lineNumber = i + 1;
          break;
        }
      }
      
      problems.push({
        line: lineNumber,
        dependencies: match[1].trim(),
        snippet: lines[lineNumber - 1]?.trim() || ''
      });
    }
    
    if (problems.length > 0) {
      filesWithProblem++;
      problemsFound.push({
        file: filePath,
        problems: problems
      });
    }
    
  } catch (error) {
    console.error(`Error leyendo archivo ${filePath}:`, error.message);
  }
}

/**
 * Muestra los resultados del escaneo
 */
function showResults() {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.blue}🔍 RESULTADOS DEL ESCANEO${colors.reset}`);
  console.log('='.repeat(80) + '\n');
  
  console.log(`Archivos escaneados: ${colors.yellow}${totalFiles}${colors.reset}`);
  console.log(`Archivos con problemas: ${colors.red}${filesWithProblem}${colors.reset}\n`);
  
  if (problemsFound.length === 0) {
    console.log(`${colors.green}✅ ¡No se encontraron problemas!${colors.reset}`);
    console.log(`${colors.green}   Todas las tablas deberían cargar correctamente.${colors.reset}\n`);
    return;
  }
  
  console.log(`${colors.red}⚠️  PROBLEMAS ENCONTRADOS:${colors.reset}\n`);
  
  problemsFound.forEach((item, index) => {
    console.log(`${colors.magenta}${index + 1}. ${item.file}${colors.reset}`);
    
    item.problems.forEach((problem, pIndex) => {
      console.log(`   ${colors.yellow}Línea ${problem.line}:${colors.reset}`);
      console.log(`   ${colors.red}Dependencies: [${problem.dependencies}]${colors.reset}`);
      console.log(`   Código: ${problem.snippet.substring(0, 80)}...`);
      console.log('');
    });
  });
  
  console.log('='.repeat(80));
  console.log(`${colors.yellow}📋 RECOMENDACIÓN:${colors.reset}`);
  console.log(`
${colors.yellow}Para cada archivo listado arriba:${colors.reset}

1. Cambiar el import:
   ${colors.red}- import { createClientComponentClient } from "@/lib/supabase/client"${colors.reset}
   ${colors.green}+ import { getSupabaseClient } from "@/lib/supabase/singleton"${colors.reset}

2. Cambiar la inicialización:
   ${colors.red}- const supabase = createClientComponentClient()${colors.reset}
   ${colors.green}+ const supabase = getSupabaseClient()${colors.reset}

3. Quitar 'supabase' de las dependencies:
   ${colors.red}- }, [otherDeps, supabase])${colors.reset}
   ${colors.green}+ }, [otherDeps])${colors.reset}

${colors.blue}📖 Ver documentación completa en:${colors.reset}
   docs/SOLUCION_PROBLEMA_TABLAS_NO_CARGAN_OCT_14_2025.md
`);
  console.log('='.repeat(80) + '\n');
}

// Ejecutar escaneo
console.log(`${colors.blue}🔍 Iniciando escaneo...${colors.reset}\n`);

dirsToScan.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Escaneando directorio: ${dir}/`);
    scanDirectory(dir);
  } else {
    console.log(`${colors.yellow}⚠️  Directorio no encontrado: ${dir}/${colors.reset}`);
  }
});

showResults();

// Exit code: 0 si no hay problemas, 1 si hay problemas
process.exit(problemsFound.length > 0 ? 1 : 0);

