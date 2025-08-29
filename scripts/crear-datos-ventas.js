const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Error: Variables de entorno no configuradas');
  console.log('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function crearDatosVentas() {
  console.log('🔍 Creando datos de ventas para el mapa...');

  try {
    // 1. Intentar crear la tabla directamente
    console.log('\n📋 Creando tabla sales_vehicles...');
    
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS sales_vehicles (
          id SERIAL PRIMARY KEY,
          postal_code VARCHAR(10),
          price DECIMAL(10,2),
          brand VARCHAR(100),
          model VARCHAR(100),
          financing_type VARCHAR(50),
          discount DECIMAL(5,2),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    });

    if (createError) {
      console.log('⚠️ Error al crear tabla (puede que ya exista):', createError.message);
    } else {
      console.log('✅ Tabla sales_vehicles creada o ya existía');
    }

    // 2. Verificar si hay datos existentes
    console.log('\n📊 Verificando datos existentes...');
    const { data: ventasExistentes, error: checkError, count } = await supabase
      .from('sales_vehicles')
      .select('*', { count: 'exact' })
      .limit(1);

    if (checkError) {
      console.log('❌ Error al verificar datos existentes:', checkError);
      return;
    }

    console.log(`📈 Ventas existentes: ${count || 0}`);

    // 3. Si no hay datos, añadir datos de ejemplo
    if (!count || count === 0) {
      console.log('💡 Añadiendo datos de ejemplo...');
      
      // Datos de ejemplo con códigos postales españoles reales
      const datosEjemplo = [
        { postal_code: '28001', price: 25000, brand: 'Seat', model: 'Ibiza', financing_type: 'Financiación', discount: 5.0 },
        { postal_code: '28002', price: 35000, brand: 'Volkswagen', model: 'Golf', financing_type: 'Contado', discount: 0.0 },
        { postal_code: '28003', price: 42000, brand: 'BMW', model: 'Serie 1', financing_type: 'Financiación', discount: 8.0 },
        { postal_code: '28004', price: 38000, brand: 'Audi', model: 'A3', financing_type: 'Financiación', discount: 3.0 },
        { postal_code: '28005', price: 32000, brand: 'Mercedes', model: 'Clase A', financing_type: 'Contado', discount: 2.0 },
        { postal_code: '08001', price: 22000, brand: 'Ford', model: 'Focus', financing_type: 'Financiación', discount: 7.0 },
        { postal_code: '08002', price: 18000, brand: 'Renault', model: 'Clio', financing_type: 'Contado', discount: 4.0 },
        { postal_code: '08003', price: 45000, brand: 'Volvo', model: 'XC40', financing_type: 'Financiación', discount: 6.0 },
        { postal_code: '08004', price: 38000, brand: 'Peugeot', model: '3008', financing_type: 'Financiación', discount: 5.0 },
        { postal_code: '08005', price: 29000, brand: 'Citroën', model: 'C3', financing_type: 'Contado', discount: 3.0 },
        { postal_code: '46001', price: 26000, brand: 'Hyundai', model: 'Tucson', financing_type: 'Financiación', discount: 8.0 },
        { postal_code: '46002', price: 33000, brand: 'Kia', model: 'Sportage', financing_type: 'Contado', discount: 2.0 },
        { postal_code: '46003', price: 24000, brand: 'Toyota', model: 'Corolla', financing_type: 'Financiación', discount: 4.0 },
        { postal_code: '46004', price: 36000, brand: 'Honda', model: 'CR-V', financing_type: 'Financiación', discount: 6.0 },
        { postal_code: '46005', price: 20000, brand: 'Nissan', model: 'Qashqai', financing_type: 'Contado', discount: 5.0 },
        { postal_code: '41001', price: 42000, brand: 'Mazda', model: 'CX-5', financing_type: 'Financiación', discount: 7.0 },
        { postal_code: '41002', price: 31000, brand: 'Skoda', model: 'Octavia', financing_type: 'Contado', discount: 3.0 },
        { postal_code: '41003', price: 27000, brand: 'Dacia', model: 'Duster', financing_type: 'Financiación', discount: 9.0 },
        { postal_code: '41004', price: 34000, brand: 'Opel', model: 'Astra', financing_type: 'Financiación', discount: 4.0 },
        { postal_code: '41005', price: 23000, brand: 'Fiat', model: '500X', financing_type: 'Contado', discount: 6.0 },
        { postal_code: '50001', price: 28000, brand: 'Seat', model: 'Leon', financing_type: 'Financiación', discount: 5.0 },
        { postal_code: '50002', price: 39000, brand: 'Volkswagen', model: 'Passat', financing_type: 'Contado', discount: 1.0 },
        { postal_code: '50003', price: 44000, brand: 'BMW', model: 'Serie 3', financing_type: 'Financiación', discount: 7.0 },
        { postal_code: '50004', price: 41000, brand: 'Audi', model: 'A4', financing_type: 'Financiación', discount: 4.0 },
        { postal_code: '50005', price: 35000, brand: 'Mercedes', model: 'Clase C', financing_type: 'Contado', discount: 3.0 },
        { postal_code: '29001', price: 21000, brand: 'Ford', model: 'Mondeo', financing_type: 'Financiación', discount: 6.0 },
        { postal_code: '29002', price: 17000, brand: 'Renault', model: 'Megane', financing_type: 'Contado', discount: 5.0 },
        { postal_code: '29003', price: 47000, brand: 'Volvo', model: 'XC60', financing_type: 'Financiación', discount: 8.0 },
        { postal_code: '29004', price: 40000, brand: 'Peugeot', model: '508', financing_type: 'Financiación', discount: 6.0 },
        { postal_code: '29005', price: 31000, brand: 'Citroën', model: 'C4', financing_type: 'Contado', discount: 4.0 }
      ];

      const { error: insertError } = await supabase
        .from('sales_vehicles')
        .insert(datosEjemplo);

      if (insertError) {
        console.log('❌ Error al insertar datos de ejemplo:', insertError);
        return;
      }

      console.log(`✅ Se han añadido ${datosEjemplo.length} ventas de ejemplo`);
    } else {
      console.log('✅ Ya hay datos de ventas en la base de datos');
    }

    // 4. Verificar datos finales
    console.log('\n📊 Verificando datos finales...');
    const { data: ventasFinales, error: finalError, count: countFinal } = await supabase
      .from('sales_vehicles')
      .select('postal_code, price', { count: 'exact' });

    if (finalError) {
      console.log('❌ Error al verificar datos finales:', finalError);
      return;
    }

    console.log(`✅ Total de ventas disponibles: ${countFinal}`);
    
    // Mostrar algunos códigos postales únicos
    const codigosUnicos = [...new Set(ventasFinales.map(v => v.postal_code?.substring(0, 2)))].filter(Boolean);
    console.log(`📍 Códigos postales únicos: ${codigosUnicos.slice(0, 10).join(', ')}...`);

    console.log('\n🎯 Estado de la base de datos:');
    console.log('✅ Tabla sales_vehicles lista');
    console.log(`✅ ${countFinal} ventas disponibles`);
    console.log('✅ Datos listos para el mapa');

  } catch (error) {
    console.log('❌ Error general:', error);
  }
}

crearDatosVentas();

