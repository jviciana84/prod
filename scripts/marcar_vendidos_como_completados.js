/**
 * Marcar vehículos vendidos como completados en fotos
 * REGLA: Si está vendido, NO puede estar pendiente
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

async function marcarVendidosCompletados(ejecutar = false) {
  console.log('\n🔧 MARCAR VENDIDOS COMO COMPLETADOS\n');
  console.log('='.repeat(80));

  try {
    // 1. Obtener vendidos pendientes
    const { data: vendidos, error: error1 } = await supabase
      .from('sales_vehicles')
      .select('license_plate, model, sale_date');

    if (error1) throw error1;

    const vendidosPendientes = [];

    for (const vendido of vendidos) {
      const { data: foto, error: error2 } = await supabase
        .from('fotos')
        .select('id, license_plate, model, photos_completed')
        .eq('license_plate', vendido.license_plate)
        .eq('photos_completed', false)
        .single();

      if (error2 && error2.code !== 'PGRST116') continue;
      
      if (foto) {
        vendidosPendientes.push({
          id: foto.id,
          license_plate: vendido.license_plate,
          model: vendido.model,
          sale_date: vendido.sale_date
        });
      }
    }

    console.log(`\n🔍 Vehículos vendidos pendientes de fotos: ${vendidosPendientes.length}`);
    
    if (vendidosPendientes.length === 0) {
      console.log('\n✅ No hay vehículos vendidos pendientes de fotos');
      console.log('='.repeat(80));
      return;
    }

    console.log('\nListado:');
    vendidosPendientes.forEach((v, i) => {
      const fecha = v.sale_date 
        ? new Date(v.sale_date).toLocaleDateString('es-ES')
        : 'N/A';
      console.log(`  ${i + 1}. ${v.license_plate} - ${v.model} [Vendido: ${fecha}]`);
    });

    if (ejecutar) {
      console.log('\n' + '='.repeat(80));
      console.log('🔄 MARCANDO COMO COMPLETADOS...');
      console.log('-'.repeat(80));

      let actualizados = 0;
      let errores = 0;

      for (const vehiculo of vendidosPendientes) {
        const { error: updateError } = await supabase
          .from('fotos')
          .update({
            photos_completed: true,
            photos_completed_date: new Date().toISOString(),
            estado_pintura: 'vendido'
          })
          .eq('id', vehiculo.id);

        if (updateError) {
          console.log(`❌ Error: ${vehiculo.license_plate}`);
          errores++;
        } else {
          console.log(`✅ ${vehiculo.license_plate} marcado como completado`);
          actualizados++;
        }
      }

      console.log('\n' + '='.repeat(80));
      console.log('📊 RESUMEN:');
      console.log('-'.repeat(80));
      console.log(`✅ Actualizados: ${actualizados}`);
      console.log(`❌ Errores: ${errores}`);
      console.log('='.repeat(80));
    } else {
      console.log('\n' + '='.repeat(80));
      console.log('⚠️  MODO SIMULACIÓN - NO SE REALIZARON CAMBIOS');
      console.log('='.repeat(80));
      console.log('\nPara ejecutar los cambios:');
      console.log('node scripts/marcar_vendidos_como_completados.js --ejecutar');
      console.log('='.repeat(80));
    }

  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

const ejecutar = process.argv.includes('--ejecutar');

if (ejecutar) {
  console.log('⚠️  MODO EJECUCIÓN');
} else {
  console.log('ℹ️  MODO SIMULACIÓN');
}

marcarVendidosCompletados(ejecutar);


