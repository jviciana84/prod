const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Error: Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function crearDatosEjemplo() {
  console.log('🔍 Creando datos de ejemplo para el mapa...');

  try {
    // Datos de ejemplo con códigos postales españoles reales
    const datosEjemplo = [
      // Madrid (28)
      { client_postal_code: '28001', price: 25000, brand: 'Seat', model: 'Ibiza', financing_type: 'Financiación', discount: 5.0 },
      { client_postal_code: '28002', price: 35000, brand: 'Volkswagen', model: 'Golf', financing_type: 'Contado', discount: 0.0 },
      { client_postal_code: '28003', price: 42000, brand: 'BMW', model: 'Serie 1', financing_type: 'Financiación', discount: 8.0 },
      { client_postal_code: '28004', price: 38000, brand: 'Audi', model: 'A3', financing_type: 'Financiación', discount: 3.0 },
      { client_postal_code: '28005', price: 32000, brand: 'Mercedes', model: 'Clase A', financing_type: 'Contado', discount: 2.0 },
      { client_postal_code: '28006', price: 28000, brand: 'Ford', model: 'Focus', financing_type: 'Financiación', discount: 7.0 },
      { client_postal_code: '28007', price: 45000, brand: 'Volvo', model: 'XC40', financing_type: 'Financiación', discount: 6.0 },
      { client_postal_code: '28008', price: 22000, brand: 'Renault', model: 'Clio', financing_type: 'Contado', discount: 4.0 },
      
      // Barcelona (08)
      { client_postal_code: '08001', price: 40000, brand: 'BMW', model: 'Serie 1', financing_type: 'Financiación', discount: 8.0 },
      { client_postal_code: '08002', price: 28000, brand: 'Audi', model: 'A3', financing_type: 'Financiación', discount: 3.0 },
      { client_postal_code: '08003', price: 32000, brand: 'Mercedes', model: 'Clase A', financing_type: 'Contado', discount: 2.0 },
      { client_postal_code: '08004', price: 18000, brand: 'Renault', model: 'Clio', financing_type: 'Contado', discount: 4.0 },
      { client_postal_code: '08005', price: 38000, brand: 'Peugeot', model: '3008', financing_type: 'Financiación', discount: 5.0 },
      { client_postal_code: '08006', price: 29000, brand: 'Citroën', model: 'C3', financing_type: 'Contado', discount: 3.0 },
      { client_postal_code: '08007', price: 26000, brand: 'Hyundai', model: 'Tucson', financing_type: 'Financiación', discount: 8.0 },
      { client_postal_code: '08008', price: 33000, brand: 'Kia', model: 'Sportage', financing_type: 'Contado', discount: 2.0 },
      
      // Valencia (46)
      { client_postal_code: '46001', price: 32000, brand: 'Mercedes', model: 'Clase A', financing_type: 'Contado', discount: 2.0 },
      { client_postal_code: '46002', price: 22000, brand: 'Ford', model: 'Focus', financing_type: 'Financiación', discount: 7.0 },
      { client_postal_code: '46003', price: 18000, brand: 'Renault', model: 'Clio', financing_type: 'Contado', discount: 4.0 },
      { client_postal_code: '46004', price: 45000, brand: 'Volvo', model: 'XC40', financing_type: 'Financiación', discount: 6.0 },
      { client_postal_code: '46005', price: 38000, brand: 'Peugeot', model: '3008', financing_type: 'Financiación', discount: 5.0 },
      { client_postal_code: '46006', price: 29000, brand: 'Citroën', model: 'C3', financing_type: 'Contado', discount: 3.0 },
      { client_postal_code: '46007', price: 26000, brand: 'Hyundai', model: 'Tucson', financing_type: 'Financiación', discount: 8.0 },
      { client_postal_code: '46008', price: 33000, brand: 'Kia', model: 'Sportage', financing_type: 'Contado', discount: 2.0 },
      
      // Sevilla (41)
      { client_postal_code: '41001', price: 24000, brand: 'Toyota', model: 'Corolla', financing_type: 'Financiación', discount: 4.0 },
      { client_postal_code: '41002', price: 36000, brand: 'Honda', model: 'CR-V', financing_type: 'Financiación', discount: 6.0 },
      { client_postal_code: '41003', price: 20000, brand: 'Nissan', model: 'Qashqai', financing_type: 'Contado', discount: 5.0 },
      { client_postal_code: '41004', price: 42000, brand: 'Mazda', model: 'CX-5', financing_type: 'Financiación', discount: 7.0 },
      { client_postal_code: '41005', price: 31000, brand: 'Skoda', model: 'Octavia', financing_type: 'Contado', discount: 3.0 },
      { client_postal_code: '41006', price: 27000, brand: 'Dacia', model: 'Duster', financing_type: 'Financiación', discount: 9.0 },
      { client_postal_code: '41007', price: 34000, brand: 'Opel', model: 'Astra', financing_type: 'Financiación', discount: 4.0 },
      { client_postal_code: '41008', price: 23000, brand: 'Fiat', model: '500X', financing_type: 'Contado', discount: 6.0 },
      
      // Zaragoza (50)
      { client_postal_code: '50001', price: 28000, brand: 'Seat', model: 'Leon', financing_type: 'Financiación', discount: 5.0 },
      { client_postal_code: '50002', price: 39000, brand: 'Volkswagen', model: 'Passat', financing_type: 'Contado', discount: 1.0 },
      { client_postal_code: '50003', price: 44000, brand: 'BMW', model: 'Serie 3', financing_type: 'Financiación', discount: 7.0 },
      { client_postal_code: '50004', price: 41000, brand: 'Audi', model: 'A4', financing_type: 'Financiación', discount: 4.0 },
      { client_postal_code: '50005', price: 35000, brand: 'Mercedes', model: 'Clase C', financing_type: 'Contado', discount: 3.0 },
      { client_postal_code: '50006', price: 21000, brand: 'Ford', model: 'Mondeo', financing_type: 'Financiación', discount: 6.0 },
      { client_postal_code: '50007', price: 17000, brand: 'Renault', model: 'Megane', financing_type: 'Contado', discount: 5.0 },
      { client_postal_code: '50008', price: 47000, brand: 'Volvo', model: 'XC60', financing_type: 'Financiación', discount: 8.0 },
      
      // Málaga (29)
      { client_postal_code: '29001', price: 40000, brand: 'Peugeot', model: '508', financing_type: 'Financiación', discount: 6.0 },
      { client_postal_code: '29002', price: 31000, brand: 'Citroën', model: 'C4', financing_type: 'Contado', discount: 4.0 },
      { client_postal_code: '29003', price: 25000, brand: 'Seat', model: 'Ibiza', financing_type: 'Financiación', discount: 5.0 },
      { client_postal_code: '29004', price: 35000, brand: 'Volkswagen', model: 'Golf', financing_type: 'Contado', discount: 0.0 },
      { client_postal_code: '29005', price: 42000, brand: 'BMW', model: 'Serie 1', financing_type: 'Financiación', discount: 8.0 },
      { client_postal_code: '29006', price: 38000, brand: 'Audi', model: 'A3', financing_type: 'Financiación', discount: 3.0 },
      { client_postal_code: '29007', price: 32000, brand: 'Mercedes', model: 'Clase A', financing_type: 'Contado', discount: 2.0 },
      { client_postal_code: '29008', price: 22000, brand: 'Ford', model: 'Focus', financing_type: 'Financiación', discount: 7.0 },
      
      // Murcia (30)
      { client_postal_code: '30001', price: 18000, brand: 'Renault', model: 'Clio', financing_type: 'Contado', discount: 4.0 },
      { client_postal_code: '30002', price: 45000, brand: 'Volvo', model: 'XC40', financing_type: 'Financiación', discount: 6.0 },
      { client_postal_code: '30003', price: 38000, brand: 'Peugeot', model: '3008', financing_type: 'Financiación', discount: 5.0 },
      { client_postal_code: '30004', price: 29000, brand: 'Citroën', model: 'C3', financing_type: 'Contado', discount: 3.0 },
      { client_postal_code: '30005', price: 26000, brand: 'Hyundai', model: 'Tucson', financing_type: 'Financiación', discount: 8.0 },
      { client_postal_code: '30006', price: 33000, brand: 'Kia', model: 'Sportage', financing_type: 'Contado', discount: 2.0 },
      { client_postal_code: '30007', price: 24000, brand: 'Toyota', model: 'Corolla', financing_type: 'Financiación', discount: 4.0 },
      { client_postal_code: '30008', price: 36000, brand: 'Honda', model: 'CR-V', financing_type: 'Financiación', discount: 6.0 },
      
      // Alicante (03)
      { client_postal_code: '03001', price: 20000, brand: 'Nissan', model: 'Qashqai', financing_type: 'Contado', discount: 5.0 },
      { client_postal_code: '03002', price: 42000, brand: 'Mazda', model: 'CX-5', financing_type: 'Financiación', discount: 7.0 },
      { client_postal_code: '03003', price: 31000, brand: 'Skoda', model: 'Octavia', financing_type: 'Contado', discount: 3.0 },
      { client_postal_code: '03004', price: 27000, brand: 'Dacia', model: 'Duster', financing_type: 'Financiación', discount: 9.0 },
      { client_postal_code: '03005', price: 34000, brand: 'Opel', model: 'Astra', financing_type: 'Financiación', discount: 4.0 },
      { client_postal_code: '03006', price: 23000, brand: 'Fiat', model: '500X', financing_type: 'Contado', discount: 6.0 },
      { client_postal_code: '03007', price: 28000, brand: 'Seat', model: 'Leon', financing_type: 'Financiación', discount: 5.0 },
      { client_postal_code: '03008', price: 39000, brand: 'Volkswagen', model: 'Passat', financing_type: 'Contado', discount: 1.0 },
      
      // Córdoba (14)
      { client_postal_code: '14001', price: 44000, brand: 'BMW', model: 'Serie 3', financing_type: 'Financiación', discount: 7.0 },
      { client_postal_code: '14002', price: 41000, brand: 'Audi', model: 'A4', financing_type: 'Financiación', discount: 4.0 },
      { client_postal_code: '14003', price: 35000, brand: 'Mercedes', model: 'Clase C', financing_type: 'Contado', discount: 3.0 },
      { client_postal_code: '14004', price: 21000, brand: 'Ford', model: 'Mondeo', financing_type: 'Financiación', discount: 6.0 },
      { client_postal_code: '14005', price: 17000, brand: 'Renault', model: 'Megane', financing_type: 'Contado', discount: 5.0 },
      { client_postal_code: '14006', price: 47000, brand: 'Volvo', model: 'XC60', financing_type: 'Financiación', discount: 8.0 },
      { client_postal_code: '14007', price: 40000, brand: 'Peugeot', model: '508', financing_type: 'Financiación', discount: 6.0 },
      { client_postal_code: '14008', price: 31000, brand: 'Citroën', model: 'C4', financing_type: 'Contado', discount: 4.0 }
    ];

    console.log(`💡 Añadiendo ${datosEjemplo.length} ventas de ejemplo...`);

    const { error: insertError } = await supabase
      .from('sales_vehicles')
      .insert(datosEjemplo);

    if (insertError) {
      console.log('❌ Error al insertar datos de ejemplo:', insertError);
      return;
    }

    console.log(`✅ Se han añadido ${datosEjemplo.length} ventas de ejemplo`);

    // Verificar datos finales
    console.log('\n📊 Verificando datos finales...');
    const { data: ventasFinales, error: finalError, count: countFinal } = await supabase
      .from('sales_vehicles')
      .select('client_postal_code, price', { count: 'exact' });

    if (finalError) {
      console.log('❌ Error al verificar datos finales:', finalError);
      return;
    }

    console.log(`✅ Total de ventas disponibles: ${countFinal}`);
    
    // Mostrar agrupación por códigos postales
    const ventasPorCodigo = ventasFinales.reduce((acc, venta) => {
      const codigo = venta.client_postal_code?.toString().substring(0, 2) || '00';
      acc[codigo] = (acc[codigo] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📍 Agrupación por códigos postales:');
    Object.entries(ventasPorCodigo)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .forEach(([codigo, cantidad]) => {
        console.log(`  ${codigo}: ${cantidad} ventas`);
      });

    console.log('\n🎯 Estado de la base de datos:');
    console.log('✅ Datos de ejemplo añadidos');
    console.log(`✅ ${countFinal} ventas totales disponibles`);
    console.log('✅ Mapa listo para mostrar ventas por provincia');

  } catch (error) {
    console.log('❌ Error general:', error);
  }
}

crearDatosEjemplo();

