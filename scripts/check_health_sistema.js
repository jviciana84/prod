/**
 * 🏥 CHEQUEO DE SALUD DEL SISTEMA
 * 
 * Script rápido para verificar que no hay problemas conocidos
 * 
 * USO:
 *   node scripts/check_health_sistema.js
 * 
 * VERIFICA:
 *   - Patrón problemático useEffect con supabase
 *   - Archivos críticos
 *   - Configuración básica
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

let allChecksPass = true;

console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
console.log(`${colors.blue}🏥 CHEQUEO DE SALUD DEL SISTEMA${colors.reset}`);
console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);

/**
 * CHECK 1: Archivos críticos existen
 */
console.log(`${colors.yellow}1. Verificando archivos críticos...${colors.reset}`);

const criticalFiles = [
  'lib/supabase/singleton.ts',
  'components/vehicles/stock-table.tsx',
  'components/photos/photos-table.tsx',
];

let criticalFilesOK = true;
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ${colors.green}✓${colors.reset} ${file}`);
  } else {
    console.log(`   ${colors.red}✗${colors.reset} ${file} ${colors.red}NO ENCONTRADO${colors.reset}`);
    criticalFilesOK = false;
    allChecksPass = false;
  }
});

if (criticalFilesOK) {
  console.log(`   ${colors.green}✅ Archivos críticos OK${colors.reset}\n`);
} else {
  console.log(`   ${colors.red}❌ Faltan archivos críticos${colors.reset}\n`);
}

/**
 * CHECK 2: Singleton correcto
 */
console.log(`${colors.yellow}2. Verificando singleton de Supabase...${colors.reset}`);

try {
  const singletonContent = fs.readFileSync('lib/supabase/singleton.ts', 'utf8');
  
  if (singletonContent.includes('getSupabaseClient') && 
      singletonContent.includes('supabaseClient')) {
    console.log(`   ${colors.green}✅ Singleton correctamente implementado${colors.reset}\n`);
  } else {
    console.log(`   ${colors.red}❌ Singleton parece estar mal configurado${colors.reset}\n`);
    allChecksPass = false;
  }
} catch (error) {
  console.log(`   ${colors.red}❌ Error leyendo singleton: ${error.message}${colors.reset}\n`);
  allChecksPass = false;
}

/**
 * CHECK 3: Buscar patrón problemático en archivos críticos
 */
console.log(`${colors.yellow}3. Verificando archivos críticos sin patrón problemático...${colors.reset}`);

const filesToCheck = [
  'components/vehicles/stock-table.tsx',
  'components/photos/photos-table.tsx',
];

let patternsFound = 0;

filesToCheck.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    
    // Buscar patrón problemático
    const hasProblematicPattern = /},\s*\[([^\]]*supabase[^\]]*)\]\s*\)/g.test(content);
    
    if (hasProblematicPattern) {
      console.log(`   ${colors.red}⚠️  ${file} tiene patrón problemático${colors.reset}`);
      patternsFound++;
      allChecksPass = false;
    } else {
      console.log(`   ${colors.green}✓${colors.reset} ${file}`);
    }
  } catch (error) {
    console.log(`   ${colors.yellow}?${colors.reset} ${file} (no se pudo leer)`);
  }
});

if (patternsFound === 0) {
  console.log(`   ${colors.green}✅ Archivos críticos sin patrón problemático${colors.reset}\n`);
} else {
  console.log(`   ${colors.red}❌ Encontrado patrón problemático en ${patternsFound} archivo(s)${colors.reset}\n`);
}

/**
 * CHECK 4: Documentación existe
 */
console.log(`${colors.yellow}4. Verificando documentación...${colors.reset}`);

const docs = [
  'docs/SOLUCION_PROBLEMA_TABLAS_NO_CARGAN_OCT_14_2025.md',
  'docs/RESUMEN_EJECUTIVO_PROBLEMA_TABLAS_14_OCT.md',
];

let docsOK = true;
docs.forEach(doc => {
  if (fs.existsSync(doc)) {
    console.log(`   ${colors.green}✓${colors.reset} ${doc}`);
  } else {
    console.log(`   ${colors.yellow}?${colors.reset} ${doc} (no encontrado)`);
    docsOK = false;
  }
});

if (docsOK) {
  console.log(`   ${colors.green}✅ Documentación disponible${colors.reset}\n`);
} else {
  console.log(`   ${colors.yellow}⚠️  Falta documentación (no crítico)${colors.reset}\n`);
}

/**
 * RESULTADO FINAL
 */
console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);

if (allChecksPass) {
  console.log(`${colors.green}✅ SISTEMA SALUDABLE${colors.reset}`);
  console.log(`   Todos los checks críticos pasaron correctamente.\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}❌ SE DETECTARON PROBLEMAS${colors.reset}`);
  console.log(`   Revisa los checks marcados arriba.\n`);
  console.log(`${colors.yellow}📖 Documentación:${colors.reset}`);
  console.log(`   docs/SOLUCION_PROBLEMA_TABLAS_NO_CARGAN_OCT_14_2025.md\n`);
  process.exit(1);
}

