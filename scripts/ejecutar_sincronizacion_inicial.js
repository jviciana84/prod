const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function ejecutarSincronizacion() {
  console.log('='.repeat(70));
  console.log('SINCRONIZACIÓN INICIAL: duc_scraper → nuevas_entradas');
  console.log('='.repeat(70));

  try {
    // Leer lista de vehículos
    if (!fs.existsSync('scripts/vehiculos_a_sincronizar.json')) {
      console.log('\n❌ No se encuentra el archivo vehiculos_a_sincronizar.json');
      console.log('Primero ejecuta: node scripts/aplicar_sincronizacion_duc.js');
      return;
    }

    const vehiculos = JSON.parse(fs.readFileSync('scripts/vehiculos_a_sincronizar.json', 'utf8'));
    
    console.log(`\nVehículos a sincronizar: ${vehiculos.length}`);
    console.log('\nIniciando en 3 segundos...');
    console.log('Presiona Ctrl+C para cancelar');
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n' + '='.repeat(70));
    console.log('SINCRONIZANDO');
    console.log('='.repeat(70));

    let insertados = 0;
    let errores = 0;

    for (const v of vehiculos) {
      try {
        const vehicleType = (v['Modelo']?.toLowerCase() || '').includes('moto') || 
                           (v['Modelo']?.toLowerCase() || '').includes('motorrad')
                           ? 'Moto' 
                           : 'Turismo';

        const { error } = await supabase
          .from('nuevas_entradas')
          .insert({
            license_plate: v['Matrícula'],
            model: v['Modelo'],
            vehicle_type: vehicleType,
            is_received: false,
            purchase_date: new Date().toISOString().split('T')[0],
          });

        if (error) {
          if (!error.message.includes('duplicate key')) {
            console.error(`  ❌ Error con ${v['Matrícula']}:`, error.message);
            errores++;
          }
        } else {
          insertados++;
          if (insertados % 10 === 0) {
            console.log(`  ✅ Sincronizados: ${insertados}/${vehiculos.length}`);
          }
        }

      } catch (err) {
        console.error(`  ❌ Error con ${v['Matrícula']}:`, err.message);
        errores++;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('RESULTADO');
    console.log('='.repeat(70));
    console.log(`\n✅ Insertados en nuevas_entradas: ${insertados}/${vehiculos.length}`);
    console.log(`❌ Errores: ${errores}`);

    if (insertados > 0) {
      console.log('\n🎉 SINCRONIZACIÓN COMPLETADA');
      console.log('✅ Los vehículos ahora aparecen en nuevas_entradas');
      console.log('✅ Con is_received = false (pendientes de recibir)');
      
      // Limpiar archivo temporal
      fs.unlinkSync('scripts/vehiculos_a_sincronizar.json');
      console.log('✅ Archivo temporal eliminado');
    }

    console.log('\n' + '='.repeat(70));
    console.log('PRÓXIMOS PASOS');
    console.log('='.repeat(70));
    console.log('\n1. Verifica en /dashboard/nuevas-entradas que aparecen los vehículos');
    console.log('2. Cuando recibas físicamente un vehículo, márcalo como "Recibido"');
    console.log('3. Automáticamente se creará en stock y fotos');
    console.log('4. A partir de ahora, cada vehículo nuevo en DUC aparecerá');
    console.log('   automáticamente en nuevas_entradas (si el trigger está activo)');
    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

ejecutarSincronizacion();

