const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function compararDucVsStock() {
  console.log('='.repeat(70));
  console.log('COMPARACIÓN: DUC vs STOCK');
  console.log('='.repeat(70));

  try {
    // 1. Obtener matrículas de DUC
    console.log('\n1. Obteniendo datos de DUC...');
    const { data: ducData } = await supabase
      .from('duc_scraper')
      .select('"Matrícula", "Modelo"')
      .not('"Matrícula"', 'is', null);

    const ducMatriculas = new Map();
    (ducData || []).forEach(v => {
      const mat = v['Matrícula']?.toUpperCase().trim();
      if (mat) {
        ducMatriculas.set(mat, v['Modelo']);
      }
    });
    
    console.log(`   Total en DUC: ${ducMatriculas.size}`);

    // 2. Obtener stock
    console.log('\n2. Obteniendo datos de STOCK...');
    const { data: stockData } = await supabase
      .from('stock')
      .select('license_plate, model, is_sold');

    console.log(`   Total en STOCK: ${stockData?.length || 0}`);
    
    const stockDisponible = (stockData || []).filter(v => !v.is_sold);
    console.log(`   Stock disponible (is_sold=false): ${stockDisponible.length}`);

    // 3. Comparar
    console.log('\n' + '='.repeat(70));
    console.log('ANÁLISIS DE DIFERENCIAS');
    console.log('='.repeat(70));

    // Vehículos en DUC que NO están en STOCK
    console.log('\n📋 Vehículos en DUC que NO están en STOCK:');
    let enDucNoEnStock = 0;
    ducMatriculas.forEach((modelo, matricula) => {
      const existeEnStock = stockData?.some(s => 
        s.license_plate?.toUpperCase().trim() === matricula
      );
      
      if (!existeEnStock) {
        console.log(`   - ${matricula} (${modelo})`);
        enDucNoEnStock++;
      }
    });
    
    if (enDucNoEnStock === 0) {
      console.log('   ✅ Ninguno - Todos los de DUC están en stock');
    } else {
      console.log(`\n   Total: ${enDucNoEnStock} vehículos`);
    }

    // Vehículos en DUC que están VENDIDOS en STOCK
    console.log('\n💰 Vehículos en DUC pero VENDIDOS en STOCK (is_sold=true):');
    let enDucPeroVendidos = 0;
    ducMatriculas.forEach((modelo, matricula) => {
      const vehiculo = stockData?.find(s => 
        s.license_plate?.toUpperCase().trim() === matricula
      );
      
      if (vehiculo && vehiculo.is_sold) {
        console.log(`   - ${matricula} (${vehiculo.model || 'N/A'})`);
        enDucPeroVendidos++;
      }
    });
    
    if (enDucPeroVendidos === 0) {
      console.log('   ✅ Ninguno - No hay vendidos en DUC');
    } else {
      console.log(`\n   Total: ${enDucPeroVendidos} vehículos`);
    }

    // Vehículos en DUC disponibles en STOCK
    console.log('\n✅ Vehículos en DUC y DISPONIBLES en STOCK:');
    let enDucYDisponibles = 0;
    ducMatriculas.forEach((modelo, matricula) => {
      const vehiculo = stockData?.find(s => 
        s.license_plate?.toUpperCase().trim() === matricula
      );
      
      if (vehiculo && !vehiculo.is_sold) {
        enDucYDisponibles++;
      }
    });
    console.log(`   Total: ${enDucYDisponibles} vehículos`);

    // Resumen
    console.log('\n' + '='.repeat(70));
    console.log('RESUMEN');
    console.log('='.repeat(70));
    console.log(`\n📊 Total en DUC: ${ducMatriculas.size}`);
    console.log(`📊 Total en STOCK: ${stockData?.length || 0}`);
    console.log(`📊 Stock disponible: ${stockDisponible.length}`);
    console.log('');
    console.log(`✅ En DUC y disponibles en stock: ${enDucYDisponibles}`);
    console.log(`💰 En DUC pero vendidos en stock: ${enDucPeroVendidos}`);
    console.log(`❌ En DUC pero NO en stock: ${enDucNoEnStock}`);
    console.log('');
    console.log(`📌 Dashboard debería mostrar: ${enDucYDisponibles} vehículos`);
    
    if (enDucYDisponibles !== ducMatriculas.size) {
      console.log(`\n⚠️  DIFERENCIA: ${ducMatriculas.size - enDucYDisponibles} vehículos`);
      console.log(`   Razón: ${enDucPeroVendidos} vendidos + ${enDucNoEnStock} no en stock`);
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Detalles:', error);
  }
}

compararDucVsStock();

