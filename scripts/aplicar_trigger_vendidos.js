/**
 * Aplicar trigger para auto-completar fotos al vender
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

async function aplicarTrigger() {
  console.log('\n🔧 APLICANDO TRIGGER: Auto-completar fotos al vender\n');
  console.log('='.repeat(80));

  try {
    const sqlContent = readFileSync('APLICAR_TRIGGER_AUTO_COMPLETE_VENDIDOS.sql', 'utf8');
    
    console.log('📝 Ejecutando SQL...');
    console.log('-'.repeat(80));

    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sqlContent 
    });

    if (error) {
      console.log('⚠️  No se puede ejecutar SQL directamente');
      console.log('');
      console.log('Por favor, ejecuta MANUALMENTE en Supabase SQL Editor:');
      console.log('Archivo: APLICAR_TRIGGER_AUTO_COMPLETE_VENDIDOS.sql');
      process.exit(1);
    }

    console.log('✅ Trigger aplicado correctamente');
    console.log('='.repeat(80));
    console.log('');
    console.log('🎯 REGLA APLICADA:');
    console.log('   Si un vehículo está vendido, NO puede estar pendiente de fotos');
    console.log('');
    console.log('✅ Funcionamiento:');
    console.log('   - Al insertar en sales_vehicles → marca automáticamente fotos como completadas');
    console.log('   - Estado de pintura cambia a "vendido"');
    console.log('   - Si ya estaba completado, respeta la fecha original');
    console.log('');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ ERROR:', error);
    console.log('');
    console.log('Por favor, ejecuta MANUALMENTE en Supabase SQL Editor:');
    console.log('Archivo: APLICAR_TRIGGER_AUTO_COMPLETE_VENDIDOS.sql');
    process.exit(1);
  }
}

aplicarTrigger();

