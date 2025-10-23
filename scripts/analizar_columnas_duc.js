const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analizarColumnas() {
  console.log('='.repeat(70));
  console.log('ANÁLISIS DE COLUMNAS duc_scraper');
  console.log('='.repeat(70));

  try {
    // Obtener varios registros para ver variedad
    const { data: registros } = await supabase
      .from('duc_scraper')
      .select('*')
      .limit(3);

    if (!registros || registros.length === 0) {
      console.log('\n❌ No hay datos en duc_scraper');
      return;
    }

    const primerRegistro = registros[0];
    const columnas = Object.keys(primerRegistro).sort();

    console.log(`\n📊 Total de columnas: ${columnas.length}`);
    console.log('\n🔍 COLUMNAS RELEVANTES PARA UBICACIÓN/ESTADO:\n');

    // Columnas potencialmente útiles
    const columnasInteres = [
      'Disponibilidad',
      'Ubicación tienda',
      'Tienda',
      'Concesionario',
      'Destino',
      'Estado',
      'Origen',
      'Origenes unificados',
      'Fecha disponibilidad',
      'Fecha entrada VO',
      'En uso',
      'Días creado',
      'Días publicado',
      'Días stock'
    ];

    columnasInteres.forEach(col => {
      const valores = registros.map(r => r[col]).filter(v => v !== null && v !== '');
      const valoresUnicos = [...new Set(valores)];
      
      console.log(`📌 ${col}:`);
      if (valoresUnicos.length > 0) {
        valoresUnicos.forEach(v => {
          console.log(`   - "${v}"`);
        });
      } else {
        console.log('   (vacío en todos los registros)');
      }
      console.log('');
    });

    console.log('='.repeat(70));
    console.log('TODAS LAS COLUMNAS (lista completa):');
    console.log('='.repeat(70));
    console.log('');

    columnas.forEach((col, i) => {
      const ejemplo = primerRegistro[col];
      const valorMostrar = ejemplo 
        ? (String(ejemplo).length > 40 ? String(ejemplo).substring(0, 40) + '...' : ejemplo)
        : 'null';
      console.log(`${(i+1).toString().padStart(3)}. ${col.padEnd(35)} = ${valorMostrar}`);
    });

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

analizarColumnas();

