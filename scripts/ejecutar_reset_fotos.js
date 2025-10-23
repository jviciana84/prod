const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function ejecutarReset() {
  console.log('='.repeat(70));
  console.log('EJECUTAR RESET DE FOTOS');
  console.log('='.repeat(70));

  try {
    // Leer datos
    if (!fs.existsSync('scripts/reset_fotos_data.json')) {
      console.log('\n❌ No se encuentra reset_fotos_data.json');
      console.log('Ejecuta primero: node scripts/reset_fotos_pendientes.js');
      return;
    }

    const data = JSON.parse(fs.readFileSync('scripts/reset_fotos_data.json', 'utf8'));
    const { incorrectosCompletados, incorrectosPendientes, faltanEnFotos } = data;

    console.log(`\nAcciones a realizar:`);
    console.log(`  - Resetear a pendiente: ${incorrectosCompletados.length}`);
    console.log(`  - Marcar completados: ${incorrectosPendientes.length}`);
    console.log(`  - Crear pendientes: ${faltanEnFotos.length}`);

    console.log('\nIniciando en 3 segundos...');
    await new Promise(r => setTimeout(r, 3000));

    let resetCount = 0;
    let completadosCount = 0;
    let creadosCount = 0;
    let errores = 0;

    // 1. RESETEAR a pendiente (sin fotos en DUC)
    if (incorrectosCompletados.length > 0) {
      console.log('\n' + '='.repeat(70));
      console.log('1. RESETEANDO A PENDIENTE (sin fotos en DUC)');
      console.log('='.repeat(70));

      for (const v of incorrectosCompletados) {
        try {
          const { error } = await supabase
            .from('fotos')
            .update({
              photos_completed: false,
              estado_pintura: 'pendiente',
              is_available: false,  // No disponible hasta que llegue
              auto_completed: false,
              physical_reception_date: null,  // Resetear fecha
              updated_at: new Date().toISOString()
            })
            .eq('license_plate', v.matricula);

          if (error) {
            console.error(`   ❌ Error con ${v.matricula}:`, error.message);
            errores++;
          } else {
            resetCount++;
            if (resetCount % 5 === 0) {
              console.log(`   ✅ Reseteados: ${resetCount}/${incorrectosCompletados.length}`);
            }
          }

          // También actualizar stock
          await supabase
            .from('stock')
            .update({
              is_available: false,
              physical_reception_date: null,
              auto_marked_received: false
            })
            .eq('license_plate', v.matricula);

          // Y nuevas_entradas
          await supabase
            .from('nuevas_entradas')
            .update({
              is_received: false,
              reception_date: null
            })
            .eq('license_plate', v.matricula);

        } catch (err) {
          console.error(`   ❌ Error con ${v.matricula}:`, err.message);
          errores++;
        }
      }

      console.log(`\n   ✅ Total reseteados: ${resetCount}/${incorrectosCompletados.length}`);
    }

    // 2. MARCAR como completados (con fotos en DUC)
    if (incorrectosPendientes.length > 0) {
      console.log('\n' + '='.repeat(70));
      console.log('2. MARCANDO COMO COMPLETADOS (con fotos en DUC)');
      console.log('='.repeat(70));

      for (const v of incorrectosPendientes) {
        try {
          // Marcar como completado (trigger se encargará del backdating)
          const { error } = await supabase
            .from('fotos')
            .update({
              photos_completed: true
            })
            .eq('license_plate', v.matricula);

          if (error) {
            console.error(`   ❌ Error con ${v.matricula}:`, error.message);
            errores++;
          } else {
            completadosCount++;
          }
        } catch (err) {
          console.error(`   ❌ Error con ${v.matricula}:`, err.message);
          errores++;
        }
      }

      console.log(`\n   ✅ Total completados: ${completadosCount}/${incorrectosPendientes.length}`);
    }

    // 3. CREAR pendientes (no existen en fotos)
    if (faltanEnFotos.length > 0) {
      console.log('\n' + '='.repeat(70));
      console.log('3. CREANDO REGISTROS PENDIENTES');
      console.log('='.repeat(70));

      for (const v of faltanEnFotos) {
        try {
          const { error } = await supabase
            .from('fotos')
            .insert({
              license_plate: v.matricula,
              model: v.modelo,
              estado_pintura: 'pendiente',
              photos_completed: false,
              is_available: false,
              paint_status_date: new Date().toISOString()
            });

          if (error && !error.message.includes('duplicate')) {
            console.error(`   ❌ Error con ${v.matricula}:`, error.message);
            errores++;
          } else {
            creadosCount++;
          }
        } catch (err) {
          console.error(`   ❌ Error con ${v.matricula}:`, err.message);
          errores++;
        }
      }

      console.log(`\n   ✅ Total creados: ${creadosCount}/${faltanEnFotos.length}`);
    }

    // RESUMEN FINAL
    console.log('\n' + '='.repeat(70));
    console.log('RESUMEN FINAL');
    console.log('='.repeat(70));
    console.log(`\n✅ Reseteados a pendiente: ${resetCount}`);
    console.log(`✅ Marcados como completados: ${completadosCount}`);
    console.log(`✅ Creados como pendientes: ${creadosCount}`);
    console.log(`❌ Errores: ${errores}`);

    if (errores === 0) {
      console.log('\n🎉 RESET COMPLETADO EXITOSAMENTE');
      console.log('✅ Tabla fotos sincronizada con duc_scraper');
      console.log('✅ Vehículos sin fotos marcados como pendientes');
      console.log('✅ Vehículos con fotos marcados como completados');
      
      fs.unlinkSync('scripts/reset_fotos_data.json');
      console.log('✅ Archivo temporal eliminado');
    } else {
      console.log('\n⚠️  COMPLETADO CON ERRORES');
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

ejecutarReset();

