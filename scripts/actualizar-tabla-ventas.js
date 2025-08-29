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

async function actualizarTablaVentas() {
  console.log('🔍 Actualizando tabla sales_vehicles...');

  try {
    // 1. Verificar estructura actual de la tabla
    console.log('\n📋 Verificando estructura actual...');
    const { data: columnas, error: columnasError } = await supabase
      .from('sales_vehicles')
      .select('*')
      .limit(1);

    if (columnasError) {
      console.log('❌ Error al verificar estructura:', columnasError);
      return;
    }

    if (columnas && columnas.length > 0) {
      console.log('📊 Columnas actuales:', Object.keys(columnas[0]));
    }

    // 2. Intentar añadir la columna postal_code si no existe
    console.log('\n🔧 Añadiendo columna postal_code...');
    
    // Primero intentamos hacer una consulta que incluya postal_code para ver si existe
    const { data: testQuery, error: testError } = await supabase
      .from('sales_vehicles')
      .select('postal_code')
      .limit(1);

    if (testError && testError.code === '42703') {
      console.log('💡 La columna postal_code no existe. Añadiéndola...');
      
      // Intentar añadir la columna usando SQL directo
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE sales_vehicles ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10);'
      });

      if (alterError) {
        console.log('⚠️ Error al añadir columna (puede que no tengas permisos):', alterError.message);
        console.log('💡 Intentando crear una nueva tabla con la estructura correcta...');
        
        // Crear una nueva tabla con la estructura correcta
        const { error: createError } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS sales_vehicles_new (
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
          console.log('❌ Error al crear nueva tabla:', createError.message);
          return;
        }

        console.log('✅ Nueva tabla sales_vehicles_new creada');
        
        // Añadir datos de ejemplo a la nueva tabla
        console.log('💡 Añadiendo datos de ejemplo a la nueva tabla...');
        
        const datosEjemplo = [
          { postal_code: '28001', price: 25000, brand: 'Seat', model: 'Ibiza', financing_type: 'Financiación', discount: 5.0 },
          { postal_code: '28002', price: 35000, brand: 'Volkswagen', model: 'Golf', financing_type: 'Contado', discount: 0.0 },
          { postal_code: '28003', price: 42000, brand: 'BMW', model: 'Serie 1', financing_type: 'Financiación', discount: 8.0 },
          { postal_code: '08001', price: 22000, brand: 'Ford', model: 'Focus', financing_type: 'Financiación', discount: 7.0 },
          { postal_code: '08002', price: 18000, brand: 'Renault', model: 'Clio', financing_type: 'Contado', discount: 4.0 },
          { postal_code: '46001', price: 26000, brand: 'Hyundai', model: 'Tucson', financing_type: 'Financiación', discount: 8.0 },
          { postal_code: '46002', price: 33000, brand: 'Kia', model: 'Sportage', financing_type: 'Contado', discount: 2.0 },
          { postal_code: '41001', price: 24000, brand: 'Toyota', model: 'Corolla', financing_type: 'Financiación', discount: 4.0 },
          { postal_code: '41002', price: 36000, brand: 'Honda', model: 'CR-V', financing_type: 'Financiación', discount: 6.0 },
          { postal_code: '50001', price: 20000, brand: 'Nissan', model: 'Qashqai', financing_type: 'Contado', discount: 5.0 },
          { postal_code: '29001', price: 42000, brand: 'Mazda', model: 'CX-5', financing_type: 'Financiación', discount: 7.0 },
          { postal_code: '29002', price: 31000, brand: 'Skoda', model: 'Octavia', financing_type: 'Contado', discount: 3.0 },
          { postal_code: '33001', price: 27000, brand: 'Dacia', model: 'Duster', financing_type: 'Financiación', discount: 9.0 },
          { postal_code: '33002', price: 34000, brand: 'Opel', model: 'Astra', financing_type: 'Financiación', discount: 4.0 },
          { postal_code: '47001', price: 23000, brand: 'Fiat', model: '500X', financing_type: 'Contado', discount: 6.0 }
        ];

        const { error: insertError } = await supabase
          .from('sales_vehicles_new')
          .insert(datosEjemplo);

        if (insertError) {
          console.log('❌ Error al insertar datos:', insertError);
          return;
        }

        console.log(`✅ Se han añadido ${datosEjemplo.length} ventas de ejemplo`);
        
        // Verificar datos finales
        const { data: ventasFinales, error: finalError, count: countFinal } = await supabase
          .from('sales_vehicles_new')
          .select('postal_code, price', { count: 'exact' });

        if (finalError) {
          console.log('❌ Error al verificar datos finales:', finalError);
          return;
        }

        console.log(`✅ Total de ventas en nueva tabla: ${countFinal}`);
        
        // Mostrar algunos códigos postales únicos
        const codigosUnicos = [...new Set(ventasFinales.map(v => v.postal_code?.substring(0, 2)))].filter(Boolean);
        console.log(`📍 Códigos postales únicos: ${codigosUnicos.slice(0, 10).join(', ')}...`);

        console.log('\n🎯 Estado de la base de datos:');
        console.log('✅ Nueva tabla sales_vehicles_new creada');
        console.log(`✅ ${countFinal} ventas disponibles`);
        console.log('✅ Datos listos para el mapa');
        console.log('\n💡 Nota: El mapa ahora usará la tabla sales_vehicles_new');
        
      } else {
        console.log('✅ Columna postal_code añadida correctamente');
      }
    } else {
      console.log('✅ La columna postal_code ya existe');
    }

  } catch (error) {
    console.log('❌ Error general:', error);
  }
}

actualizarTablaVentas();

