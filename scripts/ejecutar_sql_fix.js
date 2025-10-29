/**
 * Ejecutar SQL para corregir trigger de fotos reales
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function ejecutarSQL() {
  console.log('\n🔧 APLICANDO FIX: Trigger de fotos reales\n');
  console.log('='.repeat(80));

  try {
    const sqlContent = readFileSync('APLICAR_FIX_TRIGGER_FOTOS_REALES.sql', 'utf8');
    
    console.log('📝 Ejecutando SQL...');
    console.log('-'.repeat(80));

    // Ejecutar el SQL completo
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sqlContent 
    });

    if (error) {
      // Si no existe la función exec_sql, intentar ejecutar directamente
      console.log('⚠️  No se puede ejecutar SQL directamente desde Node.js');
      console.log('');
      console.log('Por favor, ejecuta MANUALMENTE en Supabase SQL Editor:');
      console.log('='.repeat(80));
      console.log('');
      console.log('1. Ve a: https://supabase.com/dashboard/project/YOUR_PROJECT/sql');
      console.log('2. Copia y pega el contenido de: APLICAR_FIX_TRIGGER_FOTOS_REALES.sql');
      console.log('3. Click en "Run"');
      console.log('');
      console.log('='.repeat(80));
      process.exit(1);
    }

    console.log('✅ SQL ejecutado correctamente');
    console.log('='.repeat(80));
    console.log('');
    console.log('✅ Trigger corregido exitosamente');
    console.log('🎯 CAMBIO IMPORTANTE:');
    console.log('   - Ahora detecta SOLO fotos reales (URL foto 9, 10, 11, 12, 13, 14, 15)');
    console.log('   - NO detecta fotos dummy (1-8)');
    console.log('   - Los vehículos con solo fotos dummy quedarán como pendientes');
    console.log('');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ ERROR:', error);
    console.log('');
    console.log('Por favor, ejecuta MANUALMENTE en Supabase SQL Editor:');
    console.log('Archivo: APLICAR_FIX_TRIGGER_FOTOS_REALES.sql');
    process.exit(1);
  }
}

ejecutarSQL();


