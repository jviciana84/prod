const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function eliminarAusentes() {
  console.log('='.repeat(70));
  console.log('ELIMINAR VEHICULOS AUSENTES');
  console.log('='.repeat(70));

  try {
    // 1. Obtener matrículas del CSV DUC
    console.log('\n1. Obteniendo matrículas del CSV DUC...');
    const { data: ducData } = await supabase
      .from('duc_scraper')
      .select('"Matrícula"')
      .not('"Matrícula"', 'is', null);

    const ducMatriculas = new Set(
      (ducData || [])
        .map((v) => v['Matrícula']?.toUpperCase().trim())
        .filter(Boolean)
    );
    console.log(`   Matrículas en DUC: ${ducMatriculas.size}`);

    // 2. Obtener matrículas vendidas
    console.log('\n2. Obteniendo matrículas vendidas...');
    const { data: salesData } = await supabase
      .from('sales_vehicles')
      .select('license_plate');

    const salesMatriculas = new Set(
      (salesData || [])
        .map((v) => v.license_plate?.toUpperCase().trim())
        .filter(Boolean)
    );
    console.log(`   Matrículas vendidas: ${salesMatriculas.size}`);

    // 3. Obtener matrículas clasificadas
    console.log('\n3. Obteniendo vehículos ya clasificados...');
    const { data: classified } = await supabase
      .from('vehicle_sale_status')
      .select('vehicle_id, source_table, license_plate');

    const classifiedSet = new Set(
      (classified || []).map(v => `stock_${v.vehicle_id}`)
    );
    console.log(`   Vehículos clasificados: ${classifiedSet.size}`);

    // 4. Obtener todo el stock
    console.log('\n4. Obteniendo stock completo...');
    const { data: stock } = await supabase
      .from('stock')
      .select('id, license_plate, model, is_sold, created_at');

    console.log(`   Total en stock: ${stock?.length || 0}`);

    // 5. Identificar ausentes
    const ausentes = (stock || []).filter((v) => {
      const matricula = v.license_plate?.toUpperCase().trim();
      const key = `stock_${v.id}`;
      
      if (!matricula) return false;
      
      const enDuc = ducMatriculas.has(matricula);
      const enVentas = salesMatriculas.has(matricula);
      const clasificado = classifiedSet.has(key);
      
      // Es ausente si NO está en DUC, NO está vendido, Y NO está clasificado
      return !enDuc && !enVentas && !clasificado;
    });

    console.log('\n' + '='.repeat(70));
    console.log('VEHICULOS AUSENTES DETECTADOS');
    console.log('='.repeat(70));
    console.log(`\nTotal ausentes: ${ausentes.length}`);

    if (ausentes.length === 0) {
      console.log('\n✅ No hay vehículos ausentes para eliminar');
      return;
    }

    // Mostrar primeros 20
    console.log('\nPrimeros 20 vehículos a eliminar:');
    ausentes.slice(0, 20).forEach((v, i) => {
      console.log(`  ${(i + 1).toString().padStart(3)}. ${v.license_plate} - ${v.model || 'N/A'}`);
    });

    if (ausentes.length > 20) {
      console.log(`\n  ... y ${ausentes.length - 20} más`);
    }

    // Confirmación
    console.log('\n' + '='.repeat(70));
    console.log('⚠️  ADVERTENCIA');
    console.log('='.repeat(70));
    console.log('\nEsta operación eliminará PERMANENTEMENTE estos vehículos:');
    console.log(`  - ${ausentes.length} registros de la tabla STOCK`);
    console.log(`  - Registros relacionados en FOTOS (si existen)`);
    console.log(`  - NO se puede deshacer`);
    
    console.log('\nEsperando confirmación...');
    console.log('Para continuar, ejecuta: node scripts/ejecutar_eliminacion_ausentes.js');

    // Guardar lista para el script de confirmación
    const fs = require('fs');
    fs.writeFileSync(
      'scripts/ausentes_a_eliminar.json',
      JSON.stringify({
        total: ausentes.length,
        fecha: new Date().toISOString(),
        ausentes: ausentes.map(v => ({
          id: v.id,
          license_plate: v.license_plate,
          model: v.model,
          created_at: v.created_at
        }))
      }, null, 2)
    );

    console.log('\n✅ Lista guardada en: scripts/ausentes_a_eliminar.json');
    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Detalles:', error);
  }
}

eliminarAusentes();

