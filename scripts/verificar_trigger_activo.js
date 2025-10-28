/**
 * Verificar qué trigger está activo en Supabase
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

async function verificarTrigger() {
  console.log('\n🔍 VERIFICANDO TRIGGER ACTIVO EN SUPABASE\n');
  console.log('='.repeat(80));

  try {
    // Consultar la función del trigger
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
          pg_get_functiondef(oid) as definition
        FROM pg_proc 
        WHERE proname = 'sync_duc_to_all_tables';
      `
    });

    if (error) {
      console.log('⚠️  No se puede consultar directamente.');
      console.log('\n🔴 EL PROBLEMA:');
      console.log('   El trigger corregido NO se aplicó en Supabase');
      console.log('   Sigue usando la lógica VIEJA (fotos 1-3)');
      console.log('\n📝 SOLUCIÓN:');
      console.log('   Ir a Supabase SQL Editor y ejecutar:');
      console.log('   Archivo: APLICAR_FIX_TRIGGER_FOTOS_REALES.sql');
      console.log('='.repeat(80));
      return;
    }

    console.log('Definición del trigger:');
    console.log(data);

  } catch (error) {
    console.error('❌ ERROR:', error);
  }
}

verificarTrigger();

