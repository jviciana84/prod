require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function aplicarNuevoSistemaStock() {
  console.log('🚀 APLICANDO NUEVO SISTEMA DE STOCK');
  console.log('='.repeat(70));
  console.log('\n📋 Nueva lógica:');
  console.log('  - Stock = SOLO vehículos en DUC');
  console.log('  - Entrega con fecha → Elimina de stock');
  console.log('  - Disponibilidad desde DUC."Disponibilidad"');
  console.log('='.repeat(70));

  try {
    // 1. Aplicar trigger de eliminación al entregar
    console.log('\n📝 Paso 1: Aplicando trigger delete_stock_on_delivery...');
    const triggerDelivery = fs.readFileSync(
      path.join(__dirname, '../triggers/delete_stock_on_delivery.sql'),
      'utf8'
    );
    
    const { error: triggerDeliveryError } = await supabase.rpc('exec_sql', { 
      sql_query: triggerDelivery 
    });
    
    if (triggerDeliveryError) {
      // Intentar ejecutar directamente
      console.log('⚠️  Ejecutando SQL directamente...');
      // Para ejecutar esto, necesitarías acceso directo a PostgreSQL
      console.log('ℹ️  SQL guardado en: triggers/delete_stock_on_delivery.sql');
      console.log('   Ejecuta manualmente en Supabase SQL Editor');
    } else {
      console.log('✅ Trigger delete_stock_on_delivery aplicado');
    }

    // 2. Aplicar trigger de sincronización DUC → stock
    console.log('\n📝 Paso 2: Aplicando trigger sync_duc_to_stock...');
    const triggerSync = fs.readFileSync(
      path.join(__dirname, '../triggers/sync_duc_to_stock_complete.sql'),
      'utf8'
    );
    
    console.log('ℹ️  SQL guardado en: triggers/sync_duc_to_stock_complete.sql');
    console.log('   Ejecuta manualmente en Supabase SQL Editor');

    // 3. LIMPIEZA INICIAL: Eliminar stock que NO está en DUC
    console.log('\n🗑️  Paso 3: Limpiando stock (solo quedará lo de DUC)...');
    
    // Obtener matrículas de DUC
    const { data: ducData, error: ducError } = await supabase
      .from('duc_scraper')
      .select('"Matrícula"')
      .not('"Matrícula"', 'is', null);

    if (ducError) throw ducError;

    const ducMatriculas = new Set(
      (ducData || []).map(v => v['Matrícula']?.toUpperCase().trim()).filter(Boolean)
    );
    console.log(`   Matrículas en DUC: ${ducMatriculas.size}`);

    // Obtener matrículas vendidas (las mantenemos)
    const { data: salesData, error: salesError } = await supabase
      .from('sales_vehicles')
      .select('license_plate');

    if (salesError) throw salesError;

    const salesMatriculas = new Set(
      (salesData || []).map(v => v.license_plate?.toUpperCase().trim()).filter(Boolean)
    );
    console.log(`   Matrículas vendidas (mantener): ${salesMatriculas.size}`);

    // Obtener todo el stock actual
    const { data: stockData, error: stockError } = await supabase
      .from('stock')
      .select('id, license_plate');

    if (stockError) throw stockError;
    console.log(`   Stock actual: ${stockData?.length || 0}`);

    // Identificar qué eliminar
    const aEliminar = (stockData || []).filter(v => {
      const matricula = v.license_plate?.toUpperCase().trim();
      if (!matricula) return true; // Eliminar sin matrícula
      
      const enDuc = ducMatriculas.has(matricula);
      const vendido = salesMatriculas.has(matricula);
      
      // Eliminar si NO está en DUC (aunque esté vendido)
      return !enDuc;
    });

    console.log(`\n🚫 Registros a eliminar: ${aEliminar.length}`);

    if (aEliminar.length > 0) {
      console.log('\nPrimeros 10 a eliminar:');
      aEliminar.slice(0, 10).forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.license_plate}`);
      });

      // Eliminar historial primero
      const idsEliminar = aEliminar.map(v => v.id);
      
      console.log('\n🗑️  Eliminando historial...');
      const { error: histError } = await supabase
        .from('stock_history')
        .delete()
        .in('stock_id', idsEliminar);

      if (histError) {
        console.log('⚠️  Error eliminando historial:', histError.message);
      }

      console.log('🗑️  Eliminando de stock...');
      const { error: delError } = await supabase
        .from('stock')
        .delete()
        .in('id', idsEliminar);

      if (delError) throw delError;
      console.log(`✅ Eliminados ${aEliminar.length} registros`);
    }

    // 4. SINCRONIZACIÓN INICIAL desde DUC
    console.log('\n🔄 Paso 4: Sincronizando desde DUC...');
    
    // Obtener datos completos de DUC
    const { data: ducComplete, error: ducCompleteError } = await supabase
      .from('duc_scraper')
      .select('"Matrícula", "Modelo", "Marca", "Disponibilidad"')
      .not('"Matrícula"', 'is', null);

    if (ducCompleteError) throw ducCompleteError;

    let creados = 0;
    let actualizados = 0;

    for (const ducVehicle of ducComplete || []) {
      const matricula = ducVehicle['Matrícula'];
      
      // Verificar si existe en stock
      const { data: existing } = await supabase
        .from('stock')
        .select('id')
        .eq('license_plate', matricula)
        .single();

      const isAvailable = ducVehicle['Disponibilidad'] === 'DISPONIBLE';

      if (!existing) {
        // Crear nuevo
        const { error: insertError } = await supabase
          .from('stock')
          .insert({
            license_plate: matricula,
            model: ducVehicle['Modelo'],
            brand: ducVehicle['Marca'],
            reception_date: new Date().toISOString(),
            is_available: isAvailable
          });

        if (!insertError) creados++;
      } else {
        // Actualizar disponibilidad
        const { error: updateError } = await supabase
          .from('stock')
          .update({
            is_available: isAvailable,
            updated_at: new Date().toISOString()
          })
          .eq('license_plate', matricula);

        if (!updateError) actualizados++;
      }
    }

    console.log(`✅ Sincronización completada:`);
    console.log(`   - Creados: ${creados}`);
    console.log(`   - Actualizados: ${actualizados}`);

    // 5. RESUMEN FINAL
    console.log('\n' + '='.repeat(70));
    console.log('✅ NUEVO SISTEMA APLICADO');
    console.log('='.repeat(70));
    
    const { data: finalStock } = await supabase
      .from('stock')
      .select('license_plate, is_available');

    const disponibles = finalStock?.filter(v => v.is_available === true).length || 0;
    const noDisponibles = finalStock?.filter(v => v.is_available === false).length || 0;

    console.log('\n📊 Stock final:');
    console.log(`   TOTAL: ${finalStock?.length || 0}`);
    console.log(`   DISPONIBLE: ${disponibles}`);
    console.log(`   NO DISPONIBLE: ${noDisponibles}`);
    console.log(`   (RESERVADO se calcula desde sales_vehicles sin entrega)`);

    console.log('\n📝 IMPORTANTE:');
    console.log('   1. Ejecuta los SQL de triggers/ manualmente en Supabase SQL Editor');
    console.log('   2. Actualiza stock-table.tsx con nuevas pestañas');
    console.log('   3. El sistema estará completamente automático');

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  }
}

// Ejecutar
aplicarNuevoSistemaStock()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });

