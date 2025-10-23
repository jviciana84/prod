require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verificarStockActual() {
  console.log('🔍 VERIFICANDO STOCK ACTUAL');
  console.log('='.repeat(70));

  try {
    // Obtener todo el stock
    const { data: stockData, error } = await supabase
      .from('stock')
      .select('license_plate, model, vehicle_type, is_available')

    if (error) throw error;

    console.log(`\n📊 TOTAL EN STOCK: ${stockData.length}`);

    // Filtrar disponibles
    const disponibles = stockData.filter(v => v.is_available === true);
    const noDisponibles = stockData.filter(v => v.is_available === false);

    console.log(`✅ DISPONIBLES (is_available = true): ${disponibles.length}`);
    console.log(`❌ NO DISPONIBLES (is_available = false): ${noDisponibles.length}`);

    // Analizar BMW y MINI en DISPONIBLES (solo por modelo)
    const bmw = disponibles.filter(v => {
      const model = v.model?.toLowerCase() || "";
      
      const isBMW = model.startsWith("i") || 
                    model.startsWith("x") || 
                    model.startsWith("m") ||
                    model.includes("serie") ||
                    model.includes("series") ||
                    model.includes("xdrive") ||
                    model.includes("edrive") ||
                    model.includes("bmw");
      
      const isMINI = model.includes("mini");
      const isMotorrad = model.includes("motorrad");
      
      return isBMW && !isMINI && !isMotorrad;
    });

    const mini = disponibles.filter(v => {
      const model = v.model?.toLowerCase() || "";
      return model.includes("mini");
    });

    const otros = disponibles.filter(v => {
      const model = v.model?.toLowerCase() || "";
      
      const isBMW = model.startsWith("i") || 
                    model.startsWith("x") || 
                    model.startsWith("m") ||
                    model.includes("serie") ||
                    model.includes("series") ||
                    model.includes("xdrive") ||
                    model.includes("edrive") ||
                    model.includes("bmw");
      
      const isMINI = model.includes("mini");
      
      return !isBMW && !isMINI;
    });

    console.log('\n📊 DESGLOSE DE DISPONIBLES:');
    console.log(`   BMW: ${bmw.length}`);
    console.log(`   MINI: ${mini.length}`);
    console.log(`   OTROS: ${otros.length}`);
    console.log(`   TOTAL: ${bmw.length + mini.length + otros.length}`);

    if (otros.length > 0) {
      console.log('\n⚠️  VEHÍCULOS "OTROS" (no BMW ni MINI):');
      otros.forEach((v, i) => {
        console.log(`   ${i + 1}. ${v.license_plate} - ${v.model}`);
      });
    }

    console.log('\n📋 TODOS LOS BMW DISPONIBLES:');
    bmw.forEach((v, i) => {
      console.log(`   ${i + 1}. ${v.license_plate} - ${v.model}`);
    });

    console.log('\n📋 TODOS LOS MINI DISPONIBLES:');
    mini.forEach((v, i) => {
      console.log(`   ${i + 1}. ${v.license_plate} - ${v.model}`);
    });

    // Verificación: BMW + MINI debe ser = disponibles
    if (bmw.length + mini.length !== disponibles.length) {
      console.log('\n⚠️  ADVERTENCIA: BMW + MINI + OTROS no cuadra con total disponibles');
      console.log(`   BMW (${bmw.length}) + MINI (${mini.length}) + OTROS (${otros.length}) = ${bmw.length + mini.length + otros.length}`);
      console.log(`   Pero disponibles = ${disponibles.length}`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  }
}

// Ejecutar
verificarStockActual()
  .then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });

