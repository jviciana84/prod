const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function obtenerColumnas() {
  console.log('Obteniendo columnas de duc_scraper desde types/supabase.ts...\n');
  
  // Usar el esquema de TypeScript para obtener las columnas exactas
  const fs = require('fs');
  const content = fs.readFileSync('types/supabase.ts', 'utf-8');
  
  // Buscar la sección duc_scraper Row
  const match = content.match(/duc_scraper:\s*\{[\s\S]*?Row:\s*\{([\s\S]*?)\n\s*\}/);
  
  if (match) {
    const rowContent = match[1];
    const lines = rowContent.split('\n');
    const columns = [];
    
    lines.forEach(line => {
      const columnMatch = line.match(/["']([^"']+)["']:\s*\w+/);
      if (columnMatch) {
        columns.push(columnMatch[1]);
      }
    });
    
    console.log(`Total columnas encontradas: ${columns.length}\n`);
    console.log('Columnas que tienen ACENTOS o caracteres especiales:\n');
    
    columns.forEach((col, i) => {
      if (/[áéíóúñüÁÉÍÓÚÑÜ\/]/.test(col)) {
        console.log(`  ${i + 1}. "${col}"`);
      }
    });
    
    console.log('\n\nTodas las columnas:');
    columns.forEach((col, i) => {
      console.log(`  ${i + 1}. "${col}"`);
    });
  } else {
    console.log('No se pudo parsear el archivo types/supabase.ts');
  }
}

obtenerColumnas();



