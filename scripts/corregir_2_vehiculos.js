/**
 * Corregir 6272HRK y 4462JKS - marcados manualmente por error
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

async function corregirVehiculos() {
  console.log('\n🔧 CORRIGIENDO VEHÍCULOS MARCADOS POR ERROR\n');
  console.log('='.repeat(80));

  try {
    const vehiculos = ['6272HRK', '4462JKS'];
    
    for (const matricula of vehiculos) {
      const { error: updateError } = await supabase
        .from('fotos')
        .update({
          photos_completed: false,
          photos_completed_date: null,
          auto_completed: false
        })
        .eq('license_plate', matricula);

      if (updateError) {
        console.log(`❌ Error: ${matricula} - ${updateError.message}`);
      } else {
        console.log(`✅ ${matricula} marcado como PENDIENTE`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ CORREGIDOS: 6272HRK y 4462JKS ahora están PENDIENTES');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

corregirVehiculos();


