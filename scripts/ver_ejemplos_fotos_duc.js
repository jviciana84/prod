/**
 * Ver ejemplos reales de cómo se almacenan las fotos en DUC
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verEjemplosFotosDuc() {
  console.log('\n📸 EJEMPLOS DE FOTOS EN DUC\n');
  console.log('='.repeat(80));

  try {
    // 1. Ejemplo con fotos
    const { data: conFotos, error: error1 } = await supabase
      .from('duc_scraper')
      .select('"Matrícula", "Modelo", "URL foto 1", "URL foto 2", "URL foto 3", "URL foto 4", "URL foto 5"')
      .not('URL foto 1', 'is', null)
      .limit(3);

    if (error1) throw error1;

    console.log('\n✅ EJEMPLOS CON FOTOS:');
    console.log('-'.repeat(80));
    
    conFotos.forEach((v, i) => {
      console.log(`\n${i + 1}. Matrícula: ${v['Matrícula']}`);
      console.log(`   Modelo: ${v['Modelo']}`);
      console.log(`   URL foto 1: ${v['URL foto 1'] ? v['URL foto 1'].substring(0, 80) + '...' : 'Vacío'}`);
      console.log(`   URL foto 2: ${v['URL foto 2'] ? v['URL foto 2'].substring(0, 80) + '...' : 'Vacío'}`);
      console.log(`   URL foto 3: ${v['URL foto 3'] ? v['URL foto 3'].substring(0, 80) + '...' : 'Vacío'}`);
      console.log(`   Tiene URL foto 1: ${v['URL foto 1'] ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   Tiene URL foto 2: ${v['URL foto 2'] ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   Tiene URL foto 3: ${v['URL foto 3'] ? '✅ SÍ' : '❌ NO'}`);
    });

    // 2. Ejemplo sin fotos
    const { data: sinFotos, error: error2 } = await supabase
      .from('duc_scraper')
      .select('"Matrícula", "Modelo", "URL foto 1", "URL foto 2", "URL foto 3"')
      .is('URL foto 1', null)
      .is('URL foto 2', null)
      .is('URL foto 3', null)
      .limit(3);

    if (error2) throw error2;

    console.log('\n\n❌ EJEMPLOS SIN FOTOS:');
    console.log('-'.repeat(80));
    
    sinFotos.forEach((v, i) => {
      console.log(`\n${i + 1}. Matrícula: ${v['Matrícula']}`);
      console.log(`   Modelo: ${v['Modelo']}`);
      console.log(`   URL foto 1: ${v['URL foto 1'] || 'NULL/Vacío'}`);
      console.log(`   URL foto 2: ${v['URL foto 2'] || 'NULL/Vacío'}`);
      console.log(`   URL foto 3: ${v['URL foto 3'] || 'NULL/Vacío'}`);
    });

    // 3. Verificar los 4 vehículos "problemáticos"
    console.log('\n\n🔴 VERIFICAR LOS 4 VEHÍCULOS "PROBLEMÁTICOS":');
    console.log('-'.repeat(80));

    const problematicos = ['6272HRK', '1779GDV', '4462JKS', '9968LJJ'];

    for (const matricula of problematicos) {
      const { data: vehiculo, error } = await supabase
        .from('duc_scraper')
        .select('*')
        .eq('Matrícula', matricula)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.log(`\n❌ Error consultando ${matricula}`);
        continue;
      }

      if (!vehiculo) {
        console.log(`\n⚠️  ${matricula} - NO encontrado en DUC`);
        continue;
      }

      console.log(`\n📋 ${matricula} - ${vehiculo['Modelo']}`);
      console.log(`   Disponibilidad: ${vehiculo['Disponibilidad']}`);
      
      // Verificar todas las URLs de fotos
      let tieneFotos = false;
      for (let i = 1; i <= 15; i++) {
        const urlKey = `URL foto ${i}`;
        if (vehiculo[urlKey]) {
          tieneFotos = true;
          console.log(`   ${urlKey}: ✅ ${vehiculo[urlKey].substring(0, 60)}...`);
        }
      }
      
      if (!tieneFotos) {
        console.log(`   ❌ NO TIENE NINGUNA FOTO`);
      }
    }

    // 4. Estadísticas de campos de fotos
    console.log('\n\n📊 ESTADÍSTICAS DE FOTOS EN DUC:');
    console.log('='.repeat(80));

    const { count: total } = await supabase
      .from('duc_scraper')
      .select('*', { count: 'exact', head: true });

    const { count: conFoto1 } = await supabase
      .from('duc_scraper')
      .select('*', { count: 'exact', head: true })
      .not('URL foto 1', 'is', null);

    const { count: conFoto2 } = await supabase
      .from('duc_scraper')
      .select('*', { count: 'exact', head: true })
      .not('URL foto 2', 'is', null);

    const { count: conFoto3 } = await supabase
      .from('duc_scraper')
      .select('*', { count: 'exact', head: true })
      .not('URL foto 3', 'is', null);

    console.log(`\nTotal vehículos en DUC: ${total}`);
    console.log(`Con URL foto 1: ${conFoto1} (${((conFoto1/total)*100).toFixed(1)}%)`);
    console.log(`Con URL foto 2: ${conFoto2} (${((conFoto2/total)*100).toFixed(1)}%)`);
    console.log(`Con URL foto 3: ${conFoto3} (${((conFoto3/total)*100).toFixed(1)}%)`);
    
    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

verEjemplosFotosDuc();

