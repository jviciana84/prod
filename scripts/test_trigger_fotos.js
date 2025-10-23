const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTrigger() {
  console.log('='.repeat(70));
  console.log('TEST: Trigger de Fotos Completadas → Backdating -2 días');
  console.log('='.repeat(70));

  const testPlate = 'TEST' + Date.now();

  try {
    console.log('\n1. Creando vehículo de prueba SIN fotos en DUC...');
    await supabase.from('duc_scraper').insert({
      'ID Anuncio': testPlate,
      'Matrícula': testPlate,
      'Modelo': 'Test Backdating'
    });
    
    await new Promise(r => setTimeout(r, 1500));
    
    const { data: antes } = await supabase
      .from('stock')
      .select('physical_reception_date, is_available, auto_marked_received')
      .eq('license_plate', testPlate)
      .single();

    console.log('   ✅ Creado en stock:');
    console.log(`      - fecha: ${antes.physical_reception_date || 'NULL (correcto)'}`);
    console.log(`      - disponible: ${antes.is_available} (esperado: false)`);

    console.log('\n2. Marcando fotos como COMPLETADAS...');
    const { error: updateError } = await supabase
      .from('fotos')
      .update({ photos_completed: true })
      .eq('license_plate', testPlate);

    if (updateError) {
      console.log('   ❌ Error:', updateError.message);
      throw updateError;
    }

    await new Promise(r => setTimeout(r, 2000));

    console.log('\n3. Verificando resultados del trigger...\n');

    // Stock
    const { data: stock } = await supabase
      .from('stock')
      .select('physical_reception_date, is_available, auto_marked_received')
      .eq('license_plate', testPlate)
      .single();

    const diasStock = stock.physical_reception_date 
      ? Math.floor((new Date() - new Date(stock.physical_reception_date)) / (1000*60*60*24))
      : null;

    console.log('   📦 STOCK:');
    console.log(`      - physical_reception_date: ${stock.physical_reception_date || 'NULL'}`);
    console.log(`      - Días calculados: ${diasStock} (esperado: 2)`);
    console.log(`      - is_available: ${stock.is_available} (esperado: true)`);
    console.log(`      - auto_marked_received: ${stock.auto_marked_received} (esperado: true)`);
    console.log(`      - Estado: ${stock.physical_reception_date && diasStock === 2 ? '✅ CORRECTO' : '❌ ERROR'}`);

    // Fotos
    const { data: fotos } = await supabase
      .from('fotos')
      .select('physical_reception_date, is_available, auto_completed, estado_pintura, photos_completed')
      .eq('license_plate', testPlate)
      .single();

    console.log('\n   📸 FOTOS:');
    console.log(`      - physical_reception_date: ${fotos.physical_reception_date || 'NULL'}`);
    console.log(`      - photos_completed: ${fotos.photos_completed} (esperado: true)`);
    console.log(`      - is_available: ${fotos.is_available} (esperado: true)`);
    console.log(`      - auto_completed: ${fotos.auto_completed} (esperado: true)`);
    console.log(`      - estado_pintura: ${fotos.estado_pintura} (esperado: completado)`);
    console.log(`      - Estado: ${fotos.auto_completed && fotos.estado_pintura === 'completado' ? '✅ CORRECTO' : '❌ ERROR'}`);

    // Nuevas entradas
    const { data: nuevas } = await supabase
      .from('nuevas_entradas')
      .select('is_received, reception_date')
      .eq('license_plate', testPlate)
      .single();

    console.log('\n   📋 NUEVAS_ENTRADAS:');
    console.log(`      - is_received: ${nuevas.is_received} (esperado: true)`);
    console.log(`      - reception_date: ${nuevas.reception_date || 'NULL'}`);
    console.log(`      - Estado: ${nuevas.is_received ? '✅ CORRECTO' : '❌ ERROR'}`);

    // Limpieza
    console.log('\n4. Limpiando datos de prueba...');
    await supabase.from('fotos').delete().eq('license_plate', testPlate);
    await supabase.from('stock').delete().eq('license_plate', testPlate);
    await supabase.from('nuevas_entradas').delete().eq('license_plate', testPlate);
    await supabase.from('duc_scraper').delete().eq('"ID Anuncio"', testPlate);
    console.log('   ✅ Limpieza completada');

    console.log('\n' + '='.repeat(70));
    if (diasStock === 2 && stock.auto_marked_received && fotos.auto_completed && nuevas.is_received) {
      console.log('🎉 TRIGGER FUNCIONANDO PERFECTAMENTE');
      console.log('✅ Backdating de 2 días aplicado correctamente');
      console.log('✅ Stock, fotos y nuevas_entradas sincronizados');
      console.log('\n📊 Próximo paso: Actualizar componentes UI (Fase 3)');
    } else {
      console.log('⚠️  Hay algunos problemas - revisar triggers');
    }
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

testTrigger();

