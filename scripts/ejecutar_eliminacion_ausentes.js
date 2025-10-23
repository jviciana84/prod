const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function ejecutarEliminacion() {
  console.log('='.repeat(70));
  console.log('EJECUTAR ELIMINACIÓN DE AUSENTES');
  console.log('='.repeat(70));

  try {
    // Leer lista de ausentes
    if (!fs.existsSync('scripts/ausentes_a_eliminar.json')) {
      console.log('\n❌ No se encuentra el archivo ausentes_a_eliminar.json');
      console.log('Primero ejecuta: node scripts/eliminar_ausentes.js');
      return;
    }

    const data = JSON.parse(fs.readFileSync('scripts/ausentes_a_eliminar.json', 'utf8'));
    const { ausentes, total, fecha } = data;

    console.log(`\nAusentes a eliminar: ${total}`);
    console.log(`Lista generada: ${new Date(fecha).toLocaleString()}`);

    console.log('\n⚠️  ÚLTIMA ADVERTENCIA ⚠️');
    console.log('Esta acción es IRREVERSIBLE');
    console.log('\nEliminando en 5 segundos...');
    console.log('Presiona Ctrl+C para cancelar');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n' + '='.repeat(70));
    console.log('INICIANDO ELIMINACIÓN');
    console.log('='.repeat(70));

    let deletedStock = 0;
    let deletedFotos = 0;
    let errores = 0;

    for (const ausente of ausentes) {
      try {
        // 1. Eliminar de FOTOS
        const { error: fotoError } = await supabase
          .from('fotos')
          .delete()
          .eq('license_plate', ausente.license_plate);

        if (!fotoError) {
          deletedFotos++;
        }

        // 2. Eliminar de STOCK
        const { error: stockError } = await supabase
          .from('stock')
          .delete()
          .eq('id', ausente.id);

        if (stockError) {
          console.error(`  ❌ Error eliminando ${ausente.license_plate}:`, stockError.message);
          errores++;
        } else {
          deletedStock++;
          if (deletedStock % 10 === 0) {
            console.log(`  ✅ Procesados: ${deletedStock}/${total}`);
          }
        }

      } catch (err) {
        console.error(`  ❌ Error con ${ausente.license_plate}:`, err.message);
        errores++;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('RESULTADO FINAL');
    console.log('='.repeat(70));
    console.log(`\n✅ Eliminados de STOCK: ${deletedStock}/${total}`);
    console.log(`✅ Eliminados de FOTOS: ${deletedFotos}`);
    console.log(`❌ Errores: ${errores}`);

    if (errores === 0 && deletedStock === total) {
      console.log('\n🎉 ELIMINACIÓN COMPLETADA EXITOSAMENTE');
      
      // Limpiar archivo temporal
      fs.unlinkSync('scripts/ausentes_a_eliminar.json');
      console.log('✅ Archivo temporal eliminado');
    } else {
      console.log('\n⚠️  ELIMINACIÓN COMPLETADA CON ERRORES');
      console.log('   Revisa los logs anteriores para detalles');
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ ERROR GENERAL:', error.message);
    console.error('Detalles:', error);
  }
}

ejecutarEliminacion();

