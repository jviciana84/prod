const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Error: Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarDatosClientes() {
  console.log('🔍 Verificando datos de client_postal_code...');

  try {
    // Verificar datos con client_postal_code
    const { data: ventas, error, count } = await supabase
      .from('sales_vehicles')
      .select('client_postal_code, price', { count: 'exact' })
      .not('client_postal_code', 'is', null)
      .limit(10);

    if (error) {
      console.log('❌ Error al consultar datos:', error);
      return;
    }

    console.log(`📈 Total de ventas con código postal: ${count}`);
    
    if (ventas && ventas.length > 0) {
      console.log('\n📊 Muestra de datos:');
      ventas.forEach((venta, index) => {
        console.log(`${index + 1}. Código: ${venta.client_postal_code}, Precio: ${venta.price}`);
      });

      // Agrupar por códigos postales
      const ventasPorCodigo = ventas.reduce((acc, venta) => {
        const codigo = venta.client_postal_code?.toString().substring(0, 2) || '00';
        acc[codigo] = (acc[codigo] || 0) + 1;
        return acc;
      }, {});

      console.log('\n📍 Agrupación por códigos postales:');
      Object.entries(ventasPorCodigo).forEach(([codigo, cantidad]) => {
        console.log(`  ${codigo}: ${cantidad} ventas`);
      });

      console.log('\n✅ Datos disponibles para el mapa');
    } else {
      console.log('❌ No hay datos con códigos postales');
    }

  } catch (error) {
    console.log('❌ Error general:', error);
  }
}

verificarDatosClientes();

