const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verificarFlujo() {
  console.log('='.repeat(70));
  console.log('VERIFICACIÓN DEL FLUJO ACTUAL DEL SISTEMA');
  console.log('='.repeat(70));

  try {
    // 1. Verificar triggers activos
    console.log('\n1. VERIFICANDO TRIGGERS ACTIVOS...\n');
    
    const { data: triggers, error: trigError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            trigger_name,
            event_object_table as tabla,
            action_timing as cuando,
            event_manipulation as accion,
            action_statement as funcion
          FROM information_schema.triggers
          WHERE trigger_schema = 'public'
          AND event_object_table IN ('nuevas_entradas', 'duc_scraper', 'sales_vehicles')
          ORDER BY event_object_table, trigger_name;
        `
      });

    if (trigError) {
      console.log('   (No se puede consultar triggers directamente)');
      console.log('   Verificando por funciones conocidas...\n');
    } else if (triggers && triggers.length > 0) {
      triggers.forEach(t => {
        console.log(`   📌 ${t.tabla} → ${t.trigger_name}`);
        console.log(`      ${t.cuando} ${t.accion}`);
        console.log('');
      });
    }

    // 2. Probar flujo nuevas_entradas → stock
    console.log('2. PROBANDO FLUJO: nuevas_entradas → stock + fotos\n');
    
    const testPlate = 'TEST_FLOW_' + Date.now();
    
    console.log(`   Creando vehículo de prueba: ${testPlate}`);
    const { data: newEntry, error: insertError } = await supabase
      .from('nuevas_entradas')
      .insert({
        license_plate: testPlate,
        model: 'Test Model',
        vehicle_type: 'Turismo',
        is_received: false
      })
      .select()
      .single();

    if (insertError) {
      console.log('   ❌ Error creando en nuevas_entradas:', insertError.message);
    } else {
      console.log('   ✅ Creado en nuevas_entradas');
      
      // Esperar un momento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar si está en stock (NO debería estar aún)
      const { data: stockBefore } = await supabase
        .from('stock')
        .select('*')
        .eq('license_plate', testPlate)
        .single();

      if (stockBefore) {
        console.log('   ⚠️  Ya está en stock (no debería)');
      } else {
        console.log('   ✅ NO está en stock (correcto - aún no recibido)');
      }

      // Marcar como recibido
      console.log('\n   Marcando como RECIBIDO (is_received = true)...');
      const { error: updateError } = await supabase
        .from('nuevas_entradas')
        .update({ is_received: true })
        .eq('id', newEntry.id);

      if (updateError) {
        console.log('   ❌ Error marcando como recibido:', updateError.message);
      } else {
        console.log('   ✅ Marcado como recibido');
        
        // Esperar trigger
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verificar si está en stock ahora
        const { data: stockAfter } = await supabase
          .from('stock')
          .select('*')
          .eq('license_plate', testPlate)
          .single();

        if (stockAfter) {
          console.log('   ✅ TRIGGER FUNCIONÓ: Apareció en stock');
        } else {
          console.log('   ❌ TRIGGER NO FUNCIONÓ: NO está en stock');
        }

        // Verificar fotos
        const { data: fotos } = await supabase
          .from('fotos')
          .select('*')
          .eq('license_plate', testPlate)
          .single();

        if (fotos) {
          console.log('   ✅ TRIGGER FUNCIONÓ: Apareció en fotos');
        } else {
          console.log('   ❌ TRIGGER NO FUNCIONÓ: NO está en fotos');
        }
      }

      // Limpiar
      console.log('\n   Limpiando datos de prueba...');
      await supabase.from('fotos').delete().eq('license_plate', testPlate);
      await supabase.from('stock').delete().eq('license_plate', testPlate);
      await supabase.from('nuevas_entradas').delete().eq('id', newEntry.id);
      console.log('   ✅ Limpieza completada');
    }

    // 3. Verificar conexión duc_scraper → nuevas_entradas
    console.log('\n' + '='.repeat(70));
    console.log('3. VERIFICANDO: duc_scraper → nuevas_entradas');
    console.log('='.repeat(70));
    console.log('\n   ❓ ¿Existe trigger automático de duc_scraper a nuevas_entradas?');
    
    const { data: ducTriggers } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('event_object_table', 'duc_scraper');

    if (!ducTriggers || ducTriggers.length === 0) {
      console.log('   ❌ NO - No hay triggers en duc_scraper');
      console.log('   📝 El paso de DUC a nuevas_entradas es MANUAL');
    } else {
      console.log('   ✅ SÍ - Hay triggers activos');
    }

    console.log('\n' + '='.repeat(70));
    console.log('RESUMEN DEL FLUJO ACTUAL');
    console.log('='.repeat(70));
    console.log('\n📊 DUC_SCRAPER (Scraper cada 8h)');
    console.log('   ↓');
    console.log('   ❌ NO HAY CONEXIÓN AUTOMÁTICA');
    console.log('   ↓');
    console.log('   ✋ MANUAL - Usuario debe agregar a nuevas_entradas');
    console.log('   ↓');
    console.log('📋 NUEVAS_ENTRADAS (is_received = false)');
    console.log('   ↓');
    console.log('   ✋ Usuario marca "Recibido"');
    console.log('   ↓');
    console.log('   ⚡ TRIGGER AUTOMÁTICO (si funciona)');
    console.log('   ↓');
    console.log('📦 STOCK + 📸 FOTOS');
    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

verificarFlujo();

