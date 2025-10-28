/**
 * INVESTIGACIÓN URGENTE: ¿Qué está marcando automáticamente como completados?
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

async function investigarUrgente() {
  console.log('\n🚨 INVESTIGACIÓN URGENTE: ¿QUÉ ESTÁ AUTO-COMPLETANDO?\n');
  console.log('='.repeat(80));

  try {
    // Ver completados en los últimos 5 minutos
    const hace5min = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: recientes, error } = await supabase
      .from('fotos')
      .select('license_plate, model, photos_completed, auto_completed, photos_completed_date, updated_at')
      .eq('photos_completed', true)
      .gte('updated_at', hace5min)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    console.log(`\n🔴 VEHÍCULOS MARCADOS COMO COMPLETADOS EN LOS ÚLTIMOS 5 MINUTOS: ${recientes.length}`);
    console.log('='.repeat(80));

    if (recientes.length === 0) {
      console.log('\n✅ No hay vehículos marcados recientemente');
    } else {
      recientes.forEach((v, i) => {
        const fecha = new Date(v.updated_at).toLocaleTimeString('es-ES');
        const tipo = v.auto_completed ? '🤖 AUTO' : '👤 MANUAL';
        console.log(`${i + 1}. ${v.license_plate} - ${v.model} [${fecha}] ${tipo}`);
      });

      // Verificar si tienen fotos reales
      console.log('\n' + '='.repeat(80));
      console.log('🔍 VERIFICANDO SI TIENEN FOTOS REALES EN DUC:');
      console.log('='.repeat(80));

      let sinFotosReales = 0;

      for (const vehiculo of recientes) {
        const { data: ducData } = await supabase
          .from('duc_scraper')
          .select('"Matrícula", "URL foto 9", "URL foto 10", "URL foto 11", "URL foto 12", "URL foto 13", "URL foto 14", "URL foto 15"')
          .eq('Matrícula', vehiculo.license_plate)
          .single();

        if (!ducData) {
          console.log(`${vehiculo.license_plate}: ⚠️  NO en DUC`);
          continue;
        }

        const tieneFotosReales = !!(
          ducData['URL foto 9'] || 
          ducData['URL foto 10'] || 
          ducData['URL foto 11'] ||
          ducData['URL foto 12'] ||
          ducData['URL foto 13'] ||
          ducData['URL foto 14'] ||
          ducData['URL foto 15']
        );

        if (tieneFotosReales) {
          console.log(`${vehiculo.license_plate}: ✅ SÍ tiene fotos reales`);
        } else {
          console.log(`${vehiculo.license_plate}: ❌ NO tiene fotos reales (ERROR!)`);
          sinFotosReales++;
        }
      }

      console.log('\n' + '='.repeat(80));
      console.log(`🔴 VEHÍCULOS SIN FOTOS REALES: ${sinFotosReales}`);
      console.log('='.repeat(80));
    }

  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

investigarUrgente();

