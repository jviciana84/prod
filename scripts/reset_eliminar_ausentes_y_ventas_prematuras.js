require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'OK' : 'FALTA');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'OK' : 'FALTA');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function eliminarDatosReset() {
  console.log('🔄 RESET: Eliminando ventas prematuras y vehículos ausentes...\n');

  try {
    // 1. Obtener matrículas del DUC (activas)
    console.log('📋 Paso 1: Obteniendo matrículas activas en DUC...');
    const { data: ducData, error: ducError } = await supabase
      .from('duc_scraper')
      .select('"Matrícula"');

    if (ducError) throw ducError;

    const ducMatriculas = new Set(
      (ducData || [])
        .map(v => v['Matrícula']?.toUpperCase().trim())
        .filter(Boolean)
    );
    console.log(`✅ Matrículas en DUC: ${ducMatriculas.size}`);

    // 2. Obtener matrículas vendidas
    console.log('\n📋 Paso 2: Obteniendo matrículas vendidas...');
    const { data: salesData, error: salesError } = await supabase
      .from('sales_vehicles')
      .select('license_plate');

    if (salesError) throw salesError;

    const salesMatriculas = new Set(
      (salesData || [])
        .map(v => v.license_plate?.toUpperCase().trim())
        .filter(Boolean)
    );
    console.log(`✅ Matrículas vendidas: ${salesMatriculas.size}`);

    // 3. Obtener todo el stock
    console.log('\n📋 Paso 3: Obteniendo stock completo...');
    const { data: stockData, error: stockError } = await supabase
      .from('stock')
      .select('id, license_plate');

    if (stockError) throw stockError;

    console.log(`✅ Total en stock: ${stockData?.length || 0}`);

    // 4. Identificar ausentes (no en DUC ni vendidos)
    const ausentes = (stockData || []).filter(vehicle => {
      const matricula = vehicle.license_plate?.toUpperCase().trim();
      if (!matricula) return false;
      
      const enDuc = ducMatriculas.has(matricula);
      const vendido = salesMatriculas.has(matricula);
      
      return !enDuc && !vendido; // Ausente = no está en DUC y no está vendido
    });

    console.log(`\n🚫 Vehículos ausentes encontrados: ${ausentes.length}`);

    if (ausentes.length > 0) {
      console.log('\n📋 Lista de vehículos ausentes a eliminar:');
      ausentes.forEach((v, i) => {
        console.log(`${i + 1}. ${v.license_plate} (ID: ${v.id})`);
      });

      // 5. Eliminar de stock_history primero (por FK constraint)
      console.log('\n🗑️  Paso 4: Eliminando historial de vehículos ausentes...');
      const idsAusentes = ausentes.map(v => v.id);
      
      const { error: deleteHistoryError } = await supabase
        .from('stock_history')
        .delete()
        .in('stock_id', idsAusentes);

      if (deleteHistoryError) {
        console.log('⚠️  Error al eliminar historial:', deleteHistoryError.message);
      } else {
        console.log(`✅ Eliminado historial de stock`);
      }

      // 6. Ahora sí eliminar de stock
      console.log('\n🗑️  Paso 5: Eliminando vehículos ausentes de stock...');
      
      const { error: deleteStockError } = await supabase
        .from('stock')
        .delete()
        .in('id', idsAusentes);

      if (deleteStockError) throw deleteStockError;
      console.log(`✅ Eliminados ${ausentes.length} vehículos ausentes de stock`);

      // 7. Eliminar de fotos también
      console.log('\n🗑️  Paso 6: Eliminando ausentes de tabla fotos...');
      const matriculasAusentes = ausentes.map(v => v.license_plate);
      
      const { error: deleteFotosError } = await supabase
        .from('fotos')
        .delete()
        .in('license_plate', matriculasAusentes);

      if (deleteFotosError) {
        console.log('⚠️  Error al eliminar de fotos (puede que no existan):', deleteFotosError.message);
      } else {
        console.log(`✅ Eliminados de tabla fotos`);
      }
    } else {
      console.log('✅ No hay vehículos ausentes para eliminar');
    }

    // 8. Buscar y eliminar registros con columnas de ventas prematuras (si existen)
    console.log('\n📋 Paso 7: Buscando ventas marcadas como prematuras...');
    
    // Intentar buscar (puede que las columnas no existan)
    const { data: prematureSales, error: prematureError } = await supabase
      .from('sales_vehicles')
      .select('id, license_plate, is_premature_sale')
      .eq('is_premature_sale', true);

    if (prematureError) {
      if (prematureError.message.includes('column') || prematureError.message.includes('does not exist')) {
        console.log('ℹ️  Columna is_premature_sale no existe (normal, no hay datos que limpiar)');
      } else {
        console.log('⚠️  Error al buscar ventas prematuras:', prematureError.message);
      }
    } else if (prematureSales && prematureSales.length > 0) {
      console.log(`🚫 Ventas prematuras encontradas: ${prematureSales.length}`);
      prematureSales.forEach((v, i) => {
        console.log(`${i + 1}. ${v.license_plate}`);
      });

      // Eliminar marca de prematura (poner en false)
      const { error: updateError } = await supabase
        .from('sales_vehicles')
        .update({ is_premature_sale: false })
        .eq('is_premature_sale', true);

      if (updateError) throw updateError;
      console.log(`✅ Desmarcadas ${prematureSales.length} ventas prematuras`);
    } else {
      console.log('✅ No hay ventas marcadas como prematuras');
    }

    console.log('\n✅ ¡RESET COMPLETADO!');
    console.log('\n📊 Resumen:');
    console.log(`   - Vehículos ausentes eliminados: ${ausentes.length}`);
    console.log(`   - Stock limpio: Solo vehículos en DUC o vendidos`);
    console.log(`   - Ventas prematuras: Desmarcadas (si existían)`);

  } catch (error) {
    console.error('\n❌ Error durante el reset:', error);
    throw error;
  }
}

// Ejecutar
eliminarDatosReset()
  .then(() => {
    console.log('\n✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });

