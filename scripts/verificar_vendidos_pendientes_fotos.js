/**
 * Verificar si hay coches vendidos marcados como pendientes de fotos
 * REGLA: Si un coche está vendido, NO puede estar pendiente de fotos
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

async function verificarVendidosPendientes() {
  console.log('\n🔍 VERIFICANDO: Coches vendidos pendientes de fotos\n');
  console.log('='.repeat(80));
  console.log('REGLA: Si un coche está vendido, NO puede estar pendiente de fotos');
  console.log('='.repeat(80));

  try {
    // 1. Obtener vehículos vendidos
    const { data: vendidos, error: error1 } = await supabase
      .from('sales_vehicles')
      .select('license_plate, model, sale_date');

    if (error1) throw error1;

    console.log(`\n📊 Total vehículos en sales_vehicles: ${vendidos.length}`);

    // 2. Verificar cuáles están pendientes en fotos
    const vendidosPendientesFotos = [];

    for (const vendido of vendidos) {
      const { data: foto, error: error2 } = await supabase
        .from('fotos')
        .select('id, license_plate, model, photos_completed, estado_pintura')
        .eq('license_plate', vendido.license_plate)
        .eq('photos_completed', false) // Pendiente
        .single();

      if (error2 && error2.code !== 'PGRST116') continue;
      
      if (foto) {
        vendidosPendientesFotos.push({
          license_plate: vendido.license_plate,
          model: vendido.model,
          sale_date: vendido.sale_date,
          estado_pintura: foto.estado_pintura
        });
      }
    }

    // 3. Mostrar resultados
    console.log('\n' + '='.repeat(80));
    console.log(`🔴 VEHÍCULOS VENDIDOS PERO PENDIENTES DE FOTOS: ${vendidosPendientesFotos.length}`);
    console.log('='.repeat(80));

    if (vendidosPendientesFotos.length === 0) {
      console.log('\n✅ ¡PERFECTO! No hay coches vendidos pendientes de fotos.');
      console.log('='.repeat(80));
      return;
    }

    console.log('\nListado:');
    console.log('-'.repeat(80));

    vendidosPendientesFotos.forEach((v, i) => {
      const fecha = v.sale_date 
        ? new Date(v.sale_date).toLocaleDateString('es-ES')
        : 'N/A';
      console.log(`${(i + 1).toString().padStart(2, ' ')}. ${v.license_plate.padEnd(10)} - ${v.model.padEnd(40)} [Vendido: ${fecha}]`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('⚠️  ESTOS VEHÍCULOS DEBERÍAN MARCARSE COMO COMPLETADOS');
    console.log('   (O al menos no aparecer en pendientes)');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

verificarVendidosPendientes();

